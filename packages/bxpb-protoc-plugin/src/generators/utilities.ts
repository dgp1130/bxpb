/** @fileoverview General utilities for generating code from protocol buffers. */

import { MethodDescriptorProto } from 'google-protobuf/google/protobuf/descriptor_pb';

/** Gets the fully qualified name for the given service hosted in the provided package. */
export function getFullyQualifiedServiceName(pkg: string|undefined, serviceName: string): string {
    return pkg ? `${pkg}.${serviceName}` : serviceName;
}

/** Gets the unqalified request type for the given method descriptor. */
export function getRelativeRequestType(method: MethodDescriptorProto): string {
    const inputType = method.getInputType();
    if (!inputType) throw new Error(`Method \`${method.getName()}\` is missing an input type!`);
    return inputType.replace(/^.*\./, '');
}

/** Gets the unqalified response type for the given method descriptor. */
export function getRelativeResponseType(method: MethodDescriptorProto): string {
    const outputType = method.getOutputType();
    if (!outputType) throw new Error(`Method \`${method.getName()}\` is missing an output type!`);
    return outputType.replace(/^.*\./, '');
}