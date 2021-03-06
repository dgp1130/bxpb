import { Message } from 'google-protobuf';

/** Descriptor of metadata related to a proto service. */
export interface ServiceDescriptor {
    /** Fully-qualified service name. */
    readonly serviceNameFq: string;

    /** Map of unqualified method name to its descriptor. */
    readonly methods: Record<string, MethodDescriptor<string, Message, Message>>;
}

/** Descriptor of metadata related to a proto service method. */
export interface MethodDescriptor<Name extends string, Req extends Message, Res extends Message> {
    /** Unqualified method name. */
    readonly name: Name;

    /**
     * Function which serializes a request message.
     * 
     * Input should always be of type {@link Req}, unfortunately that is not directly expressable in
     * the type system here, or else it would break variance with the generic version.
     */
    readonly requestSerialize: (message: Message) => Uint8Array;

    /** Function which deserializes a request message. */
    readonly requestDeserialize: (message: Uint8Array) => Req;

    /**
     * Function which serializes a response message.
     * 
     * Input should always be of type {@link Res}, unfortunately that is not directly expressable in
     * the type system here, or else it would break variance with the generic version.
     */
    readonly responseSerialize: (message: Message) => Uint8Array;

    /** Function which deserializes a response message. */
    readonly responseDeserialize: (message: Uint8Array) => Res;
}