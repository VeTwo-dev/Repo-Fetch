import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import { resolve } from "pathe";
import { tmpdir } from "os";
import {
  computeHash,
  computeFileHash,
  computeDirectoryHash,
  generateChecksum,
  verifyIntegrity,
} from "../../src/registry/integrity";
import type { ResourceManifest } from "../../src/registry/types";

function makeManifest(checksum: {
  algorithm: "sha256" | "sha512" | "md5";
  value: string;
}): ResourceManifest {
  return {
    id: "test",
    name: "Test",
    displayName: "Test",
    version: "1.0.0",
    description: "A test manifest",
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
    checksum,
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

describe("computeHash", () => {
  it("computes sha256 of a string", () => {
    const hash = computeHash("hello world", "sha256");
    expect(hash).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  });

  it("computes md5 of a buffer", () => {
    const buf = Buffer.from("hello world");
    const hash = computeHash(buf, "md5");
    expect(hash).toBe("5eb63bbbe01eeed093cb22bb8f5acdc3");
  });

  it("different algorithms produce different hashes", () => {
    const sha = computeHash("test", "sha256");
    const md = computeHash("test", "md5");
    expect(sha).not.toBe(md);
  });
});

describe("computeFileHash", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = resolve(tmpdir(), "repo-fetch-test-" + Math.random());
    await fs.ensureDir(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("hashes a file correctly", async () => {
    const filePath = resolve(tmpDir, "file.txt");
    await fs.writeFile(filePath, "hello world");
    const hash = await computeFileHash(filePath, "sha256");
    expect(hash).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  });

  it("defaults to sha256", async () => {
    const filePath = resolve(tmpDir, "file.txt");
    await fs.writeFile(filePath, "hello world");
    const hash = await computeFileHash(filePath);
    expect(hash).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  });
});

describe("computeDirectoryHash", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = resolve(tmpdir(), "repo-fetch-test-" + Math.random());
    await fs.ensureDir(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("hashes all files in directory", async () => {
    await fs.writeFile(resolve(tmpDir, "a.txt"), "aaa");
    await fs.writeFile(resolve(tmpDir, "b.txt"), "bbb");
    const hash = await computeDirectoryHash(tmpDir, "sha256");
    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(64);
  });

  it("deterministic (same files = same hash)", async () => {
    await fs.writeFile(resolve(tmpDir, "a.txt"), "aaa");
    const hash1 = await computeDirectoryHash(tmpDir, "sha256");
    const hash2 = await computeDirectoryHash(tmpDir, "sha256");
    expect(hash1).toBe(hash2);
  });
});

describe("generateChecksum", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = resolve(tmpdir(), "repo-fetch-test-" + Math.random());
    await fs.ensureDir(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("returns ResourceChecksum object with algorithm and value", async () => {
    const filePath = resolve(tmpDir, "file.txt");
    await fs.writeFile(filePath, "data");
    const checksum = await generateChecksum(filePath);
    expect(checksum).toEqual({
      algorithm: "sha256",
      value: expect.any(String),
    });
  });

  it("supports sha256, sha512, md5", async () => {
    const filePath = resolve(tmpDir, "file.txt");
    await fs.writeFile(filePath, "data");

    const sha256 = await generateChecksum(filePath, "sha256");
    const sha512 = await generateChecksum(filePath, "sha512");
    const md5 = await generateChecksum(filePath, "md5");

    expect(sha256.algorithm).toBe("sha256");
    expect(sha256.value.length).toBe(64);
    expect(sha512.algorithm).toBe("sha512");
    expect(sha512.value.length).toBe(128);
    expect(md5.algorithm).toBe("md5");
    expect(md5.value.length).toBe(32);
  });
});

describe("verifyIntegrity", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = resolve(tmpdir(), "repo-fetch-test-" + Math.random());
    await fs.ensureDir(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("valid checksum passes", async () => {
    const filePath = resolve(tmpDir, "file.txt");
    await fs.writeFile(filePath, "hello world");
    const checksum = await generateChecksum(filePath);
    const manifest = makeManifest(checksum);

    const result = await verifyIntegrity(manifest, filePath);
    expect(result.valid).toBe(true);
    expect(result.checksumMatch).toBe(true);
  });

  it("invalid checksum fails with checksumMatch=false", async () => {
    const filePath = resolve(tmpDir, "file.txt");
    await fs.writeFile(filePath, "hello world");
    const manifest = makeManifest({
      algorithm: "sha256",
      value: "0000000000000000000000000000000000000000000000000000000000000000",
    });

    const result = await verifyIntegrity(manifest, filePath);
    expect(result.checksumMatch).toBe(false);
    expect(result.valid).toBe(false);
  });

  it("missing file fails", async () => {
    const manifest = makeManifest({ algorithm: "sha256", value: "abc" });
    const result = await verifyIntegrity(manifest, resolve(tmpDir, "nonexistent.txt"));
    expect(result.valid).toBe(false);
    expect(result.checksumMatch).toBe(false);
  });
});
