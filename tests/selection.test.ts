import { describe, it, expect } from "vitest";
import type { TreeItem, TreeNode } from "../src/types";
import { buildTree, toggleNode } from "../src/core/tree";
import {
  getSelectedItems,
  getSelectedFiles,
  getSelectedFolders,
  getSelectedDownloadItems,
} from "../src/core/selection";

const mockItems: TreeItem[] = [
  { path: "src/index.ts", type: "blob", sha: "a", size: 100, url: "" },
  { path: "src/lib/helper.ts", type: "blob", sha: "b", size: 200, url: "" },
  { path: "src", type: "tree", sha: "c", size: 0, url: "" },
  { path: "README.md", type: "blob", sha: "d", size: 50, url: "" },
];

describe("selection", () => {
  it("getSelectedItems returns all selected nodes", () => {
    const tree = buildTree(mockItems);
    toggleNode(tree, "src/index.ts");
    toggleNode(tree, "README.md");
    const items = getSelectedItems(tree);
    expect(items.length).toBe(2);
  });

  it("getSelectedFiles returns only file selections", () => {
    const tree = buildTree(mockItems);
    toggleNode(tree, "src");
    toggleNode(tree, "README.md");
    const files = getSelectedFiles(tree);
    expect(files.length).toBe(1);
    expect((files[0] as TreeNode).path).toBe("README.md");
  });

  it("getSelectedFolders returns only directory selections", () => {
    const tree = buildTree(mockItems);
    toggleNode(tree, "src");
    toggleNode(tree, "README.md");
    const folders = getSelectedFolders(tree);
    expect(folders.length).toBe(1);
    expect((folders[0] as TreeNode).path).toBe("src");
  });

  it("getSelectedDownloadItems expands folder selection to children", () => {
    const tree = buildTree(mockItems);
    toggleNode(tree, "src");
    const items = getSelectedDownloadItems(tree);
    // Should include src children
    expect(items.length).toBe(2);
    expect(items.some((i) => i.path === "src/index.ts")).toBe(true);
    expect(items.some((i) => i.path === "src/lib/helper.ts")).toBe(true);
  });
});
