---
'@neshca/cache-handler': minor
---

Updated the documentation and peer dependencies to explicitly state that only Next.js versions `13.5.x` and `14.x.x` are supported. Modified the default `estimateExpireAge` function to perform the calculation as `(staleAge) => staleAge * 1.5`.
