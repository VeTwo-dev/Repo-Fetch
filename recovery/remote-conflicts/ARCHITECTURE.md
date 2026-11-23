# Architecture

This document describes the internal architecture of `@vetwo/repo-fetch`.

## Design Principles

### 1. Framework Agnostic

The core library has zero framework dependencies. It works with:
- Node.js (any version >= 18)
- Deno
- Bun
- Any environment supporting ESM

### 2. Provider Agnostic Core

The core download engine knows nothing about GitHub, GitLab, or any specific provider. Providers are registered via dependency injection:

```typescript
// Core only knows about the Provider interface
interface Provider {
  getTree(repo: RepoIdentifier, options?: FetchOptions): Promise<TreeItem[]>;
  getDownloadUrl(repo: RepoIdentifier, path: string, options?: FetchOptions): string;
  // ...
}

// Providers are registered at startup
registerProvider("github", new GitHubProvider());
registerProvider("gitlab", new GitLabProvider());
```

### 3. Modular Architecture

Each feature is a separate module with clear boundaries:

```
src/
├── providers/      # Git providers (GitHub, GitLab, etc.)
├── core/           # Core functionality
│   ├── tree/       # Repository tree building
│   ├── download/   # Download engine
│   ├── filters/    # File filtering
│   ├── selection/  # Selection management
│   ├── preview/    # Download preview
│   ├── cache/      # LRU caching
│   ├── browser/    # Interactive browser
│   ├── resolver/   # URL resolution
│   └── progress/   # Progress tracking
├── events/         # Event system
├── plugins/        # Plugin system
├── errors/         # Error classes
├── config/         # Configuration
├── logger/         # Logging
└── validators/     # Input validation
```

### 4. Composition Over Inheritance

The library uses functional composition rather than deep inheritance:

```typescript
// Functions compose to build functionality
const tree = await listRepositoryTree(repo);
const filtered = await filterRepository(tree, { glob: "**/*.ts" });
const preview = generatePreview(filtered);
const results = await downloadSelection(filtered, repo);
```

### 5. Type Safety

- TypeScript strict mode
- No `any` types (warned in lint)
- Zod schemas for runtime validation
- Full type exports for consumers

## Registry System Architecture

The `@vetwo/repo-fetch` package includes a full-featured Vetwo Registry Client that handles resource discovery, installation, dependency resolution, and post-install transforms.

### Registry Pipeline

```
User Request → Download Registry Index → Search/Query → Resolve Metadata →
Check Compatibility → Resolve Dependencies → Detect Conflicts →
Determine Download Path → Download Resource → Verify Checksum →
Execute Lifecycle Hooks → Apply AST Transforms → Return Installation Report
```

The `RegistryClient` class (`src/registry/index.ts`) orchestrates the entire pipeline. It never scans repositories directly — it consumes a pre-built registry index served over HTTPS.

### Registry Modules

