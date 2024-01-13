---
'@neshca/cache-handler': patch
---

Refactored Redis Handlers timeout handling

#### Changes

-   Refactored Redis Handlers to use `AbortSignal` instead of promisifying `setTimeout`.
-   Set default Redis Handlers `timeoutMs` option to 5000 ms.
