export type ResourceType =
  | "plugin"
  | "module"
  | "template"
  | "preset"
  | "generator"
  | "snippet"
  | "recipe"
  | "blueprint"
  | "integration"
  | "adapter"
  | "example"
  | "theme"
  | "configuration";

export type Runtime = "node" | "bun" | "deno" | "browser" | "any";

export type Framework =
  | "react"
  | "vue"
  | "svelte"
  | "angular"
  | "solid"
  | "next"
  | "nuxt"
  | "astro"
  | "express"
  | "fastify"
  | "hono"
  | "elysia"
  | "nest"
  | "any";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun" | "any";

export type Architecture = "x64" | "arm64" | "any";

export type OperatingSystem = "linux" | "darwin" | "win32" | "any";

export interface ResourceManifest {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description: string;
  type: ResourceType;
  category: string;
  tags: string[];
  keywords: string[];
  author: ResourceAuthor;
  repository: string;
  homepage: string;
  license: string;
  engines: ResourceEngines;
  vetwo: VetwoCompatibility;
  dependencies: ResourceDependency[];
  optionalDependencies: ResourceDependency[];
  peerDependencies: ResourceDependency[];
  conflicts: ResourceConflict[];
  supportedRuntimes: Runtime[];
  supportedFrameworks: Framework[];
  supportedPackageManagers: PackageManager[];
  checksum: ResourceChecksum;
  downloadPath: string;
  examples: ResourceExample[];
  documentation: string;
  screenshots: string[];
  lifecycleHooks: LifecycleHookDef[];
  variables: VariableDef[];
  transforms: TransformDef[];
  createdAt: string;
  updatedAt: string;
}

export interface ResourceAuthor {
  name: string;
  email?: string;
  url?: string;
  github?: string;
}

export interface ResourceEngines {
  node?: string;
  bun?: string;
  vetwo?: string;
}

export interface VetwoCompatibility {
  minVersion: string;
  maxVersion?: string;
  experimental?: boolean;
}

export interface ResourceDependency {
  id: string;
  version: string;
  name: string;
  type: "required" | "optional" | "peer";
}

export interface ResourceConflict {
  id: string;
  name: string;
  reason: string;
}

export interface ResourceChecksum {
  algorithm: "sha256" | "sha512" | "md5";
  value: string;
}

export interface ResourceExample {
  title: string;
  description: string;
  code?: string;
}

export interface LifecycleHookDef {
  name: LifecycleHookName;
  script: string;
  description?: string;
}

export type LifecycleHookName =
  | "beforeInstall"
  | "afterInstall"
  | "beforeUpdate"
  | "afterUpdate"
  | "beforeRemove"
  | "afterRemove"
  | "beforeGenerate"
  | "afterGenerate";

export interface VariableDef {
  name: string;
  type: "string" | "number" | "boolean" | "select";
  description: string;
  defaultValue?: string | number | boolean;
  required: boolean;
  prompt?: string;
  options?: Array<{ label: string; value: string }>;
  validate?: string;
}

export interface TransformDef {
  type: "packageJson" | "tsConfig" | "imports" | "routes" | "config" | "custom";
  target: string;
  action: "merge" | "prepend" | "append" | "replace" | "remove";
  data: unknown;
  description?: string;
}

export interface RegistryIndex {
  version: string;
  updatedAt: string;
  resources: RegistryResourceEntry[];
  categories: CategoryEntry[];
  tags: TagEntry[];
  searchIndex: SearchIndexEntry[];
}

export interface RegistryResourceEntry {
  id: string;
  name: string;
  displayName: string;
  version: string;
  type: ResourceType;
  category: string;
  tags: string[];
  description: string;
  author: string;
  license: string;
  checksum: ResourceChecksum;
  downloadPath: string;
  manifestVersion: string;
}

export interface CategoryEntry {
  id: string;
  name: string;
  displayName: string;
  description: string;
  resourceCount: number;
}

export interface TagEntry {
  name: string;
  count: number;
}

export interface SearchIndexEntry {
  id: string;
  name: string;
  displayName: string;
  description: string;
  keywords: string[];
  tags: string[];
  type: ResourceType;
  category: string;
}

export interface SearchResult {
  resource: RegistryResourceEntry;
  score: number;
  matchType: "exact" | "prefix" | "fuzzy" | "tag" | "category";
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  order: string[];
  cycles: string[][];
}

export interface DependencyNode {
  id: string;
  name: string;
  version: string;
  type: "required" | "optional" | "peer";
  resolved: boolean;
  manifest?: ResourceManifest;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: "required" | "optional" | "peer";
}

