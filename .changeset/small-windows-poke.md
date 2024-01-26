---
'@neshca/cache-handler': patch
---

Refactor `redis-stack` Handler to use `Promise.allSettled` for `set` callback.
