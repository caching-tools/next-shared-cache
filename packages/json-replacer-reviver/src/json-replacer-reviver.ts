import { Buffer } from 'node:buffer';

export type BufferJsonRepresentation = { type: 'Buffer'; data: number[] };

export type BufferBase64Representation = { type: 'BufferBase64'; data: string };

/**
 * Checks if a value is a JSON representation of a `Buffer` object.
 *
 * @param value - The value to check.
 *
 * @returns `true` if the value is a JSON representation of a `Buffer` object, `false` otherwise.
 */
export function isBufferJsonRepresentation(value: unknown): value is BufferJsonRepresentation {
    return (
        typeof value === 'object' &&
        value !== null &&
        (value as BufferJsonRepresentation).type === 'Buffer' &&
        Array.isArray((value as BufferJsonRepresentation).data)
    );
}

/**
 * Checks if a value is a base64-encoded JSON representation of a `Buffer` object.
 *
 * @param value - The value to check.
 *
 * @returns `true` if the value is a base64-encoded JSON representation of a `Buffer` object, `false` otherwise.
 */
export function isBufferBase64Representation(value: unknown): value is BufferBase64Representation {
    return (
        typeof value === 'object' &&
        value !== null &&
        (value as BufferBase64Representation).type === 'BufferBase64' &&
        typeof (value as BufferBase64Representation).data === 'string'
    );
}

/**
 * Revives a `Buffer` object from its JSON representation.
 *
 * @param key - The key of the property being parsed.
 * @param value - The value of the property being parsed.
 *
 * @returns The `Buffer` object, or the original value if it is not a `BufferJsonRepresentation` object.
 *
 * @example
 * ```js
 * const buffer = Buffer.from('hello');
 * console.log(buffer); // <Buffer 68 65 6c 6c 6f>
 *
 * const json = JSON.stringify(buffer);
 * console.log(json); // '{"type":"Buffer","data":[104,101,108,108,111]}'
 *
 * const parsed = JSON.parse(json, reviveFromJsonRepresentation);
 * console.log(parsed); // <Buffer 68 65 6c 6c 6f>
 * ```
 */
export function reviveFromJsonRepresentation(key: string, value: unknown): unknown {
    if (isBufferJsonRepresentation(value)) {
        // @ts-expect-error -- TS doesn't know that Buffer.from can accept a BufferJsonRepresentation
        return Buffer.from(value);
    }

    return value;
}

/**
 * Replaces a JSON representation of a `Buffer` with a base64-encoded JSON representation.
 *
 * @param key - The key of the property being stringified.
 * @param value - The value of the property being stringified.
 *
 * @returns Base64 representation of a `Buffer`, or the original value if it is not a `BufferJsonRepresentation` object.
 *
 * @example
 * ```js
 * const buffer = Buffer.from('hello');
 * console.log(buffer); // <Buffer 68 65 6c 6c 6f>
 *
 * const jsonBase64 = JSON.stringify(buffer, replaceJsonWithBase64);
 * console.log(jsonBase64); // '{"type":"BufferBase64","data":"aGVsbG8="}'
 *
 * const parsedFromBase64 = JSON.parse(jsonBase64, reviveFromBase64Representation);
 * console.log(parsed); // <Buffer 68 65 6c 6c 6f>
 * ```
 */
export function replaceJsonWithBase64(key: string, value: unknown): unknown {
    if (isBufferJsonRepresentation(value)) {
        return { type: 'BufferBase64', data: Buffer.from(value.data).toString('base64') };
    }

    return value;
}

/**
 * Revives a `Buffer` object from its base64-encoded JSON representation.
 *
 * @param key - The key of the property being parsed.
 * @param value - The value of the property being parsed.
 *
 * @returns The revived `Buffer` object, or the original value if it is not a `BufferJsonBase64Representation` object.
 *
 * @example
 * ```js
 * const buffer = Buffer.from('hello');
 * console.log(buffer); // <Buffer 68 65 6c 6c 6f>
 *
 * const jsonBase64 = JSON.stringify(buffer, replaceJsonWithBase64);
 * console.log(jsonBase64); // '{"type":"BufferBase64","data":"aGVsbG8="}'
 *
 * const parsedFromBase64 = JSON.parse(jsonBase64, reviveFromBase64Representation);
 * console.log(parsed); // <Buffer 68 65 6c 6c 6f>
 * ```
 */
export function reviveFromBase64Representation(key: string, value: unknown): unknown {
    if (isBufferBase64Representation(value)) {
        return Buffer.from(value.data, 'base64');
    }

    return value;
}
