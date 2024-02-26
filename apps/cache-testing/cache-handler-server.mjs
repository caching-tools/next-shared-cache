import { CacheHandler } from '@neshca/cache-handler';
import createLruHandler from '@neshca/cache-handler/local-lru';
import createServerHandler from '@neshca/cache-handler/server';

CacheHandler.onCreation(() => {
    const baseUrl = process.env.REMOTE_CACHE_SERVER_BASE_URL ?? 'http://localhost:8080';

    const httpHandler = createServerHandler({
        baseUrl,
    });

    const localHandler = createLruHandler();

    return {
        handlers: [httpHandler, localHandler],
    };
});

export default CacheHandler;
