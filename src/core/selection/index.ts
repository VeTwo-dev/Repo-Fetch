import type { TreeNode, DownloadItem } from "../../types";
import { flattenTree, getSelectedNodes } from "../tree";

export function getSelectedItems(nodes: TreeNode[]): TreeNode[] {
  return getSelectedNodes(nodes);
}

export function getSelectedFiles(nodes: TreeNode[]): TreeNode[] {
  return getSelectedNodes(nodes).filter((n) => n.type === "file");
}

export function getSelectedFolders(nodes: TreeNode[]): TreeNode[] {
  return getSelectedNodes(nodes).filter((n) => n.type === "directory");
}

export function expandSelectionToChildren(nodes: TreeNode[]): void {
  for (const node of flattenTree(nodes)) {
    if (node.selected && node.type === "directory") {
      for (const child of flattenTree(node.children)) {
        if (child.type === "file") {
          child.selected = true;
        }
      }
    }
  }
}

export function getSelectedDownloadItems(nodes: TreeNode[]): DownloadItem[] {
  expandSelectionToChildren(nodes);
  const files = getSelectedFiles(nodes);
  // Note: actual URLs will be populated by the download engine
  return files.map((f) => ({
    path: f.path,
    url: "",
    size: f.size,
    type: "file" as const,
  }));
}
