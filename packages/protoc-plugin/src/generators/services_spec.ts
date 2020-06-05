import { dummyFileDescriptor } from '../testing/dummies';
import { generateServiceFiles } from './services';

describe('services', () => {
    describe('generateServiceFiles()', () => {
        it('generates proto service files', () => {
            const fileDescriptor = dummyFileDescriptor({
                services: [
                    {
                        name: 'Foo',
                    },
                ],
            });

            const [ jsFile, dtsFile ] = Array.from(
                generateServiceFiles('foo.proto', fileDescriptor));
            
            expect(jsFile.getName()).toBe('foo_bxservices.js');
            expect(jsFile.getContent()).toBe(`
/** @fileoverview Service code for implementing services defined in foo.proto. */

import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import * as descriptors from './foo_bxdescriptors.js';

/**
 * Run {@link FooService} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serveFoo(transport, serviceImpl) {
    internal.serve(transport, descriptors.FooService, serviceImpl);
}
            `.trim());

            expect(dtsFile.getName()).toBe('foo_bxservices.d.ts');
            expect(dtsFile.getContent()).toBe(`
/** @fileoverview Service code for implementing services defined in foo.proto. */

import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import * as descriptors from './foo_bxdescriptors';

/**
 * Run {@link FooService} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serveFoo(transport: internal.Transport, serviceImpl: internal.ServiceImplementation<descriptors.IFooService>);
            `.trim());
        });
        
        it('generates multiple services in a single file', () => {
            const fileDescriptor = dummyFileDescriptor({
                services: [
                    { name: 'Foo' },
                    { name: 'Bar' },
                ],
            });

            const [ jsFile, dtsFile ] = Array.from(generateServiceFiles(
                'foo.proto', fileDescriptor));
            
            expect(jsFile.getContent()).toBe(`
/** @fileoverview Service code for implementing services defined in foo.proto. */

import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import * as descriptors from './foo_bxdescriptors.js';

/**
 * Run {@link FooService} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serveFoo(transport, serviceImpl) {
    internal.serve(transport, descriptors.FooService, serviceImpl);
}

/**
 * Run {@link BarService} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serveBar(transport, serviceImpl) {
    internal.serve(transport, descriptors.BarService, serviceImpl);
}
            `.trim());

            expect(dtsFile.getContent()).toBe(`
/** @fileoverview Service code for implementing services defined in foo.proto. */

import { internalOnlyDoNotDependOrElse as internal } from '@bxpb/runtime';
import * as descriptors from './foo_bxdescriptors';

/**
 * Run {@link FooService} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serveFoo(transport: internal.Transport, serviceImpl: internal.ServiceImplementation<descriptors.IFooService>);

/**
 * Run {@link BarService} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serveBar(transport: internal.Transport, serviceImpl: internal.ServiceImplementation<descriptors.IBarService>);
            `.trim());
        });

        it('generates nothing if there are no services in the file', () => {
            const fileDescriptor = dummyFileDescriptor({
                services: [], // No services in the file.
            });

            const generatedFiles = Array.from(generateServiceFiles('foo.proto', fileDescriptor));

            expect(generatedFiles).toEqual([]);
        });

        it('generates files in subdirectory', () => {
            const [ jsFile, dtsFile ] = Array.from(generateServiceFiles(
                'hello/world/foo.proto', dummyFileDescriptor()));
            
            // Output files should be in the same subdirectory.
            expect(jsFile.getName()).toBe('hello/world/foo_bxservices.js');
            expect(dtsFile.getName()).toBe('hello/world/foo_bxservices.d.ts');
        });

        it('throws when given a service with no name', () => {
            const fileDescriptor = dummyFileDescriptor({
                services: [
                    { name: null }, // Caller forgot to set a name.
                ],
            });

            expect(() => Array.from(generateServiceFiles('foo.proto', fileDescriptor)))
                .toThrowMatching(
                    (err: Error) => err.message.includes('foo.proto: Service has no name.'),
                )
            ;
        });
    });
});