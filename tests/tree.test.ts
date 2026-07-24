import { describe, it, expect } from "vitest";
import type { TreeItem, TreeNode } from "../src/types";
import {
  buildTree,
  flattenTree,
  findNodeByPath,
  getSelectedNodes,
  toggleNode,
  selectAll,
  countFiles,
  countFolders,
  calculateTotalSize,
} from "../src/core/tree";

const mockItems: TreeItem[] = [
  { path: "package.json", type: "blob", sha: "a", size: 100, url: "" },
  { path: "src", type: "tree", sha: "b", size: 0, url: "" },
  { path: "src/index.ts", type: "blob", sha: "c", size: 200, url: "" },
  { path: "src/utils.ts", type: "blob", sha: "d", size: 300, url: "" },
  { path: "README.md", type: "blob", sha: "e", size: 50, url: "" },
];

describe("buildTree", () => {
  it("builds tree from flat items", () => {
    const tree = buildTree(mockItems);
    expect(tree.length).toBe(3); // src, package.json, README.md
    const src = findNodeByPath(tree, "src");
    expect(src).not.toBeNull();
    expect((src as TreeNode).type).toBe("directory");
    expect((src as TreeNode).children.length).toBe(2);
  });

  it("sorts items alphabetically", () => {
    const tree = buildTree(mockItems);
    expect((tree[0] as TreeNode).name).toBe("package.json");
    expect((tree[1] as TreeNode).name).toBe("README.md");
    expect((tree[2] as TreeNode).name).toBe("src");
  });
});

describe("flattenTree", () => {
  it("flattens nested tree", () => {
    const tree = buildTree(mockItems);
    const flat = flattenTree(tree);
    expect(flat.length).toBe(5);
  });
});

describe("findNodeByPath", () => {
  it("finds node by path", () => {
    const tree = buildTree(mockItems);
    const node = findNodeByPath(tree, "src/index.ts");
    expect(node).not.toBeNull();
    expect((node as TreeNode).name).toBe("index.ts");
    expect((node as TreeNode).type).toBe("file");
  });

  it("returns null for non-existent path", () => {
    const tree = buildTree(mockItems);
    const node = findNodeByPath(tree, "nonexistent.ts");
    expect(node).toBeNull();
  });
});

describe("getSelectedNodes", () => {
  it("returns selected nodes", () => {
    const tree = buildTree(mockItems);
    toggleNode(tree, "src/index.ts");
    const selected = getSelectedNodes(tree);
    expect(selected.length).toBe(1);
    expect((selected[0] as TreeNode).path).toBe("src/index.ts");
  });
});

describe("toggleNode", () => {
  it("toggles selection state", () => {
    const tree = buildTree(mockItems);
    toggleNode(tree, "package.json");
    expect((tree[0] as TreeNode).selected).toBe(true);
    toggleNode(tree, "package.json");
    expect((tree[0] as TreeNode).selected).toBe(false);
  });
});

describe("selectAll", () => {
  it("selects all nodes", () => {
    const tree = buildTree(mockItems);
    selectAll(tree, true);
    const selected = getSelectedNodes(tree);
    expect(selected.length).toBe(5);
  });

  it("deselects all nodes", () => {
    const tree = buildTree(mockItems);
    selectAll(tree, true);
    selectAll(tree, false);
    const selected = getSelectedNodes(tree);
    expect(selected.length).toBe(0);
  });
});

describe("countFiles", () => {
  it("counts file nodes", () => {
    const tree = buildTree(mockItems);
    expect(countFiles(tree)).toBe(4);
  });
});

describe("countFolders", () => {
  it("counts directory nodes", () => {
    const tree = buildTree(mockItems);
    expect(countFolders(tree)).toBe(1);
  });
});

describe("calculateTotalSize", () => {
  it("sums file sizes", () => {
    const tree = buildTree(mockItems);
    expect(calculateTotalSize(tree)).toBe(650);
  });
});
