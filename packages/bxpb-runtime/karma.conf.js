module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: [ 'jasmine', 'karma-typescript' ],
        files: [
            'src/**/*.ts',
        ],
        preprocessors: {
            '**/*.ts': 'karma-typescript',
        },
        karmaTypescriptConfig: {
            tsconfig: './tsconfig.spec.json',

            // Disable coverage, or else it wraps source files inline and blocks the sourcemap
            // comment from being at the end of the file, thus the browser cannot parse it
            // correctly. By disabling coverage, source maps work as expected.
            coverageOptions: {
                instrumentation: false,
            },
        },
        reporters: [ 'karma-typescript', 'kjhtml' ],
    });
};