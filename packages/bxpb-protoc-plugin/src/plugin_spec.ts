import { promises as fs } from 'fs';
import { CodeGeneratorRequest, CodeGeneratorResponse } from 'google-protobuf/google/protobuf/compiler/plugin_pb';
import { execute } from "./plugin";

describe('plugin', () => {
    describe('execute()', () => {
        it('processes a `CodeGeneratorRequest` from stdin into a `CodeGeneratorResponse` to stdout',
                async () => {
            const req = new CodeGeneratorRequest();
            req.setFileToGenerateList([
                'foo.proto',
                'bar.proto',
                'baz.proto',
            ]);
            spyOn(fs, 'readFile').and.returnValue(
                Promise.resolve(Buffer.from(req.serializeBinary())));
            const writeSpy = spyOn(fs, 'writeFile');

            await execute();

            expect(fs.readFile).toHaveBeenCalledWith('/dev/stdin');

            expect(fs.writeFile).toHaveBeenCalledWith('/dev/stdout', jasmine.any(Uint8Array));
            const output: Uint8Array = writeSpy.calls.first().args[1];
            const res = CodeGeneratorResponse.deserializeBinary(output);

            const expectedFirst = new CodeGeneratorResponse.File();
            expectedFirst.setName('foo.proto.bxpb')
            expectedFirst.setContent('Content: foo.proto');
            const expectedSecond = new CodeGeneratorResponse.File();
            expectedSecond.setName('bar.proto.bxpb');
            expectedSecond.setContent('Content: bar.proto');
            const expectedThird = new CodeGeneratorResponse.File();
            expectedThird.setName('baz.proto.bxpb');
            expectedThird.setContent('Content: baz.proto')

            expect(res.getFileList()).toEqual([ expectedFirst, expectedSecond, expectedThird ]);
        });
    });
});