| Module | Path | Responsibility |
|--------|------|----------------|
| `types.ts` | `src/registry/types.ts` | All type definitions: `ResourceManifest`, `RegistryIndex`, `SearchResult`, `DependencyGraph`, `CompatibilityReport`, `InstallationReport`, etc. |
| `schema/` | `src/registry/schema/` | Zod validation schemas for the registry index and resource manifests. Used at runtime to validate every network response before it enters the system. |
| `cache/` | `src/registry/cache/` | TTL-based filesystem cache (`~/.vetwo/registry-cache/`). Caches the index and individual manifests. Default TTL: 1 hour. Checks `mtime` on read; returns `null` on expiry. |
| `search/` | `src/registry/search/` | Fuzzy search engine with Levenshtein distance, tokenization, and keyword scoring. Supports exact, prefix, fuzzy, tag, and category match types. Filters by runtime, framework, package manager, type, and tags. |
| `resolver/` | `src/registry/resolver/` | Dependency resolver with topological sort (Kahn's algorithm) and cycle detection (DFS with visited/visiting sets). Produces a `DependencyGraph` with nodes, edges, install order, and detected cycles. |
| `compatibility/` | `src/registry/compatibility/` | Environment detection (Node, Bun, Deno, OS, architecture, package manager, framework) and compatibility checking against a manifest's engine requirements, supported runtimes, frameworks, and Vetwo version. |
| `variables/` | `src/registry/variables/` | Template variable resolution with a four-source chain: context → env (`VETWO_VAR_*`) → default → prompt. Supports string, number, boolean, and select types. Uses `@clack/prompts` for interactive input. |
| `transforms/` | `src/registry/transforms/` | AST transformations for `package.json`, `tsconfig.json`, imports, routes, config files, and custom transforms. Actions include merge, prepend, append, replace, and remove. Creates `.bak` backups before modifying files. |
| `integrity/` | `src/registry/integrity/` | SHA-256, SHA-512, and MD5 checksum verification. Verifies individual files and directories. Also validates the manifest schema itself. Warns when MD5 is used. |
| `lifecycle/` | `src/registry/lifecycle/` | 8 lifecycle hooks: `beforeInstall`, `afterInstall`, `beforeUpdate`, `afterUpdate`, `beforeRemove`, `afterRemove`, `beforeGenerate`, `afterGenerate`. Executes scripts via `execSync` with resource metadata injected as environment variables. |
| `report/` | `src/registry/report/` | Typed installation report generation and formatting. Tracks installed resources, dependencies, warnings, errors, skipped items, compatibility results, integrity checks, lifecycle results, and transform results. |

### Key Design Decisions

- **Registry never scans the repository directly.** It consumes a pre-built `RegistryIndex` JSON served from `registry.vetwo.dev`. This decouples discovery from hosting.
- **Plugin-first architecture** with extensible providers (for search/resolution) and hook points (lifecycle, transforms).
- **TypeScript strict mode** with zero `any` types. All network responses are validated through Zod schemas before use.
- **Tree-shakable ESM exports.** Each module is independently importable.
- **100% typed APIs.** Every public function and class has full TypeScript type coverage.

### Offline Mode

The registry client supports an offline mode (`RegistryConfig.offline`). When enabled, it serves cached index and manifest data without making network requests. If no cache exists, it throws a `NetworkError`.

```typescript
const client = new RegistryClient({ offline: true });
```

## GitHub Repo URL Resolution

Repository URLs are resolved through a three-step fallback chain implemented in `resolveRepoUrl()` (`src/utils/index.ts`):

```
Resolution Chain:
1. .env file (GITHUB_REPO_URL) → parse and use
2. Auto-detect from git remote → extract origin URL (HTTPS or SSH)
3. Interactive wizard prompt → user provides URL
```

### Resolution Steps

1. **Environment variable** — Reads `GITHUB_REPO_URL` (configurable via `envVar` option). Normalizes the URL and validates it before using.
2. **Git remote auto-detection** — Runs `git remote get-url origin`, parses both HTTPS (`https://github.com/owner/repo`) and SSH (`git@github.com:owner/repo`) formats, and converts to a normalized HTTPS URL.
3. **Interactive prompt** — Uses `@clack/prompts` to ask the user for a repository URL or shorthand (e.g., `user/repo`).

Each step can be individually enabled or disabled:

```typescript
const url = await resolveRepoUrl({
  envVar: "GITHUB_REPO_URL",  // environment variable name
  autoDetect: true,             // try git remote
  prompt: true,                 // interactive fallback
});
```

### Dev Dependency Pattern

The `fetchFromConfig()` function (`src/core/fetch-config/index.ts`) enables usage as a dev dependency with zero configuration:

```typescript
import { fetchFromConfig } from "@vetwo/repo-fetch/core/fetch-config";

const result = await fetchFromConfig({
  output: "./templates",
  folders: ["src/components"],
});
```

It resolves the repository URL through the same chain, then delegates to `fetchRepo()`, `fetchFiles()`, or `fetchFolders()` depending on the options provided. If no URL can be resolved, it throws with a clear error message suggesting all three resolution methods.

## Dependency Resolution

The `DependencyResolver` class (`src/registry/resolver/index.ts`) resolves the full dependency tree for a resource.

### Topological Sort

Uses Kahn's algorithm to produce an installation order that respects all dependency constraints:

1. Compute in-degree for each node
2. Initialize queue with zero-degree nodes
3. Process queue, decrementing neighbor in-degrees
4. Result is a linearized install order

### Cycle Detection

Uses DFS with two sets (`visited` and `visiting`) to detect cycles during traversal. When a node in `visiting` is encountered again, the current DFS path is recorded as a cycle. The `install()` method aborts with a `CIRCULAR_DEPENDENCY` error if any cycles are found.

### Conflict Resolution

The manifest declares explicit conflicts (`ResourceConflict[]`). After resolution, the resolver checks each conflict against resolved nodes. Conflicting resources are treated as cycles and prevent installation.

### Dependency Types

- **Required** — Must be installed. Missing required dependencies abort installation.
- **Optional** — Installed if available. Missing optional dependencies are skipped.
- **Peer** — Expected to be provided by the host project. Missing peer dependencies are reported as warnings.

## Variable Resolution

The `variables/` module resolves template variables through a four-source chain:

```
context → env (VETWO_VAR_*) → default → prompt
```

1. **Context** — Values passed programmatically via `VariableContext` (e.g., `projectName`, `author`).
2. **Environment** — Variables prefixed with `VETWO_VAR_` are checked. Names are normalized to uppercase with underscores (e.g., `userName` → `VETWO_VAR_USERNAME`). Values are cast to the declared type (string, number, boolean).
3. **Default** — The `defaultValue` declared in the manifest's `VariableDef`.
4. **Prompt** — Interactive prompt via `@clack/prompts`. Supports `text`, `confirm`, and `select` input types. Only triggered for variables that remain unresolved after the first three sources.

Resolved variables use `{{ variableName }}` template syntax in transforms and are applied via regex replacement.

## Installation Report

The `InstallationReport` (`src/registry/types.ts`) is a comprehensive, typed record of everything that happened during an installation:

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Overall success status (set to `false` on any error) |
| `startTime` / `endTime` | `string` | ISO 8601 timestamps |
| `duration` | `number` | Total time in milliseconds |
| `resources` | `InstalledResource[]` | Successfully installed resources with path, files, and checksum verification status |
| `dependencies` | `InstalledDependency[]` | Resolved and installed dependencies with type and path |
| `warnings` | `InstallationWarning[]` | Non-fatal issues (compatibility warnings, failed transforms, failed lifecycle hooks) |
| `errors` | `InstallationError[]` | Fatal errors with codes, messages, and optional stack traces |
| `skipped` | `SkippedResource[]` | Resources skipped due to incompatibility, conflicts, already-installed, or missing peer dependencies |
| `compatibility` | `CompatibilityReport` | Full environment compatibility check results |
| `integrity` | `IntegrityResult[]` | Checksum and manifest schema verification results |
| `lifecycleResults` | `LifecycleResult[]` | Per-hook success/failure, duration, and output |
| `transformResults` | `TransformResult[]` | Per-transform success/failure, type, target, action, and backup path |

The report is finalized by `finalizeReport()` which stamps the end time and computes duration. `formatReport()` produces a human-readable text summary, and `printReport()` outputs it to the console.

## Data Flow

### 1. Input Resolution

```
User Input → resolveRepository() → RepoIdentifier
```

The resolver parses various input formats into a normalized `RepoIdentifier`:

```typescript
interface RepoIdentifier {
  provider: "github" | "gitlab" | "bitbucket" | "azure" | "gitea" | "forgejo";
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
}
```

### 2. Tree Loading

```
RepoIdentifier → provider.getTree() → TreeItem[] → buildTree() → TreeNode[]
```

- Provider fetches raw tree from Git API (e.g., GitHub Trees API)
- `buildTree()` converts flat items into hierarchical `TreeNode[]`
- Tree is cached via LRU cache

### 3. Selection

```
TreeNode[] → User Selection → Selected Nodes
```

- User selects nodes via browser or programmatic API
- Selection propagates to children (folders expand to all files)

### 4. Download

```
Selected Nodes → provider.getDownloadUrl() → HTTP Request → File Write
```

- Each selected node gets a download URL from the provider
- Downloads run in parallel with configurable concurrency
- Progress is tracked and displayed via spinner

## Provider System

### Provider Interface

```typescript
interface Provider {
  name: string;
  config: ProviderConfig;
  getTree(repo: RepoIdentifier, options?: FetchOptions): Promise<TreeItem[]>;
  getFile(repo: RepoIdentifier, path: string, options?: FetchOptions): Promise<Readable | null>;
  getDownloadUrl(repo: RepoIdentifier, path: string, options?: FetchOptions): string;
  resolveRepository(input: string): Promise<RepoIdentifier>;
  getDefaultBranch(repo: RepoIdentifier, options?: FetchOptions): Promise<string>;
  search(repo: RepoIdentifier, query: string, options?: FetchOptions): Promise<TreeItem[]>;
  testConnection(token?: string): Promise<boolean>;
}
```

### GitHub Implementation

The GitHub provider uses:

1. **Git Trees API** - Recursive tree listing
   - Endpoint: `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
   - Returns flat list of all files and directories

2. **Raw Content URLs** - Direct file downloads
   - Pattern: `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`
   - Efficient single-file downloads

3. **Contents API** - Not used (Trees API is more efficient)

### Other Providers (Architecture Ready)

All stub providers implement the `Provider` interface but throw `ProviderNotImplementedError`:

```typescript
class GitLabProvider implements Provider {
  async getTree(repo: RepoIdentifier, options?: FetchOptions): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("gitlab");
  }
  // ...
}
```

## Event System

The event system provides lifecycle hooks:

```typescript
// Types
type EventName = 
  | "beforeBrowse" | "afterBrowse"
  | "beforeDownload" | "afterDownload"
  | "beforeWrite" | "afterWrite"
  | "error";

