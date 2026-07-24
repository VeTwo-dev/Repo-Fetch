import { describe, it, expect } from "vitest";
import {
  searchRegistry,
  searchByCategory,
  searchByTag,
  searchByType,
  getCategories,
  getTags,
  getPopularResources,
} from "../../src/registry/search";
import type { RegistryIndex } from "../../src/registry/types";

function createTestIndex(): RegistryIndex {
  const resources = [
    {
      id: "plugin-auth",
      name: "plugin-auth",
      displayName: "Auth Plugin",
      version: "1.0.0",
      type: "plugin" as const,
      category: "security",
      tags: ["auth", "login", "oauth"],
      description: "Authentication plugin",
      author: "Alice",
      license: "MIT",
      checksum: { algorithm: "sha256" as const, value: "aaa" },
      downloadPath: "/auth",
      manifestVersion: "1.0.0",
    },
    {
      id: "template-react",
      name: "template-react",
      displayName: "React Template",
      version: "2.0.0",
      type: "template" as const,
      category: "frontend",
      tags: ["react", "spa"],
      description: "React starter template",
      author: "Bob",
      license: "ISC",
      checksum: { algorithm: "sha256" as const, value: "bbb" },
      downloadPath: "/react",
      manifestVersion: "1.0.0",
    },
    {
      id: "module-utils",
      name: "module-utils",
      displayName: "Utility Module",
      version: "1.2.0",
      type: "module" as const,
      category: "utilities",
      tags: ["helpers", "utils"],
      description: "Common utility functions",
      author: "Carol",
      license: "MIT",
      checksum: { algorithm: "sha256" as const, value: "ccc" },
      downloadPath: "/utils",
      manifestVersion: "1.0.0",
    },
    {
      id: "preset-default",
      name: "preset-default",
      displayName: "Default Preset",
      version: "3.0.0",
      type: "preset" as const,
      category: "frontend",
      tags: ["react", "styling", "linting"],
      description: "Default project preset",
      author: "Dave",
      license: "MIT",
      checksum: { algorithm: "sha256" as const, value: "ddd" },
      downloadPath: "/preset",
      manifestVersion: "1.0.0",
    },
    {
      id: "plugin-logger",
      name: "plugin-logger",
      displayName: "Logger Plugin",
      version: "1.0.0",
      type: "plugin" as const,
      category: "utilities",
      tags: ["logging", "debug"],
      description: "Logging plugin",
      author: "Eve",
      license: "MIT",
      checksum: { algorithm: "sha256" as const, value: "eee" },
      downloadPath: "/logger",
      manifestVersion: "1.0.0",
    },
    {
      id: "snippet-hello",
      name: "snippet-hello",
      displayName: "Hello Snippet",
      version: "0.1.0",
      type: "snippet" as const,
      category: "examples",
      tags: ["starter"],
      description: "Hello world snippet",
      author: "Frank",
      license: "MIT",
      checksum: { algorithm: "sha256" as const, value: "fff" },
      downloadPath: "/hello",
      manifestVersion: "1.0.0",
    },
  ];

  const searchIndex = resources.map((r) => ({
    id: r.id,
    name: r.name,
    displayName: r.displayName,
    description: r.description,
    keywords: [r.type],
    tags: r.tags,
    type: r.type,
    category: r.category,
  }));

  return {
    version: "1.0.0",
    updatedAt: "2024-01-01T00:00:00Z",
    resources,
    categories: [
      {
        id: "security",
        name: "security",
        displayName: "Security",
        description: "Security resources",
        resourceCount: 1,
      },
      {
        id: "frontend",
        name: "frontend",
        displayName: "Frontend",
        description: "Frontend resources",
        resourceCount: 2,
      },
      {
        id: "utilities",
        name: "utilities",
        displayName: "Utilities",
        description: "Utility resources",
        resourceCount: 2,
      },
      {
        id: "examples",
        name: "examples",
        displayName: "Examples",
        description: "Example resources",
        resourceCount: 1,
      },
    ],
    tags: [
      { name: "auth", count: 1 },
      { name: "react", count: 2 },
      { name: "utils", count: 1 },
    ],
    searchIndex,
  };
}

