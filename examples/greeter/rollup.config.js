import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

// Handle warnings.
function onwarn(warning, warn) {
    // Suppress "eval" warning.
    // I hate it too, but the Protobuf library uses Closure which emits eval'd code.
    // Nothing to do but ignore the warning.
    if (warning.code === 'EVAL') return;
    warn(warning);
}

export default {
    input: 'src/background.ts',
    output: {
        name: 'background',
        file: 'dist/background.js',
        sourcemap: 'inline',
        format: 'iife',
    },
    plugins: [
        typescript(),
        resolve({
            browser: true,
        }),
        commonjs({
            extensions: ['.js', '.ts'],
        }),
    ],
    onwarn,
}