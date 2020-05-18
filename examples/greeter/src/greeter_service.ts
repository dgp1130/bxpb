/** This file will eventually be auto-generated, but for now is hand-written. */

import { GreetRequest, GreetResponse } from '../proto/foo/bar/greeter_pb';
import { ServiceDescriptor } from 'bxpb-runtime/dist/descriptors';
import { Message } from 'google-protobuf';

/**
 * Example proto service type. Must be explicitly declared for type inference of the method
 * implementation map to work.
 */
export interface IGreeterService extends ServiceDescriptor<any> {
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
export const greeterService: ServiceDescriptor<IGreeterService> = Object.freeze({
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