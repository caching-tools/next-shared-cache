import type { TagsManifest } from '@neshca/next-common';

function hasItems(object: object): object is { items: object } {
    return Object.hasOwn(object, 'items');
}

function hasVersion(object: object): object is { version: number } {
    return Object.hasOwn(object, 'version');
}

export function isTagsManifest(object: unknown): object is TagsManifest {
    return (
        typeof object === 'object' &&
        object !== null &&
        hasItems(object) &&
        typeof object.items === 'object' &&
        object.items !== null &&
        hasVersion(object) &&
        object.version === 1
    );
}
