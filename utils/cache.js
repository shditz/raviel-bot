

class LRUCache {
  constructor(maxSize = 100, ttl = 300000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
  }

  set(key, value, customTtl = null) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: customTtl || this.ttl,
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }

  debug() {
    const info = [];
    for (const [key, entry] of this.cache) {
      const age = Date.now() - entry.timestamp;
      info.push({
        key,
        ageMs: age,
        ttlMs: entry.ttl,
        expired: age > entry.ttl,
      });
    }
    return info;
  }
}

module.exports = { LRUCache };
