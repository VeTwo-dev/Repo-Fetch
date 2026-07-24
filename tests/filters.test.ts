import { describe, it, expect } from "vitest";
import type { TreeItem } from "../src/types";
import { filterTreeItems, filterBySearch } from "../src/core/filters";
import { buildTree } from "../src/core/tree";

const mockItems: TreeItem[] = [
  { path: "package.json", type: "blob", sha: "a", size: 100, url: "" },
  { path: "src/index.ts", type: "blob", sha: "b", size: 200, url: "" },
  { path: "src/utils.ts", type: "blob", sha: "c", size: 300, url: "" },
  { path: "src/styles.css", type: "blob", sha: "d", size: 50, url: "" },
  { path: "dist/bundle.js", type: "blob", sha: "e", size: 1000, url: "" },
  { path: "node_modules/pkg/index.js", type: "blob", sha: "f", size: 500, url: "" },
];

describe("filterTreeItems", () => {
  it("filters by extension", () => {
    const result = filterTreeItems(mockItems, { extensions: [".ts"] });
    expect(result.length).toBe(2);
    expect(result.every((i) => i.path.endsWith(".ts"))).toBe(true);
  });

  it("filters by files only", () => {
    const result = filterTreeItems(mockItems, { filesOnly: true });
    expect(result.every((i) => i.type === "blob")).toBe(true);
  });

  it("filters by glob pattern", () => {
    const result = filterTreeItems(mockItems, { glob: "src/**" });
    expect(result.length).toBe(3);
    expect(result.every((i) => i.path.startsWith("src/"))).toBe(true);
  });

  it("filters with exclude glob", () => {
    const result = filterTreeItems(mockItems, {
      glob: "**/*.ts",
      excludeGlob: "**/utils.ts",
    });
    expect(result.length).toBe(1);
    expect(result[0]?.path).toBe("src/index.ts");
  });

  it("filters by regex", () => {
    const result = filterTreeItems(mockItems, {
      regex: /\.(ts|json)$/,
    });
    expect(result.length).toBe(3);
  });

  it("filters by exclude regex", () => {
    const result = filterTreeItems(mockItems, {
      regex: /\.ts$/,
      excludeRegex: /utils/,
    });
    expect(result.length).toBe(1);
    expect(result[0]?.path).toBe("src/index.ts");
  });
});

describe("filterBySearch", () => {
  it("filters nodes by search query", () => {
    const tree = buildTree(mockItems);
    const result = filterBySearch(tree, "utils");
    expect(result.length).toBe(1);
    expect(result[0]?.path).toBe("src/utils.ts");
  });

  it("is case insensitive by default", () => {
    const tree = buildTree(mockItems);
    const result = filterBySearch(tree, "UTILS");
    expect(result.length).toBe(1);
  });

  it("respects case sensitivity", () => {
    const tree = buildTree(mockItems);
    const result = filterBySearch(tree, "UTILS", true);
    expect(result.length).toBe(0);
  });
});
