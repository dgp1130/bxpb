import { promises as fs } from 'fs';
import { CodeGeneratorRequest, CodeGeneratorResponse } from 'google-protobuf/google/protobuf/compiler/plugin_pb';
import { execute } from "./plugin";
import { dummyFileDescriptor, dummyCodegenRequest, dummyCodegenResponseFile } from './testing/dummies';
import * as descriptorGenerator from './generators/descriptors';
import * as serviceGenerator from './generators/services';

/** Helper function to invoke the plugin's {@link execute} method in a simple fashion. */
async function invokePlugin(req: CodeGeneratorRequest): Promise<CodeGeneratorResponse> {
    // Set up the serialized request to be read from stdin.
    spyOn(fs, 'readFile').and.returnValue(
        Promise.resolve(Buffer.from(req.serializeBinary())));
    const writeSpy = spyOn(fs, 'writeFile');

    // Call the plugin.
    await execute();

    // Expect that the request was read from stdin.
    expect(fs.readFile).toHaveBeenCalledWith('/dev/stdin');

    // Expect that the response was written to stdout.
    expect(fs.writeFile).toHaveBeenCalledWith('/dev/stdout', jasmine.any(Uint8Array));

    // Deserialize the response given to stdout.
    const output: Uint8Array = writeSpy.calls.first().args[1];
    return CodeGeneratorResponse.deserializeBinary(output);
}

