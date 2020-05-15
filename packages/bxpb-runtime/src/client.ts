import { Message } from "google-protobuf";
import { ServiceDescriptor, MethodDescriptor } from "./descriptors";
import { ProtoRequest, ProtoResponse } from "./wire_format";
import { encode, decode } from "./encoders";

type ProtoTransport = typeof chrome.runtime.sendMessage;

/**
 * PRIVATE API: Do not depend on this directly! Only generated code should extend this class.
 * Protected APIs here do not follow semantic versioning. Do **not** use or I WILL BREAK YOU!
 * 
 * Base class for a client which communicates with a service.
 */
export abstract class ProtoClient {
    /**
     * @param sendMessage The transport to use to communicate with the related service.
     */
    constructor(protected readonly sendMessage: ProtoTransport) { }
}

/**
 * PRIVATE API: Do not depend on this directly! Only generated code should call this method.
 * This function does not follow semantic versioning. Do **not** use or I WILL BREAK YOU!
 * 
 * @param service The service to call a method on.
 * @param method The method to call.
 * @param req The request to pass to specified method.
 * @returns A {@link Promise<Res>} resolving to the response from the specified method.
 */
export async function rpc<Req extends Message, Res extends Message>(
    sendMessage: ProtoTransport,
    service: ServiceDescriptor<any>,
    method: MethodDescriptor<Req, Res>,
    req: Req,
): Promise<Res> {
    // Send request to backend and await the response.
    const request: ProtoRequest = {
        serviceNameFq: service.serviceNameFq,
        methodName: method.name,
        message: encode(method.requestSerialize(req)),
    };
    const response = await sendRpc(sendMessage, request);
    
    // Propgate error if backend failed.
    if (!!response.error) {
        throw new Error(response.error);
    }

    // Assert a message is given.
    const res = response.message;
    if (res === undefined) {
        throw new Error(
            `Response does not contian a message or an error: ${stringify(response)}`);
    }

    // Deserialize the response and return it.
    try {
        return method.responseDeserialize(decode(res));
    } catch (err) {
        throw new Error(`Failed to deserialize response:\n${err.message}`);
    }
}

/**
 * Sends the given {@link ProtoRequest} to on the transport, awaits the response, and then validates
 * it. 
 */
async function sendRpc(sendMessage: ProtoTransport, req: ProtoRequest): Promise<ProtoResponse> {
    const response = await new Promise((resolve) => {
        sendMessage(req, (res) => resolve(res));
    });
    validateResponse(response);
    return response;
}

/**
 * Validates that the given response object is a {@link ProtoResponse}. Does **not** validate
 * semantics of the object (ie. the message may not be a valid serialized protobuf).
 */
function validateResponse(response: unknown): asserts response is ProtoResponse {
    if (typeof response !== 'object') {
        throw new Error(`Response is not an object: ${stringify(response)}`);
    }
    if (response === null) throw new Error('Response is `null`.');
    const res = response as Record<string, unknown>;

    if (res.error === undefined && res.message === undefined) {
        throw new Error(`Response does not contain \`message\` or \`error\`: ${stringify(res)}`);
    }

    if (!!res.message && typeof res.message !== 'string') {
        throw new Error(`Response \`message\` is not a string: ${stringify(res)}`);
    }

    if (!!res.error && typeof res.error !== 'string') {
        throw new Error(`Response \`error\` is not a string: ${stringify(res)}`);
    }
}

function stringify(data: unknown): string {
    return JSON.stringify(data, null /* replacer */, 4 /* tabSize */);
}