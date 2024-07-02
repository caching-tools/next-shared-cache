---
'@neshca/cache-handler': minor
---

Add the new option `revalidateTagQuerySize` to the `redis-stack` and the `redis-strings` Handlers

#### New Features

##### `@neshca/cache-handle/redis-strings`

- Added `revalidateTagQuerySize` option. It allows specifying the number of tags in a single query retrieved from Redis when scanning or searching for tags.
- Increased the default query size for `hScan` from 25 to 100.

##### `@neshca/cache-handle/redis-stack`

- Added `revalidateTagQuerySize` option. It allows specifying the number of tags in a single query retrieved from Redis when scanning or searching for tags.
- Increased the default query size for `ft.search` from 25 to 100.
