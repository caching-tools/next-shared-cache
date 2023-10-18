import { Buffer } from 'node:buffer';

/**
 * Represents the JSON structure of a `Buffer` object.
 */
export type BufferJsonRepresentation = {
    /**
     * Indicates the representation type; always 'Buffer' for this structure.
     */
    type: 'Buffer';
    /**
     * An array of numbers representing the buffer's byte data.
     */
    data: number[];
};

/**
 * Represents the base64-encoded JSON structure of a `Buffer` object.
 */
export type BufferBase64Representation = {
    /**
     * Indicates the representation type; always 'BufferBase64' for this structure.
     */
    type: 'BufferBase64';
    /**
     * A string containing the base64-encoded data of the buffer.
     */
    data: string;
};

/**
 * Determines if a value corresponds to the JSON representation of a `Buffer` object.
 *
 * @param value - Value to be verified.
 * @returns `true` if the value matches the JSON representation of a `Buffer`, otherwise `false`.
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
 * Determines if a value matches the base64-encoded JSON format of a `Buffer` object.
 *
 * @param value - Value to be verified.
 * @returns `true` if the value matches the base64-encoded JSON format of a `Buffer`, otherwise `false`.
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
 * Converts a JSON representation of a `Buffer` object back to the actual `Buffer` object.
 *
 * @param key - Property key during parsing.
 * @param value - Associated value during parsing.
 * @returns A `Buffer` object if the value is a JSON representation of it; otherwise, returns the original value.
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
 * Transforms a JSON representation of a `Buffer` object into its base64-encoded JSON format.
 *
 * @param key - Property key during stringification.
 * @param value - Associated value during stringification.
 * @returns A base64-encoded representation if the value is a `Buffer`; otherwise, returns the original value.
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
 * Recovers a `Buffer` object from its base64-encoded JSON format.
 *
 * @param key - Property key during parsing.
 * @param value - Associated value during parsing.
 * @returns A `Buffer` object if the value is a base64-encoded JSON representation of it; otherwise, returns the original value.
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
