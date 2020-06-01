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
import { serve } from 'bxpb-runtime/dist/service.js';
import * as descriptors from './foo_bxdescriptors.js';

/**
 * Run {@link FooService} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serveFoo(transport, serviceImpl) {
    serve(transport, descriptors.FooService, serviceImpl);
}
            `.trim());

            expect(dtsFile.getName()).toBe('foo_bxservices.d.ts');
            expect(dtsFile.getContent()).toBe(`
import { Transport, ServiceImplementation } from 'bxpb-runtime/dist/service';
import * as descriptors from './foo_bxdescriptors';

/**
 * Run {@link FooService} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serveFoo(transport: Transport, serviceImpl: ServiceImplementation<descriptors.FooService>);
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
import { serve } from 'bxpb-runtime/dist/service.js';
import * as descriptors from './foo_bxdescriptors.js';

/**
 * Run {@link FooService} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serveFoo(transport, serviceImpl) {
    serve(transport, descriptors.FooService, serviceImpl);
}

/**
 * Run {@link BarService} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serveBar(transport, serviceImpl) {
    serve(transport, descriptors.BarService, serviceImpl);
}
            `.trim());

            expect(dtsFile.getContent()).toBe(`
import { Transport, ServiceImplementation } from 'bxpb-runtime/dist/service';
import * as descriptors from './foo_bxdescriptors';

/**
 * Run {@link FooService} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serveFoo(transport: Transport, serviceImpl: ServiceImplementation<descriptors.FooService>);

/**
 * Run {@link BarService} on the given transport endpoint, using the provided
 * implementation for each RPC method.
 */
export function serveBar(transport: Transport, serviceImpl: ServiceImplementation<descriptors.BarService>);
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