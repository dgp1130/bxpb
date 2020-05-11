import { ServiceDescriptor, MethodDescriptor } from './descriptors';
import { Message } from 'google-protobuf';
import { ProtoRequest, ProtoResponse } from './wire_format';
import { decode, encode } from './encoders';

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

    transport.addListener(async (request: unknown, sender, respond) => {
        respond(await handleRequest(service, impl, request));
    });
}

/**
 * Handles the given proto request and returns a response. Will **never** throw an error, but
 * instead return a {@link ProtoResponse} containing error details.
 * 
 * @param request Should be of type {@link ProtoRequest}, but will be validated at runtime.
 */
async function handleRequest<T extends ServiceDescriptor<any>>(
    service: ServiceDescriptor<T>,
    impl: ServiceImplementation<T>,
    request: unknown,
): Promise<ProtoResponse> {
    try {
        return await handleRequestDangerously(service, impl, request);
    } catch (err) {
        return {
            error: err.message,
        };
    }
}

/**
 * Handles the given proto request and returns a response. May throw an error if there is a
 * validation error or the method implementation throws.
 * 
 * @param req Should be of type {@link ProtoRequest}, but will be validated at runtime.
 */
async function handleRequestDangerously<T extends ServiceDescriptor<any>>(
    service: ServiceDescriptor<T>,
    impl: ServiceImplementation<T>,
    req: unknown,
): Promise<ProtoResponse> {
    // Validate the shape and type of the properties on the request.
    // Does not validate the semantics of the object (ie. the service may not exist).
    validateRequest(req);

    // Verify service is supported.
    if (req.serviceNameFq !== service.serviceNameFq) {
        throw new Error(`Cannot handle request for unknown service: "${req.serviceNameFq}".` +
            ` Only "${service.serviceNameFq}" is supported.`);
    }

    // Verify method is supported.
    const methodDescriptor = service.methods[req.methodName];
    if (!methodDescriptor) {
        const methodList = Object.values(service.methods)
            .map((method) => `"${method.name}"`)
            .join(', ');
        throw new Error(`Cannot handle method "${req.methodName}" for service` + 
            ` ${service.serviceNameFq}. Only methods supported are: ${methodList}.`);
    }

    // Verify method is implemented.
    const method = impl[req.methodName] as MethodImplementation<typeof methodDescriptor>|undefined;
    if (!method) {
        throw new Error(`Implementation function for "${req.methodName}" not found.`);
    }

    // Invoke the method and return the result.
    const res = await callMethod(methodDescriptor, method, req.message);
    return { message: res };
}

/**
 * Call the given proto method with the provided encoded protobuf.
 * 
 * @param req The request protobuf serialized to binary and decodeable with {@link decode}.
 * @returns The response protobuf serialized to binary and decodeable with {@link decode}.
 */
async function callMethod(
    methodDescriptor: MethodDescriptor<Message, Message>,
    method: (req: Message) => Promise<Message>,
    req: string,
): Promise<string> {
    // Deserialize the request.
    let request!: Message;
    try {
        request = methodDescriptor.requestDeserialize(decode(req));
    } catch (err) {
        throw new Error(`Failed to deserialize request message:\n${err.message}`);
    }

    // Invoke user-code which implements the actual method.
    const response = await method(request);

    // Serialize the response.
    try {
        return encode(methodDescriptor.responseSerialize(response));
    } catch (err) {
        throw new Error(`Failed to serialize response message:\n${err.message}`);
    }
}

/**
 * Validates that the given request object is a {@link ProtoRequest}. Does **not** validate the
 * semantics of the object (ie. the service may not exist).
 */
function validateRequest(request: unknown): asserts request is ProtoRequest {
    if (typeof request !== 'object') {
        throw new Error(`Request is not an object: ${stringify(request)}`);
    }
    if (request === null) throw new Error('Request is `null`.');
    const req = request as Record<string, unknown>;

    if (!req.serviceNameFq) {
        throw new Error(`Request does not contain \`serviceNameFq\`: ${stringify(request)}`);
    }
    if (typeof req.serviceNameFq !== 'string') {
        throw new Error(`Request \`serviceNameFq\` is not a string: ${stringify(request)}'`);
    }

    if (!req.methodName) {
        throw new Error(`Request does not contain \`methodName\`: ${stringify(request)}'`);
    }
    if (typeof req.methodName !== 'string') {
        throw new Error(`Request \`methodName\` is not a string: ${stringify(request)}`);
    }

    if (req.message === undefined) { // Allow empty string for protos with all default values.
        throw new Error(`Request does not contain \`message\`: ${stringify(request)}`);
    }
    if (typeof req.message !== 'string') {
        throw new Error(`Request \`message\` is not a string: ${stringify(request)}`);
    }
}

function stringify(data: unknown): string {
    return JSON.stringify(data, null /* replacer */, 4 /* tabSize */);
}