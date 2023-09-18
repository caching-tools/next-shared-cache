export function stringifyObject(object: unknown): string {
    return JSON.stringify(object, null, '    ');
}
