import type { TreeItem, TreeNode, FilterOptions } from "../../types";
import { flattenTree } from "../tree";
import { simpleGlobMatch } from "../../utils";

export function filterTreeItems(items: TreeItem[], options: FilterOptions): TreeItem[] {
  return items.filter((item) => {
    if (options.foldersOnly && item.type !== "tree") {
      return false;
    }
    if (options.filesOnly && item.type !== "blob") {
      return false;
    }

    if (options.extensions && options.extensions.length > 0) {
      const ext = item.path.split(".").pop();
      if (!ext) {
        return false;
      }
      const dotExt = ext.startsWith(".") ? ext : `.${ext}`;
      const normalizedExtensions = options.extensions.map((e) => (e.startsWith(".") ? e : `.${e}`));
      if (!normalizedExtensions.includes(dotExt)) {
        return false;
      }
    }

    if (options.glob) {
      const patterns = Array.isArray(options.glob) ? options.glob : [options.glob];
      const excludePatterns: string[] = [];
      const includePatterns: string[] = [];

      for (const p of patterns) {
        if (p.startsWith("!")) {
          excludePatterns.push(p.slice(1));
        } else {
          includePatterns.push(p);
        }
      }

      if (includePatterns.length > 0) {
        const matches = includePatterns.some((p) => simpleGlobMatch(p, item.path));
        if (!matches) {
          return false;
        }
      }

      if (excludePatterns.length > 0) {
        const excluded = excludePatterns.some((p) => simpleGlobMatch(p, item.path));
        if (excluded) {
          return false;
        }
      }
    }

    if (options.regex) {
      if (!options.regex.test(item.path)) {
        return false;
      }
    }

    if (options.excludeGlob) {
      const patterns = Array.isArray(options.excludeGlob)
        ? options.excludeGlob
        : [options.excludeGlob];
      const excluded = patterns.some((p) => simpleGlobMatch(p, item.path));
      if (excluded) {
        return false;
      }
    }

    if (options.excludeRegex) {
      if (options.excludeRegex.test(item.path)) {
        return false;
      }
    }

    return true;
  });
}

export function filterTreeNodes(nodes: TreeNode[], options: FilterOptions): TreeNode[] {
  const items: TreeItem[] = flattenTree(nodes).map((n) => ({
    path: n.path,
    type: n.type === "file" ? "blob" : "tree",
    sha: n.sha,
    size: n.size,
    url: "",
  }));

  const filtered = filterTreeItems(items, options);
  const filteredPaths = new Set(filtered.map((f) => f.path));
  return nodes.filter((n) => filteredPaths.has(n.path));
}

export function filterBySearch(
  nodes: TreeNode[],
  query: string,
  caseSensitive = false,
): TreeNode[] {
  const lower = caseSensitive ? query : query.toLowerCase();
  return flattenTree(nodes).filter((n) => {
    const path = caseSensitive ? n.path : n.path.toLowerCase();
    return path.includes(lower);
  });
}

export async function filterRepository(
  nodes: TreeNode[],
  options: FilterOptions,
): Promise<TreeNode[]> {
  return filterTreeNodes(nodes, options);
}
