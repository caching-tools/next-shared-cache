---
'@neshca/cache-handler': minor
---

Add `revalidatePath` functionality.

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
