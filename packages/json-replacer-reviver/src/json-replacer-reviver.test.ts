import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    isBufferBase64Representation,
    isBufferJsonRepresentation,
    replaceJsonWithBase64,
    reviveFromBase64Representation,
    reviveFromJsonRepresentation,
} from './json-replacer-reviver';

const TEST_STRING = 'Hello';
const TEST_BUFFER = Buffer.from(TEST_STRING);
const JSON_REPRESENTATION = { type: 'Buffer', data: [72, 101, 108, 108, 111] };
const BASE64_REPRESENTATION = { type: 'BufferBase64', data: 'SGVsbG8=' };

const INVALID_INPUTS = [
    {},
    null,
    undefined,
    'hello',
    123,
    true,
    false,
    { type: 'Buffer', data: 'hello' },
    { type: 'BufferBase64', data: [1, 2, 3] },
];

await describe('Buffer JSON Representation', async () => {
    await it('should identify and revive valid JSON representations', () => {
        const json = JSON.stringify(TEST_BUFFER);
        const revivedFromJson = JSON.parse(json, reviveFromJsonRepresentation) as Buffer;

        assert.strictEqual(isBufferJsonRepresentation(JSON_REPRESENTATION), true);
        assert.strictEqual(TEST_BUFFER.equals(revivedFromJson), true);
    });

    await it('should reject invalid JSON representations', () => {
        for (const input of INVALID_INPUTS) {
            assert.strictEqual(isBufferJsonRepresentation(input), false);
        }
    });

    await it('should handle non-Buffer JSON representations during revival', () => {
        const value = 'hello';
        const revived = reviveFromJsonRepresentation('', value);
        assert.strictEqual(revived, value);
    });

    await it('should convert JSON representation to its Base64 format', () => {
        const converted = replaceJsonWithBase64('', JSON_REPRESENTATION);
        assert.deepStrictEqual(converted, BASE64_REPRESENTATION);
    });
});

await describe('Buffer Base64 Representation', async () => {
    await it('should identify and revive valid Base64 representations', () => {
        const revived = reviveFromBase64Representation('', BASE64_REPRESENTATION);

        assert.strictEqual(isBufferBase64Representation(BASE64_REPRESENTATION), true);
        assert.strictEqual(TEST_BUFFER.equals(revived as Buffer), true);
    });

    await it('should reject invalid Base64 representations', () => {
        for (const input of INVALID_INPUTS) {
            assert.strictEqual(isBufferBase64Representation(input), false);
        }
    });

    await it('should handle Buffer serialization and deserialization', () => {
        const object = {
            someKey: {
                name: 'someName',
                buffer: TEST_BUFFER,
            },
        };
        const serialized = JSON.stringify(object, replaceJsonWithBase64);
        const deserialized = JSON.parse(serialized, reviveFromBase64Representation) as typeof object;
        assert.strictEqual(object.someKey.buffer.equals(deserialized.someKey.buffer), true);
    });
});
