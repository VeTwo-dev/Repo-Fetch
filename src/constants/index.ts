export const PACKAGE_NAME = "@vetwo/repo-fetch";
export const PACKAGE_VERSION = "0.1.0";
export const DEFAULT_OUTPUT_DIR = "./download";
export const DEFAULT_TIMEOUT = 30000;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_CONCURRENCY = 5;
export const GITHUB_API_BASE = "https://api.github.com";
export const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";
export const CACHE_TTL = 1000 * 60 * 60; // 1 hour
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
export const SUPPORTED_PROVIDERS = [
  "github",
  "gitlab",
  "bitbucket",
  "azure",
  "gitea",
  "forgejo",
] as const;
