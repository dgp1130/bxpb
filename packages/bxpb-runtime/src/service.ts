import { ServiceDescriptor, MethodDescriptor } from './descriptors';
import { Message } from 'google-protobuf';

type Transport = typeof chrome.runtime.onMessage;

/** The implementation required to support the provided service. */
type ServiceImplementation<T extends ServiceDescriptor<any>> = {
    readonly [K in keyof T['methods']]: MethodImplementation<T['methods'][K]>;
};

/** The implementation required to support the provided method. */
type MethodImplementation<Descriptor extends MethodDescriptor<Message, Message>> =
    (req: Descriptor extends MethodDescriptor<infer Request, Message> ? Request : never)
        => Descriptor extends MethodDescriptor<Message, infer Response> ? Promise<Response> : never;

/**
 * Serve the given service on the given transport.
 * 
 * @param transport The message passing transport to host the service on. Messages received from
 *     will be handled as requests to this service.
 * @param service The protobuf service descriptor to be served.
 * @param impl The implementations of all methods on the service. An implementation for <b>every</b>
 *     method is required.
 */
export function serve<T extends ServiceDescriptor<any>>(
    transport: Transport,
    service: ServiceDescriptor<T>,
    impl: ServiceImplementation<T>,
) {
    // Validate that the input implementation is valid for JavaScript users.
    for (const methodName of Object.keys(service.methods)) {
        const method = impl[methodName];
        if (!method) throw new Error(`Method "${methodName}" not included on service.`);
        if (!(method instanceof Function)) {
            throw new Error(`Method "${methodName}" is not a function.`);
        }
    }
}