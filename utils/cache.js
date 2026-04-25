/**
 * Simple LRU (Least Recently Used) Cache Implementation
 * Perfect for caching API responses, preventing duplicate requests
 */

class LRUCache {
  constructor(maxSize = 100, ttl = 300000) {
    this.maxSize = maxSize;
    this.ttl = ttl; // in milliseconds (default 5 minutes)
    this.cache = new Map();
    this.accessOrder = [];
  }

  /**
   * Set value in cache with optional custom TTL
   */
  set(key, value, customTtl = null) {
    // Remove if exists
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
    }

    // Check if we need to evict
    if (this.cache.size >= this.maxSize) {
      const lruKey = this.accessOrder.shift();
      this.cache.delete(lruKey);
    }

    // Set value with timestamp
    const ttlMs = customTtl || this.ttl;
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttlMs,
    });

    // Add to access order
    this.accessOrder.push(key);
  }

  /**
   * Get value from cache if exists and not expired
   */
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

    // Move to end (most recently used)
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);

    return entry.value;
  }

  /**
   * Check if key exists and is valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete specific key
   */
  delete(key) {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache size
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Get all cache info for debugging
   */
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
