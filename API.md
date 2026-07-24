# API Reference

Complete API reference for `@vetwo/repo-fetch`.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Functions](#core-functions)
  - [fetchRepo](#fetchrepo)
  - [fetchFiles](#fetchfiles)
  - [fetchFolders](#fetchfolders)
  - [downloadFile](#downloadfile)
  - [downloadFolder](#downloadfolder)
  - [downloadSelection](#downloadselection)
  - [downloadItems](#downloaditems)
- [Tree Operations](#tree-operations)
  - [listRepositoryTree](#listrepositorytree)
  - [buildTree](#buildtree)
  - [flattenTree](#flattentree)
  - [findNodeByPath](#findnodebypath)
  - [getSelectedNodes](#getselectednodes)
  - [selectAll](#selectall)
  - [toggleNode](#togglenode)
- [Filters](#filters)
  - [filterRepository](#filterrepository)
  - [filterTreeItems](#filtertreeitems)
  - [filterTreeNodes](#filtertreenodes)
  - [filterBySearch](#filterbysearch)
- [Providers](#providers)
  - [registerProvider](#registerprovider)
  - [getProvider](#getprovider)
  - [getProviderForRepo](#getproviderforrepo)
  - [getProviderFromInput](#getproviderfrominput)
  - [hasProvider](#hasprovider)
  - [listProviders](#listproviders)
- [Preview](#preview)
  - [generatePreview](#generatepreview)
  - [formatPreview](#formatpreview)
  - [previewDownload](#previewdownload)
- [Search](#search)
  - [searchRepository](#searchrepository)
- [Browser](#browser)
  - [browseRepository](#browserepository)
- [Cache](#cache)
- [Configuration](#configuration)
  - [setConfig](#setconfig)
  - [getConfig](#getconfig)
  - [resetConfig](#resetconfig)
  - [defineConfig](#defineconfig)
- [Events](#events)
- [Plugins](#plugins)
- [Progress](#progress)
- [Resolver](#resolver)
  - [resolveRepository](#resolverepository)
  - [parseRepositoryInput](#parserepositoryinput)
- [Utilities](#utilities)
- [Errors](#errors)
- [Types](#types)
- [Registry Client](#registry-client)
  - [RegistryClient](#registryclient)
  - [searchRegistry](#searchregistry)
  - [searchByCategory / searchByTag / searchByType](#searchbycategory--searchbytag--searchbytype)
  - [getCategories / getTags / getPopularResources](#getcategories--gettags--getpopularresources)
- [Compatibility Engine](#compatibility-engine)
  - [detectEnvironment](#detectenvironment)
  - [checkCompatibility](#checkcompatibility)
- [Variable Engine](#variable-engine)
  - [resolveVariables](#resolvevariables)
  - [applyVariables](#applyvariables)
  - [validateVariableValue](#validatevariablevalue)
- [AST Transforms](#ast-transforms)
  - [applyTransforms](#applytransforms)
- [Integrity System](#integrity-system)
  - [verifyIntegrity](#verifyintegrity)
  - [computeHash / computeFileHash / computeDirectoryHash / generateChecksum](#computehash--computefilehash--computedirectoryhash--generatechecksum)
- [Lifecycle Hooks](#lifecycle-hooks)
  - [executeLifecycleHooks](#executelifecyclehooks)
  - [getAvailableHooks / hasHook / getHookDescription](#getavailablehooks--hashook--gethookdescription)
- [Installation Report](#installation-report)
  - [createReport / addInstalledResource / addError / addWarning / finalizeReport / formatReport](#createreport--addinstalledresource--adderror--addwarning--finalizereport--formatreport)
- [GitHub Repo URL Resolution](#github-repo-url-resolution)
  - [detectRepoFromGitRemote](#detectrepofromgitremote)
  - [resolveRepoUrl](#resolverepourl)
  - [fetchFromConfig](#fetchfromconfig)
- [Registry Cache](#registry-cache)
  - [RegistryCache](#registrycache)
- [Constants](#constants)

---

## Installation

```bash
npm install @vetwo/repo-fetch
```

---

## Quick Start

```typescript
import { fetchFiles, browseRepository } from "@vetwo/repo-fetch";

// Download specific files
const results = await fetchFiles(
  { owner: "octocat", repo: "hello-world", provider: "github" },
  ["README.md", "src/index.ts"],
  { output: "./download", concurrency: 5 }
);

// Interactive browse and download
const nodes = await browseRepository(
  { owner: "octocat", repo: "hello-world", provider: "github" }
);
```

---

## Core Functions

### fetchRepo

Downloads the entire repository tree.

```typescript
function fetchRepo(
  repo: RepoIdentifier,
  options?: FetchOptions & DownloadOptions
): Promise<DownloadResult[]>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | `RepoIdentifier` | Yes | Repository identifier |
| `options` | `FetchOptions & DownloadOptions` | No | Combined options |

**Example:**

```typescript
const results = await fetchRepo(
  { owner: "octocat", repo: "hello-world", provider: "github" },
  { output: "./download", concurrency: 10, overwrite: true }
);
```

---

### fetchFiles

Downloads specific files by path.

```typescript
function fetchFiles(
  repo: RepoIdentifier,
  paths: string[],
  options?: DownloadOptions & FetchOptions
): Promise<DownloadResult[]>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | `RepoIdentifier` | Yes | Repository identifier |
| `paths` | `string[]` | Yes | Array of file paths to download |
| `options` | `DownloadOptions & FetchOptions` | No | Download options |

**Example:**

```typescript
const results = await fetchFiles(
  { owner: "octocat", repo: "hello-world", provider: "github" },
  ["README.md", "package.json", "src/index.ts"],
  { output: "./my-project" }
);
```

---

### fetchFolders

Downloads entire folders recursively.

```typescript
function fetchFolders(
  repo: RepoIdentifier,
  folders: string[],
  options?: DownloadOptions & FetchOptions
): Promise<DownloadResult[]>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | `RepoIdentifier` | Yes | Repository identifier |
| `folders` | `string[]` | Yes | Array of folder paths to download |
| `options` | `DownloadOptions & FetchOptions` | No | Download options |

**Example:**

```typescript
const results = await fetchFolders(
  { owner: "octocat", repo: "hello-world", provider: "github" },
  ["src", "tests"],
  { output: "./download" }
);
```

---

### downloadFile

Downloads a single file.

```typescript
function downloadFile(
  repo: RepoIdentifier,
  filePath: string,
  options?: DownloadOptions & FetchOptions
): Promise<DownloadResult>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | `RepoIdentifier` | Yes | Repository identifier |
| `filePath` | `string` | Yes | Path to the file |
| `options` | `DownloadOptions & FetchOptions` | No | Download options |

**Example:**

```typescript
const result = await downloadFile(
  { owner: "octocat", repo: "hello-world", provider: "github" },
  "README.md",
  { output: "./download" }
);
```

---

### downloadFolder

Downloads a folder and all its contents.

```typescript
function downloadFolder(
  repo: RepoIdentifier,
  folderPath: string,
  options?: DownloadOptions & FetchOptions
): Promise<DownloadResult[]>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | `RepoIdentifier` | Yes | Repository identifier |
| `folderPath` | `string` | Yes | Path to the folder |
| `options` | `DownloadOptions & FetchOptions` | No | Download options |

**Example:**

```typescript
const results = await downloadFolder(
  { owner: "octocat", repo: "hello-world", provider: "github" },
  "src",
  { output: "./download" }
);
```

---

### downloadSelection

Downloads selected nodes from a tree.

```typescript
function downloadSelection(
  nodes: TreeNode[],
  repo: RepoIdentifier,
  options?: DownloadOptions & FetchOptions
): Promise<DownloadResult[]>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `TreeNode[]` | Yes | Selected tree nodes |
| `repo` | `RepoIdentifier` | Yes | Repository identifier |
| `options` | `DownloadOptions & FetchOptions` | No | Download options |

**Example:**

```typescript
import { listRepositoryTree, selectAll, downloadSelection } from "@vetwo/repo-fetch";

const nodes = await listRepositoryTree(repo);
selectAll(nodes);

const results = await downloadSelection(nodes, repo, {
  output: "./download",
  concurrency: 10,
});
```

---

### downloadItems

Downloads an array of download items.

```typescript
function downloadItems(
  items: DownloadItem[],
  repo: RepoIdentifier,
  options?: DownloadOptions & FetchOptions
): Promise<DownloadResult[]>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items` | `DownloadItem[]` | Yes | Array of download items |
| `repo` | `RepoIdentifier` | Yes | Repository identifier |
| `options` | `DownloadOptions & FetchOptions` | No | Download options |

**Example:**

```typescript
import { downloadItems, getProvider } from "@vetwo/repo-fetch";

const provider = getProvider("github");
const items = paths.map((path) => ({
  path,
  url: provider.getDownloadUrl(repo, path),
  size: 0,
  type: "file" as const,
}));

const results = await downloadItems(items, repo);
```

---

## Tree Operations

### listRepositoryTree

Fetches and builds the repository tree.

```typescript
function listRepositoryTree(
  repo: RepoIdentifier,
  options?: FetchOptions
): Promise<TreeNode[]>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | `RepoIdentifier` | Yes | Repository identifier |
| `options` | `FetchOptions` | No | Fetch options |

**Example:**

```typescript
const nodes = await listRepositoryTree(
  { owner: "octocat", repo: "hello-world", provider: "github" },
  { branch: "main", token: process.env.GITHUB_TOKEN }
);
```

---

### buildTree

Builds a tree structure from flat tree items.

```typescript
function buildTree(items: TreeItem[]): TreeNode[]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items` | `TreeItem[]` | Yes | Flat array of tree items |

**Returns:** Array of root `TreeNode` objects

---

### flattenTree

Flattens a tree structure into a flat array.

```typescript
function flattenTree(nodes: TreeNode[]): TreeNode[]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `TreeNode[]` | Yes | Root tree nodes |

**Returns:** Flat array of all nodes

---

### findNodeByPath

Finds a node by its path.

```typescript
function findNodeByPath(nodes: TreeNode[], path: string): TreeNode | undefined
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `TreeNode[]` | Yes | Root tree nodes |
| `path` | `string` | Yes | Path to find |

**Returns:** Matching node or `undefined`

**Example:**

```typescript
const node = findNodeByPath(nodes, "src/index.ts");
if (node) {
  node.selected = true;
}
```

---

### getSelectedNodes

Gets all selected nodes from the tree.

```typescript
function getSelectedNodes(nodes: TreeNode[]): TreeNode[]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `TreeNode[]` | Yes | Root tree nodes |

**Returns:** Array of selected nodes

---

### selectAll

Selects or deselects all nodes.

```typescript
function selectAll(nodes: TreeNode[], selected?: boolean): void
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `TreeNode[]` | Yes | Root tree nodes |
| `selected` | `boolean` | No | Selection state (default: `true`) |

---

### toggleNode

Toggles a node's selection state.

```typescript
function toggleNode(node: TreeNode): void
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `node` | `TreeNode` | Yes | Node to toggle |

---

## Filters

### filterRepository

Filters a repository based on filter options.

```typescript
function filterRepository(
  items: TreeItem[],
  options: FilterOptions
): TreeItem[]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items` | `TreeItem[]` | Yes | Array of tree items |
| `options` | `FilterOptions` | Yes | Filter options |

---

### filterTreeItems

Filters tree items by various criteria.

```typescript
function filterTreeItems(
  items: TreeItem[],
  options: FilterOptions
): TreeItem[]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items` | `TreeItem[]` | Yes | Array of tree items |
| `options` | `FilterOptions` | Yes | Filter options |

---

### filterTreeNodes

Filters tree nodes by various criteria.

```typescript
function filterTreeNodes(
  nodes: TreeNode[],
  options: FilterOptions
): TreeNode[]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `TreeNode[]` | Yes | Array of tree nodes |
| `options` | `FilterOptions` | Yes | Filter options |

**Example:**

```typescript
import { filterTreeNodes } from "@vetwo/repo-fetch";

// Filter by extension
const tsFiles = filterTreeNodes(nodes, { extensions: [".ts", ".tsx"] });

// Filter by glob
const srcFiles = filterTreeNodes(nodes, { glob: "src/**" });

// Filter files only
const files = filterTreeNodes(nodes, { filesOnly: true });
```

---

### filterBySearch

Filters tree items by search query.

```typescript
function filterBySearch(
  items: TreeItem[],
  query: string
): TreeItem[]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `items` | `TreeItem[]` | Yes | Array of tree items |
| `query` | `string` | Yes | Search query |

---

## Providers

### registerProvider

Registers a new provider.

```typescript
function registerProvider(name: ProviderName, provider: Provider): void
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `ProviderName` | Yes | Provider name |
| `provider` | `Provider` | Yes | Provider instance |

**Example:**

```typescript
import { registerProvider } from "@vetwo/repo-fetch";
import { MyCustomProvider } from "./my-provider";

registerProvider("custom", new MyCustomProvider());
```

---

### getProvider

Gets a registered provider by name.

```typescript
function getProvider(name: ProviderName): Provider
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `ProviderName` | Yes | Provider name |

**Returns:** Provider instance

**Throws:** `Error` if provider not registered

---

### getProviderForRepo

Gets the provider for a repository.

```typescript
function getProviderForRepo(
  repo: RepoIdentifier,
  options?: FetchOptions
): Provider
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | `RepoIdentifier` | Yes | Repository identifier |
| `options` | `FetchOptions` | No | Fetch options |

---

### getProviderFromInput

Gets the provider from a repository input string.

```typescript
async function getProviderFromInput(input: string): Promise<Provider>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | `string` | Yes | Repository input (URL or shorthand) |

---

### hasProvider

Checks if a provider is registered.

```typescript
function hasProvider(name: string): boolean
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Provider name |

---

### listProviders

Lists all registered providers.

```typescript
function listProviders(): ProviderName[]
```

**Returns:** Array of registered provider names

---

## Preview

### generatePreview

Generates a preview of a download.

```typescript
function generatePreview(
  nodes: TreeNode[],
  destination: string
): PreviewData
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `TreeNode[]` | Yes | Tree nodes |
| `destination` | `string` | Yes | Destination path |

**Returns:** `PreviewData` with files, folders, total size, and estimated time

---

### formatPreview

Formats preview data for display.

```typescript
function formatPreview(preview: PreviewData): string
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `preview` | `PreviewData` | Yes | Preview data |

**Returns:** Formatted string

---

### previewDownload

Shows an interactive download preview.

```typescript
async function previewDownload(
  nodes: TreeNode[],
  destination: string
): Promise<boolean>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodes` | `TreeNode[]` | Yes | Tree nodes |
| `destination` | `string` | Yes | Destination path |

**Returns:** `true` if confirmed, `false` if cancelled

---

## Search

### searchRepository

Searches for files in a repository.

```typescript
async function searchRepository(
  repo: RepoIdentifier,
  options: SearchOptions
): Promise<TreeItem[]>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | `RepoIdentifier` | Yes | Repository identifier |
| `options` | `SearchOptions` | Yes | Search options |

**Example:**

```typescript
import { searchRepository } from "@vetwo/repo-fetch";

const results = await searchRepository(
  { owner: "octocat", repo: "hello-world", provider: "github" },
  { query: "index", caseSensitive: false }
);
```

---

## Browser

### browseRepository

Opens an interactive repository browser.

```typescript
async function browseRepository(
  repo: RepoIdentifier,
  options?: FetchOptions
): Promise<TreeNode[]>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | `RepoIdentifier` | Yes | Repository identifier |
| `options` | `FetchOptions` | No | Fetch options |

**Returns:** Array of selected tree nodes

**Example:**

```typescript
import { browseRepository, downloadSelection } from "@vetwo/repo-fetch";

const nodes = await browseRepository(
  { owner: "octocat", repo: "hello-world", provider: "github" }
);

if (nodes.length > 0) {
  const results = await downloadSelection(
    nodes,
    { owner: "octocat", repo: "hello-world", provider: "github" },
    { output: "./download" }
  );
}
```

---

## Cache

The cache module provides an LRU cache for storing repository data.

```typescript
import { cache, CacheStore } from "@vetwo/repo-fetch";
```

**Methods:**

```typescript
// Get a cached entry
const entry = cache.get(key: string): CacheEntry | undefined;

// Set a cached entry
cache.set(key: string, data: unknown, ttl?: number): void;

// Delete a cached entry
cache.delete(key: string): boolean;

// Clear all entries
cache.clear(): void;

// Get cache statistics
const stats = cache.getStats(): { size: number; maxSize: number };

// Get all entries
const entries = cache.entries(): CacheEntry[];
```

**Example:**

```typescript
import { cache } from "@vetwo/repo-fetch";

// Cache a tree for 1 hour
const tree = await getTree(repo);
cache.set(`tree:${repo.owner}/${repo.repo}`, tree, 1000 * 60 * 60);

// Retrieve cached tree
const cached = cache.get(`tree:${repo.owner}/${repo.repo}`);
if (cached) {
  console.log("Using cached tree");
}
```

---

## Configuration

### setConfig

Sets the global configuration.

```typescript
function setConfig(config: Partial<Config>): void
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `Partial<Config>` | Yes | Configuration options |

**Example:**

```typescript
import { setConfig } from "@vetwo/repo-fetch";

setConfig({
  provider: "github",
  token: process.env.GITHUB_TOKEN,
  concurrency: 10,
  output: "./downloads",
});
```

---

### getConfig

Gets the current configuration.

```typescript
function getConfig(): Config
```

**Returns:** Current configuration object

---

### resetConfig

Resets configuration to defaults.

```typescript
function resetConfig(): void
```

---

### defineConfig

Defines and validates a configuration object.

```typescript
function defineConfig(config: Config): Config
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `Config` | Yes | Configuration to validate |

**Returns:** Validated configuration object

**Throws:** `ValidationError` if configuration is invalid

**Example:**

```typescript
import { defineConfig } from "@vetwo/repo-fetch";

const config = defineConfig({
  provider: "github",
  token: process.env.GITHUB_TOKEN,
  concurrency: 10,
  timeout: 60000,
});
```

---

## Events

The event system allows plugins to hook into the download lifecycle.

```typescript
import { globalEmitter, EventEmitter } from "@vetwo/repo-fetch";
```

**Events:**

| Event | Description |
|-------|-------------|
| `beforeBrowse` | Before repository browsing starts |
| `afterBrowse` | After repository browsing completes |
| `beforeDownload` | Before download starts |
| `afterDownload` | After download completes |
| `beforeWrite` | Before writing files |
| `afterWrite` | After writing files |
| `error` | When an error occurs |

**Methods:**

```typescript
// Subscribe to an event
globalEmitter.on("beforeDownload", (ctx) => {
  console.log("Download starting:", ctx.data);
});

// Unsubscribe from an event
globalEmitter.off("beforeDownload", handler);

// Register a plugin
globalEmitter.registerPlugin(plugin);

// Unregister a plugin
globalEmitter.unregisterPlugin(pluginName);

// Get all registered plugins
const plugins = globalEmitter.getPlugins();

// Clear all handlers
globalEmitter.clear();
```

**Example:**

```typescript
import { globalEmitter } from "@vetwo/repo-fetch";

globalEmitter.on("beforeDownload", (ctx) => {
  const { repo, items } = ctx.data;
  console.log(`Downloading ${items.length} files from ${repo.owner}/${repo.repo}`);
});

globalEmitter.on("afterDownload", (ctx) => {
  const { results } = ctx.data;
  const successful = results.filter(r => r.success).length;
  console.log(`Downloaded ${successful} files successfully`);
});
```

---

## Plugins

### BasePlugin

Abstract base class for creating plugins.

```typescript
abstract class BasePlugin implements Plugin {
  abstract name: string;
  abstract version: string;
  abstract hooks: Partial<PluginHooks>;

  register(): void;
  unregister(): void;
}
```

**Example:**

```typescript
import { BasePlugin } from "@vetwo/repo-fetch";

class MyPlugin extends BasePlugin {
  name = "my-plugin";
  version = "1.0.0";

  hooks = {
    beforeDownload: async (ctx) => {
      console.log("Download starting:", ctx.data);
    },
    afterDownload: async (ctx) => {
      console.log("Download completed:", ctx.data);
    },
  };
}

const plugin = new MyPlugin();
plugin.register();
```

---

## Progress

### ProgressTracker

Tracks download progress.

```typescript
class ProgressTracker {
  start(total: number, totalBytes: number): void;
  update(file: string, bytes: number): void;
  fail(file: string): void;
  succeed(): void;
}
```

**Example:**

```typescript
import { ProgressTracker } from "@vetwo/repo-fetch";

const tracker = new ProgressTracker();
tracker.start(10, 1024 * 1024); // 10 files, 1MB

// Update progress
tracker.update("file1.txt", 1024);

// Mark as complete
tracker.succeed();
```

---

## Resolver

### resolveRepository

Resolves a repository input string to a `RepoIdentifier`.

```typescript
function resolveRepository(input: string): RepoIdentifier
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | `string` | Yes | Repository input |

**Returns:** `RepoIdentifier` object

**Supported formats:**

- Full URL: `https://github.com/owner/repo`
- Shorthand: `owner/repo`
- With branch: `owner/repo#branch`

**Example:**

```typescript
import { resolveRepository } from "@vetwo/repo-fetch";

const repo = resolveRepository("octocat/hello-world");
// { owner: "octocat", repo: "hello-world", provider: "github" }
```

---

### parseRepositoryInput

Alias for `resolveRepository`.

```typescript
function parseRepositoryInput(input: string): RepoIdentifier
```

---

## Utilities

```typescript
import {
  normalizeRepoUrl,
  parseRepoUrl,
  estimateDownloadTime,
  formatBytes,
  formatDuration,
  formatSpeed,
  computeHash,
  isValidProvider,
  buildFullUrl,
  pathJoin,
} from "@vetwo/repo-fetch";
```

### normalizeRepoUrl

Normalizes a repository URL.

```typescript
function normalizeRepoUrl(url: string): string
```

### parseRepoUrl

Parses a repository URL into a `RepoIdentifier`.

```typescript
function parseRepoUrl(input: string): RepoIdentifier
```

### estimateDownloadTime

Estimates download time based on size and speed.

```typescript
function estimateDownloadTime(bytes: number, speedBytesPerSec: number): number
```

### formatBytes

Formats bytes to human-readable string.

```typescript
function formatBytes(bytes: number): string
```

**Example:**

```typescript
formatBytes(1024); // "1.0 KB"
formatBytes(1048576); // "1.0 MB"
```

### formatDuration

Formats milliseconds to human-readable string.

```typescript
function formatDuration(ms: number): string
```

### formatSpeed

Formats bytes per second to human-readable string.

```typescript
function formatSpeed(bytesPerSec: number): string
```

### computeHash

Computes a hash for a value.

```typescript
function computeHash(value: unknown): string
```

### isValidProvider

Checks if a provider name is valid.

```typescript
function isValidProvider(name: string): boolean
```

### buildFullUrl

Builds a full URL from base and path.

```typescript
function buildFullUrl(base: string, path: string): string
```

### pathJoin

Joins path segments.

```typescript
function pathJoin(...segments: string[]): string
```

---

## Errors

All errors extend `RepoFetchError`:

```typescript
import {
  RepoFetchError,
  RepositoryNotFoundError,
  BranchNotFoundError,
  PathNotFoundError,
  RateLimitedError,
  InvalidRepositoryError,
  InvalidURLError,
  PermissionDeniedError,
  NetworkError,
  TimeoutError,
  ValidationError,
  ProviderNotImplementedError,
} from "@vetwo/repo-fetch";
```

### RepoFetchError

Base error class with structured error information.

```typescript
class RepoFetchError extends Error {
  readonly code: string;
  readonly reason: string;
  readonly suggestion: string;
  readonly recovery: string;
  readonly docsUrl: string;
}
```

### Error Classes

| Error | Code | Description |
|-------|------|-------------|
| `RepositoryNotFoundError` | `REPOSITORY_NOT_FOUND` | Repository does not exist |
| `BranchNotFoundError` | `BRANCH_NOT_FOUND` | Branch does not exist |
| `PathNotFoundError` | `PATH_NOT_FOUND` | Path does not exist |
| `RateLimitedError` | `RATE_LIMITED` | API rate limit exceeded |
| `InvalidRepositoryError` | `INVALID_REPOSITORY` | Invalid repository reference |
| `InvalidURLError` | `INVALID_URL` | Invalid URL |
| `PermissionDeniedError` | `PERMISSION_DENIED` | Access denied |
| `NetworkError` | `NETWORK_ERROR` | Network error |
| `TimeoutError` | `TIMEOUT` | Request timeout |
| `ValidationError` | `VALIDATION_ERROR` | Validation error |
| `ProviderNotImplementedError` | `PROVIDER_NOT_IMPLEMENTED` | Provider not implemented |

**Example:**

```typescript
import { fetchFiles, RepositoryNotFoundError } from "@vetwo/repo-fetch";

try {
  await fetchFiles(repo, ["README.md"]);
} catch (error) {
  if (error instanceof RepositoryNotFoundError) {
    console.error(`Repository not found: ${error.reason}`);
    console.error(`Suggestion: ${error.suggestion}`);
    console.error(`Recovery: ${error.recovery}`);
  }
}
```

---

## Types

```typescript
import type {
  ProviderName,
  RepoIdentifier,
  TreeItem,
  TreeNode,
  DownloadItem,
  DownloadResult,
  DownloadOptions,
  FetchOptions,
  FetchFilesOptions,
  FilterOptions,
  SearchOptions,
  PreviewData,
  CacheEntry,
  ProgressData,
  ProviderConfig,
  Plugin,
  PluginHooks,
  PluginContext,
  Config,
  DoctorResult,
  EventName,
  LogLevel,
  ResolvedInput,
} from "@vetwo/repo-fetch";
```

### RepoIdentifier

```typescript
interface RepoIdentifier {
  provider: ProviderName;
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
  type?: "tree" | "blob";
  ref?: string;
}
```

### TreeItem

```typescript
interface TreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size: number;
  url: string;
}
```

### TreeNode

```typescript
interface TreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  sha: string;
  size: number;
  children: TreeNode[];
  depth: number;
  expanded: boolean;
  selected: boolean;
  parent: TreeNode | null;
}
```

### DownloadOptions

```typescript
interface DownloadOptions {
  output: string;
  overwrite?: boolean;
  merge?: boolean;
  skipExisting?: boolean;
  clean?: boolean;
  concurrency?: number;
  timeout?: number;
  retries?: number;
}
```

### FetchOptions

```typescript
interface FetchOptions {
  provider?: ProviderName;
  token?: string;
  branch?: string;
  path?: string;
  depth?: number;
  recursive?: boolean;
  cache?: boolean;
  signal?: AbortSignal;
  retries?: number;
}
```

### Config

```typescript
interface Config {
  provider?: ProviderName;
  token?: string;
  cache?: boolean;
  output?: string;
  overwrite?: boolean;
  merge?: boolean;
  skipExisting?: boolean;
  clean?: boolean;
  concurrency?: number;
  timeout?: number;
  retries?: number;
  plugins?: string[];
}
```

---

## Registry Client

### RegistryClient

Main class for interacting with the Vetwo Registry.

```typescript
import { RegistryClient } from "@vetwo/repo-fetch";

const client = new RegistryClient({ config: { baseUrl: "..." } });
```

Methods:
- `getIndex()` - Download and cache registry index
- `search(options)` - Search registry resources
- `getById(id)` - Get resource by ID
- `getManifest(id)` - Get full resource manifest
- `checkCompatibility(manifest)` - Check environment compatibility
- `resolveDependencies(manifest)` - Resolve dependency graph
- `install(resourceId, options)` - Install a resource

### searchRegistry

```typescript
function searchRegistry(index: RegistryIndex, options: SearchOptions): SearchResult[]
```

Fuzzy search with Levenshtein distance, tokenization, and keyword scoring.

### searchByCategory / searchByTag / searchByType

```typescript
function searchByCategory(index: RegistryIndex, category: string): RegistryResourceEntry[]
function searchByTag(index: RegistryIndex, tag: string): RegistryResourceEntry[]
function searchByType(index: RegistryIndex, type: ResourceType): RegistryResourceEntry[]
```

### getCategories / getTags / getPopularResources

```typescript
function getCategories(index: RegistryIndex): CategoryEntry[]
function getTags(index: RegistryIndex): TagEntry[]
function getPopularResources(index: RegistryIndex, limit?: number): RegistryResourceEntry[]
```

---

## Compatibility Engine

### detectEnvironment

```typescript
function detectEnvironment(): EnvironmentInfo
```

Detects Node/Bun/Deno version, OS, architecture, package manager, framework, and VeTwo version.

### checkCompatibility

```typescript
function checkCompatibility(manifest: ResourceManifest): CompatibilityReport
```

Checks runtime, framework, package manager, Node/Bun version, OS, architecture, and VeTwo version compatibility.

---

## Variable Engine

### resolveVariables

```typescript
function resolveVariables(manifest: ResourceManifest, context?: VariableContext): VariableResolution[]
```

Resolves variables using chain: context → env (VETWO_VAR_*) → default → prompt

### applyVariables

```typescript
function applyVariables(template: string, variables: VariableResolution[]): string
```

Replaces `{{ varName }}` patterns in template strings.

### validateVariableValue

```typescript
function validateVariableValue(variable: VariableDef, value: string | number | boolean): { valid: boolean; error?: string }
```

---

## AST Transforms

### applyTransforms

```typescript
function applyTransforms(manifest: ResourceManifest, projectPath: string, variables: VariableResolution[]): Promise<TransformResult[]>
```

Applies transforms for packageJson, tsConfig, imports, routes, config, and custom types with backup/rollback support.

---

## Integrity System

### verifyIntegrity

```typescript
function verifyIntegrity(manifest: ResourceManifest, downloadPath: string): Promise<IntegrityResult>
```

Verifies checksum, manifest schema, and downloaded files.

### computeHash / computeFileHash / computeDirectoryHash / generateChecksum

```typescript
function computeHash(data: Buffer | string, algorithm: string): string
function computeFileHash(filePath: string, algorithm?: string): Promise<string>
function computeDirectoryHash(dirPath: string, algorithm?: string): Promise<string>
function generateChecksum(filePath: string, algorithm?: "sha256" | "sha512" | "md5"): Promise<ResourceChecksum>
```

---

## Lifecycle Hooks

### executeLifecycleHooks

```typescript
function executeLifecycleHooks(manifest: ResourceManifest, context: LifecycleContext, phase: "install" | "update" | "remove" | "generate"): Promise<LifecycleResult[]>
```

Executes hooks: beforeInstall, afterInstall, beforeUpdate, afterUpdate, beforeRemove, afterRemove, beforeGenerate, afterGenerate.

### getAvailableHooks / hasHook / getHookDescription

```typescript
function getAvailableHooks(manifest: ResourceManifest): LifecycleHookName[]
function hasHook(manifest: ResourceManifest, hookName: LifecycleHookName): boolean
function getHookDescription(manifest: ResourceManifest, hookName: LifecycleHookName): string
```

---

## Installation Report

### createReport / addInstalledResource / addError / addWarning / finalizeReport / formatReport

```typescript
function createReport(): InstallationReport
function addInstalledResource(report: InstallationReport, manifest: ResourceManifest, path: string, files: string[], checksumVerified: boolean): void
function addWarning(report: InstallationReport, code: string, message: string, resource?: string): void
function addError(report: InstallationReport, code: string, message: string, resource?: string, stack?: string): void
function finalizeReport(report: InstallationReport): void
function formatReport(report: InstallationReport): string
```

---

## GitHub Repo URL Resolution

### detectRepoFromGitRemote

```typescript
function detectRepoFromGitRemote(): Promise<string | null>
```

Detects repository URL from git remote origin.

### resolveRepoUrl

```typescript
function resolveRepoUrl(options?: { envVar?: string; noPrompt?: boolean; noAutoDetect?: boolean }): Promise<string | null>
```

Resolution chain: .env → wizard prompt → auto-detect from git remote.

### fetchFromConfig

```typescript
function fetchFromConfig(options?: FetchFromConfigOptions): Promise<FetchFromConfigResult>
```

Dev dependency helper for fetching from configured repository.

---

## Registry Cache

### RegistryCache

```typescript
import { RegistryCache } from "@vetwo/repo-fetch";

const cache = new RegistryCache({ dir: "~/.vetwo/registry-cache", ttl: 3600000 });
```

Methods: `getIndex()`, `setIndex()`, `getManifest()`, `setManifest()`, `hasIndex()`, `isExpired()`, `clear()`, `getStats()`

---

## Constants

```typescript
import {
  PACKAGE_NAME,
  PACKAGE_VERSION,
  DEFAULT_OUTPUT_DIR,
  DEFAULT_TIMEOUT,
  DEFAULT_MAX_RETRIES,
  DEFAULT_CONCURRENCY,
  GITHUB_API_BASE,
  GITHUB_RAW_BASE,
  CACHE_TTL,
  MAX_FILE_SIZE,
  SUPPORTED_PROVIDERS,
} from "@vetwo/repo-fetch";
```

| Constant | Value | Description |
|----------|-------|-------------|
| `PACKAGE_NAME` | `"@vetwo/repo-fetch"` | Package name |
| `PACKAGE_VERSION` | `"0.1.0"` | Package version |
| `DEFAULT_OUTPUT_DIR` | `"./download"` | Default output directory |
| `DEFAULT_TIMEOUT` | `30000` | Default timeout (30s) |
| `DEFAULT_MAX_RETRIES` | `3` | Default retry count |
| `DEFAULT_CONCURRENCY` | `5` | Default concurrency |
| `GITHUB_API_BASE` | `"https://api.github.com"` | GitHub API base URL |
| `GITHUB_RAW_BASE` | `"https://raw.githubusercontent.com"` | GitHub raw content base URL |
| `CACHE_TTL` | `3600000` | Cache TTL (1 hour) |
| `MAX_FILE_SIZE` | `104857600` | Max file size (100MB) |
| `SUPPORTED_PROVIDERS` | `["github", "gitlab", ...]` | Supported providers |
