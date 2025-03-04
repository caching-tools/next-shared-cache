// @ts-check

import { CacheHandler } from '@neshca/cache-handler';

CacheHandler.onCreation(() => {
  return {
    handlers: [
      {
        name: 'handler-none',
        get: () => Promise.resolve(undefined),
        set: () => Promise.resolve(undefined),
        revalidateTag: () => Promise.resolve(undefined),
        delete: () => Promise.resolve(undefined),
      },
    ],
  };
});

export default CacheHandler;
