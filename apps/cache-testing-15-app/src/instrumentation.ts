export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { registerInitialCache } = await import('@neshca/cache-handler/instrumentation');
        const CacheHandler = (await import('../cache-handler-redis-stack.mjs')).default;
        await registerInitialCache(CacheHandler);
    }
}
