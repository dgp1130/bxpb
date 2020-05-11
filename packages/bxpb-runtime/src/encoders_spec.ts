import { encode, decode } from "./encoders";

describe('encoders', () => {
    it('encodes and decodes the given binary data as a base64 string', () => {
        const input = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

        const encoded = encode(input);
        expect(() => atob(encoded)).not.toThrow(); // Should be valid base64.

        const output = decode(encoded);
        expect(output).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    });
});