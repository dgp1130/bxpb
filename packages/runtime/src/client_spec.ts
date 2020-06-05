import { ProtoClient, rpc } from './client';
import { ProtoRequest, ProtoResponse } from './wire_format';
import { ServiceDescriptor } from './descriptors';
import { GreetRequest, GreetResponse, UnrelatedMessage } from 'generated/test_data/greeter_pb';
import { encode } from './encoders';

/** Example proto service for testing. */
const greeterService: Readonly<ServiceDescriptor> = Object.freeze({
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

/** Golden request for testing. */
const goldenRequest: Readonly<ProtoRequest> = Object.freeze({
    serviceNameFq: 'foo.bar.Greeter',
    methodName: 'Greet',
    message: encode(new GreetRequest().serializeBinary()),
});

describe('client', () => {
    describe('ProtoClient', () => {
        it('exposes protected `sendMessage` property', () => {
            class MyClient extends ProtoClient {
                /** Expose protected {@link sendMessage} property publicly. */
                getSendMessage() {
                    return this.sendMessage;
                }
            }

            // Assert that `sendMessage` was set.
            const sendMessage = jasmine.createSpy('sendMessage');
            const client = new MyClient(sendMessage);
            expect(client.getSendMessage()).toBe(sendMessage);
        });
    });

    describe('rpc()', () => {
        it('makes an RPC to the given method', async () => {
            const res = new GreetResponse();
            res.setMessage('Hello, Dave!');
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: ProtoResponse) => void) => {
                respond({
                    message: encode(res.serializeBinary()),
                });
            });

            const req = new GreetRequest();
            req.setName('Dave');
            const response = await rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                req,
            );
            
            expect(sendMessage).toHaveBeenCalledWith({
                serviceNameFq: 'foo.bar.Greeter',
                methodName: 'Greet',
                message: encode(req.serializeBinary()),
            }, jasmine.any(Function) /* respond */);

            expect(response).toBeInstanceOf(GreetResponse);
            expect((response as GreetResponse).getMessage()).toBe('Hello, Dave!');
        });

        it('propagates backend errors', async () => {
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: ProtoResponse) => void) => {
                respond({
                    error: 'I don\'t know you!',
                });
            });

            await expectAsync(rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                new GreetRequest(),
            )).toBeRejectedWithError(Error, 'I don\'t know you!');
        });

        it('makes an RPC to the given method with a default request proto', async () => {
            const res = new GreetResponse();
            res.setMessage('Hello, Dave!');
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: ProtoResponse) => void) => {
                respond({
                    message: encode(res.serializeBinary()),
                });
            });

            const response = await rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                new GreetRequest(),
            );
            
            expect(sendMessage).toHaveBeenCalledWith({
                ...goldenRequest,
                message: '', // Default proto becomes an empty string.
            }, jasmine.any(Function) /* respond */);

            expect(response).toBeInstanceOf(GreetResponse);
            expect((response as GreetResponse).getMessage()).toBe('Hello, Dave!');
        });

        it('makes an RPC to the given method with a default response proto', async () => {
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: ProtoResponse) => void) => {
                const response = encode(new GreetResponse().serializeBinary());
                expect(response).toBe(''); // Default proto becomes an empty string.
                respond({
                    message: response,
                });
            });

            const response = await rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                new GreetRequest(),
            );
            
            expect(response).toBeInstanceOf(GreetResponse);
            expect((response as GreetResponse).getMessage()).toBe(''); // Defaults to empty string.
        });

        it('throws when backend responds with a non-object', async () => {
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: unknown) => void) => {
                respond('not an object');
            });

            await expectAsync(rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                new GreetRequest(),
            )).toBeRejectedWithError(Error, /not an object/);
        });

        it('throws when backend responds with `undefined`', async () => {
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: unknown) => void) => {
                respond(undefined);
            });

            await expectAsync(rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                new GreetRequest(),
            )).toBeRejectedWithError(Error, /not an object/);
        });

        it('throws when backend responds with `null`', async () => {
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: unknown) => void) => {
                respond(null);
            });

            await expectAsync(rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                new GreetRequest(),
            )).toBeRejectedWithError(Error, 'Response is `null`.');
        });

        it('throws when backend response lacks `message` **and** `error`', async () => {
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: unknown) => void) => {
                respond({});
            });

            await expectAsync(rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                new GreetRequest(),
            )).toBeRejectedWithError(Error, /does not contain `message` or `error`/);
        });

        it('throws when backend responds with a non-string `message`', async () => {
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: unknown) => void) => {
                respond({
                    message: 1234, // Not a string.
                });
            });

            await expectAsync(rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                new GreetRequest(),
            )).toBeRejectedWithError(Error, /`message` is not a string/);
        });

        it('throws when backend responds with a non-string `error`', async () => {
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: unknown) => void) => {
                respond({
                    error: 1234, // Not a string.
                });
            });

            await expectAsync(rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                new GreetRequest(),
            )).toBeRejectedWithError(Error, /`error` is not a string/);
        });

        it('throws when backend responds with an invalid base64 message', async () => {
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: unknown) => void) => {
                respond({
                    message: 'Not base64-encoded.',
                });
            });

            await expectAsync(rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                new GreetRequest(),
            )).toBeRejectedWithError(Error, /Failed to deserialize response/);
        });

        it('throws when backend responds with a base64 message which is not a proto', async () => {
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: unknown) => void) => {
                respond({
                    message: btoa('Not a proto.'),
                });
            });

            await expectAsync(rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                new GreetRequest(),
            )).toBeRejectedWithError(Error, /Failed to deserialize response/);
        });

        // Caveat: It is impossible to know at runtime if the given proto is the correct type, as
        // they lack the necessary type information. Proto deserialization can work for incorrect
        // protos if their definitions are binary compatible. For example, two messages which
        // contain only a string in the first position are binary compatible and serializing with
        // one message and deserializing with the other will work. bxpb does not attempt to solve
        // this problem, rather it will only error out when given "obviously wrong" protos which
        // fail protobuf deserialization.
        it('throws when backend responds with message which is the wrong proto type', async () => {
            const res = new UnrelatedMessage();
            res.setNumber(42);
            const sendMessage = jasmine.createSpy('sendMessage')
                    .and.callFake((req: ProtoRequest, respond: (res: unknown) => void) => {
                respond({
                    message: encode(res.serializeBinary()),
                });
            });

            await expectAsync(rpc(
                sendMessage,
                greeterService,
                greeterService.methods.Greet,
                new GreetRequest(),
            )).toBeRejectedWithError(Error, /Failed to deserialize response/);
        });
    });
});