interface PluginContext {
  event: string;
  data: Record<string, unknown>;
  plugin: Plugin;
}

// Usage
globalEmitter.on("beforeDownload", async (ctx) => {
  console.log("Download starting...");
});
```

## Plugin System

Plugins extend functionality via lifecycle hooks:

```typescript
interface Plugin {
  name: string;
  version: string;
  hooks: Partial<PluginHooks>;
}

interface PluginHooks {
  beforeBrowse: (ctx: PluginContext) => Promise<void> | void;
  afterBrowse: (ctx: PluginContext) => Promise<void> | void;
  beforeDownload: (ctx: PluginContext) => Promise<void> | void;
  afterDownload: (ctx: PluginContext) => Promise<void> | void;
  beforeWrite: (ctx: PluginContext) => Promise<void> | void;
  afterWrite: (ctx: PluginContext) => Promise<void> | void;
  onError: (ctx: PluginContext) => Promise<void> | void;
}
```

## Error Handling

All errors extend `RepoFetchError`:

```typescript
class RepoFetchError extends Error {
  code: string;           // Machine-readable code
  reason: string;         // Human-readable explanation
  suggestion: string;     // What to try
  recovery: string;       // How to fix it
  docsUrl: string;        // Link to documentation
}
```

## Caching Strategy

- **LRU Cache** with configurable TTL (default: 1 hour)
- **Key**: Repository identifier + branch
- **Value**: Tree data + ETag
- **Invalidation**: TTL-based, manual clear via CLI

## Download Engine

### Parallelism

```typescript
// Configurable concurrency (default: 5)
const limit = pLimit(concurrency);

