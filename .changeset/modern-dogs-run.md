---
'@neshca/cache-handler': patch
---

Add the ability to disable Redis operations timeout in the `redis-string` and `redis-stack` Handlers.

#### New Functionality

##### `@neshca/cache-handler/redis-strings`

- Added a condition to check if the `timeoutMs` is zero to disable Redis operations timeout.

##### `@neshca/cache-handler/redis-stack`

- Added a condition to check if the `timeoutMs` is zero to disable Redis operations timeout.
