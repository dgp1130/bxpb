import { promises as fs } from 'fs';
import { CodeGeneratorRequest, CodeGeneratorResponse } from 'google-protobuf/google/protobuf/compiler/plugin_pb';
import { FileDescriptorProto } from 'google-protobuf/google/protobuf/descriptor_pb';
import * as descriptorGenerator from './generators/descriptors';
import * as serviceGenerator from './generators/services';
import * as clientGenerator from './generators/clients';

/**
 * Executes the plugin by reading a serialized {@link CodeGeneratorRequest} from stdin and writing a
 * {@link CodeGeneratorResponse} to stdout.
 * 
 * Implementation note: This is just responsible for reading stdin and writing stdout.
 */
export async function execute() {
    const stdin = await fs.readFile('/dev/stdin');

    const stdout = executeSerialization(stdin);

    await fs.writeFile('/dev/stdout', stdout);
}

/**
 * Parses the given data as {@link CodeGeneratorRequest}, generates a response and serializes it as
 * {@link CodeGeneratorResponse}.
 */
function executeSerialization(request: Uint8Array): Uint8Array {
    const req = CodeGeneratorRequest.deserializeBinary(request);

    const res = generate(req);

    return res.serializeBinary();
}

/**
 * Generates output files for the given {@link CodeGeneratorRequest} as a
 * {@link CodeGeneratorResponse}.
 */
function generate(req: CodeGeneratorRequest): CodeGeneratorResponse {
    // Assert that the number of files and file descriptors are the same.
    const files = req.getFileToGenerateList();
    const fileDescriptors = req.getProtoFileList();
    if (files.length != fileDescriptors.length) {
        throw new Error('Count of `file_to_generate` should match count of `proto_file`.');
    }

    // Generate code from the input protos.
    const res = new CodeGeneratorResponse();
    res.setFileList(
        zip(files, fileDescriptors)
            .flatMap(([ file, descriptor ]) => [ ...generateProto(file, descriptor) ]),
    );
    return res;
}

/** Returns an iterable of generated files from the given *.proto file and its descriptor. */
function* generateProto(file: string, fileDescriptor: FileDescriptorProto):
        Iterable<CodeGeneratorResponse.File> {
    // If there are no services, there is nothing to generate.
    if (fileDescriptor.getServiceList().length === 0) return [];

    // Generate proto code.
    yield* descriptorGenerator.generateDescriptorFiles(file, fileDescriptor);
    yield* serviceGenerator.generateServiceFiles(file, fileDescriptor);
    yield* clientGenerator.generateClientFiles(file, fileDescriptor);
}

/**
 * Zips the two given arrays into a single array of tuples of items with the same index in both
 * arrays.
 * 
 * @throws When the provided arrays are different lengths.
 */
function zip<T, U>(first: T[], second: U[]): Array<readonly [T, U]> {
    if (first.length !== second.length) {
        throw new Error(`Cannot zip() arrays of different lengths: ${first.length} !==` +
                ` ${second.length}.`);
    }
    return first.map((item, index) => [item, second[index]] as const);
}