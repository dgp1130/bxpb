import { promises as fs } from 'fs';
import { CodeGeneratorRequest, CodeGeneratorResponse } from 'google-protobuf/google/protobuf/compiler/plugin_pb';
import { execute } from "./plugin";
import { dummyFileDescriptor, dummyCodegenRequest, dummyCodegenResponseFile } from './testing/dummies';
import * as descriptorGenerator from './generators/descriptors';

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

            const res = await invokePlugin(req);

            expect(descriptorGenerator.generateDescriptorFiles).toHaveBeenCalledWith(
                'foo.proto', dummyFileDescriptor());

            const [ descriptorJs, descriptorDts ] = res.getFileList();
            
            expect(descriptorJs.getName()).toBe('foo_descriptors.js');
            expect(descriptorJs.getContent()).toBe('export const descriptors = [ /* ... */ ];');

            expect(descriptorDts.getName()).toBe('foo_descriptors.d.ts');
            expect(descriptorDts.getContent()).toBe('export const descriptors: Descriptor[];');
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

            const [ fooDescriptorJs, fooDescriptorDts, barDescriptorJs, barDescriptorDts ] =
                    res.getFileList();
            
            expect(fooDescriptorJs.getName()).toBe('foo_descriptors.js');
            expect(fooDescriptorDts.getName()).toBe('foo_descriptors.d.ts');
            expect(barDescriptorJs.getName()).toBe('bar_descriptors.js');
            expect(barDescriptorDts.getName()).toBe('bar_descriptors.d.ts');
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

            const res = await invokePlugin(req);

            expect(descriptorGenerator.generateDescriptorFiles).not.toHaveBeenCalled();

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