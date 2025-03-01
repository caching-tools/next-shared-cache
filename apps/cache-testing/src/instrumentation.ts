export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerInitialCache } = await import(
      '@neshca/cache-handler/instrumentation/register-initial-cache'
    );
    const CacheHandler = (await import('../cache-handler-redis-stack.js'))
      .default;
    await registerInitialCache(CacheHandler);
  }
}
