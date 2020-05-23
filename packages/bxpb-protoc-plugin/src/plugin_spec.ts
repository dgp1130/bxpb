import { compile } from "./plugin";

describe('plugin', () => {
    describe('compile()', () => {
        it('compiles', async () => {
            spyOn(console, 'log');

            await compile();

            expect(console.log).toHaveBeenCalledWith('Compiled! Trust me...');
        });
    });
});