import { promises as fs } from 'fs';
import { CodeGeneratorRequest, CodeGeneratorResponse } from 'google-protobuf/google/protobuf/compiler/plugin_pb';

/**
 * Executes the plugin by reading a serialized {@link CodeGeneratorRequest} from stdin and writing a
 * {@link CodeGeneratorResponse} to stdout.
 * 
 * Implementation note: This is just responsible for reading stdin and writing stdout.
 */
export async function execute() {
    const stdin = await fs.readFile('/dev/stdin');

    const stdout = await executeSerialization(stdin);

    await fs.writeFile('/dev/stdout', stdout);
}

/**
 * Parses the given data as {@link CodeGeneratorRequest}, generates a response and serializes it as
 * {@link CodeGeneratorResponse}.
 */
async function executeSerialization(request: Uint8Array): Promise<Uint8Array> {
    const req = CodeGeneratorRequest.deserializeBinary(request);

    const res = await generate(req);

    return res.serializeBinary();
}

/**
 * Generates output files for the given {@link CodeGeneratorRequest} as a
 * {@link CodeGeneratorResponse}.
 */
async function generate(req: CodeGeneratorRequest): Promise<CodeGeneratorResponse> {
    const res = new CodeGeneratorResponse();

    // Generate dummy files for now.
    res.setFileList(req.getFileToGenerateList().map((file) => {
        const output = new CodeGeneratorResponse.File();
        output.setName(`${file}.bxpb`);
        output.setContent(`Content: ${file}`);
        return output;
    }));

    return res;
}