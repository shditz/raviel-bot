

class LRUCache {
  constructor(maxSize = 100, ttl = 300000) {
    this.maxSize = maxSize;
    this.ttl = ttl;   
    this.cache = new Map();
    this.accessOrder = [];
  }


  set(key, value, customTtl = null) {
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
    }

    if (this.cache.size >= this.maxSize) {
      const lruKey = this.accessOrder.shift();
      this.cache.delete(lruKey);
    }
    const ttlMs = customTtl || this.ttl;
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttlMs,
    });

    this.accessOrder.push(key);
  }
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const entry = this.cache.get(key);
    const isExpired = Date.now() - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      return null;
    }

    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);

    return entry.value;
  }


  has(key) {
    return this.get(key) !== null;
  }


  delete(key) {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
  }


  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  
  get size() {
    return this.cache.size;
  }

  debug() {
    const info = [];
    for (const [key, entry] of this.cache) {
      const age = Date.now() - entry.timestamp;
      const isExpired = age > entry.ttl;
      info.push({
        key,
        ageMs: age,
        ttlMs: entry.ttl,
        expired: isExpired,
      });
    }
    return info;
  }
}

module.exports = {LRUCache};
