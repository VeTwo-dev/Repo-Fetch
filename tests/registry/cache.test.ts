import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import { resolve } from "pathe";
import { tmpdir } from "os";
import { RegistryCache } from "../../src/registry/cache";
import type { RegistryIndex, ResourceManifest } from "../../src/registry/types";

function createTestIndex(): RegistryIndex {
  return {
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    resources: [],
    categories: [],
    tags: [],
    searchIndex: [],
  };
}

function createTestManifest(id: string = "test"): ResourceManifest {
  return {
    id,
    name: "Test",
    displayName: "Test",
    version: "1.0.0",
    description: "A test resource",
    type: "plugin",
    category: "util",
    tags: [],
    keywords: [],
    author: { name: "test" },
    repository: "",
    homepage: "",
    license: "MIT",
    engines: {},
    vetwo: { minVersion: "1.0.0" },
    dependencies: [],
    optionalDependencies: [],
    peerDependencies: [],
    conflicts: [],
    supportedRuntimes: ["any"],
    supportedFrameworks: ["any"],
    supportedPackageManagers: ["any"],
    checksum: { algorithm: "sha256", value: "abc" },
    downloadPath: "/",
    examples: [],
    documentation: "",
    screenshots: [],
    lifecycleHooks: [],
    variables: [],
    transforms: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("RegistryCache", () => {
  let tmpDir: string;
  let cache: RegistryCache;

  beforeEach(async () => {
    tmpDir = resolve(
      tmpdir(),
      `registry-cache-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await fs.ensureDir(tmpDir);
    cache = new RegistryCache({ dir: tmpDir, ttl: 1000 * 60 * 60 });
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("getIndex returns null when no cache exists", async () => {
    const result = await cache.getIndex();
    expect(result).toBeNull();
  });

  it("setIndex + getIndex stores and retrieves index", async () => {
    const index = createTestIndex();
    await cache.setIndex(index);
    const result = await cache.getIndex();
    expect(result).toEqual(index);
  });

  it("setIndex + hasIndex returns true after set", async () => {
    await cache.setIndex(createTestIndex());
    const result = await cache.hasIndex();
    expect(result).toBe(true);
  });

  it("hasIndex returns false when no index", async () => {
    const result = await cache.hasIndex();
    expect(result).toBe(false);
  });

  it("getIndex returns null when TTL expired", async () => {
    const shortCache = new RegistryCache({ dir: tmpDir, ttl: 10 });
    await shortCache.setIndex(createTestIndex());
    await new Promise((r) => setTimeout(r, 20));
    const result = await shortCache.getIndex();
    expect(result).toBeNull();
  });

  it("isExpired returns true when no file exists", async () => {
    const result = await cache.isExpired();
    expect(result).toBe(true);
  });

  it("isExpired returns false immediately after setIndex", async () => {
    await cache.setIndex(createTestIndex());
    const result = await cache.isExpired();
    expect(result).toBe(false);
  });

  it("setManifest + getManifest stores and retrieves manifest by id", async () => {
    const manifest = createTestManifest("my-plugin");
    await cache.setManifest("my-plugin", manifest);
    const result = await cache.getManifest("my-plugin");
    expect(result).toEqual(manifest);
  });

  it("getManifest returns null for nonexistent id", async () => {
    const result = await cache.getManifest("nonexistent");
    expect(result).toBeNull();
  });

  it("clear removes the cache directory", async () => {
    await cache.setIndex(createTestIndex());
    await cache.setManifest("a", createTestManifest("a"));
    expect(await fs.pathExists(tmpDir)).toBe(true);

    await cache.clear();
    expect(await fs.pathExists(tmpDir)).toBe(false);
  });

  it("getStats returns stats after setIndex", async () => {
    await cache.setIndex(createTestIndex());
    await cache.setManifest("a", createTestManifest("a"));
    await cache.setManifest("b", createTestManifest("b"));

    const stats = await cache.getStats();
    expect(stats.manifestCount).toBe(2);
    expect(stats.indexAge).toBeGreaterThanOrEqual(0);
    expect(stats.size).toBeGreaterThan(0);
  });

  it("getStats returns zero stats for empty cache", async () => {
    const stats = await cache.getStats();
    expect(stats.manifestCount).toBe(0);
    expect(stats.indexAge).toBe(0);
    expect(stats.size).toBe(0);
  });
});
