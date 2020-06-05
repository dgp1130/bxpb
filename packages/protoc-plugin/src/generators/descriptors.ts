import * as path from 'path';
import { FileDescriptorProto } from 'google-protobuf/google/protobuf/descriptor_pb';
import { CodeGeneratorResponse } from 'google-protobuf/google/protobuf/compiler/plugin_pb';
import { getFullyQualifiedServiceName, getRelativeRequestType, getRelativeResponseType } from './utilities';

/**
 * Returns an iterable of generated BXPB service descriptors from the given *.proto file and its
 * descriptor.
 */
export function* generateDescriptorFiles(file: string, fileDescriptor: FileDescriptorProto):
        Iterable<CodeGeneratorResponse.File> {
    // If there are no services, don't generate anything.
    if (fileDescriptor.getServiceList().length === 0) return;

    const filePath = path.parse(file);
    const generatedBaseName = `${filePath.name}_bxdescriptors`;

    // Generate JavaScript file.
    const jsFile = new CodeGeneratorResponse.File();
    jsFile.setName(path.format({
        ...filePath,
        base: undefined, // Must not specify base for name and ext to be used.
        name: generatedBaseName,
        ext: '.js',
    }));
    jsFile.setContent(generateDescriptorJs(filePath, fileDescriptor));
    yield jsFile;

    // Generate TypeScript definitions.
    const dtsFile = new CodeGeneratorResponse.File();
    dtsFile.setName(path.format({
        ...filePath,
        base: undefined, // Must not specify base for name and ext to be used.
        name: generatedBaseName,
        ext: '.d.ts',
    }));
    dtsFile.setContent(generateDescriptorDts(filePath, fileDescriptor));
    yield dtsFile;
}

/** Returns the generated JavaScript source as a string. */
function generateDescriptorJs(filePath: path.ParsedPath, descriptor: FileDescriptorProto): string {
    return `
/**
 * @fileoverview Descriptors of services defined in ${path.format(filePath)}.
 * 
 * WARNING: The content of these files are considered an implementation detail of BXPB, are not
 * subject to semantic versioning and are not suitable for direct use. DO NOT IMPORT THIS FILE
 * DIRECTLY as it may change at any time without warning!
 */

import protos from './${filePath.name}_pb.js';

${descriptor.getServiceList().map((service) => {
    const serviceName = service.getName();
    if (!serviceName) throw new Error(`${path.format(filePath)}: Service has no name.`);

    return `
/** Service descriptor for \`${serviceName}\`. */
export const ${serviceName}Service = Object.freeze({
    serviceNameFq: '${getFullyQualifiedServiceName(descriptor.getPackage(), serviceName)}',
    methods: {
        ${service.getMethodList().map((method) => {
            const methodName = method.getName();
            if (!methodName) throw new Error(`Method in service \`${serviceName}\` has no name!`);

            return `
        /** Method descriptor for \`${serviceName}.${methodName}\`. */
        ${methodName}: {
            name: '${methodName}',
            requestSerialize: (message) => message.serializeBinary(),
            requestDeserialize: (message) => protos.${getRelativeRequestType(method)}.deserializeBinary(message),
            responseSerialize: (message) => message.serializeBinary(),
            responseDeserialize: (message) => protos.${getRelativeResponseType(method)}.deserializeBinary(message),
        },
            `.trim();
        }).join('\n\n        ' /* two indents */)}
    },
});
    `.trim();
}).join('\n\n')}
    `.trim();
}

/** Returns the generated TypeScript definitions as a string. */
function generateDescriptorDts(filePath: path.ParsedPath, descriptor: FileDescriptorProto): string {
    return `
/**
 * @fileoverview Descriptors of services defined in ${path.format(filePath)}.
 * 
 * WARNING: The content of these files are considered an implementation detail of BXPB, are not
 * subject to semantic versioning and are not suitable for direct use. DO NOT IMPORT THIS FILE
 * DIRECTLY as it may change at any time without warning!
 */

import { Message } from 'google-protobuf';
import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import protos from './${filePath.name}_pb';

${descriptor.getServiceList().map((service) => {
    const serviceName = service.getName();
    if (!serviceName) throw new Error(`${path.format(filePath)}: Service has no name.`);

    return `
/** Interface of \`${serviceName}\`'s service descriptor. */
export interface I${serviceName}Service extends internal.ServiceDescriptor {
    readonly serviceNameFq: '${getFullyQualifiedServiceName(descriptor.getPackage(), serviceName)}';
    readonly methods: {
        ${service.getMethodList().map((method) => {
            const methodName = method.getName();
            if (!methodName) throw new Error(`Method in service \`${serviceName}\` has no name!`);

            return `
        /** Interface of \`${serviceName}.${methodName}\`'s method descriptor. */
        readonly ${methodName}: internal.MethodDescriptor<'${methodName}', protos.${getRelativeRequestType(method)}, protos.${getRelativeResponseType(method)}>;
            `.trim();
        }).join('\n\n        ' /* two indents */)}
    };
}

/** Service descriptor for \`${serviceName}\`. */
export const ${serviceName}Service: I${serviceName}Service;
`.trim();
}).join('\n\n')}
    `.trim();
}