describe('plugin', () => {
    describe('execute()', () => {
        it('processes a `CodeGeneratorRequest` from stdin into a `CodeGeneratorResponse` to stdout',
                async () => {
            const req = dummyCodegenRequest({
                filesToGenerate: [ 'foo.proto' ],
                protoFiles: [ {} ],
            });

            spyOn(descriptorGenerator, 'generateDescriptorFiles').and.returnValue([
                dummyCodegenResponseFile({
                    name: 'foo_descriptors.js',
                    content: 'export const descriptors = [ /* ... */ ];',
                }),
                dummyCodegenResponseFile({
                    name: 'foo_descriptors.d.ts',
                    content: 'export const descriptors: Descriptor[];',
                }),
            ]);

            spyOn(serviceGenerator, 'generateServiceFiles').and.returnValue([
                dummyCodegenResponseFile({
                    name: 'foo_services.js',
                    content: 'export const services = [ /* ... */ ];',
                }),
                dummyCodegenResponseFile({
                    name: 'foo_services.d.ts',
                    content: 'export const services: Service[];',
                }),
            ]);

            const res = await invokePlugin(req);

            expect(descriptorGenerator.generateDescriptorFiles).toHaveBeenCalledWith(
                'foo.proto', dummyFileDescriptor());
            expect(serviceGenerator.generateServiceFiles).toHaveBeenCalledWith(
                'foo.proto', dummyFileDescriptor());

            const [ descriptorJs, descriptorDts, serviceJs, serviceDts ] = res.getFileList();
            
            expect(descriptorJs.getName()).toBe('foo_descriptors.js');
            expect(descriptorJs.getContent()).toBe('export const descriptors = [ /* ... */ ];');

            expect(descriptorDts.getName()).toBe('foo_descriptors.d.ts');
            expect(descriptorDts.getContent()).toBe('export const descriptors: Descriptor[];');
            
            expect(serviceJs.getName()).toBe('foo_services.js');
            expect(serviceJs.getContent()).toBe('export const services = [ /* ... */ ];');

            expect(serviceDts.getName()).toBe('foo_services.d.ts');
            expect(serviceDts.getContent()).toBe('export const services: Service[];');
        });

        it('generates from multiple proto source files', async () => {
            const req = dummyCodegenRequest({
                filesToGenerate: [ 'foo.proto', 'bar.proto' ],
                protoFiles: [
                    { // foo.proto
                        services: [
                            { name: 'Foo' },
                        ],
                    },
                    { // bar.proto
                        services: [
                            { name: 'Bar' },
                        ],
                    },
                ],
            });

            spyOn(descriptorGenerator, 'generateDescriptorFiles').and.returnValues(
                // Call to generate foo.proto.
                [
                    dummyCodegenResponseFile({ name: 'foo_descriptors.js' }),
                    dummyCodegenResponseFile({ name: 'foo_descriptors.d.ts' }),
                ],

                // Call to generate bar.proto.
                [
                    dummyCodegenResponseFile({ name: 'bar_descriptors.js' }),
                    dummyCodegenResponseFile({ name: 'bar_descriptors.d.ts' }),
                ],
            );

            spyOn(serviceGenerator, 'generateServiceFiles').and.returnValues(
                // Call to generate foo.proto.
                [
                    dummyCodegenResponseFile({ name: 'foo_services.js' }),
                    dummyCodegenResponseFile({ name: 'foo_services.d.ts' }),
                ],

                // Call to generate bar.proto.
                [
                    dummyCodegenResponseFile({ name: 'bar_services.js' }),
                    dummyCodegenResponseFile({ name: 'bar_services.d.ts' }),
                ],
            );

            const res = await invokePlugin(req);

            expect(descriptorGenerator.generateDescriptorFiles).toHaveBeenCalledTimes(2);
            expect(descriptorGenerator.generateDescriptorFiles).toHaveBeenCalledWith(
                'foo.proto',
                dummyFileDescriptor({
                    services: [
                        { name: 'Foo' },
                    ],
                }),
            );
            expect(descriptorGenerator.generateDescriptorFiles).toHaveBeenCalledWith(
                'bar.proto',
                dummyFileDescriptor({
                    services: [
                        { name: 'Bar' },
                    ],
                }),
            );

            expect(serviceGenerator.generateServiceFiles).toHaveBeenCalledTimes(2);
            expect(serviceGenerator.generateServiceFiles).toHaveBeenCalledWith(
                'foo.proto',
                dummyFileDescriptor({
                    services: [
                        { name: 'Foo' },
                    ],
                }),
            );
            expect(serviceGenerator.generateServiceFiles).toHaveBeenCalledWith(
                'bar.proto',
                dummyFileDescriptor({
                    services: [
                        { name: 'Bar' },
                    ],
                }),
            );

            const [ fooDescriptorJs, fooDescriptorDts, fooServiceJs, fooServiceDts,
                    barDescriptorJs, barDescriptorDts, barServiceJs, barServiceDts ] =
                    res.getFileList();
            
            expect(fooDescriptorJs.getName()).toBe('foo_descriptors.js');
            expect(fooDescriptorDts.getName()).toBe('foo_descriptors.d.ts');
            expect(fooServiceJs.getName()).toBe('foo_services.js');
            expect(fooServiceDts.getName()).toBe('foo_services.d.ts');
            expect(barDescriptorJs.getName()).toBe('bar_descriptors.js');
            expect(barDescriptorDts.getName()).toBe('bar_descriptors.d.ts');
            expect(barServiceJs.getName()).toBe('bar_services.js');
            expect(barServiceDts.getName()).toBe('bar_services.d.ts');
        });

        it('generates from source file with no services', async () => {
            const req = dummyCodegenRequest({
                filesToGenerate: [ 'foo.proto' ],
                protoFiles: [
                    {
                        services: [], // No services in proto file.
                    },
                ],
            });

            spyOn(descriptorGenerator, 'generateDescriptorFiles');
            spyOn(serviceGenerator, 'generateServiceFiles');

            const res = await invokePlugin(req);

            expect(descriptorGenerator.generateDescriptorFiles).not.toHaveBeenCalled();
            expect(serviceGenerator.generateServiceFiles).not.toHaveBeenCalled();

            expect(res.getFileList()).toEqual([]);
        });

        it('throws when given a different number of files and descriptors', async () => {
            const req = dummyCodegenRequest({
                // Caller gives two files, but only one file descriptor.
                filesToGenerate: [ 'foo.proto', 'bar.proto' ],
                protoFiles: [ {} ],
            });

            await expectAsync(invokePlugin(req)).toBeRejectedWithError(
                /Count of `file_to_generate` should match count of `proto_file`./);
        });
    });
});