describe("searchRegistry", () => {
  const index = createTestIndex();

  it("exact name match returns high score with matchType exact", () => {
    const results = searchRegistry(index, { query: "plugin-auth" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.resource.id).toBe("plugin-auth");
    expect(results[0]?.matchType).toBe("exact");
    expect(results[0]?.score).toBeGreaterThanOrEqual(0.9);
  });

  it("prefix match returns matchType prefix", () => {
    const results = searchRegistry(index, { query: "auth" });
    const pluginResult = results.find((r) => r.resource.id === "plugin-auth");
    expect(pluginResult).toBeDefined();
    expect(pluginResult?.matchType).toBe("prefix");
  });

  it("fuzzy/partial match works", () => {
    const results = searchRegistry(index, { query: "auth" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.resource.id === "plugin-auth")).toBe(true);
  });

  it("filters by type", () => {
    const results = searchRegistry(index, { query: "template", type: "plugin" });
    expect(results.every((r) => r.resource.type === "plugin")).toBe(true);
  });

  it("filters by category", () => {
    const results = searchRegistry(index, { query: "", category: "security" });
    expect(results.every((r) => r.resource.category === "security")).toBe(true);
  });

  it("filters by tags", () => {
    const results = searchRegistry(index, { query: "", tags: ["react"] });
    expect(results.every((r) => r.resource.tags.includes("react"))).toBe(true);
  });

  it("respects limit parameter", () => {
    const results = searchRegistry(index, { query: "", limit: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("returns empty for no-match query", () => {
    const results = searchRegistry(index, { query: "zzzzzzzzz" });
    expect(results).toEqual([]);
  });

  it("returns results sorted by score descending", () => {
    const results = searchRegistry(index, { query: "plugin" });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]?.score).toBeGreaterThanOrEqual(results[i]?.score ?? 0);
    }
  });
});

describe("searchByCategory", () => {
  const index = createTestIndex();

  it("returns only matching resources", () => {
    const results = searchByCategory(index, "frontend");
    expect(results.length).toBe(2);
    expect(results.every((r) => r.category === "frontend")).toBe(true);
  });

  it("returns empty for unknown category", () => {
    expect(searchByCategory(index, "nonexistent")).toEqual([]);
  });
});

describe("searchByTag", () => {
  const index = createTestIndex();

  it("returns only matching resources", () => {
    const results = searchByTag(index, "react");
    expect(results.length).toBe(2);
    expect(results.every((r) => r.tags.includes("react"))).toBe(true);
  });

  it("returns empty for unknown tag", () => {
    expect(searchByTag(index, "nonexistent")).toEqual([]);
  });
});

describe("searchByType", () => {
  const index = createTestIndex();

  it("returns only matching resources", () => {
    const results = searchByType(index, "plugin");
    expect(results.length).toBe(2);
    expect(results.every((r) => r.type === "plugin")).toBe(true);
  });

  it("returns empty for type with no resources", () => {
    expect(searchByType(index, "theme")).toEqual([]);
  });
});

describe("getCategories", () => {
  it("returns category list", () => {
    const index = createTestIndex();
    const categories = getCategories(index);
    expect(categories.length).toBe(4);
    expect(categories.map((c) => c.id)).toContain("security");
  });
});

describe("getTags", () => {
  it("returns tag list", () => {
    const index = createTestIndex();
    const tags = getTags(index);
    expect(tags.length).toBe(3);
    expect(tags.map((t) => t.name)).toContain("react");
  });
});

describe("getPopularResources", () => {
  const index = createTestIndex();

  it("returns resources sorted by tag count descending", () => {
    const results = getPopularResources(index);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]?.tags.length).toBeGreaterThanOrEqual(results[i]?.tags.length ?? 0);
    }
  });

  it("respects limit parameter", () => {
    const results = getPopularResources(index, 2);
    expect(results.length).toBe(2);
  });
});
