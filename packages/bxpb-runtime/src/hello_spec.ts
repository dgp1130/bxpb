import { hello } from "./hello";

describe('hello', () => {
    it('says hello', () => {
        expect(hello('Dave')).toBe('Hello, Dave!');
    });
});