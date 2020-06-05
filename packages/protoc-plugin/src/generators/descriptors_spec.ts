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
/**
 * @fileoverview Descriptors of services defined in foo.proto.
 * 
 * WARNING: The content of these files are considered an implementation detail of BXPB, are not
 * subject to semantic versioning and are not suitable for direct use. DO NOT IMPORT THIS FILE
 * DIRECTLY as it may change at any time without warning!
 */

import protos from './foo_pb.js';

/** Service descriptor for \`Foo\`. */
export const FooService = Object.freeze({
    serviceNameFq: 'hello.world.Foo',
    methods: {
        /** Method descriptor for \`Foo.Bar\`. */
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
/**
 * @fileoverview Descriptors of services defined in foo.proto.
 * 
 * WARNING: The content of these files are considered an implementation detail of BXPB, are not
 * subject to semantic versioning and are not suitable for direct use. DO NOT IMPORT THIS FILE
 * DIRECTLY as it may change at any time without warning!
 */

import { Message } from 'google-protobuf';
import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import protos from './foo_pb';

/** Interface of \`Foo\`'s service descriptor. */
export interface IFooService extends internal.ServiceDescriptor {
    readonly serviceNameFq: 'hello.world.Foo';
    readonly methods: {
        /** Interface of \`Foo.Bar\`'s method descriptor. */
        readonly Bar: internal.MethodDescriptor<'Bar', protos.BarRequest, protos.BarResponse>;
    };
}

/** Service descriptor for \`Foo\`. */
export const FooService: IFooService;
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
/**
 * @fileoverview Descriptors of services defined in foo.proto.
 * 
 * WARNING: The content of these files are considered an implementation detail of BXPB, are not
 * subject to semantic versioning and are not suitable for direct use. DO NOT IMPORT THIS FILE
 * DIRECTLY as it may change at any time without warning!
 */

import protos from './foo_pb.js';

/** Service descriptor for \`Foo\`. */
export const FooService = Object.freeze({
    serviceNameFq: 'hello.world.Foo',
    methods: {
        /** Method descriptor for \`Foo.FooMethod\`. */
        FooMethod: {
            name: 'FooMethod',
            requestSerialize: (message) => message.serializeBinary(),
            requestDeserialize: (message) => protos.FooMethodRequest.deserializeBinary(message),
            responseSerialize: (message) => message.serializeBinary(),
            responseDeserialize: (message) => protos.FooMethodResponse.deserializeBinary(message),
        },
    },
});

/** Service descriptor for \`Bar\`. */
export const BarService = Object.freeze({
    serviceNameFq: 'hello.world.Bar',
    methods: {
        /** Method descriptor for \`Bar.BarMethod\`. */
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
/**
 * @fileoverview Descriptors of services defined in foo.proto.
 * 
 * WARNING: The content of these files are considered an implementation detail of BXPB, are not
 * subject to semantic versioning and are not suitable for direct use. DO NOT IMPORT THIS FILE
 * DIRECTLY as it may change at any time without warning!
 */

import { Message } from 'google-protobuf';
import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import protos from './foo_pb';

/** Interface of \`Foo\`'s service descriptor. */
export interface IFooService extends internal.ServiceDescriptor {
    readonly serviceNameFq: 'hello.world.Foo';
    readonly methods: {
        /** Interface of \`Foo.FooMethod\`'s method descriptor. */
        readonly FooMethod: internal.MethodDescriptor<'FooMethod', protos.FooMethodRequest, protos.FooMethodResponse>;
    };
}

/** Service descriptor for \`Foo\`. */
export const FooService: IFooService;

/** Interface of \`Bar\`'s service descriptor. */
export interface IBarService extends internal.ServiceDescriptor {
    readonly serviceNameFq: 'hello.world.Bar';
    readonly methods: {
        /** Interface of \`Bar.BarMethod\`'s method descriptor. */
        readonly BarMethod: internal.MethodDescriptor<'BarMethod', protos.BarMethodRequest, protos.BarMethodResponse>;
    };
}

/** Service descriptor for \`Bar\`. */
export const BarService: IBarService;
            `.trim());
        });

        it('generates multiple methods in a single service', () => {
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
                            {
                                name: 'Baz',
                                inputType: 'BazRequest',
                                outputType: 'BazResponse',
                            },
                        ],
                    },
                ],
            });

            const [ jsFile, dtsFile ] = Array.from(
                generateDescriptorFiles('foo.proto', fileDescriptor));
            
            expect(jsFile.getContent()).toBe(`
/**
 * @fileoverview Descriptors of services defined in foo.proto.
 * 
 * WARNING: The content of these files are considered an implementation detail of BXPB, are not
 * subject to semantic versioning and are not suitable for direct use. DO NOT IMPORT THIS FILE
 * DIRECTLY as it may change at any time without warning!
 */

import protos from './foo_pb.js';

/** Service descriptor for \`Foo\`. */
export const FooService = Object.freeze({
    serviceNameFq: 'hello.world.Foo',
    methods: {
        /** Method descriptor for \`Foo.Bar\`. */
        Bar: {
            name: 'Bar',
            requestSerialize: (message) => message.serializeBinary(),
            requestDeserialize: (message) => protos.BarRequest.deserializeBinary(message),
            responseSerialize: (message) => message.serializeBinary(),
            responseDeserialize: (message) => protos.BarResponse.deserializeBinary(message),
        },

        /** Method descriptor for \`Foo.Baz\`. */
        Baz: {
            name: 'Baz',
            requestSerialize: (message) => message.serializeBinary(),
            requestDeserialize: (message) => protos.BazRequest.deserializeBinary(message),
            responseSerialize: (message) => message.serializeBinary(),
            responseDeserialize: (message) => protos.BazResponse.deserializeBinary(message),
        },
    },
});
            `.trim());

            expect(dtsFile.getContent()).toBe(`
/**
 * @fileoverview Descriptors of services defined in foo.proto.
 * 
 * WARNING: The content of these files are considered an implementation detail of BXPB, are not
 * subject to semantic versioning and are not suitable for direct use. DO NOT IMPORT THIS FILE
 * DIRECTLY as it may change at any time without warning!
 */

import { Message } from 'google-protobuf';
import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import protos from './foo_pb';

/** Interface of \`Foo\`'s service descriptor. */
export interface IFooService extends internal.ServiceDescriptor {
    readonly serviceNameFq: 'hello.world.Foo';
    readonly methods: {
        /** Interface of \`Foo.Bar\`'s method descriptor. */
        readonly Bar: internal.MethodDescriptor<'Bar', protos.BarRequest, protos.BarResponse>;

        /** Interface of \`Foo.Baz\`'s method descriptor. */
        readonly Baz: internal.MethodDescriptor<'Baz', protos.BazRequest, protos.BazResponse>;
    };
}

/** Service descriptor for \`Foo\`. */
export const FooService: IFooService;
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
/**
 * @fileoverview Descriptors of services defined in foo.proto.
 * 
 * WARNING: The content of these files are considered an implementation detail of BXPB, are not
 * subject to semantic versioning and are not suitable for direct use. DO NOT IMPORT THIS FILE
 * DIRECTLY as it may change at any time without warning!
 */

import protos from './foo_pb.js';

/** Service descriptor for \`Foo\`. */
export const FooService = Object.freeze({
    serviceNameFq: 'Foo',
    methods: {
        /** Method descriptor for \`Foo.Bar\`. */
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
/**
 * @fileoverview Descriptors of services defined in foo.proto.
 * 
 * WARNING: The content of these files are considered an implementation detail of BXPB, are not
 * subject to semantic versioning and are not suitable for direct use. DO NOT IMPORT THIS FILE
 * DIRECTLY as it may change at any time without warning!
 */

import { Message } from 'google-protobuf';
import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import protos from './foo_pb';

/** Interface of \`Foo\`'s service descriptor. */
export interface IFooService extends internal.ServiceDescriptor {
    readonly serviceNameFq: 'Foo';
    readonly methods: {
        /** Interface of \`Foo.Bar\`'s method descriptor. */
        readonly Bar: internal.MethodDescriptor<'Bar', protos.BarRequest, protos.BarResponse>;
    };
}

/** Service descriptor for \`Foo\`. */
export const FooService: IFooService;
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