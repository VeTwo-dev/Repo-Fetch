import { describe, it, expect } from "vitest";
import type { CacheEntry } from "../src/types";
import { CacheStore, cache } from "../src/core/cache";

describe("CacheStore", () => {
  it("stores and retrieves values", () => {
    const store = new CacheStore();
    store.set("key1", { data: "hello" });
    expect(store.get("key1")).toEqual({ data: "hello" });
  });

  it("returns null for missing keys", () => {
    const store = new CacheStore();
    expect(store.get("nonexistent")).toBeNull();
  });

  it("checks existence", () => {
    const store = new CacheStore();
    store.set("key1", "value");
    expect(store.has("key1")).toBe(true);
    expect(store.has("nonexistent")).toBe(false);
  });

  it("deletes values", () => {
    const store = new CacheStore();
    store.set("key1", "value");
    store.delete("key1");
    expect(store.has("key1")).toBe(false);
  });

  it("clears all values", () => {
    const store = new CacheStore();
    store.set("key1", "value1");
    store.set("key2", "value2");
    store.clear();
    expect(store.size).toBe(0);
  });

  it("respects TTL", async () => {
    const store = new CacheStore({ ttl: 10 }); // 10ms TTL
    store.set("key1", "value");
    expect(store.has("key1")).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(store.has("key1")).toBe(false);
  });

  it("stores etag", () => {
    const store = new CacheStore();
    store.set("key1", "value", "abc123");
    const entry = store.entries()[0] as CacheEntry | undefined;
    expect(entry?.etag).toBe("abc123");
  });

  it("provides stats", () => {
    const store = new CacheStore({ max: 100 });
    store.set("key1", "value");
    const stats = store.getStats();
    expect(stats.size).toBe(1);
    expect(stats.maxSize).toBe(100);
  });

  it("global cache is available", () => {
    expect(cache).toBeInstanceOf(CacheStore);
  });
});
