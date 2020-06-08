import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

// Handle warnings.
function onwarn(warning, warn) {
    // Protocol buffers use `eval()` which generates a warning in Rollup.
    // Ignore this warning as there's nothing we can do about.
    if (warning.code === 'EVAL') return;
    warn(warning);
}

export default [
    // Build JavaScript for background script.
    {
        input: 'background.ts',
        output: {
            name: 'background',
            file: 'build/background.js',
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
    },

    // Build JavaScript for popup window.
    {
        input: 'popup.ts',
        output: {
            name: 'popup',
            file: 'build/popup.js',
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
    },
];