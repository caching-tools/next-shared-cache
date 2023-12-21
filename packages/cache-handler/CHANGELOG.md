# @neshca/cache-handler

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
