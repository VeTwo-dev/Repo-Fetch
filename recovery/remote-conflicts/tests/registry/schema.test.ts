import { describe, it, expect } from "vitest";
import { ResourceManifestSchema, RegistryIndexSchema } from "../../src/registry/schema";

function createValidManifest() {
  return {
    id: "test-resource",
    name: "test-resource",
    displayName: "Test Resource",
    version: "1.0.0",
    description: "A test resource",
    type: "plugin" as const,
    category: "testing",
    author: { name: "Test Author" },
    repository: "https://github.com/test/repo",
    homepage: "https://example.com",
    license: "MIT",
    engines: {},
    vetwo: { minVersion: "1.0.0" },
    checksum: { algorithm: "sha256" as const, value: "abc123" },
    downloadPath: "/test/path",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };
}

function createValidIndex() {
  return {
    version: "1.0.0",
    updatedAt: "2024-01-01T00:00:00Z",
    resources: [
      {
        id: "res-1",
        name: "resource-one",
        displayName: "Resource One",
        version: "1.0.0",
        type: "plugin" as const,
        category: "testing",
        tags: ["test"],
        description: "First resource",
        author: "Author One",
        license: "MIT",
        checksum: { algorithm: "sha256" as const, value: "abc" },
        downloadPath: "/res1",
        manifestVersion: "1.0.0",
      },
    ],
    categories: [
      {
        id: "testing",
        name: "testing",
        displayName: "Testing",
        description: "Testing resources",
        resourceCount: 1,
      },
    ],
    tags: [{ name: "test", count: 1 }],
    searchIndex: [
      {
        id: "res-1",
        name: "resource-one",
        displayName: "Resource One",
        description: "First resource",
        keywords: ["test"],
        tags: ["test"],
        type: "plugin" as const,
        category: "testing",
      },
    ],
  };
}

describe("ResourceManifestSchema", () => {
  it("accepts a valid minimal manifest", () => {
    const result = ResourceManifestSchema.safeParse(createValidManifest());
    expect(result.success).toBe(true);
  });

  it("rejects manifest with missing required fields", () => {
    const base = createValidManifest();
    for (const field of [
      "id",
      "name",
      "version",
      "description",
      "type",
      "category",
      "author",
      "repository",
      "homepage",
      "license",
      "vetwo",
      "checksum",
      "downloadPath",
      "createdAt",
      "updatedAt",
    ] as const) {
      const rest = { ...base };
      delete rest[field];
      expect(ResourceManifestSchema.safeParse(rest).success).toBe(false);
    }
  });

  it("rejects invalid version format", () => {
    const base = createValidManifest();
    expect(ResourceManifestSchema.safeParse({ ...base, version: "1.0" }).success).toBe(false);
    expect(ResourceManifestSchema.safeParse({ ...base, version: "v1.0.0" }).success).toBe(false);
    expect(ResourceManifestSchema.safeParse({ ...base, version: "abc" }).success).toBe(false);
  });

  it("accepts valid semver with prerelease", () => {
    const base = createValidManifest();
    expect(ResourceManifestSchema.safeParse({ ...base, version: "1.0.0-beta.1" }).success).toBe(
      true,
    );
    expect(ResourceManifestSchema.safeParse({ ...base, version: "2.3.4-alpha.12" }).success).toBe(
      true,
    );
    expect(ResourceManifestSchema.safeParse({ ...base, version: "0.1.0-rc.1" }).success).toBe(true);
  });

  it("rejects invalid type", () => {
    const base = createValidManifest();
    expect(ResourceManifestSchema.safeParse({ ...base, type: "invalid" }).success).toBe(false);
  });

  it("rejects invalid runtime in supportedRuntimes", () => {
    const base = createValidManifest();
    expect(
      ResourceManifestSchema.safeParse({ ...base, supportedRuntimes: ["invalid"] }).success,
    ).toBe(false);
  });

  it("applies defaults for optional arrays", () => {
    const result = ResourceManifestSchema.parse(createValidManifest());
    expect(result.tags).toEqual([]);
    expect(result.keywords).toEqual([]);
    expect(result.dependencies).toEqual([]);
    expect(result.optionalDependencies).toEqual([]);
    expect(result.peerDependencies).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(result.examples).toEqual([]);
    expect(result.screenshots).toEqual([]);
    expect(result.lifecycleHooks).toEqual([]);
    expect(result.variables).toEqual([]);
    expect(result.transforms).toEqual([]);
    expect(result.supportedRuntimes).toEqual(["any"]);
    expect(result.supportedFrameworks).toEqual(["any"]);
    expect(result.supportedPackageManagers).toEqual(["any"]);
    expect(result.documentation).toBe("");
  });

  it("validates nested author object requires name", () => {
    const base = createValidManifest();
    expect(ResourceManifestSchema.safeParse({ ...base, author: {} }).success).toBe(false);
    expect(ResourceManifestSchema.safeParse({ ...base, author: { name: "" } }).success).toBe(false);
    expect(ResourceManifestSchema.safeParse({ ...base, author: { name: "Valid" } }).success).toBe(
      true,
    );
  });

  it("validates nested checksum algorithm", () => {
    const base = createValidManifest();
    expect(
      ResourceManifestSchema.safeParse({ ...base, checksum: { algorithm: "invalid", value: "x" } })
        .success,
    ).toBe(false);
    expect(
      ResourceManifestSchema.safeParse({ ...base, checksum: { algorithm: "sha256", value: "abc" } })
        .success,
    ).toBe(true);
    expect(
      ResourceManifestSchema.safeParse({ ...base, checksum: { algorithm: "sha512", value: "abc" } })
        .success,
    ).toBe(true);
    expect(
      ResourceManifestSchema.safeParse({ ...base, checksum: { algorithm: "md5", value: "abc" } })
        .success,
    ).toBe(true);
  });
});

describe("RegistryIndexSchema", () => {
  it("accepts a valid index", () => {
    const result = RegistryIndexSchema.safeParse(createValidIndex());
    expect(result.success).toBe(true);
  });

  it("rejects index with missing fields", () => {
    const base = createValidIndex();
    for (const field of [
      "version",
      "updatedAt",
      "resources",
      "categories",
      "tags",
      "searchIndex",
    ] as const) {
      const rest = { ...base };
      delete rest[field];
      expect(RegistryIndexSchema.safeParse(rest).success).toBe(false);
    }
  });

  it("validates category entries require resourceCount >= 0", () => {
    const base = createValidIndex();
    const cat = base.categories[0];
    expect(cat).toBeDefined();
    expect(
      RegistryIndexSchema.safeParse({ ...base, categories: [{ ...cat!, resourceCount: -1 }] })
        .success,
    ).toBe(false);
    expect(
      RegistryIndexSchema.safeParse({ ...base, categories: [{ ...cat!, resourceCount: 0 }] })
        .success,
    ).toBe(true);
  });

  it("validates tag entries require count >= 0", () => {
    const base = createValidIndex();
    expect(
      RegistryIndexSchema.safeParse({ ...base, tags: [{ name: "t", count: -1 }] }).success,
    ).toBe(false);
    expect(
      RegistryIndexSchema.safeParse({ ...base, tags: [{ name: "t", count: 0 }] }).success,
    ).toBe(true);
  });
});
