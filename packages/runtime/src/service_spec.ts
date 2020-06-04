import { Message } from 'google-protobuf';
import { serve, Transport, ServiceImplementation } from './service';
import { ServiceDescriptor } from './descriptors';
import { FakeEvent } from './testing/fake_event';
import { ProtoRequest, ProtoResponse } from './wire_format';
import { GreetRequest, GreetResponse, UnrelatedMessage } from 'generated/test_data/greeter_pb';
import { encode, decode } from './encoders';

/**
 * Example proto service type. Must be explicitly declared for type inference of the method
 * implementation map to work.
 */
interface IGreeterService extends ServiceDescriptor<any> {
    readonly serviceNameFq: 'foo.bar.Greeter';
    readonly methods: {
        readonly Greet: {
            readonly name: 'Greet';
            readonly requestSerialize: (req: Message) => Uint8Array;
            readonly requestDeserialize: (req: Uint8Array) => GreetRequest;
            readonly responseSerialize: (res: Message) => Uint8Array;
            readonly responseDeserialize: (res: Uint8Array) => GreetResponse;
        };
    };
}

/** Example proto service. */
const greeterService: Readonly<ServiceDescriptor<IGreeterService>> = Object.freeze({
    serviceNameFq: 'foo.bar.Greeter',
    methods: {
        Greet: {
            name: 'Greet',
            requestSerialize: (message) => message.serializeBinary(),
            requestDeserialize: (message) => GreetRequest.deserializeBinary(message),
            responseSerialize: (message) => message.serializeBinary(),
            responseDeserialize: (message) => GreetResponse.deserializeBinary(message),
        },
    },
});

// Valid request to use as a basis when altering specific pieces to verify assertion errors.
const goldenRequest: Readonly<ProtoRequest> = Object.freeze({
    serviceNameFq: 'foo.bar.Greeter',
    methodName: 'Greet',
    message: encode(new GreetRequest().serializeBinary()),
});

type OnMessageListener = (message: any, sender: chrome.runtime.MessageSender, respond: (message: any) => void) => void;
class FakeMessageEvent extends FakeEvent<OnMessageListener> { }

