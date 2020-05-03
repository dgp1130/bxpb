import { serve } from './service';
import { Message } from 'google-protobuf';
import { ServiceDescriptor } from './descriptors';

/**
 * Example proto service type. Must be explicitly declared for type inference of the method
 * implementation map to work.
 */
interface IGreeterService extends ServiceDescriptor<any> {
    readonly serviceNameFq: 'foo.bar.Greeter';
    readonly methods: {
        readonly greet: {
            readonly name: 'Greet';
            readonly requestSerialize: (req: Message) => Uint8Array;
            readonly requestDeserialize: (req: Uint8Array) => Message;
            readonly responseSerialize: (res: Message) => Uint8Array;
            readonly responseDeserialize: (res: Uint8Array) => Message;
        };
    };
}

/**
 * Example proto service. Serialize/deserialize functions don't actually do anything because they
 * would require a real {@link Message} subclass, which is not easy to stub thus requiring a real,
 * compiled, protobuf. Generating one would make the tests dependent on a pre-build step, which
 * would be tricky to integrate with Karma. So instead, these functions are typed correctly but not
 * actually implemented.
 */
const GREETER_SERVICE: ServiceDescriptor<IGreeterService> = Object.freeze({
    serviceNameFq: 'foo.bar.Greeter',
    methods: {
        greet: {
            name: 'Greet',
            requestSerialize: () => new Uint8Array(),
            requestDeserialize: () => ({}) as Message,
            responseSerialize: () => new Uint8Array(),
            responseDeserialize: () => ({}) as Message,
        },
    },
});

describe('service', () => {
    beforeEach(() => {
        globalThis.chrome = globalThis.chrome ?? ({} as any);
        globalThis.chrome.runtime = globalThis.chrome.runtime ?? ({} as any);
        globalThis.chrome.runtime.sendMessage = globalThis.chrome.runtime.sendMessage
            ?? (() => fail('Unexpected call to `chrome.runtime.sendMessage()`.'));
    });

    describe('serve()', () => {
        it('serves a proto service on the given transport', () => {
            // Not yet implemented, for now just don't throw.
            expect(() => serve(chrome.runtime.onMessage, GREETER_SERVICE, {
                greet: async () => ({}) as Message,
            })).not.toThrow();
        });

        it('throws an error when a method implementation is missing', () => {
            // TODO(#2): Make this ts-expect-error
            // @ts-ignore
            expect(() => serve(chrome.runtime.onMessage, GREETER_SERVICE, {
                // Forgot to implement `greet()`.
            })).toThrowMatching((err: Error) => err.message.includes('"greet" not included'));
        });

        it('throws an error when a method implementation is not a function', () => {
            expect(() => serve(chrome.runtime.onMessage, GREETER_SERVICE, {
                // TODO(#2): Make this ts-expect-error
                // @ts-ignore
                greet: 'test',
            })).toThrowMatching((err: Error) => err.message.includes('"greet" is not a function'));
        });
    });
});