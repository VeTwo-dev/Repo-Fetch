import type { SUPPORTED_PROVIDERS } from "../constants";

export type ProviderName = (typeof SUPPORTED_PROVIDERS)[number];

export interface RepoIdentifier {
  provider: ProviderName;
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
  type?: "tree" | "blob";
  ref?: string;
}

export interface TreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size: number;
  url: string;
}

export interface TreeNode {
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

export interface DownloadItem {
  path: string;
  url: string;
  size: number;
  type: "file";
}

export interface DownloadResult {
  success: boolean;
  path: string;
  bytes: number;
  elapsed: number;
  error?: Error;
}

export interface DownloadOptions {
  output: string;
  overwrite?: boolean;
  merge?: boolean;
  skipExisting?: boolean;
  clean?: boolean;
  concurrency?: number;
  timeout?: number;
  retries?: number;
}

export interface FetchOptions {
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

export interface FetchFilesOptions extends FetchOptions {
  patterns?: string | string[];
  extensions?: string[];
  glob?: string;
  regex?: RegExp;
}

export interface FilterOptions {
  foldersOnly?: boolean;
  filesOnly?: boolean;
  extensions?: string[];
  glob?: string | string[];
  regex?: RegExp;
  excludeGlob?: string | string[];
  excludeRegex?: RegExp;
}

export interface SearchOptions {
  query: string;
  caseSensitive?: boolean;
  maxResults?: number;
}

export interface PreviewData {
  files: string[];
  folders: string[];
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  estimatedTime: number;
  destination: string;
}

export interface CacheEntry {
  key: string;
  data: unknown;
  etag: string | null;
  timestamp: number;
  ttl: number;
}

export interface ProgressData {
  total: number;
  completed: number;
  failed: number;
  currentFile: string;
  bytesDownloaded: number;
  totalBytes: number;
  elapsed: number;
  speed: number;
}

export interface ProviderConfig {
  name: ProviderName;
  baseUrl: string;
  apiBaseUrl: string;
  rawBaseUrl: string;
  needsToken: boolean;
  defaultBranch: string;
}

export interface Plugin {
  name: string;
  version: string;
  hooks: Partial<PluginHooks>;
}

export interface PluginHooks {
  beforeBrowse: (ctx: PluginContext) => Promise<void> | void;
  afterBrowse: (ctx: PluginContext) => Promise<void> | void;
  beforeDownload: (ctx: PluginContext) => Promise<void> | void;
  afterDownload: (ctx: PluginContext) => Promise<void> | void;
  beforeWrite: (ctx: PluginContext) => Promise<void> | void;
  afterWrite: (ctx: PluginContext) => Promise<void> | void;
  onError: (ctx: PluginContext) => Promise<void> | void;
}

export interface PluginContext {
  event: string;
  data: Record<string, unknown>;
  plugin: Plugin;
}

export interface Config {
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

export interface DoctorResult {
  internet: { status: "ok" | "error"; message: string };
  api: { status: "ok" | "error"; message: string };
  nodeVersion: { status: "ok" | "error"; message: string };
  permissions: { status: "ok" | "error"; message: string };
  output: { status: "ok" | "error"; message: string };
  cache: { status: "ok" | "error"; message: string };
}

export type EventName =
  | "beforeBrowse"
  | "afterBrowse"
  | "beforeDownload"
  | "afterDownload"
  | "beforeWrite"
  | "afterWrite"
  | "error";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type ResolvedInput =
  | { type: "full-url"; url: string; repo: RepoIdentifier }
  | { type: "shorthand"; input: string; repo: RepoIdentifier }
  | { type: "invalid"; input: string };
