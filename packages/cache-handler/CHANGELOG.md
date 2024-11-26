# @neshca/cache-handler

## 1.9.0

### Minor Changes

- 6bae69a: Updated the documentation and peer dependencies to explicitly state that only Next.js versions `13.5.x` and `14.x.x` are supported. Modified the default `estimateExpireAge` function to perform the calculation as `(staleAge) => staleAge * 1.5`.

## 1.8.1

### Patch Changes

- 3a91160: Refactor monorepo setup and release workflow. No functional changes.

## 1.8.0

### Minor Changes

- b91f759: Add the new `neshClassicCache` function to the `@neshca/cache-handler/functions` module allowing to cache the result of expensive operations in the `getServerSideProps` and a Next.js Pages API routes.

## 1.7.4

### Patch Changes

- 3cd218c: Fix `neshCache` JSDocs time interval description. It was incorrectly stated in milliseconds. Now it is stated in seconds.

## 1.7.3

### Patch Changes

- 972ed99: Add `.npmignore` file to exclude unnecessary files from the package.

## 1.7.2

### Patch Changes

- be27549: Add error handling for `keyExpirationStrategy` and `prerenderManifest` parsing.

## 1.7.1

### Patch Changes

- 432a918: Fix an error when working with the `fetch-cache` in the `registerInitialCache`.

## 1.7.0

### Minor Changes

- 978c3e2: Add `registerInitialCache` instrumentation hook for pre-populating the cache with the initial data on application start.

## 1.6.1

### Patch Changes

- 435a4fe: Fix delete functionality for all built-in Handlers and enhance debug logging.

## 1.6.0

### Minor Changes

- 7b2abf9: Refactor search index creation in the `redis-stack` Handler

  #### Minor Changes

  ##### `@neshca/cache-handler/redis-stack`

  - Move search index creation to revalidateTag method:
    - Ensure index existence before searching by creating it inside revalidateTag with a randomized name to avoid collisions
    - Allow synchronous Handler creation without waiting for the client to connect

## 1.5.1

### Patch Changes

- 41cf0c8: Rewrite README

## 1.5.0

### Minor Changes

- 6558891: Add `experimental-redis-cluster` Handler.

  #### New Features

  ##### `@neshca/cache-handler/experimental-redis-cluster`

  - Add `experimental-redis-cluster` Handler and related documentation.

  #### Improvements

  ##### `@neshca/cache-handler/redis-stack` and `@neshca/cache-handler/redis-strings`

  - Improve documentation and JSDoc comments.

## 1.4.2

### Patch Changes