export interface CompatibilityReport {
  compatible: boolean;
  runtime: CompatibilityCheck;
  framework: CompatibilityCheck;
  packageManager: CompatibilityCheck;
  nodeVersion: CompatibilityCheck;
  bunVersion: CompatibilityCheck;
  os: CompatibilityCheck;
  architecture: CompatibilityCheck;
  vetwoVersion: CompatibilityCheck;
  warnings: string[];
  errors: string[];
}

export interface CompatibilityCheck {
  supported: boolean;
  current: string;
  required: string;
  message: string;
}

export interface VariableContext {
  projectName?: string;
  packageName?: string;
  author?: string;
  license?: string;
  organization?: string;
  repository?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface VariableResolution {
  name: string;
  value: string | number | boolean;
  source: "context" | "prompt" | "default" | "env";
}

export interface TransformContext {
  projectPath: string;
  variables: VariableResolution[];
  manifest: ResourceManifest;
}

export interface TransformResult {
  type: string;
  target: string;
  action: string;
  success: boolean;
  message: string;
  backupPath?: string;
}

export interface IntegrityResult {
  valid: boolean;
  checksumMatch: boolean;
  manifestValid: boolean;
  schemaValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface LifecycleContext {
  resource: ResourceManifest;
  projectPath: string;
  variables: VariableResolution[];
  transforms: TransformResult[];
  dependencies: DependencyGraph;
}

export interface LifecycleResult {
  hook: LifecycleHookName;
  success: boolean;
  duration: number;
  output: string;
  error?: string;
}

export interface InstallationReport {
  success: boolean;
  startTime: string;
  endTime: string;
  duration: number;
  resources: InstalledResource[];
  dependencies: InstalledDependency[];
  warnings: InstallationWarning[];
  errors: InstallationError[];
  skipped: SkippedResource[];
  compatibility: CompatibilityReport;
  integrity: IntegrityResult[];
  lifecycleResults: LifecycleResult[];
  transformResults: TransformResult[];
  installedFiles: string[];
}

export interface InstalledResource {
  id: string;
  name: string;
  version: string;
  type: ResourceType;
  path: string;
  files: string[];
  checksumVerified: boolean;
}

export interface InstalledDependency {
  id: string;
  name: string;
  version: string;
  type: "required" | "optional" | "peer";
  path: string;
}

export interface InstallationWarning {
  code: string;
  message: string;
  resource?: string;
}

export interface InstallationError {
  code: string;
  message: string;
  resource?: string;
  stack?: string;
}

export interface SkippedResource {
  id: string;
  name: string;
  reason: "incompatible" | "conflict" | "already-installed" | "peer-missing";
  details: string;
}

export interface RegistryConfig {
  baseUrl: string;
  cacheDir: string;
  cacheTtl: number;
  timeout: number;
  retries: number;
  offline: boolean;
  token?: string;
  registryPath: string;
  searchIndexPath: string;
}

export interface RegistryClientOptions {
  config?: Partial<RegistryConfig>;
  token?: string;
  offline?: boolean;
}

export interface InstallOptions {
  output: string;
  variables?: VariableContext;
  skipCompatibility?: boolean;
  skipIntegrity?: boolean;
  skipLifecycle?: boolean;
  skipTransforms?: boolean;
  overwrite?: boolean;
  dryRun?: boolean;
  force?: boolean;
  concurrency?: number;
  timeout?: number;
  retries?: number;
}

export interface SearchOptions {
  query: string;
  type?: ResourceType;
  category?: string;
  tags?: string[];
  runtime?: Runtime;
  framework?: Framework;
  packageManager?: PackageManager;
  limit?: number;
  offset?: number;
  fuzzy?: boolean;
}

export type RegistryEventName =
  | "registry:index:downloaded"
  | "registry:index:cached"
  | "registry:resource:resolved"
  | "registry:resource:downloaded"
  | "registry:dependency:resolved"
  | "registry:dependency:conflict"
  | "registry:compatibility:check"
  | "registry:compatibility:fail"
  | "registry:integrity:check"
  | "registry:integrity:fail"
  | "registry:lifecycle:hook:start"
  | "registry:lifecycle:hook:end"
  | "registry:transform:apply"
  | "registry:install:start"
  | "registry:install:progress"
  | "registry:install:complete"
  | "registry:install:error";

export type RegistryEventHandler = (data: Record<string, unknown>) => Promise<void> | void;
