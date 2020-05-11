import { decode } from './encoders';

/** The "wire format" of an RPC request. */
export interface ProtoRequest {
    /** The fully-qualified service name to call a method on. */
    serviceNameFq: string;

    /** The unqualified method name to call on the given service. */
    methodName: string;

    /**
     * The encoded request proto message to call the method with. Must be decodeable with
     * {@link decode}.
     */
    message: string;
}

/**
 * The "wire format" of an RPC response. Only one of {@property error} or {@property message} must
 * be set.
 */
export interface ProtoResponse {
    /**
     * If set, the RPC responded successfully. Contains the encoded response proto message and is
     * decodeable with {@link decode}.
     */
    message?: string;

    /** If set, the RPC encountered an error. Contains information about the failure. */
    error?: string;
}