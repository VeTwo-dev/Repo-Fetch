// Public API - @vetwo/repo-fetch
export type {
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
} from "./types";

export {
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
} from "./errors";

export { globalEmitter, EventEmitter } from "./events";

export { BasePlugin } from "./plugins";

export { Logger, logger } from "./logger";

export {
  registerProvider,
  getProvider,
  getProviderForRepo,
  getProviderFromInput,
  hasProvider,
  listProviders,
} from "./providers";
export type { Provider } from "./providers";

// Core functions
export {
  fetchRepo,
  fetchFiles,
  fetchFolders,
  downloadFile,
  downloadFolder,
  downloadSelection,
  downloadItems,
} from "./core/download";

export { fetchFromConfig, type FetchFromConfigOptions } from "./core/fetch-config";

export { browseRepository } from "./core/browser";

export {
  listRepositoryTree,
  buildTree,
  flattenTree,
  findNodeByPath,
  getSelectedNodes,
  selectAll,
  toggleNode,
} from "./core/tree";

export { filterRepository, filterTreeItems, filterTreeNodes, filterBySearch } from "./core/filters";

export { resolveRepository, parseRepositoryInput } from "./core/resolver";

export { generatePreview, formatPreview, previewDownload } from "./core/preview";

export { cache, CacheStore } from "./core/cache";

export { ProgressTracker } from "./core/progress";

export { searchRepository } from "./api/search";

export { setConfig, getConfig, resetConfig, defineConfig } from "./config";

// Registry
export { RegistryClient } from "./registry";
export { RegistryCache } from "./registry/cache";
export {
  searchRegistry,
  searchByCategory,
  searchByTag,
  searchByType,
  getCategories,
  getTags,
  getPopularResources,
} from "./registry/search";
export { DependencyResolver } from "./registry/resolver";
export { checkCompatibility, detectEnvironment } from "./registry/compatibility";
export { resolveVariables, promptVariables, applyVariables } from "./registry/variables";
export { applyTransforms } from "./registry/transforms";
export {
  verifyIntegrity,
  computeHash as computeRegistryHash,
  computeFileHash,
  computeDirectoryHash,
  generateChecksum,
} from "./registry/integrity";
export { executeLifecycleHooks, getAvailableHooks, hasHook } from "./registry/lifecycle";
export {
  createReport,
  addInstalledResource,
  addInstalledDependency,
  addWarning,
  addError,
  addSkipped,
  finalizeReport,
  formatReport,
  printReport,
} from "./registry/report";
export { RegistryIndexSchema, ResourceManifestSchema } from "./registry/schema";
export type {
  ResourceType,
  Runtime,
  Framework,
  PackageManager,
  Architecture,
  OperatingSystem,
  ResourceManifest,
  ResourceAuthor,
  ResourceEngines,
  VetwoCompatibility,
  ResourceDependency,
  ResourceConflict,
  ResourceChecksum,
  ResourceExample,
  LifecycleHookName,
  LifecycleHookDef,
  VariableDef,
  TransformDef,
  RegistryIndex,
  RegistryResourceEntry,
  CategoryEntry,
  TagEntry,
  SearchIndexEntry,
  SearchResult,
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  CompatibilityReport,
  CompatibilityCheck,
  VariableContext,
  VariableResolution,
  TransformContext,
  TransformResult,
  IntegrityResult,
  LifecycleContext,
  LifecycleResult,
  InstallationReport,
  InstalledResource,
  InstalledDependency,
  InstallationWarning,
  InstallationError,
  SkippedResource,
  RegistryConfig,
  RegistryClientOptions,
  InstallOptions,
  SearchOptions as RegistrySearchOptions,
  RegistryEventName,
  RegistryEventHandler,
} from "./registry/types";

// Utils
export {
  normalizeRepoUrl,
  parseRepoUrl,
  estimateDownloadTime,
  formatBytes,
  formatDuration,
  formatSpeed,
  isValidProvider,
  buildFullUrl,
  pathJoin,
  detectRepoFromGitRemote,
  resolveRepoUrl,
  resolveRepoIdentifier,
  type ResolveRepoUrlOptions,
} from "./utils";

// Constants
export {
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
} from "./constants";
