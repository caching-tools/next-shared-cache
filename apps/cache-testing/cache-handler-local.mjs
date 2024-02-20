import { CacheHandler } from '@neshca/cache-handler';
import createLruCache from '@neshca/cache-handler/local-lru';

CacheHandler.onCreation(() => {
    const localCache = createLruCache();

    return {
        handlers: [localCache],
    };
});

export default CacheHandler;
