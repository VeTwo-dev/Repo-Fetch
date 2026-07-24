import { LRUCache } from "lru-cache";
import { CACHE_TTL } from "../../constants";
import type { CacheEntry } from "../../types";

class CacheStore {
  private cache: LRUCache<string, CacheEntry>;

  constructor(options?: { max?: number; ttl?: number }) {
    this.cache = new LRUCache<string, CacheEntry>({
      max: options?.max ?? 500,
      ttl: options?.ttl ?? CACHE_TTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, etag: string | null = null, ttl: number = CACHE_TTL): void {
    this.cache.set(key, {
      key,
      data,
      etag,
      timestamp: Date.now(),
      ttl,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  entries(): CacheEntry[] {
    return [...this.cache.values()];
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
    };
  }
}

export const cache = new CacheStore();
export { CacheStore };