describe('service', () => {
    describe('serve()', () => {
        it('serves a proto service on the given transport', async () => {
            const methodSpy = jasmine.createSpy('Greet').and.callFake(async (req) => {
                const res = new GreetResponse();
                res.setMessage(`Hello, ${req.getName()}!`);
                return res;
            });

            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const req = new GreetRequest();
            req.setName('Dave');
            const request: ProtoRequest = {
                serviceNameFq: 'foo.bar.Greeter',
                methodName: 'Greet',
                message: encode(req.serializeBinary()),
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).toHaveBeenCalledWith(req);

            expect(response.error).toBeUndefined();
            expect(response.message).toBeDefined();

            const res = GreetResponse.deserializeBinary(decode(response.message!));
            expect(res.getMessage()).toBe('Hello, Dave!');
        });

        it('responds when given a default request proto', async () => {
            const methodSpy = jasmine.createSpy('Greet').and.callFake(async (req) => {
                const res = new GreetResponse();
                res.setMessage(`Hello there!`);
                return res;
            });

            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const req = new GreetRequest();
            const encodedReq = encode(req.serializeBinary());
            expect(encodedReq).toBe(''); // Default proto becomes an empty string.
            const request: ProtoRequest = {
                ...goldenRequest,
                message: encodedReq,
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).toHaveBeenCalledWith(req);

            expect(response.error).toBeUndefined();
            expect(response.message).toBeDefined();

            const res = GreetResponse.deserializeBinary(decode(response.message!));
            expect(res.getMessage()).toBe('Hello there!');
        });

        it('responds with an empty response when given a default response proto', async () => {
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                async Greet(): Promise<GreetResponse> {
                    return new GreetResponse(); // Default proto will serialize to empty string.  
                },
            });

            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(goldenRequest, {} /* sender */, resolve);
            });

            expect(response.error).toBeUndefined();
            expect(response.message).toBe(''); // Default proto response is an empty string.

            const res = GreetResponse.deserializeBinary(decode(response.message!));
            expect(res.getMessage()).toBe(''); // Unset property defaults to empty string.
        });

        it('throws an error when a method implementation is missing', () => {
            // TODO(#2): Make this ts-expect-error
            // @ts-ignore
            expect(() => serve(new FakeEvent(), greeterService, {
                // Forgot to implement `Greet()`.
            })).toThrowMatching((err: Error) => err.message.includes('"Greet" not included'));
        });

        it('throws an error when a method implementation is not a function', () => {
            expect(() => serve(new FakeEvent(), greeterService, {
                // TODO(#2): Make this ts-expect-error
                // @ts-ignore
                Greet: 'test',
            })).toThrowMatching((err: Error) => err.message.includes('"Greet" is not a function'));
        });

        it('responds with an error when `ProtoRequest` is not an object', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request = 'not an object';
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('Request is not an object');
        });

        it('responds with an error when `ProtoRequest` is undefined', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request = undefined;
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('Request is not an object');
        });

        it('responds with an error when `ProtoRequest` is null', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request = null;
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('Request is `null`.');
        });

        it('responds with an error when `ProtoRequest` is missing service name', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request = {
                ...goldenRequest,
                serviceNameFq: undefined, // Forgot to set `serviceNameFq`.
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('does not contain `serviceNameFq`');
        });

        it('responds with an error when `ProtoRequest` has a non-string service name', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request = {
                ...goldenRequest,
                serviceNameFq: 1234, // Not a string.
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('`serviceNameFq` is not a string');
        });

        it('responds with an error when `ProtoRequest` is missing method name', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request = {
                ...goldenRequest,
                methodName: undefined, // Forgot to set `methodName`.
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('does not contain `methodName`');
        });

        it('responds with an error when `ProtoRequest` has a non-string method name', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request = {
                ...goldenRequest,
                methodName: 1234, // Not a string.
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('`methodName` is not a string');
        });

        it('responds with an error when `ProtoRequest` is missing message', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request = {
                ...goldenRequest,
                message: undefined, // Forgot to set `message`.
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('does not contain `message`');
        });

        it('responds with an error when `ProtoRequest` has a non-string message', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request = {
                ...goldenRequest,
                message: 1234, // Not a string.
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('`message` is not a string');
        });

        it('responds with an error when given an unknown service', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request: ProtoRequest = {
                ...goldenRequest,
                serviceNameFq: 'not a real service',
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('unknown service: "not a real service"');
        });

        it('responds with an error when given an unknown method', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request: ProtoRequest = {
                ...goldenRequest,
                methodName: 'not a real method',
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('Cannot handle method "not a real method"');
        });

        it('responds with an error when not given a valid base64 message', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request: ProtoRequest = {
                ...goldenRequest,
                message: 'Not base64-encoded.',
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('Failed to deserialize request message');
        });

        it('responds with an error when given a base64 message which is not a proto', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            const request: ProtoRequest = {
                ...goldenRequest,
                message: btoa('Not a proto.'),
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('Failed to deserialize request message');
        });

        // Caveat: It is impossible to know at runtime if the given proto is the correct type, as
        // they lack the necessary type information. Proto deserialization can work for incorrect
        // protos if their definitions are binary compatible. For example, two messages which
        // contain only a string in the first position are binary compatible and serializing with
        // one message and deserializing with the other will work. bxpb does not attempt to solve
        // this problem, rather it will only error out when given "obviously wrong" protos which
        // fail protobuf deserialization.
        it('responds with an error when given the wrong proto type', async () => {
            const methodSpy = jasmine.createSpy('methodSpy');
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: methodSpy,
            });

            // Request sent with the wrong encoded proto.
            const req = new UnrelatedMessage();
            req.setNumber(42);
            const request: ProtoRequest = {
                ...goldenRequest,
                message: encode(req.serializeBinary()),
            };
            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(request, {} /* sender */, resolve);
            });

            expect(methodSpy).not.toHaveBeenCalled();

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('Failed to deserialize request message');
        });

        it('responds with an error when the method implementation throws', async () => {
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: () => {
                    throw new Error('I don\'t work for a superstore...');
                },
            });

            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(goldenRequest, {} /* sender */, resolve);
            });

            expect(response.message).toBeUndefined();
            expect(response.error).toBe('I don\'t work for a superstore...');
        });

        it('responds with an error when the method implementation rejects', async () => {
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                Greet: () => Promise.reject(new Error('I don\'t work for a superstore...')),
            });

            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(goldenRequest, {} /* sender */, resolve);
            });

            expect(response.message).toBeUndefined();
            expect(response.error).toBe('I don\'t work for a superstore...');
        });

        it('responds with an error when method implementation fails to serialize response',
                async () => {
            // Simulate an error by spying on `serializeBinary()` and throwing. Ideally this could
            // be simulated by simply returning the wrong proto in the method implementation,
            // however the protobuf deserialization algorithm does not appear to detect that as an
            // error, even when given an incompatible proto type.
            spyOn(GreetResponse.prototype, 'serializeBinary')
                    .and.throwError(new Error('Bad response proto.'));
            
            const evt = new FakeMessageEvent();
            serve(evt, greeterService, {
                async Greet(): Promise<GreetResponse> {
                    return new GreetResponse();
                },
            });

            const response = await new Promise<ProtoResponse>((resolve) => {
                evt.trigger(goldenRequest, {} /* sender */, resolve);
            });

            expect(response.message).toBeUndefined();
            expect(response.error).toContain('Failed to serialize response message');
        });

        it('exports `Transport`', () => {
            // Transport **must** be exported or generated code cannot import it and will revert the
            // type to `any` rather than throwing a type error. This test simply asserts that the
            // type is exported by throwing a compile-error if it was not.
            let transport: Transport;
        });

        it('exports `ServiceImplementation`', () => {
            // `ServiceImplementation` **must** be exported or generated code cannot import it and
            // will revert the type to `any` rather than throwing a type error. This test simply
            // asserts that the type is exported by throwing a compile-error if it was not.
            let serviceImpl: ServiceImplementation<{
                serviceNameFq: 'foo.bar.BazService',
                methods: {},
            }>;
        });
    });
});