# @vetwo/repo-fetch

> **Download selected files and folders from Git repositories without cloning the entire repository.**

[![npm version](https://img.shields.io/npm/v/@vetwo/repo-fetch?style=flat-square&color=blue)](https://www.npmjs.com/package/@vetwo/repo-fetch)
[![Build Status](https://img.shields.io/github/actions/workflow/status/vetwo/repo-fetch/ci.yml?style=flat-square&label=CI)](https://github.com/vetwo/repo-fetch/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/@vetwo/repo-fetch?style=flat-square)](https://www.npmjs.com/package/@vetwo/repo-fetch)

`repo-fetch` is a partial-clone library that downloads **only** the files you select from a Git repository. It never clones. It never wastes bandwidth. It fetches exactly what you need.

- Works with **GitHub**, GitLab, Bitbucket, Azure DevOps, Gitea, Forgejo
- Beautiful **interactive browse mode** (like VSCode)
- **Multi-selection** of files and folders
- **Glob**, **regex**, and **extension** filters
- **Parallel downloads** with progress tracking
- **LRU caching** for repository trees
- **Plugin system** with lifecycle hooks
- **Vetwo Registry Client** - Full registry for plugins, modules, templates, presets, generators, snippets, recipes, blueprints, integrations, adapters, examples, themes, and configurations
- **GitHub Repo URL Resolution** - Auto-detect repo from .env, wizard prompt, or git remote
- **CLI** and **Node.js API**

---

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [CLI Usage](#cli-usage)
  - [Interactive Browse](#interactive-browse)
  - [Download](#download)
  - [Tree View](#tree-view)
  - [Search](#search)
  - [Doctor](#doctor)
  - [Cache Management](#cache-management)
- [Node.js API](#nodejs-api)
  - [Basic Usage](#basic-usage)
  - [Single File](#single-file)
  - [Multiple Files](#multiple-files)
  - [Single Folder](#single-folder)
  - [Multiple Folders](#multiple-folders)
  - [Glob Pattern](#glob-pattern)
  - [By Extension](#by-extension)
  - [Search Files](#search-files)
  - [Preview Before Download](#preview-before-download)
  - [Custom Output Directory](#custom-output-directory)
- [Supported Repository Formats](#supported-repository-formats)
- [Providers](#providers)
- [Interactive Browse Mode](#interactive-browse-mode)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
- [Filtering](#filtering)
- [Preview](#preview)
- [Download Engine](#download-engine)
- [Caching](#caching)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Plugin System](#plugin-system)
- [Vetwo Registry Client](#vetwo-registry-client)
- [GitHub Repo URL Resolution](#github-repo-url-resolution)
- [Event System](#event-system)
- [Architecture](#architecture)
- [CLI Reference](#cli-reference)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Quick Start

```bash
# Install globally
npm install -g @vetwo/repo-fetch

# Browse a repository interactively
repo-fetch browse https://github.com/user/repo

# Or download files directly
repo-fetch download user/repo --glob "**/*.ts"
```

---

## Installation

```bash
# npm
npm install @vetwo/repo-fetch

# pnpm
pnpm add @vetwo/repo-fetch

# yarn
yarn add @vetwo/repo-fetch

# bun
bun add @vetwo/repo-fetch
```

**Requirements:** Node.js >= 18.0.0

---

## CLI Usage

### Interactive Browse

The flagship feature. Opens a VSCode-like explorer for selecting files.

```bash
# Browse any repository
repo-fetch browse
repo-fetch browse https://github.com/user/repo
repo-fetch browse user/repo
repo-fetch browse user/repo#develop

# With authentication
repo-fetch browse user/repo --token ghp_xxxx
```

The browser looks like this:

```
  Repository: facebook/react

  ↑↓ Navigate  Space Select  → Expand  ← Collapse  Enter Confirm  / Search  F Filter  P Preview  A All  Esc

❯  📁 ▼ ✓ packages
   📁   ▶ react
   📁   ▶ react-dom
   📄   ○ package.json
   📄   ○ README.md
```

See [Interactive Browse Mode](#interactive-browse-mode) for full details.

### Download

Download files and folders from a repository.

```bash
# Download entire repository
repo-fetch download user/repo

# Download to a specific directory
repo-fetch download user/repo --output ./my-project

# Download with overwrite
repo-fetch download user/repo --overwrite

# Download specific branch
repo-fetch download user/repo --branch develop

# Skip confirmation prompt
repo-fetch download user/repo --yes
```

#### By Path

```bash
# Download a specific file
repo-fetch download user/repo --path package.json

# Download a specific folder
repo-fetch download user/repo --path src/components
```

#### By Glob Pattern

```bash
# Download all TypeScript files
repo-fetch download user/repo --glob "**/*.ts"

# Download with exclusions
repo-fetch download user/repo --glob "**/*.ts" --glob "!**/*.test.ts"

# Download from specific directory
repo-fetch download user/repo --glob "src/**"
```

#### By Extension

```bash
# Download specific file types
repo-fetch download user/repo --ext ts,tsx,json

# Single extension
repo-fetch download user/repo --ext md
```

### Tree View

Display the repository directory tree.

```bash
repo-fetch tree user/repo
repo-fetch tree user/repo --depth 3
repo-fetch tree user/repo --branch main
```

Output:

```
├── 📁 packages
│   ├── 📁 react
│   │   ├── 📄 index.ts
│   │   └── 📄 package.json
│   └── 📁 react-dom
│       ├── 📄 index.ts
│       └── 📄 package.json
├── 📄 package.json
└── 📄 README.md

3 directories, 7 files
```

### Search

Search for files in a repository.

```bash
repo-fetch search user/repo docker
repo-fetch search user/repo "test" --case-sensitive
repo-fetch search user/repo config --max 20
```

### Doctor

Run system diagnostics to check everything is configured correctly.

```bash
repo-fetch doctor
```

Output:

```
Running system diagnostics...

  ✔ Internet: Internet reachable (200)
  ✔ GitHub API: GitHub API reachable (rate limit remaining: 5000)
  ✔ Node.js: Node.js v20.10.0 (supported)
  ✔ Permissions: Write permissions in current directory
  ✔ Output Directory: Output directory ready: /home/user/project/download
  ✔ Cache: Cache healthy (0/500 entries)

All checks passed!
```

### Cache Management

```bash
# Show cache statistics
repo-fetch cache

# Clear all cached data
repo-fetch clear-cache
```

---

## Node.js API

### Basic Usage

```typescript
import {
  resolveRepository,
  listRepositoryTree,
  selectAll,
  downloadSelection,
} from "@vetwo/repo-fetch";

const repo = resolveRepository("user/repo");
const tree = await listRepositoryTree(repo);
selectAll(tree, true);
await downloadSelection(tree, repo, { output: "./download" });
```

### Single File

```typescript
import {
  resolveRepository,
  listRepositoryTree,
  downloadSelection,
} from "@vetwo/repo-fetch";

const repo = resolveRepository("https://github.com/user/repo");
const tree = await listRepositoryTree(repo, { branch: "main" });

const readme = tree.find((node) => node.path === "README.md");
if (readme) readme.selected = true;

await downloadSelection(tree, repo, { output: "./download" });
```

### Multiple Files

```typescript
import {
  resolveRepository,
  listRepositoryTree,
  downloadSelection,
} from "@vetwo/repo-fetch";

const repo = resolveRepository("user/repo");
const tree = await listRepositoryTree(repo);

const paths = ["package.json", "tsconfig.json", "README.md"];
for (const path of paths) {
  const node = tree.find((n) => n.path === path);
  if (node) node.selected = true;
}

await downloadSelection(tree, repo, { output: "./output", overwrite: true });
```

### Single Folder

```typescript
import {
  resolveRepository,
  listRepositoryTree,
  downloadSelection,
} from "@vetwo/repo-fetch";

const repo = resolveRepository("user/repo#main");
const tree = await listRepositoryTree(repo);

const src = tree.find((node) => node.path === "src");
if (src) src.selected = true;

await downloadSelection(tree, repo, { output: "./src-output" });
```

### Multiple Folders

```typescript
import {
  resolveRepository,
  listRepositoryTree,
  downloadSelection,
} from "@vetwo/repo-fetch";

const repo = resolveRepository("user/repo");
const tree = await listRepositoryTree(repo);

for (const folder of ["src", "templates", "config"]) {
  const node = tree.find((n) => n.path === folder);
  if (node) node.selected = true;
}

await downloadSelection(tree, repo);
```

### Glob Pattern

```typescript
import {
  resolveRepository,
  listRepositoryTree,
  filterRepository,
  downloadSelection,
} from "@vetwo/repo-fetch";

const repo = resolveRepository("user/repo");
const tree = await listRepositoryTree(repo);

const typescriptFiles = await filterRepository(tree, { glob: "**/*.ts" });
for (const node of typescriptFiles) node.selected = true;

await downloadSelection(tree, repo);
```

### By Extension

```typescript
import {
  resolveRepository,
  listRepositoryTree,
  filterRepository,
  downloadSelection,
} from "@vetwo/repo-fetch";

const repo = resolveRepository("user/repo");
const tree = await listRepositoryTree(repo);

const filtered = await filterRepository(tree, { extensions: [".ts", ".tsx"] });
for (const node of filtered) node.selected = true;

await downloadSelection(tree, repo);
```

### Search Files

```typescript
import { resolveRepository, searchRepository } from "@vetwo/repo-fetch";

const repo = resolveRepository("user/repo");
const results = await searchRepository(repo, "docker");

for (const item of results) {
  console.log(item.path);
}
```

### Preview Before Download

```typescript
import {
  resolveRepository,
  listRepositoryTree,
  selectAll,
  generatePreview,
  formatPreview,
} from "@vetwo/repo-fetch";

const repo = resolveRepository("user/repo");
const tree = await listRepositoryTree(repo);
selectAll(tree, true);

const preview = generatePreview(tree, "./download");
console.log(formatPreview(preview));
// Will download:
//   📁 src
//   📄 package.json
//   ...
//
//   Files:   42
//   Folders: 8
//   Size:    2.3 MB
//   Est.     1s
//   To:      ./download
```

### Custom Output Directory

```typescript
await downloadSelection(tree, repo, {
  output: "./custom-output",
  overwrite: true,
  concurrency: 10,
  timeout: 60000,
  retries: 5,
});
```

---

## Supported Repository Formats

`repo-fetch` accepts any of these formats:

| Format | Example |
|--------|---------|
| Full URL | `https://github.com/user/repo` |
| With branch | `https://github.com/user/repo/tree/main` |
| With path | `https://github.com/user/repo/tree/main/templates/react` |
| Blob URL | `https://github.com/user/repo/blob/main/package.json` |
| Shorthand | `user/repo` |
| With branch | `user/repo#main` |
| With branch (@) | `user/repo@develop` |
| With branch (:) | `user/repo:feature` |
| GitLab | `https://gitlab.com/user/repo` |
| Bitbucket | `https://bitbucket.org/user/repo` |
| Azure DevOps | `https://dev.azure.com/org/project/git/repo` |
| Gitea | `https://gitea.com/user/repo` |
| Forgejo | `https://codeberg.org/user/repo` |

---

## Providers

| Provider | Status | Token Required |
|----------|--------|----------------|
| GitHub | Full implementation | Optional (recommended) |
| GitLab | Architecture ready | Yes |
| Bitbucket | Architecture ready | Yes |
| Azure DevOps | Architecture ready | Yes |
| Gitea | Architecture ready | Yes |
| Forgejo | Architecture ready | Yes |

### Authentication

Set a token via environment variable or CLI flag:

```bash
# Environment variable
export REPO_FETCH_TOKEN=ghp_xxxx

# Or GitHub-specific
export GITHUB_TOKEN=ghp_xxxx

# CLI flag
repo-fetch browse user/repo --token ghp_xxxx
```

### GitHub Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Create a new token with `repo` scope (for private repos)
3. Set the token as described above

---

## Interactive Browse Mode

The browser is a fully interactive file explorer built with `@clack/prompts`.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate up/down through items |
| `→` | Expand folder (or navigate into) |
| `←` | Collapse folder (or navigate to parent) |
| `Space` | Toggle selection of current item |
| `Enter` | Confirm selection and exit browser |
| `/` | Open search mode |
| `F` | Cycle filter: None → Files only → Folders only → None |
| `P` | Preview download (shows what will be downloaded) |
| `A` | Select all items |
| `D` | Clear all selections |
| `Esc` / `q` | Cancel and exit browser |

### Multi-Selection

Select single files, multiple files, single folders, multiple folders, or any mix:

```bash
# In browse mode:
# 1. Navigate with ↑↓
# 2. Press Space to select
# 3. Navigate to next item
# 4. Press Space again
# 5. Press Enter to confirm
```

Selected folders expand to include all their children when downloading.

### Search Mode

Press `/` to enter search mode. Type a query and press Enter:

```
Search: docker

📁 docker/
📁 config/docker/
📄 docker-compose.yml
📄 Dockerfile
```

Selecting search results works exactly like the tree view.

### Filter Mode

Press `F` to cycle through filter modes:

1. **None** - Show all items (default)
2. **Files only** - Show only files
3. **Folders only** - Show only directories

### Preview

Press `P` to see what will be downloaded:

```
Will download:

  📁 src/components
  📁 src/hooks
  📁 src/utils
  📄 package.json
  📄 tsconfig.json
  📄 README.md

  Files:   42
  Folders: 8
  Size:    2.3 MB
  Est.     1s
  To:      ./download

Continue? (y/n)
```

---

## Filtering

Apply filters when using the Node.js API:

```typescript
import { filterRepository } from "@vetwo/repo-fetch";

// Filter by glob pattern
await filterRepository(tree, { glob: "**/*.ts" });

// Filter by extension
await filterRepository(tree, { extensions: [".ts", ".tsx"] });

// Filter by regex
await filterRepository(tree, { regex: /\.test\.ts$/ });

// Folders only
await filterRepository(tree, { foldersOnly: true });

// Files only
await filterRepository(tree, { filesOnly: true });

// With exclusions
await filterRepository(tree, {
  glob: "**/*.ts",
  excludeGlob: "**/*.test.ts",
});
```

---

## Preview

Generate a preview before downloading:

```typescript
import { generatePreview, formatPreview } from "@vetwo/repo-fetch";

const preview = generatePreview(tree, "./download");

// preview contains:
// {
//   files: ["src/index.ts", "package.json", ...],
//   folders: ["src", "src/components", ...],
//   totalFiles: 42,
//   totalFolders: 8,
//   totalSize: 2411724,
//   estimatedTime: 1,
//   destination: "./download"
// }

// Format for display
console.log(formatPreview(preview));
```

---

## Download Engine

The download engine features:

- **Parallel downloads** with configurable concurrency (default: 5)
- **Retry logic** with configurable retries (default: 3)
- **Progress tracking** with real-time display
- **Overwrite/merge/skip** strategies for existing files
- **Clean output** option to remove existing directory before download
- **Timeout** per file (default: 30s)

```typescript
await downloadSelection(tree, repo, {
  output: "./download",     // Output directory
  overwrite: false,         // Overwrite existing files
  merge: false,             // Merge with existing files
  skipExisting: true,       // Skip files that already exist
  clean: false,             // Clean output directory first
  concurrency: 5,           // Parallel downloads
  timeout: 30000,           // Per-file timeout in ms
  retries: 3,               // Retry failed downloads
});
```

---

## Caching

`repo-fetch` caches repository trees using an LRU cache:

- **Default TTL:** 1 hour
- **Max entries:** 500
- **Cached data:** Repository trees, ETags, download metadata

```bash
# View cache statistics
repo-fetch cache

# Clear cache
repo-fetch clear-cache
```

Programmatic cache control:

```typescript
import { cache } from "@vetwo/repo-fetch";

// Check cache
const cached = cache.get("my-repo:main");

// Clear specific entry
cache.delete("my-repo:main");

// Clear all cache
cache.clear();

// Get stats
const stats = cache.getStats();
```

---

## Error Handling

All errors extend `RepoFetchError` with structured information:

```typescript
import { RepositoryNotFoundError, RepoFetchError } from "@vetwo/repo-fetch";

try {
  await listRepositoryTree({ provider: "github", owner: "unknown", repo: "nope" });
} catch (error) {
  if (error instanceof RepositoryNotFoundError) {
    console.log(error.code);       // "REPOSITORY_NOT_FOUND"
    console.log(error.reason);     // "The repository "unknown/nope" does not exist"
    console.log(error.suggestion); // "Verify the repository name and owner"
    console.log(error.recovery);   // "Check the URL or use repo-fetch browse"
    console.log(error.docsUrl);    // "https://github.com/vetwo/repo-fetch#errors"
  }
}
```

### Error Types

| Error Class | Code | Description |
|-------------|------|-------------|
| `RepositoryNotFoundError` | `REPOSITORY_NOT_FOUND` | Repository does not exist |
| `BranchNotFoundError` | `BRANCH_NOT_FOUND` | Branch does not exist |
| `PathNotFoundError` | `PATH_NOT_FOUND` | File or folder path does not exist |
| `RateLimitedError` | `RATE_LIMITED` | API rate limit exceeded |
| `InvalidRepositoryError` | `INVALID_REPOSITORY` | Invalid repository reference |
| `InvalidURLError` | `INVALID_URL` | Invalid URL format |
| `PermissionDeniedError` | `PERMISSION_DENIED` | Access denied |
| `NetworkError` | `NETWORK_ERROR` | Network connectivity issue |
| `TimeoutError` | `TIMEOUT` | Request timed out |
| `ValidationError` | `VALIDATION_ERROR` | Invalid input value |
| `ProviderNotImplementedError` | `PROVIDER_NOT_IMPLEMENTED` | Provider not yet implemented |

### Error Recovery

Every error includes:

- **`code`** - Machine-readable error code
- **`reason`** - Human-readable explanation
- **`suggestion`** - What to try
- **`recovery`** - How to fix it
- **`docsUrl`** - Link to documentation

---

## Configuration

### Config File

Create `repo-fetch.config.ts` in your project root:

```typescript
import { defineConfig } from "@vetwo/repo-fetch";

export default defineConfig({
  provider: "github",
  token: process.env.GITHUB_TOKEN,
  cache: true,
  output: "./download",
  overwrite: false,
  merge: false,
  skipExisting: true,
  clean: false,
  concurrency: 5,
  timeout: 30000,
  retries: 3,
  plugins: ["my-plugin"],
});
```

### Programmatic Configuration

```typescript
import { setConfig, getConfig, resetConfig } from "@vetwo/repo-fetch";

// Set configuration
setConfig({
  provider: "github",
  output: "./downloads",
  cache: true,
});

// Get current configuration
const config = getConfig();

// Reset to defaults
resetConfig();
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `provider` | `ProviderName` | `"github"` | Git provider to use |
| `token` | `string` | `undefined` | Authentication token |
| `cache` | `boolean` | `true` | Enable caching |
| `output` | `string` | `"./download"` | Output directory |
| `overwrite` | `boolean` | `false` | Overwrite existing files |
| `merge` | `boolean` | `false` | Merge with existing files |
| `skipExisting` | `boolean` | `false` | Skip existing files |
| `clean` | `boolean` | `false` | Clean output before download |
| `concurrency` | `number` | `5` | Parallel download count |
| `timeout` | `number` | `30000` | Per-file timeout (ms) |
| `retries` | `number` | `3` | Retry count |
| `plugins` | `string[]` | `[]` | Plugin names |

---

## Plugin System

Extend `repo-fetch` with plugins that hook into the download lifecycle.

### Creating a Plugin

```typescript
import { BasePlugin } from "@vetwo/repo-fetch";

class LoggingPlugin extends BasePlugin {
  name = "logging-plugin";
  version = "1.0.0";

  hooks = {
    beforeDownload: async (ctx) => {
      const items = ctx.data.items as DownloadItem[];
      console.log(`Starting download of ${items.length} files`);
    },
    afterDownload: async (ctx) => {
      const results = ctx.data.results as DownloadResult[];
      const success = results.filter((r) => r.success).length;
      console.log(`Downloaded ${success} files successfully`);
    },
  };
}
```

### Registering a Plugin

```typescript
import { BasePlugin, registerPlugin } from "@vetwo/repo-fetch";

class MyPlugin extends BasePlugin {
  name = "my-plugin";
  version = "1.0.0";
  hooks = { /* ... */ };
}

const plugin = new MyPlugin();
plugin.register();
```

### Lifecycle Hooks

| Hook | When | Data |
|------|------|------|
| `beforeBrowse` | Before opening the browser | `repo`, `options` |
| `afterBrowse` | After browser closes | `repo`, `options`, `nodes` |
| `beforeDownload` | Before download starts | `repo`, `items`, `options` |
| `afterDownload` | After download completes | `repo`, `items`, `results` |
| `beforeWrite` | Before writing a file | `path`, `data` |
| `afterWrite` | After writing a file | `path`, `bytes` |
| `onError` | When any error occurs | `error`, `context` |

See [Plugin Guide](PLUGIN_GUIDE.md) for detailed documentation.

---

## Vetwo Registry Client

Full-featured registry client for discovering, installing, and managing Vetwo ecosystem resources including plugins, modules, templates, presets, generators, snippets, recipes, blueprints, integrations, adapters, examples, themes, and configurations.

### Search

```bash
# Search the registry
repo-fetch registry search <query>

# Search with options
repo-fetch registry search "react template" --category templates --tag react --limit 10
```

```typescript
import { RegistryClient } from "@vetwo/repo-fetch";

const client = new RegistryClient();
const results = await client.search("react template", {
  category: "templates",
  tag: "react",
  limit: 10,
});
```

### Install

```bash
# Install a resource from the registry
repo-fetch registry install <resource>

# Install with options
repo-fetch registry install @vetwo/my-plugin --version latest --force
```

```typescript
const result = await client.install("@vetwo/my-plugin", {
  version: "latest",
  force: true,
});
```

### Info

```bash
# Show detailed info about a resource
repo-fetch registry info <resource>
```

```typescript
const info = await client.getInfo("@vetwo/my-plugin");
console.log(info.manifest);
console.log(info.versions);
```

### List

```bash
# List all installed resources
repo-fetch registry list
```

### Compatibility Check

```bash
# Check environment compatibility
repo-fetch registry check
```

```typescript
const report = await client.checkCompatibility();
console.log(report.compatible); // boolean
console.log(report.missing);    // string[]
```

### Cache Management

```bash
# Show registry cache stats
repo-fetch registry cache

# Clear registry cache
repo-fetch registry clear-cache
```

```typescript
const stats = await client.getCacheStats();
await client.clearCache();
```

### Categories and Tags

```bash
# List all categories
repo-fetch registry categories

# List all tags
repo-fetch registry tags
```

### Node.js API

```typescript
import { RegistryClient } from "@vetwo/repo-fetch";

const client = new RegistryClient();

// Get the full registry index
const index = await client.getIndex();

// Search
const results = await client.search("template", { category: "templates" });

// Get manifest for a resource
const manifest = await client.getManifest("@vetwo/my-plugin");

// Resolve dependencies
const deps = await client.resolveDependencies("@vetwo/my-plugin");

// Install
await client.install("@vetwo/my-plugin", { version: "1.0.0" });
```

---

## GitHub Repo URL Resolution

Automatically resolve repository URLs from environment variables, wizard prompts, or git remote detection. Useful when using `repo-fetch` as a dev dependency in scaffolding tools.

### Resolution Chain

The repository URL is resolved in this order:

1. **`.env` variable** - Check for `GITHUB_REPO_URL` (configurable)
2. **Wizard prompt** - Interactive prompt asking for the URL
3. **Git remote auto-detect** - Detect from the current project's git remote

### Options

| Option | Description |
|--------|-------------|
| `--env-var <name>` | Custom environment variable name (default: `GITHUB_REPO_URL`) |
| `--no-prompt` | Skip wizard prompt |
| `--no-auto-detect` | Skip git remote auto-detection |

### CLI Usage

```bash
# Use repo-fetch browse with auto-detection
repo-fetch browse

# Use repo-fetch download with auto-detection
repo-fetch download --output ./scaffold

# Use repo-fetch tree with auto-detection
repo-fetch tree
```

### Node.js API (`fetchFromConfig`)

Use `fetchFromConfig()` as a dev dependency to fetch templates from a configurable repo:

```typescript
import { fetchFromConfig } from "@vetwo/repo-fetch";

// Resolves repo URL via .env → prompt → git remote
const result = await fetchFromConfig({
  pattern: "templates/**",
  output: "./scaffold",
  envVar: "GITHUB_REPO_URL",  // default
  prompt: true,                // default
  autoDetect: true,            // default
});
```

---

## Event System

Listen to lifecycle events:

```typescript
import { globalEmitter } from "@vetwo/repo-fetch";

globalEmitter.on("beforeDownload", async (ctx) => {
  console.log("Download starting...");
});

globalEmitter.on("afterDownload", async (ctx) => {
  console.log("Download complete!");
});
```

---

## Architecture

```
src/
├── api/                    # Public API functions
│   └── search.ts
├── cli/                    # CLI commands
│   ├── commands/
│   │   ├── browse.ts       # Interactive browser command
│   │   ├── cache.ts        # Cache statistics
│   │   ├── clear-cache.ts  # Clear cache
│   │   ├── doctor.ts       # System diagnostics
│   │   ├── download.ts     # Download command
│   │   ├── search.ts       # Search command
│   │   └── tree.ts         # Tree view command
│   └── index.ts            # CLI entry point
├── config/                 # Configuration management
│   └── index.ts
├── constants/              # Constants
│   └── index.ts
├── core/                   # Core functionality
│   ├── browser/            # Interactive browser
│   │   └── index.ts
│   ├── cache/              # LRU cache
│   │   └── index.ts
│   ├── download/           # Download engine
│   │   └── index.ts
│   ├── filters/            # File filtering
│   │   └── index.ts
│   ├── preview/            # Download preview
│   │   └── index.ts
│   ├── progress/           # Progress tracking
│   │   └── index.ts
│   ├── resolver/           # URL/input resolution
│   │   └── index.ts
│   ├── selection/          # Selection management
│   │   └── index.ts
│   └── tree/               # Repository tree
│       └── index.ts
├── errors/                 # Error classes
│   └── index.ts
├── events/                 # Event system
│   └── index.ts
├── logger/                 # Logger
│   └── index.ts
├── plugins/                # Plugin system
│   └── index.ts
├── providers/              # Git providers
│   ├── azure/              # Azure DevOps (stub)
│   ├── bitbucket/          # Bitbucket (stub)
│   ├── forgejo/            # Forgejo (stub)
│   ├── gitea/              # Gitea (stub)
│   ├── github/             # GitHub (full)
│   └── gitlab/             # GitLab (stub)
├── registry/               # Vetwo Registry Client
│   ├── index.ts            # Main RegistryClient class
│   ├── types.ts            # Registry type definitions
│   ├── cache/              # Registry index/manifest caching
│   ├── compatibility/      # Environment detection & compatibility
│   ├── core/               # Core client
│   ├── integrity/          # Checksum verification
│   ├── lifecycle/          # Lifecycle hooks
│   ├── report/             # Installation reports
│   ├── resolver/           # Dependency resolver
│   ├── schema/             # Zod validation schemas
│   ├── search/             # Fuzzy search engine
│   ├── transforms/         # AST transformations
│   └── variables/          # Template variable engine
├── core/fetch-config/      # Dev dependency fetchFromConfig()
├── types/                  # TypeScript types
│   └── index.ts
├── utils/                  # Utilities
│   └── index.ts
└── validators/             # Zod schemas
    └── index.ts
```

### Design Principles

- **Framework-agnostic** - Works with any framework or no framework
- **Modular** - Each feature is a separate module
- **Extensible** - Plugin and event systems
- **Type-safe** - Full TypeScript with strict mode
- **Provider-agnostic core** - Core knows nothing about GitHub
- **Dependency injection** - Providers are registered, not imported
- **Composition over inheritance** - Functional composition
- **Zero `any`** - Type-safe everywhere

See [Architecture](ARCHITECTURE.md) for detailed design documentation.

---

## CLI Reference

### `repo-fetch browse [repository]`

Open interactive repository browser.

**Options:**
- `-t, --token <token>` - Authentication token
- `-b, --branch <branch>` - Branch name

### `repo-fetch download [repository]`

Download files/folders from a repository.

**Options:**
- `-t, --token <token>` - Authentication token
- `-b, --branch <branch>` - Branch name
- `-o, --output <path>` - Output directory (default: `./download`)
- `--overwrite` - Overwrite existing files
- `--merge` - Merge with existing files
- `--skip-existing` - Skip existing files
- `--clean` - Clean output directory first
- `--concurrency <number>` - Download concurrency (default: 5)
- `--timeout <ms>` - Timeout per file in ms (default: 30000)
- `--retries <number>` - Retry count (default: 3)
- `--yes` - Skip confirmation
- `--path <path>` - Specific path to download
- `--glob <pattern>` - Glob pattern
- `--ext <extensions>` - File extensions (comma-separated)

### `repo-fetch tree [repository]`

Display repository tree.

**Options:**
- `-t, --token <token>` - Authentication token
- `-b, --branch <branch>` - Branch name
- `-d, --depth <depth>` - Maximum depth (default: 10)

### `repo-fetch search <repository> <query>`

Search files in repository.

**Options:**
- `-t, --token <token>` - Authentication token
- `-b, --branch <branch>` - Branch name
- `--case-sensitive` - Case-sensitive search
- `--max <number>` - Maximum results (default: 50)

### `repo-fetch doctor`

Check system health and configuration.

### `repo-fetch cache`

Show cache statistics.

### `repo-fetch clear-cache`

Clear all cached data.

### `repo-fetch registry search <query>`

Search the Vetwo registry.

**Options:**
- `-c, --category <category>` - Filter by category
- `-t, --tag <tag>` - Filter by tag
- `-l, --limit <number>` - Maximum results (default: 20)

### `repo-fetch registry install <resource>`

Install a resource from the registry.

**Options:**
- `-v, --version <version>` - Specific version (default: latest)
- `--force` - Force reinstall

### `repo-fetch registry info <resource>`

Show detailed info about a registry resource.

### `repo-fetch registry list`

List all installed registry resources.

### `repo-fetch registry check`

Check environment compatibility for registry resources.

### `repo-fetch registry cache`

Show registry cache statistics.

### `repo-fetch registry clear-cache`

Clear registry cache.

### `repo-fetch registry categories`

List all registry categories.

### `repo-fetch registry tags`

List all registry tags.

---

## API Reference

### Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `fetchRepo(repo, options?)` | Download entire repository | `Promise<DownloadResult[]>` |
| `fetchFiles(repo, paths, options?)` | Download specific files | `Promise<DownloadResult[]>` |
| `fetchFolders(repo, folders, options?)` | Download specific folders | `Promise<DownloadResult[]>` |
| `browseRepository(repo, options?)` | Open interactive browser | `Promise<TreeNode[]>` |
| `resolveRepository(input)` | Parse repository input | `RepoIdentifier` |
| `listRepositoryTree(repo, options?)` | Get repository tree | `Promise<TreeNode[]>` |
| `downloadFile(repo, path, options?)` | Download a single file | `Promise<DownloadResult>` |
| `downloadFolder(repo, path, options?)` | Download a folder | `Promise<DownloadResult[]>` |
| `downloadSelection(nodes, repo, options?)` | Download selected nodes | `Promise<DownloadResult[]>` |
| `searchRepository(repo, query, options?)` | Search files in repository | `Promise<TreeItem[]>` |
| `filterRepository(nodes, options?)` | Filter tree nodes | `Promise<TreeNode[]>` |
| `previewDownload(nodes, destination?)` | Generate download preview | `Promise<PreviewData>` |
| `generatePreview(nodes, destination?)` | Create preview data | `PreviewData` |
| `formatPreview(data)` | Format preview as string | `string` |
| `RegistryClient.getIndex()` | Get full registry index | `Promise<RegistryIndex>` |
| `RegistryClient.search(query, options?)` | Search registry resources | `Promise<SearchResult[]>` |
| `RegistryClient.getById(id)` | Get resource by ID | `Promise<RegistryResourceEntry>` |
| `RegistryClient.getManifest(id)` | Get resource manifest | `Promise<ResourceManifest>` |
| `RegistryClient.checkCompatibility()` | Check environment compatibility | `Promise<CompatibilityReport>` |
| `RegistryClient.resolveDependencies(id)` | Resolve resource dependencies | `Promise<DependencyGraph>` |
| `RegistryClient.install(id, options?)` | Install a resource | `Promise<InstallationReport>` |
| `searchRegistry(query, options?)` | Search the registry | `Promise<SearchResult[]>` |
| `searchByCategory(category)` | Search by category | `Promise<SearchResult[]>` |
| `searchByTag(tag)` | Search by tag | `Promise<SearchResult[]>` |
| `searchByType(type)` | Search by resource type | `Promise<SearchResult[]>` |
| `detectEnvironment()` | Detect runtime environment | `Promise<EnvironmentInfo>` |
| `checkCompatibility()` | Check environment compatibility | `Promise<CompatibilityReport>` |
| `resolveVariables(template, context)` | Resolve template variables | `VariableResolution` |
| `applyVariables(template, variables)` | Apply variables to template | `string` |
| `validateVariableValue(value, schema)` | Validate a variable value | `boolean` |
| `applyTransforms(source, transforms)` | Apply AST transforms | `TransformResult` |
| `verifyIntegrity(path, checksum)` | Verify file integrity | `IntegrityResult` |
| `computeHash(data)` | Compute content hash | `string` |
| `computeFileHash(path)` | Compute file hash | `Promise<string>` |
| `computeDirectoryHash(path)` | Compute directory hash | `Promise<string>` |
| `generateChecksum(data)` | Generate checksum | `string` |
| `executeLifecycleHooks(hook, context)` | Execute lifecycle hooks | `Promise<LifecycleResult>` |
| `getAvailableHooks()` | Get available hooks | `string[]` |
| `hasHook(hook)` | Check if hook exists | `boolean` |
| `getHookDescription(hook)` | Get hook description | `string` |
| `createReport(name)` | Create installation report | `InstallationReport` |
| `addInstalledResource(report, resource)` | Add resource to report | `void` |
| `addWarning(report, message)` | Add warning to report | `void` |
| `addError(report, message)` | Add error to report | `void` |
| `finalizeReport(report)` | Finalize report | `InstallationReport` |
| `formatReport(report)` | Format report as string | `string` |
| `detectRepoFromGitRemote()` | Detect repo from git remote | `Promise<string \| null>` |
| `resolveRepoUrl(options?)` | Resolve repo URL | `Promise<string>` |
| `resolveRepoIdentifier(options?)` | Resolve repo identifier | `Promise<RepoIdentifier>` |
| `fetchFromConfig(options?)` | Fetch using resolved config | `Promise<FetchConfigResult>` |

### Types

| Type | Description |
|------|-------------|
| `RepoIdentifier` | Repository reference (provider, owner, repo, branch, path) |
| `TreeItem` | Raw tree item from provider API |
| `TreeNode` | Processed tree node with selection state |
| `DownloadItem` | Item to download |
| `DownloadResult` | Result of a download operation |
| `DownloadOptions` | Download configuration |
| `FetchOptions` | Fetch configuration |
| `FilterOptions` | Filter configuration |
| `PreviewData` | Preview information |
| `Provider` | Git provider interface |
| `Plugin` | Plugin interface |
| `Config` | Configuration object |
| `ResourceManifest` | Registry resource manifest with metadata |
| `RegistryIndex` | Full registry index of all resources |
| `RegistryResourceEntry` | Individual resource entry in the index |
| `SearchResult` | Search result with resource info and score |
| `DependencyGraph` | Resolved dependency graph |
| `DependencyNode` | Individual dependency node |
| `CompatibilityReport` | Environment compatibility report |
| `VariableResolution` | Resolved template variables |
| `TransformResult` | Result of AST transformation |
| `IntegrityResult` | File integrity check result |
| `LifecycleResult` | Lifecycle hook execution result |
| `InstallationReport` | Resource installation report |
| `RegistryConfig` | Registry client configuration |
| `InstallOptions` | Installation options |
| `SearchOptions` | Registry search options |

See [API Reference](API.md) for complete documentation.

---

## Examples

### Node API Examples

- [Single File](examples/node-api.ts)
- [Multiple Files](examples/node-api.ts)
- [Single Folder](examples/node-api.ts)
- [Multiple Folders](examples/node-api.ts)
- [Glob Pattern](examples/node-api.ts)
- [By Extension](examples/node-api.ts)
- [Preview Before Download](examples/node-api.ts)

### CLI Examples

```bash
# Browse
repo-fetch browse
repo-fetch browse https://github.com/user/repo
repo-fetch browse user/repo#develop

# Download
repo-fetch download user/repo
repo-fetch download user/repo --output ./my-project
repo-fetch download user/repo --glob "**/*.ts"
repo-fetch download user/repo --ext ts,tsx,json

# Tree
repo-fetch tree user/repo
repo-fetch tree user/repo --depth 3

# Search
repo-fetch search user/repo docker

# Doctor
repo-fetch doctor

# Cache
repo-fetch cache
repo-fetch clear-cache
```

### Plugin Examples

- [Logging Plugin](examples/plugin-example.ts)
- [Custom Provider](examples/custom-provider.ts)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

---

## Security

See [SECURITY.md](SECURITY.md) for information about reporting security vulnerabilities.

---

## License

[MIT](LICENSE) © [Vetwo](https://vetwo.dev)
# repo-fetch
