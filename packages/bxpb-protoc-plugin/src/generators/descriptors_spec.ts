import { generateDescriptorFiles } from './descriptors';
import { dummyFileDescriptor } from '../testing/dummies';

describe('plugin', () => {
    describe('generateDescriptorFiles()', () => {
        it('generates proto descriptor files', () => {
            const fileDescriptor = dummyFileDescriptor({
                pkg: 'hello.world',
                services: [
                    {
                        name: 'Foo',
                        methods: [
                            {
                                name: 'Bar',
                                inputType: 'BarRequest',
                                outputType: 'BarResponse',
                            },
                        ],
                    },
                ],
            });

            const [ jsFile, dtsFile ] = Array.from(
                generateDescriptorFiles('foo.proto', fileDescriptor));

            expect(jsFile.getName()).toBe('foo_bxdescriptors.js');
            expect(jsFile.getContent()).toBe(`
import protos from './foo_pb.js';

/** Service descriptor for Foo. */
export const FooService = Object.freeze({
    serviceNameFq: 'hello.world.Foo',
    methods: {
        Bar: {
            name: 'Bar',
            requestSerialize: (message) => message.serializeBinary(),
            requestDeserialize: (message) => protos.BarRequest.deserializeBinary(message),
            responseSerialize: (message) => message.serializeBinary(),
            responseDeserialize: (message) => protos.BarResponse.deserializeBinary(message),
        },
    },
});
            `.trim());

            expect(dtsFile.getName()).toBe('foo_bxdescriptors.d.ts');
            expect(dtsFile.getContent()).toBe(`
import { Message } from 'google-protobuf';
import { MethodDescriptor, ServiceDescriptor } from 'bxpb-runtime/dist/descriptors';
import protos from './foo_pb';

/** Interface of Foo's service descriptor. */
export interface IFooService extends ServiceDescriptor<any> {
    readonly serviceNameFq: 'hello.world.Foo';
    readonly methods: {
        readonly Bar: MethodDescriptor<'Bar', protos.BarRequest, protos.BarResponse>;
    };
}

/** Service descriptor for Foo. */
export const FooService: ServiceDescriptor<IFooService>;
            `.trim());
        });

        it('generates multiple services in a single file', () => {
            const fileDescriptor = dummyFileDescriptor({
                pkg: 'hello.world',
                services: [
                    {
                        name: 'Foo',
                        methods: [
                            {
                                name: 'FooMethod',
                                inputType: 'FooMethodRequest',
                                outputType: 'FooMethodResponse',
                            },
                        ],
                    },
                    {
                        name: 'Bar',
                        methods: [
                            {
                                name: 'BarMethod',
                                inputType: 'BarMethodRequest',
                                outputType: 'BarMethodResponse',
                            },
                        ],
                    },
                ],
            });

            const [ jsFile, dtsFile ] = Array.from(
                generateDescriptorFiles('foo.proto', fileDescriptor));
            
            expect(jsFile.getContent()).toBe(`
import protos from './foo_pb.js';

/** Service descriptor for Foo. */
export const FooService = Object.freeze({
    serviceNameFq: 'hello.world.Foo',
    methods: {
        FooMethod: {
            name: 'FooMethod',
            requestSerialize: (message) => message.serializeBinary(),
            requestDeserialize: (message) => protos.FooMethodRequest.deserializeBinary(message),
            responseSerialize: (message) => message.serializeBinary(),
            responseDeserialize: (message) => protos.FooMethodResponse.deserializeBinary(message),
        },
    },
});

/** Service descriptor for Bar. */
export const BarService = Object.freeze({
    serviceNameFq: 'hello.world.Bar',
    methods: {
        BarMethod: {
            name: 'BarMethod',
            requestSerialize: (message) => message.serializeBinary(),
            requestDeserialize: (message) => protos.BarMethodRequest.deserializeBinary(message),
            responseSerialize: (message) => message.serializeBinary(),
            responseDeserialize: (message) => protos.BarMethodResponse.deserializeBinary(message),
        },
    },
});
            `.trim());

            expect(dtsFile.getContent()).toBe(`
import { Message } from 'google-protobuf';
import { MethodDescriptor, ServiceDescriptor } from 'bxpb-runtime/dist/descriptors';
import protos from './foo_pb';

/** Interface of Foo's service descriptor. */
export interface IFooService extends ServiceDescriptor<any> {
    readonly serviceNameFq: 'hello.world.Foo';
    readonly methods: {
        readonly FooMethod: MethodDescriptor<'FooMethod', protos.FooMethodRequest, protos.FooMethodResponse>;
    };
}

/** Service descriptor for Foo. */
export const FooService: ServiceDescriptor<IFooService>;

/** Interface of Bar's service descriptor. */
export interface IBarService extends ServiceDescriptor<any> {
    readonly serviceNameFq: 'hello.world.Bar';
    readonly methods: {
        readonly BarMethod: MethodDescriptor<'BarMethod', protos.BarMethodRequest, protos.BarMethodResponse>;
    };
}

/** Service descriptor for Bar. */
export const BarService: ServiceDescriptor<IBarService>;
            `.trim());
        });

        it('generates nothing if there are no services in the file', () => {
            const fileDescriptor = dummyFileDescriptor({
                services: [], // No services in the file.
            });

            const generatedFiles = Array.from(generateDescriptorFiles('foo.proto', fileDescriptor));

            expect(generatedFiles).toEqual([]);
        });

        it('generates files in subdirectory', () => {
            const [ jsFile, dtsFile ] = Array.from(generateDescriptorFiles(
                'hello/world/foo.proto', dummyFileDescriptor()));

            // Output files should be in the same subdirectory.
            expect(jsFile.getName()).toBe('hello/world/foo_bxdescriptors.js');
            expect(dtsFile.getName()).toBe('hello/world/foo_bxdescriptors.d.ts');
        });

        it('generates files with no package', () => {
            const fileDescriptor = dummyFileDescriptor({
                pkg: null, // Caller forgot to set package.
                services: [
                    {
                        name: 'Foo',
                        methods: [
                            {
                                name: 'Bar',
                                inputType: 'BarRequest',
                                outputType: 'BarResponse',
                            },
                        ],
                    },
                ],
            });

            const [ jsFile, dtsFile ] = Array.from(
                generateDescriptorFiles('foo.proto', fileDescriptor));

            expect(jsFile.getContent()).toBe(`
import protos from './foo_pb.js';

/** Service descriptor for Foo. */
export const FooService = Object.freeze({
    serviceNameFq: 'Foo',
    methods: {
        Bar: {
            name: 'Bar',
            requestSerialize: (message) => message.serializeBinary(),
            requestDeserialize: (message) => protos.BarRequest.deserializeBinary(message),
            responseSerialize: (message) => message.serializeBinary(),
            responseDeserialize: (message) => protos.BarResponse.deserializeBinary(message),
        },
    },
});
            `.trim());

            expect(dtsFile.getContent()).toBe(`
import { Message } from 'google-protobuf';
import { MethodDescriptor, ServiceDescriptor } from 'bxpb-runtime/dist/descriptors';
import protos from './foo_pb';

/** Interface of Foo's service descriptor. */
export interface IFooService extends ServiceDescriptor<any> {
    readonly serviceNameFq: 'Foo';
    readonly methods: {
        readonly Bar: MethodDescriptor<'Bar', protos.BarRequest, protos.BarResponse>;
    };
}

/** Service descriptor for Foo. */
export const FooService: ServiceDescriptor<IFooService>;
            `.trim());
        });

        it('throws when given a method with no name', () => {
            const fileDescriptor = dummyFileDescriptor({
                services: [
                    {
                        name: 'Foo',
                        methods: [
                            {
                                name: null, // Caller forgot to set a name.
                            },
                        ],
                    },
                ],
            });

            expect(() => Array.from(generateDescriptorFiles('foo.proto', fileDescriptor)))
                .toThrowMatching(
                    (err: Error) => err.message.includes('Method in service `Foo` has no name!'),
                )
            ;
        });

        it('throws when given a method with no input type', () => {
            const fileDescriptor = dummyFileDescriptor({
                services: [
                    {
                        methods: [
                            {
                                name: 'Bar',
                                inputType: null, // Caller forgot to set an input type.
                            },
                        ],
                    },
                ],
            });

            expect(() => Array.from(generateDescriptorFiles('foo.proto', fileDescriptor)))
                .toThrowMatching(
                    (err: Error) => err.message.includes('Method `Bar` is missing an input type!'),
                )
            ;
        });

        it('throws when given a method with no output type', () => {
            const fileDescriptor = dummyFileDescriptor({
                services: [
                    {
                        methods: [
                            {
                                name: 'Bar',
                                outputType: null,
                            },
                        ],
                    },
                ],
            });

            expect(() => Array.from(generateDescriptorFiles('foo.proto', fileDescriptor)))
                .toThrowMatching(
                    (err: Error) => err.message.includes('Method `Bar` is missing an output type!'),
                )
            ;
        });

        it('throws when given a service with no name', () => {
            const fileDescriptor = dummyFileDescriptor({
                services: [
                    {
                        name: null, // Caller forgot to set a name.
                    },
                ],
            });

            expect(() => Array.from(generateDescriptorFiles('foo.proto', fileDescriptor)))
                .toThrowMatching(
                    (err: Error) => err.message.includes('foo.proto: Service has no name.'),
                )
            ;
        });
    });
});