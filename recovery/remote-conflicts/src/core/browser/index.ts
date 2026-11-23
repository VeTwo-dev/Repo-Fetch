import * as p from "@clack/prompts";
import pc from "picocolors";
import type { TreeNode, RepoIdentifier, FetchOptions } from "../../types";
import { listRepositoryTree, flattenTree, toggleNode, selectAll } from "../tree";
import { generatePreview, formatPreview } from "../preview";
import { filterBySearch } from "../filters";
import { globalEmitter } from "../../events";

interface BrowseState {
  repo: RepoIdentifier;
  nodes: TreeNode[];
  cursor: number;
  mode: "navigate" | "search" | "filter" | "preview";
  searchQuery: string;
  filterMode: "none" | "files" | "folders";
  visibleNodes: TreeNode[];
  done: boolean;
}

function renderTree(state: BrowseState): string {
  const lines: string[] = [];
  lines.push(pc.bold(`\n  Repository: ${state.repo.owner}/${state.repo.repo}\n`));

  if (state.mode !== "search") {
    lines.push(
      pc.dim(
        "  \u2191\u2193 Navigate  Space Select  \u2192 Expand  \u2190 Collapse  Enter Confirm  / Search  F Filter  P Preview  A All  Esc\n",
      ),
    );
  }

  if (state.mode === "search") {
    lines.push(pc.cyan(`  Search: ${state.searchQuery}\n`));
  }

  const visible = state.visibleNodes;

  for (let i = 0; i < visible.length; i++) {
    const node = visible[i];
    if (!node) {
      continue;
    }
    const isCursor = i === state.cursor;
    const prefix = isCursor ? pc.cyan("\u276f ") : "  ";
    const indent = "  ".repeat(node.depth);
    const icon = node.type === "directory" ? "\ud83d\udcc1" : "\ud83d\udcc4";
    const selectMark = node.selected ? pc.green("\u2713") : pc.dim("\u25cb");
    const expandMark =
      node.type === "directory" ? (node.expanded ? pc.dim("\u25bc") : pc.dim("\u25b6")) : " ";
    const line = `${prefix}${indent}${expandMark} ${selectMark} ${icon} ${node.name}`;
    lines.push(isCursor ? pc.bold(line) : line);
  }

  return lines.join("\n");
}

function getVisibleNodes(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  const walk = (node: TreeNode): void => {
    result.push(node);
    if (node.expanded && node.type === "directory") {
      for (const child of node.children) {
        walk(child);
      }
    }
  };
  for (const node of nodes) {
    walk(node);
  }
  return result;
}

function updateVisible(state: BrowseState): void {
  if (state.mode === "search" && state.searchQuery) {
    state.visibleNodes = filterBySearch(state.nodes, state.searchQuery);
  } else if (state.filterMode === "files") {
    state.visibleNodes = flattenTree(state.nodes).filter((n) => n.type === "file");
  } else if (state.filterMode === "folders") {
    state.visibleNodes = flattenTree(state.nodes).filter((n) => n.type === "directory");
  } else {
    state.visibleNodes = getVisibleNodes(state.nodes);
  }

  if (state.cursor >= state.visibleNodes.length) {
    state.cursor = Math.max(0, state.visibleNodes.length - 1);
  }
}

export async function browseRepository(
  repo: RepoIdentifier,
  options?: FetchOptions,
): Promise<TreeNode[]> {
  await globalEmitter.emit("beforeBrowse", { repo, options: options ?? {} });

  const items = await listRepositoryTree(repo, options);

  const state: BrowseState = {
    repo,
    nodes: items,
    cursor: 0,
    mode: "navigate",
    searchQuery: "",
    filterMode: "none",
    visibleNodes: getVisibleNodes(items),
    done: false,
  };

  updateVisible(state);

  while (!state.done) {
    console.clear();
    console.log(renderTree(state));

    const key = await p.text({
      message: "",
      placeholder: "Press key...",
      validate: () => undefined,
    });

    if (typeof key !== "string") {
      continue;
    }

    switch (key) {
      case "\u001b[A":
      case "k":
        if (state.cursor > 0) {
          state.cursor--;
        }
        break;
      case "\u001b[B":
      case "j":
        if (state.cursor < state.visibleNodes.length - 1) {
          state.cursor++;
        }
        break;
      case "\u001b[C":
      case "l": {
        const node = state.visibleNodes[state.cursor];
        if (node?.type === "directory" && node?.expanded === false) {
          node.expanded = true;
          updateVisible(state);
        }
        break;
      }
      case "\u001b[D":
      case "h": {
        const node = state.visibleNodes[state.cursor];
        if (node?.type === "directory" && node?.expanded === true) {
          node.expanded = false;
          updateVisible(state);
        } else if (node?.parent) {
          const visibleIdx = state.visibleNodes.indexOf(node.parent);
          if (visibleIdx >= 0) {
            state.cursor = visibleIdx;
          }
        }
        break;
      }
      case " ":
      case "Space": {
        const node = state.visibleNodes[state.cursor];
        if (node) {
          toggleNode(state.nodes, node.path);
          updateVisible(state);
        }
        break;
      }
      case "\r":
        state.done = true;
        break;
      case "/": {
        state.mode = "search";
        const searchResult = await p.text({
          message: "Search:",
          placeholder: "Type to search...",
        });
        if (typeof searchResult === "string") {
          state.searchQuery = searchResult;
        }
        state.mode = "navigate";
        updateVisible(state);
        break;
      }
      case "f":
      case "F":
        if (state.filterMode === "none") {
          state.filterMode = "files";
        } else if (state.filterMode === "files") {
          state.filterMode = "folders";
        } else {
          state.filterMode = "none";
        }
        updateVisible(state);
        break;
      case "p":
      case "P": {
        state.mode = "preview";
        console.clear();
        const preview = generatePreview(state.nodes);
        console.log(formatPreview(preview));
        const cont = await p.text({
          message: "Continue? (y/n):",
          placeholder: "",
        });
        if (cont === "y" || cont === "Y") {
          state.done = true;
        }
        state.mode = "navigate";
        break;
      }
      case "a":
      case "A":
        selectAll(state.nodes, true);
        updateVisible(state);
        break;
      case "d":
      case "D":
        selectAll(state.nodes, false);
        updateVisible(state);
        break;
      case "\u001b":
      case "q":
        return [];
      default:
        break;
    }
  }

  await globalEmitter.emit("afterBrowse", { repo, options: options ?? {}, nodes: state.nodes });

  return state.nodes;
}
