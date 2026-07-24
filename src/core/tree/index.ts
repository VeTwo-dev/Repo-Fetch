import type { TreeItem, TreeNode, RepoIdentifier, FetchOptions } from "../../types";
import { getProvider } from "../../providers";

export function buildTree(items: TreeItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  const sorted = [...items].sort((a, b) => a.path.localeCompare(b.path));

  for (const item of sorted) {
    const parts = item.path.split("/");
    let currentPath = "";
    let parent: TreeNode | null = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) {
        continue;
      }
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;
      const type = isLast ? (item.type === "tree" ? "directory" : "file") : "directory";

      if (!map.has(currentPath)) {
        const node: TreeNode = {
          name: part,
          path: currentPath,
          type,
          sha: isLast ? item.sha : "",
          size: isLast ? item.size : 0,
          children: [],
          depth: i,
          expanded: true,
          selected: false,
          parent,
        };
        map.set(currentPath, node);

        if (parent) {
          parent.children.push(node);
        } else {
          root.push(node);
        }
      }

      const maybeParent = map.get(currentPath);
      if (maybeParent) {
        parent = maybeParent;
      }
    }
  }

  return root;
}

export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  const walk = (node: TreeNode): void => {
    result.push(node);
    for (const child of node.children) {
      walk(child);
    }
  };
  for (const node of nodes) {
    walk(node);
  }
  return result;
}

export function findNodeByPath(nodes: TreeNode[], path: string): TreeNode | null {
  for (const node of flattenTree(nodes)) {
    if (node.path === path) {
      return node;
    }
  }
  return null;
}

export function getSelectedNodes(nodes: TreeNode[]): TreeNode[] {
  return flattenTree(nodes).filter((n) => n.selected);
}

function getFileNodes(nodes: TreeNode[]): TreeNode[] {
  return flattenTree(nodes).filter((n) => n.type === "file");
}

function getDirectoryNodes(nodes: TreeNode[]): TreeNode[] {
  return flattenTree(nodes).filter((n) => n.type === "directory");
}

export function toggleNode(nodes: TreeNode[], path: string): void {
  const node = findNodeByPath(nodes, path);
  if (node) {
    node.selected = !node.selected;
  }
}

export function selectAll(nodes: TreeNode[], selected: boolean): void {
  for (const node of flattenTree(nodes)) {
    node.selected = selected;
  }
}

export function expandToPath(nodes: TreeNode[], path: string): void {
  const parts = path.split("/");
  let currentPath = "";
  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const node = findNodeByPath(nodes, currentPath);
    if (node) {
      node.expanded = true;
    }
  }
}

export function countFiles(nodes: TreeNode[]): number {
  return getFileNodes(nodes).length;
}

export function countFolders(nodes: TreeNode[]): number {
  return getDirectoryNodes(nodes).length;
}

export function calculateTotalSize(nodes: TreeNode[]): number {
  return getFileNodes(nodes).reduce((acc: number, n: TreeNode) => acc + n.size, 0);
}

export async function listRepositoryTree(
  repo: RepoIdentifier,
  options?: FetchOptions,
): Promise<TreeNode[]> {
  const provider = getProvider(repo.provider);
  const items = await provider.getTree(repo, options);
  return buildTree(items);
}
