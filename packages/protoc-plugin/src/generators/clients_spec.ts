import { dummyFileDescriptor } from '../testing/dummies';
import { generateClientFiles } from './clients';

describe('clients', ()=> {
    describe('generateClientFiles()', () => {
        it('generates proto client files', () => {
            const fileDescriptor = dummyFileDescriptor({
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
                generateClientFiles('foo.proto', fileDescriptor));

            expect(jsFile.getName()).toBe('foo_bxclients.js');
            expect(jsFile.getContent()).toBe(`
/** @fileoverview Client code for calling services defined in foo.proto. */

import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import * as descriptors from './foo_bxdescriptors.js';

/** Client for calling {@link descriptors.FooService}. */
export class FooClient extends internal.ProtoClient {
    /** Invokes the {@link descriptors.FooService.methods.Bar} method. */
    async Bar(req) {
        return await internal.rpc(this.sendMessage, descriptors.FooService, descriptors.FooService.methods.Bar, req);
    }
}
            `.trim());

            expect(dtsFile.getName()).toBe('foo_bxclients.d.ts');
            expect(dtsFile.getContent()).toBe(`
/** @fileoverview Client code for calling services defined in foo.proto. */

import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import protos from './foo_pb';
import * as descriptors from './foo_bxdescriptors';

/** Client for calling {@link descriptors.FooService}. */
export class FooClient extends internal.ProtoClient {
    /** Invokes the {@link descriptors.FooService.methods.Bar} method. */
    Bar(req: protos.BarRequest): Promise<protos.BarResponse>;
}
            `.trim());
        });

        it('generates multiple clients in a single file', () => {
            const fileDescriptor = dummyFileDescriptor({
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
                generateClientFiles('foo.proto', fileDescriptor));
            
            expect(jsFile.getContent()).toBe(`
/** @fileoverview Client code for calling services defined in foo.proto. */

import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import * as descriptors from './foo_bxdescriptors.js';

/** Client for calling {@link descriptors.FooService}. */
export class FooClient extends internal.ProtoClient {
    /** Invokes the {@link descriptors.FooService.methods.FooMethod} method. */
    async FooMethod(req) {
        return await internal.rpc(this.sendMessage, descriptors.FooService, descriptors.FooService.methods.FooMethod, req);
    }
}

/** Client for calling {@link descriptors.BarService}. */
export class BarClient extends internal.ProtoClient {
    /** Invokes the {@link descriptors.BarService.methods.BarMethod} method. */
    async BarMethod(req) {
        return await internal.rpc(this.sendMessage, descriptors.BarService, descriptors.BarService.methods.BarMethod, req);
    }
}
            `.trim());

            expect(dtsFile.getContent()).toBe(`
/** @fileoverview Client code for calling services defined in foo.proto. */

import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import protos from './foo_pb';
import * as descriptors from './foo_bxdescriptors';

/** Client for calling {@link descriptors.FooService}. */
export class FooClient extends internal.ProtoClient {
    /** Invokes the {@link descriptors.FooService.methods.FooMethod} method. */
    FooMethod(req: protos.FooMethodRequest): Promise<protos.FooMethodResponse>;
}

/** Client for calling {@link descriptors.BarService}. */
export class BarClient extends internal.ProtoClient {
    /** Invokes the {@link descriptors.BarService.methods.BarMethod} method. */
    BarMethod(req: protos.BarMethodRequest): Promise<protos.BarMethodResponse>;
}
            `.trim());
        });

        it('generates multiple methods in a single client', () => {
            const fileDescriptor = dummyFileDescriptor({
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
                generateClientFiles('foo.proto', fileDescriptor));

            expect(jsFile.getContent()).toBe(`
/** @fileoverview Client code for calling services defined in foo.proto. */

import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import * as descriptors from './foo_bxdescriptors.js';

/** Client for calling {@link descriptors.FooService}. */
export class FooClient extends internal.ProtoClient {
    /** Invokes the {@link descriptors.FooService.methods.Bar} method. */
    async Bar(req) {
        return await internal.rpc(this.sendMessage, descriptors.FooService, descriptors.FooService.methods.Bar, req);
    }

    /** Invokes the {@link descriptors.FooService.methods.Baz} method. */
    async Baz(req) {
        return await internal.rpc(this.sendMessage, descriptors.FooService, descriptors.FooService.methods.Baz, req);
    }
}
            `.trim());

            expect(dtsFile.getContent()).toBe(`
/** @fileoverview Client code for calling services defined in foo.proto. */

import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import protos from './foo_pb';
import * as descriptors from './foo_bxdescriptors';

/** Client for calling {@link descriptors.FooService}. */
export class FooClient extends internal.ProtoClient {
    /** Invokes the {@link descriptors.FooService.methods.Bar} method. */
    Bar(req: protos.BarRequest): Promise<protos.BarResponse>;

    /** Invokes the {@link descriptors.FooService.methods.Baz} method. */
    Baz(req: protos.BazRequest): Promise<protos.BazResponse>;
}
            `.trim());
        });

        it('generates nothing if there are no services in the file', () => {
            const fileDescriptor = dummyFileDescriptor({
                services: [], // No services in the file.
            });

            const generatedFiles = Array.from(generateClientFiles('foo.proto', fileDescriptor));

            expect(generatedFiles).toEqual([]);
        });

        it('generates files in subdirectory', () => {
            const [ jsFile, dtsFile ] = Array.from(generateClientFiles(
                'hello/world/foo.proto', dummyFileDescriptor()));
            
            // Output files should be in the same subdirectory.
            expect(jsFile.getName()).toBe('hello/world/foo_bxclients.js');
            expect(dtsFile.getName()).toBe('hello/world/foo_bxclients.d.ts');
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

            expect(() => Array.from(generateClientFiles('foo.proto', fileDescriptor)))
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

            expect(() => Array.from(generateClientFiles('foo.proto', fileDescriptor)))
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

            expect(() => Array.from(generateClientFiles('foo.proto', fileDescriptor)))
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

            expect(() => Array.from(generateClientFiles('foo.proto', fileDescriptor)))
                .toThrowMatching(
                    (err: Error) => err.message.includes('foo.proto: Service has no name.'),
                )
            ;
        });
    });
});