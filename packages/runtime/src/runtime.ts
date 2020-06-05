import { serve, Transport as TransportImport, ServiceImplementation as ServiceImplementationImport } from './service';
import { ProtoClient, rpc } from './client';
import { MethodDescriptor as MethodDescriptorImport, ServiceDescriptor as ServiceDescriptorImport } from './descriptors';
import { Message } from 'google-protobuf';

/**
 * Export internal-only APIs.
 * 
 * These are needed by generated code but are **not** considered part of the public API. These are
 * not suitable for direct reference by user-code as they are not covered by semantic versioning and
 * may change at any time.
 */
export const internalOnlyDoNotDependOrElse = {
    serve,
    ProtoClient,
    rpc,
};
export namespace internalOnlyDoNotDependOrElse {
    export type Transport = TransportImport;
    export type ServiceImplementation<T extends ServiceDescriptorImport<any>> =
            ServiceImplementationImport<T>;
    export type MethodDescriptor<Name extends string, Req extends Message, Res extends Message> =
            MethodDescriptorImport<Name, Req, Res>;
    export type ServiceDescriptor<T extends ServiceDescriptor<any>> = ServiceDescriptorImport<T>;
}
