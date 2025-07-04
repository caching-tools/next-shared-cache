const cache = new Map();

export default class CacheHandler {
  constructor(options) {
    this.options = options;
  }

  async get(key) {
    // This could be stored anywhere, like durable storage
    return cache.get(key);
  }

  async set(key, data, ctx) {
    // This could be stored anywhere, like durable storage
    cache.set(key, {
      value: data,
      lastModified: Date.now(),
      tags: ctx.tags,
    });
  }

  async revalidateTag(tag) {
    // Iterate over all entries in the cache

    for (let [key, value] of cache) {
      // If the value's tags include the specified tag, delete this entry
      if (value.tags.includes(tag)) {
        cache.delete(key);
      }
    }
  }
}
