---
'@neshca/cache-handler': major
---

Release 1.0.0

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
