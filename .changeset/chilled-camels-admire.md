---
'@neshca/cache-handler': patch
---

Refactored the functionality of cache layers

#### Features

-   removed `unstable__logErrors` option
-   introduced `name` property for Handlers for easier debugging
-   introduced explicit cache debug logs using `process.env.NEXT_PRIVATE_DEBUG_CACHE`
-   added a new `timeoutMs` option to the Redis Handlers

#### Fixes

-   Made pre-configured Redis Handler not cause page loading to hang
