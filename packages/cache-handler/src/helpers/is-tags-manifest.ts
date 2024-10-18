import type { TagsManifest } from '@repo/next-common';

function hasItems(object: object): object is { items: unknown } {
    return Object.hasOwn(object, 'items');
}

function hasVersion(object: object): object is { version: unknown } {
    return Object.hasOwn(object, 'version');
}

export function isTagsManifest(object: unknown): object is TagsManifest {
    return (
        typeof object === 'object' &&
        object !== null &&
        hasItems(object) &&
        hasVersion(object) &&
        typeof object.version === 'number' &&
        object.version === 1
    );
}
