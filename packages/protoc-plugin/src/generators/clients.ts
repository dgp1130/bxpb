import * as path from 'path';
import { FileDescriptorProto } from 'google-protobuf/google/protobuf/descriptor_pb';
import { CodeGeneratorResponse } from 'google-protobuf/google/protobuf/compiler/plugin_pb';
import { getRelativeRequestType, getRelativeResponseType } from './utilities';

/** Returns an iterable of generated BXPB clients from the given *.proto file and its descriptor. */
export function* generateClientFiles(file: string, fileDescriptor: FileDescriptorProto):
        Iterable<CodeGeneratorResponse.File> {
    // If there are no services, don't generate anything.
    if (fileDescriptor.getServiceList().length === 0) return;

    const filePath = path.parse(file);
    const generatedBaseName = `${filePath.name}_bxclients`;

    const jsFile = new CodeGeneratorResponse.File();
    jsFile.setName(path.format({
        ...filePath,
        base: undefined, // Must not specify base for name and ext to be used.
        name: generatedBaseName,
        ext: '.js',
    }));
    jsFile.setContent(generateClientJs(filePath, fileDescriptor));
    yield jsFile;

    const dtsFile = new CodeGeneratorResponse.File();
    dtsFile.setName(path.format({
        ...filePath,
        base: undefined, // Must not specify base for name and ext to be used.
        name: generatedBaseName,
        ext: '.d.ts',
    }));
    dtsFile.setContent(generateClientDts(filePath, fileDescriptor));
    yield dtsFile;
}

/** Returns the generated JavaScript source as a string. */
function generateClientJs(filePath: path.ParsedPath, fileDescriptor: FileDescriptorProto): string {
    return `
import { ProtoClient, rpc } from '@bxpb/runtime/dist/client.js';
import * as descriptors from './${filePath.name}_bxdescriptors.js';

${fileDescriptor.getServiceList().map((service) => {
    const serviceName = service.getName();
    if (!serviceName) throw new Error(`${path.format(filePath)}: Service has no name.`);

    return `
/** Client for calling {@link descriptors.${serviceName}Service}. */
export class ${serviceName}Client extends ProtoClient {
    ${service.getMethodList().map((method) => {
        const methodName = method.getName();
        if (!methodName) throw new Error(`Method in service \`${serviceName}\` has no name!`);

        return `
    /** Invokes the {@link descriptors.${serviceName}Service.methods.${methodName}} method. */
    async ${methodName}(req) {
        return await rpc(this.sendMessage, descriptors.${serviceName}Service, descriptors.${serviceName}Service.methods.${methodName}, req);
    }
        `.trim();
    }).join('\n\n    ' /* one indent */)}
}
    `.trim();
}).join('\n\n')}
    `.trim();
}

/** Returns the generated TypeScript definitions as a string. */
function generateClientDts(filePath: path.ParsedPath, fileDescriptor: FileDescriptorProto): string {
    return `
import { ProtoClient } from '@bxpb/runtime/dist/client';
import protos from './${filePath.name}_pb';
import * as descriptors from './${filePath.name}_bxdescriptors';

${fileDescriptor.getServiceList().map((service) => {
    const serviceName = service.getName();
    if (!serviceName) throw new Error(`${path.format(filePath)}: Service has no name.`);

    return `
/** Client for calling {@link descriptors.${serviceName}Service}. */
export class ${serviceName}Client extends ProtoClient {
    ${service.getMethodList().map((method) => {
        const methodName = method.getName();
        if (!methodName) throw new Error(`Method in service \`${serviceName}\` has no name!`);

        return `
    /** Invokes the {@link descriptors.${serviceName}Service.methods.${methodName}} method. */
    ${methodName}(req: protos.${getRelativeRequestType(method)}): Promise<protos.${getRelativeResponseType(method)}>;
        `.trim();
    }).join('\n\n    ' /* one indent */)}
}
    `.trim();
}).join('\n\n')}
    `.trim();
}