import { describe, it, expect } from "vitest";
import type { TreeItem } from "../src/types";
import { buildTree, toggleNode } from "../src/core/tree";
import { generatePreview, formatPreview, previewDownload } from "../src/core/preview";

const mockItems: TreeItem[] = [
  { path: "package.json", type: "blob", sha: "a", size: 100, url: "" },
  { path: "src/index.ts", type: "blob", sha: "b", size: 200, url: "" },
  { path: "src/lib", type: "tree", sha: "c", size: 0, url: "" },
  { path: "src/lib/helper.ts", type: "blob", sha: "d", size: 300, url: "" },
];

describe("preview", () => {
  it("generatePreview creates preview data from selected nodes", () => {
    const tree = buildTree(mockItems);
    toggleNode(tree, "src/index.ts");
    toggleNode(tree, "src/lib/helper.ts");

    const preview = generatePreview(tree);
    expect(preview.files).toHaveLength(2);
    expect(preview.totalFiles).toBe(2);
    expect(preview.totalSize).toBe(500);
    expect(preview.destination).toBe("./download");
  });

  it("generatePreview includes destination", () => {
    const tree = buildTree(mockItems);
    const preview = generatePreview(tree, "./custom");
    expect(preview.destination).toBe("./custom");
  });

  it("formatPreview returns formatted string", () => {
    const tree = buildTree(mockItems);
    toggleNode(tree, "package.json");
    const preview = generatePreview(tree);
    const formatted = formatPreview(preview);
    expect(formatted).toContain("Will download");
    expect(formatted).toContain("package.json");
    expect(formatted).toContain("Files:");
  });

  it("previewDownload returns preview data", async () => {
    const tree = buildTree(mockItems);
    const preview = await previewDownload(tree, "./out");
    expect(preview).toHaveProperty("files");
    expect(preview).toHaveProperty("totalSize");
  });
});
