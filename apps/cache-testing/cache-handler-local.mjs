// @ts-check

import { CacheHandler } from '@neshca/cache-handler';
import createLruHandler from '@neshca/cache-handler/local-lru';

CacheHandler.onCreation(() => {
    const localHandler = createLruHandler();

    return {
        handlers: [localHandler],
    };
});

export default CacheHandler;
