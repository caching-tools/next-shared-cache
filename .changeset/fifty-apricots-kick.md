---
'@neshca/cache-handler': minor
---

This release introduces a colossal refactoring and new features to the `@neshca/cache-handler` package.

#### Breaking Changes

-   Changed the Handlers API;
-   `onCreation` now can accept multiple Handlers for cache layering;
-   Dropped `diskAccessMode` option;
-   Dropped `defaultLruCacheOptions` option;
-   Dropped the default LRU cache;
-   Renamed `getTagsManifest` cache method to `getRevalidatedTags`;
-   Changed the return type of `getRevalidatedTags` cache method;
-   Made Handlers to be exported as default exports.

#### Features

-   Added `buildId` to `onCreationHook` context argument;
-   Introduced `useFileSystem` option;
-   Made the LRU cache an independent Handler like Redis or Server;
-   Made `getRevalidatedTags` and `revalidateTag` cache methods to be optional.

#### Misc

-   Added TSDoc comments to the codebase.
