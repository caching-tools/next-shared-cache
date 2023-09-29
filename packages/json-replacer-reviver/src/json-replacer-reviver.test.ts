import {
    isBufferJsonRepresentation,
    replaceJsonWithBase64,
    reviveFromJsonRepresentation,
    isBufferBase64Representation,
    reviveFromBase64Representation,
} from './json-replacer-reviver';

function getBufferJsonRepresentation(buffer: Buffer): unknown {
    const bufferJson = JSON.stringify(buffer);
    return JSON.parse(bufferJson) as unknown;
}

function getBufferBase64Representation(buffer: Buffer): unknown {
    const bufferJson = JSON.stringify(buffer, replaceJsonWithBase64);
    return JSON.parse(bufferJson) as unknown;
}

describe('isBufferJsonRepresentation', () => {
    test('returns true for a valid BufferJsonRepresentation object', () => {
        const bufferJsonRepresentation = getBufferJsonRepresentation(Buffer.from('Hello'));
        expect(isBufferJsonRepresentation(bufferJsonRepresentation)).toBe(true);
    });

    test('returns false for an invalid object', () => {
        expect(isBufferJsonRepresentation({})).toBe(false);
        expect(isBufferJsonRepresentation(null)).toBe(false);
        expect(isBufferJsonRepresentation(undefined)).toBe(false);
        expect(isBufferJsonRepresentation('hello')).toBe(false);
        expect(isBufferJsonRepresentation(123)).toBe(false);
        expect(isBufferJsonRepresentation(true)).toBe(false);
        expect(isBufferJsonRepresentation(false)).toBe(false);
        expect(
            isBufferJsonRepresentation({
                type: 'Buffer',
                data: 'hello',
            }),
        ).toBe(false);
    });
});

describe('isBufferBase64Representation', () => {
    test('returns true for a valid BufferBase64Representation object', () => {
        const bufferBase64Representation = getBufferBase64Representation(Buffer.from('Hello'));
        expect(isBufferBase64Representation(bufferBase64Representation)).toBe(true);
    });

    test('returns false for an invalid object', () => {
        expect(isBufferBase64Representation({})).toBe(false);
        expect(isBufferBase64Representation(null)).toBe(false);
        expect(isBufferBase64Representation(undefined)).toBe(false);
        expect(isBufferBase64Representation('hello')).toBe(false);
        expect(isBufferBase64Representation(123)).toBe(false);
        expect(isBufferBase64Representation(true)).toBe(false);
        expect(isBufferBase64Representation(false)).toBe(false);
        expect(
            isBufferBase64Representation({
                type: 'BufferBase64',
                data: [1, 2, 3],
            }),
        ).toBe(false);
    });
});

describe('reviveFromJsonRepresentation', () => {
    test('revives a Buffer object from its JSON representation', () => {
        const bufferJson = { type: 'Buffer', data: [72, 101, 108, 108, 111] };
        const expected = Buffer.from('Hello');
        const received = reviveFromJsonRepresentation('', bufferJson);
        expect(expected.equals(received as Buffer)).toBe(true);
    });

    test('returns the original value if it is not a BufferJsonRepresentation object', () => {
        const value = 'hello';
        const received = reviveFromJsonRepresentation('', value);
        expect(received).toBe(value);
    });

    test('works with JSON.parse', () => {
        const buffer = Buffer.from('Hello');
        const json = JSON.stringify(buffer);
        const received = JSON.parse(json, reviveFromJsonRepresentation) as Buffer;
        expect(buffer.equals(received)).toBe(true);
    });
});

describe('replaceJsonWithBase64', () => {
    test('replaces a BufferJsonRepresentation object with a BufferBase64Representation object', () => {
        const bufferJson = getBufferJsonRepresentation(Buffer.from('Hello'));
        const expected = { type: 'BufferBase64', data: 'SGVsbG8=' };
        const received = replaceJsonWithBase64('', bufferJson);
        expect(received).toEqual(expected);
    });

    test('returns the original value if it is not a BufferJsonRepresentation object', () => {
        const value = 'hello';
        const received = reviveFromJsonRepresentation('', value);
        expect(received).toBe(value);
    });

    test('works with JSON.stringify', () => {
        const buffer = Buffer.from('hello');
        const jsonBase64 = JSON.stringify(buffer, replaceJsonWithBase64);
        const received = JSON.parse(jsonBase64, reviveFromBase64Representation) as Buffer;
        expect(buffer.equals(received)).toBe(true);
    });
});

describe('reviveFromBase64Representation', () => {
    test('revives a Buffer object from its base64-encoded JSON representation', () => {
        const bufferJson = getBufferBase64Representation(Buffer.from('Hello'));
        const received = reviveFromBase64Representation('', bufferJson);
        const expected = Buffer.from('Hello');
        expect(expected.equals(received as Buffer)).toBe(true);
    });

    test('returns the original value if it is not a BufferBase64Representation object', () => {
        const value = 'hello';
        const received = reviveFromBase64Representation('', value);
        expect(received).toBe(value);
    });

    test('works with JSON.stringify', () => {
        const buffer = Buffer.from('hello');
        const jsonBase64 = JSON.stringify(buffer, replaceJsonWithBase64);
        const received = JSON.parse(jsonBase64, reviveFromBase64Representation) as Buffer;
        expect(buffer.equals(received)).toBe(true);
    });
});
