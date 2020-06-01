import * as path from 'path';
import { FileDescriptorProto } from 'google-protobuf/google/protobuf/descriptor_pb';
import { CodeGeneratorResponse } from 'google-protobuf/google/protobuf/compiler/plugin_pb';

/**
 * Returns an iterable of generated BXPB services from the given *.proto file and its descriptor.
 */
export function* generateServiceFiles(file: string, fileDescriptor: FileDescriptorProto):
        Iterable<CodeGeneratorResponse.File> {
    // If there are no services, don't generate anything.
    if (fileDescriptor.getServiceList().length === 0) return;
    
    const filePath = path.parse(file);
    const generatedBaseName = `${filePath.name}_bxservices`;

    // Generate JavaScript file.
    const jsFile = new CodeGeneratorResponse.File();
    jsFile.setName(path.format({
        ...filePath,
        base: undefined, // Must not specify base for name and ext to be used.
        name: generatedBaseName,
        ext: '.js',
    }));
    jsFile.setContent(generateServiceJs(filePath, fileDescriptor));
    yield jsFile;

    // Generate TypeScript definitions.
    const dtsFile = new CodeGeneratorResponse.File();
    dtsFile.setName(path.format({
        ...filePath,
        base: undefined, // Must not specify base for name and ext to be used.
        name: generatedBaseName,
        ext: '.d.ts',
    }));
    dtsFile.setContent(generateServiceDts(filePath, fileDescriptor));
    yield dtsFile;
}

/** Returns the generated JavaScript source as a string. */
function generateServiceJs(filePath: path.ParsedPath, descriptor: FileDescriptorProto): string {
    const serviceNames = descriptor.getServiceList().map((service) => {
        const name = service.getName();
        if (!name) throw new Error(`${path.format(filePath)}: Service has no name.`);
        return name;
    });

    return `
import { serve } from 'bxpb-runtime/dist/service.js';
import * as descriptors from './${filePath.name}_bxdescriptors.js';

${serviceNames.map((serviceName) => `
/**
 * Run {@link ${serviceName}Service} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serve${serviceName}(transport, serviceImpl) {
    serve(transport, descriptors.${serviceName}Service, serviceImpl);
}
`.trim()).join('\n\n')}
    `.trim();
}

/** Returns the generated TypeScript definitions as a string. */
function generateServiceDts(filePath: path.ParsedPath, descriptor: FileDescriptorProto): string {
    const serviceNames = descriptor.getServiceList().map((service) => {
        const name = service.getName();
        if (!name) throw new Error(`${path.format(filePath)}: Service has no name.`);
        return name;
    });

    return `
import { Transport, ServiceImplementation } from 'bxpb-runtime/dist/service';
import * as descriptors from './${filePath.name}_bxdescriptors';

${serviceNames.map((serviceName) => `
/**
 * Run {@link ${serviceName}Service} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serve${serviceName}(transport: Transport, serviceImpl: ServiceImplementation<descriptors.${serviceName}Service>);
`.trim()).join('\n\n')}
    `.trim();
}