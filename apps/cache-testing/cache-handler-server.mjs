import { CacheHandler } from '@neshca/cache-handler';
import createLruCache from '@neshca/cache-handler/local-lru';
import createServerCache from '@neshca/cache-handler/server';

CacheHandler.onCreation(() => {
    const baseUrl = process.env.REMOTE_CACHE_SERVER_BASE_URL ?? 'http://localhost:8080';

    const httpCache = createServerCache({
        baseUrl,
    });

    const localCache = createLruCache();

    return {
        handlers: [httpCache, localCache],
    };
});

export default CacheHandler;
