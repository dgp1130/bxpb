import { getFullyQualifiedServiceName, getRelativeRequestType, getRelativeResponseType } from './utilities';
import { dummyMethod } from '../testing/dummies';

describe('utilities', () => {
    describe('getFullyQualifiedServiceName()', () => {
        it('returns the fully qualified name of the given service and package', () => {
            expect(getFullyQualifiedServiceName('foo.bar', 'Baz')).toBe('foo.bar.Baz');
        });

        it('returns the fully qualified name of the given service with no package', () => {
            expect(getFullyQualifiedServiceName(undefined, 'Bar')).toBe('Bar');
        });
    });

    describe('getRelativeRequestType', () => {
        it('returns the relative name of the request type of the given method', () => {
            expect(getRelativeRequestType(dummyMethod({
                inputType: 'foo.bar.MyRequest',
            }))).toBe('MyRequest');
        });

        it('throws when the input method does not have a request type', () => {
            expect(() => getRelativeRequestType(dummyMethod({
                name: 'Foo',
                inputType: null,
            }))).toThrowMatching((err: Error) =>
                err.message.includes('Method `Foo` is missing an input type!'),
            );
        });
    });

    describe('getRelativeResponseType', () => {
        it('returns the relative name of the response type of the given method', () => {
            expect(getRelativeResponseType(dummyMethod({
                outputType: 'foo.bar.MyResponse',
            }))).toBe('MyResponse');
        });

        it('throws when the output method does not have a response type', () => {
            expect(() => getRelativeResponseType(dummyMethod({
                name: 'Foo',
                outputType: null,
            }))).toThrowMatching((err: Error) =>
                err.message.includes('Method `Foo` is missing an output type!'),
            );
        });
    });
});