// Downloads run in parallel
const tasks = items.map((item) =>
  limit(async () => downloadSingleFile(item))
);
await Promise.all(tasks);
```

### Retry Logic

```typescript
// Configurable retries (default: 3)
const response = await pRetry(
  async () => fetch(url),
  { retries: 3 }
);
```

### Progress Tracking

- Spinner-based progress display
- Real-time bytes/second calculation
- File count and completion percentage

## Browser Implementation

The interactive browser uses `@clack/prompts` for terminal UI:

### Tree Navigation

- Maintains cursor position
- Supports expand/collapse
- Keyboard shortcuts for navigation

### Search Mode

- Real-time filtering
- Maintains selection state
- Returns to tree view on selection

### Filter Modes

- None: Show all items
- Files only: Filter out directories
- Folders only: Filter out files

## Validation

Zod schemas validate all inputs:

```typescript
const RepoIdentifierSchema = z.object({
  provider: z.enum(["github", "gitlab", "bitbucket", "azure", "gitea", "forgejo"]),
  owner: z.string().min(1).max(255),
  repo: z.string().min(1).max(255),
  branch: z.string().optional(),
  path: z.string().optional(),
});
```

## Performance Considerations

1. **Tree Caching**: Reduces API calls
2. **Parallel Downloads**: Maximizes throughput
3. **Selective Fetching**: Only downloads what's needed
4. **Minimal Dependencies**: Fast install times
5. **ESM + CJS**: Works everywhere

## Security Considerations

1. **Token Handling**: Never logged or exposed
2. **Input Validation**: All inputs validated via Zod
3. **Path Traversal**: Protected against
4. **Rate Limiting**: Automatic retry with backoff
5. **Timeout Protection**: Prevents hanging requests

## Future Considerations

- WebSocket support for real-time updates
- Resume interrupted downloads
- Delta updates (only changed files)
- Git LFS support
- Private GitLab/Bitbucket providers