- 092d6f4: Add the ability to disable Redis operations timeout in the `redis-string` and `redis-stack` Handlers.

  #### New Functionality

  ##### `@neshca/cache-handler/redis-strings`

  - Added a condition to check if the `timeoutMs` is zero to disable Redis operations timeout.

  ##### `@neshca/cache-handler/redis-stack`

  - Added a condition to check if the `timeoutMs` is zero to disable Redis operations timeout.

  Thanks to [@ElyDotDev](https://github.com/ElyDotDev) for the contribution.

## 1.4.1

### Patch Changes

- 1685585: Update the `revalidateTag` method to use `ft.searchNoContent` function in the `redis-stack` Handler.

  #### Improvements

  ##### `@neshca/cache-handle/redis-stack`

  - Updated the `revalidateTag` method to use `ft.searchNoContent` function.

  Thanks to [@galtonova](https://github.com/galtonova) for the contribution.

## 1.4.0

### Minor Changes

- cc3bfec: Add the new option `revalidateTagQuerySize` to the `redis-stack` and the `redis-strings` Handlers

  #### New Features

  ##### `@neshca/cache-handle/redis-strings`

  - Added `revalidateTagQuerySize` option. It allows specifying the number of tags in a single query retrieved from Redis when scanning or searching for tags.
  - Increased the default query size for `hScan` from 25 to 100.

  ##### `@neshca/cache-handle/redis-stack`

  - Added `revalidateTagQuerySize` option. It allows specifying the number of tags in a single query retrieved from Redis when scanning or searching for tags.
  - Increased the default query size for `ft.search` from 25 to 100.

## 1.3.2

### Patch Changes

- e5774f5: Added support for batched revalidateTag calls.

## 1.3.1

### Patch Changes

- 3200068: Updated types, JSDoc and the documentation.

  #### Documentation

  - added the documentation for the pre-built `redis-stack`, `redis-strings` and `local-lru` Handlers

  #### `@neshca/cache-handle/local-lru`

  - marked `LruCacheHandlerOptions` type as deprecated
  - added `LruCacheOptions` export.

  #### `@neshca/cache-handle/redis-stack`

  - marked `timeoutMs` option as optional

  #### `@neshca/cache-handle/redis-strings`

  - marked `timeoutMs` option as optional

## 1.3.0

### Minor Changes

- 0d4766b: Added `keyExpirationStrategy` option for the `redis-strings` Handler.

  #### New Features

  ##### `@neshca/cache-handle/redis-strings`

  - Added `keyExpirationStrategy` option. It allows you to choose the expiration strategy for cache keys.

## 1.2.1

### Patch Changes

- 7adc1af: Fix bin paths in package.json files.

## 1.2.0

### Minor Changes

- 76bcdcd: Add experimental `neshCache` function and related documentation.

  #### New features

  ##### `@neshca/cache-handler/functions`

  - add new endpoint `@neshca/cache-handler/functions` with useful application-side functions
  - add experimental function `neshCache` and related documentation

## 1.1.0

### Minor Changes

- 588153b: Add `revalidatePath` functionality.

  #### New Features

  ##### `@neshca/cache-handler`

  - add `implicitTags` parameter to the `get` method for Handlers
  - remove implicit tags filtration for the `PAGE` kind cache values

  ##### `@neshca/cache-handle/local-lru`

  - implement `revalidatePath` functionality

  ##### `@neshca/cache-handle/redis-stack`

  - implement `revalidatePath` functionality

  ##### `@neshca/cache-handle/redis-strings`

  - implement `revalidatePath` functionality
  - refactor `revalidateTag` method to use `HSCAN` instead of `HGETALL`

  ##### `@neshca/cache-handle/helpers`

  - add `isImplicitTag` and `getTimeoutRedisCommandOptions` functions

## 1.0.8

### Patch Changes

- 45c8e8b: Fixed unlink calls for Redis Handlers and updated dependencies.

## 1.0.7

### Patch Changes

- e92658a: Fix the redis-stack Handler `revalidateTag` method.

  #### Changes

  - Add pagination to tags search
  - Replace `del` operation with `unlink`

## 1.0.6

### Patch Changes

- c8cc0af: Add tests for `unstable_cache`

## 1.0.5

### Patch Changes

- 00b6aaf: Add information about Next.js Routers support in readmes and documentation.

## 1.0.4

### Patch Changes

- 3dd5b93: Fix body mutation of the ROUTE kind values.

## 1.0.3

### Patch Changes

- 30a20d9: Fix Redis client type in Redis Handlers

## 1.0.2

### Patch Changes

- ea5e158: Change hash set to Redis querying for the `redis-stack` Handler's `revalidateTag` method

## 1.0.1

### Patch Changes

- 6aeca1f: Fix Redis Handlers `revalidateTag` method

## 1.0.0

### Major Changes

- dbf9286: Release 1.0.0

  #### Breaking Changes

  ##### `@neshca/cache-handler`

  - rename `IncrementalCache` class to `CacheHandler`
  - rename `Cache` type to `Handler`
  - add `delete` method to `Handler`
  - remove `useFileSystem` option
  - add global `ttl` option
  - remove support for on-demand revalidation by path for App Router pages
  - remove file system handling except for pages with `fallback: false` in `getStaticPaths`
  - refactor e2e tests for App Router pages
  - add new tests for Pages router pages
  - encapsulate `Buffer` to `base64` conversion to the `ROUTE` kind values
  - make filesystem-related methods static
  - refactor constructor to prevent multiple `CacheHandler.#configureCacheHandler` calls
  - update and improve docs

  ##### Pre-configured handlers

  - remove `revalidatedTagsKey` option
  - add `sharedTagsKey` option
  - remove `useTtl` option
  - remove `@neshca/json-replacer-reviver` from deps

## 0.6.10

### Patch Changes

- bb61a52: Applied new code style.
- Updated dependencies [bb61a52]
  - @neshca/json-replacer-reviver@1.1.1

## 0.6.9

### Patch Changes

- 8570f6e: Refactor debug flag initialization in cache-handler.ts

## 0.6.8

### Patch Changes

- f3b30a5: Refactor `redis-stack` Handler to use `Promise.allSettled` for `set` callback.

## 0.6.7

### Patch Changes

- ddf957f: Added support for ES Modules.

## 0.6.6

### Patch Changes

- 3f02029: Added the `resetRequestCache` method to match with original `CacheHandler` class.

## 0.6.5

### Patch Changes

- c62c986: Refactored Redis Handlers timeout handling

  #### Changes

  - Refactored Redis Handlers to use `AbortSignal` instead of promisifying `setTimeout`.
  - Set default Redis Handlers `timeoutMs` option to 5000 ms.

## 0.6.4

### Patch Changes

- 9dcb393: Refactored `lru-cache` Handler to overcome ttl via setTimeout limitations. Added `timeoutMs` option to `server` Handler.

## 0.6.3

### Patch Changes

- 277865a: Added support for stale-while-revalidate strategy in `useTtl` option.

## 0.6.2

### Patch Changes

- fb2a5ce: Refactored the functionality of cache layers

  #### Features

  - removed `unstable__logErrors` option
  - introduced `name` property for Handlers for easier debugging
  - introduced explicit cache debug logs using `process.env.NEXT_PRIVATE_DEBUG_CACHE`
  - added a new `timeoutMs` option to the Redis Handlers

  #### Fixes

  - Made pre-configured Redis Handler not cause page loading to hang

## 0.6.1

### Patch Changes

- d9c5d09: Added the `name` static field to the `IncrementalCache` class and updated the documentation to reflect this in troubleshooting section.

## 0.6.0

### Minor Changes

- 60dab2a: This release introduces a colossal refactoring and new features to the `@neshca/cache-handler` package.

  #### Breaking Changes

  - Changed the Handlers API;
  - `onCreation` now can accept multiple Handlers for cache layering;
  - Dropped `diskAccessMode` option;
  - Dropped `defaultLruCacheOptions` option;
  - Dropped the default LRU cache;
  - Renamed `getTagsManifest` cache method to `getRevalidatedTags`;
  - Changed the return type of `getRevalidatedTags` cache method;
  - Made Handlers to be exported as default exports.

  #### Features

  - Added `buildId` to `onCreationHook` context argument;
  - Introduced `useFileSystem` option;
  - Made the LRU cache an independent Handler like Redis or Server;
  - Made `getRevalidatedTags` and `revalidateTag` cache methods to be optional.

  #### Misc

  - Added TSDoc comments to the codebase.

## 0.5.4

### Patch Changes

- 915ecef: Fix Pages router for older Next.js versions

## 0.5.3

### Patch Changes

- 571435b: Fix types and improve naming

## 0.5.2

### Patch Changes

- a18f2bb: Add async onCreation hook and async Handlers

## 0.5.1

### Patch Changes

- 9a970af: Add new HTTP Handler and an example to docs

## 0.5.0

### Minor Changes

- 954a21e: Use `exports` instead of `main` and `module` in `package.json`

  New `handlers` API:

  - Add `redis-stack` and `redis-strings` handlers;

### Patch Changes

- Updated dependencies [954a21e]
  - @neshca/json-replacer-reviver@1.1.0

## 0.4.4

### Patch Changes

- bd1d48a: Add link to the official Next.js template in the README.md

## 0.4.3

### Patch Changes

- e6869ea: Fix usage of `cache-handler` in dev environment

## 0.4.2

### Patch Changes

- a89c527: Update Redis cache handler example and docs

## 0.4.1

### Patch Changes

- cc5323d: Add next14.0.1 to dist tags

## 0.4.0

### Minor Changes

- b811b66: Upgrade to Next.js v14.0.0

## 0.3.12

### Patch Changes

- d83d9fe: Fix TagsManifest type export

## 0.3.11

### Patch Changes

- 334890f: Add next13.5.6 in distTags

## 0.3.10

### Patch Changes

- be8d389: Improve documentation

## 0.3.9

### Patch Changes

- a52f32e: Update README and fix paths to docs

## 0.3.8

### Patch Changes

- 6a33283: Rewrite README to be more clear

## 0.3.7

### Patch Changes

- a6862db: Add test for app restarting functionality

## 0.3.6

### Patch Changes

- 892c741: Fix publishing

## 0.3.5

### Patch Changes

- 8abe6ea: Add supported Next.js versions to distTags

## 0.3.4

### Patch Changes

- 577ea45: Automatically add dist-tags to npm packages

## 0.3.3

### Patch Changes

- 32bc1d6: Add changeset configuration for versioning
