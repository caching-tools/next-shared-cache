---
'@neshca/cache-handler': minor
---

Refactor search index creation in the `redis-stack` Handler

#### Minor Changes

##### `@neshca/cache-handler/redis-stack`

- Move search index creation to revalidateTag method:
  - Ensure index existence before searching by creating it inside revalidateTag with a randomized name to avoid collisions
  - Allow synchronous Handler creation without waiting for the client to connect
