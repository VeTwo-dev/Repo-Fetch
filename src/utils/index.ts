import { hash } from "ohash";
import { execSync } from "child_process";
import type { RepoIdentifier, ResolvedInput } from "../types";

export function normalizeRepoUrl(input: string): ResolvedInput {
  const trimmedInput = input.trim();

  // Full URL patterns
  const githubFull =
    /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/#@:]+)(?:\/(?:tree|blob)\/([^/]+)(?:\/(.+))?)?(?:\?.*)?$/;
  const gitlabFull = /^https?:\/\/(?:www\.)?gitlab\.com\/([^/]+)\/([^/#@:]+)/;
  const bitbucketFull = /^https?:\/\/(?:www\.)?bitbucket\.org\/([^/]+)\/([^/#@:]+)/;
  const azureFull = /^https?:\/\/(?:dev\.azure\.com\/([^/]+)\/([^/]+)\/git\/([^/#@:]+))/;
  const giteaFull = /^https?:\/\/(?:www\.)?gitea\.com\/([^/]+)\/([^/#@:]+)/;
  const forgejoFull = /^https?:\/\/(?:www\.)?codeberg\.org\/([^/]+)\/([^/#@:]+)/;

  // Shorthand patterns: user/repo, user/repo#branch, user/repo@branch, user/repo:branch
  const shorthand = /^([\w.-]+)\/([\w.-]+)(?:[#@:](\w[\w.-]*))?$/;

  const match = (
    pattern: RegExp,
    provider: string,
    ownerIdx: number,
    repoIdx: number,
    branchIdx?: number,
    pathIdx?: number,
  ): RepoIdentifier | null => {
    const m = trimmedInput.match(pattern);
    if (!m) {
      return null;
    }
    const result: RepoIdentifier = {
      provider: provider as RepoIdentifier["provider"],
      owner: m[ownerIdx] as string,
      repo: m[repoIdx] as string,
    };
    if (branchIdx !== undefined && m[branchIdx]) {
      result.branch = m[branchIdx] as string;
    }
    if (pathIdx !== undefined && m[pathIdx]) {
      result.path = m[pathIdx] as string;
    }
    return result;
  };

  let repo: RepoIdentifier | null;

  repo = match(githubFull, "github", 1, 2, 3, 4);
  if (repo) {
    return { type: "full-url", url: trimmedInput, repo };
  }

  repo = match(gitlabFull, "gitlab", 1, 2);
  if (repo) {
    return { type: "full-url", url: trimmedInput, repo };
  }

  repo = match(bitbucketFull, "bitbucket", 1, 2);
  if (repo) {
    return { type: "full-url", url: trimmedInput, repo };
  }

  repo = match(azureFull, "azure", 1, 3);
  if (repo) {
    return { type: "full-url", url: trimmedInput, repo };
  }

  repo = match(giteaFull, "gitea", 1, 2);
  if (repo) {
    return { type: "full-url", url: trimmedInput, repo };
  }

  repo = match(forgejoFull, "forgejo", 1, 2);
  if (repo) {
    return { type: "full-url", url: trimmedInput, repo };
  }

  const sm = trimmedInput.match(shorthand);
  if (sm) {
    repo = {
      provider: "github",
      owner: sm[1] as string,
      repo: sm[2] as string,
    };
    if (sm[3]) {
      repo.branch = sm[3] as string;
    }
    return { type: "shorthand", input: trimmedInput, repo };
  }

  return { type: "invalid", input: trimmedInput };
}

export function parseRepoUrl(url: string): RepoIdentifier {
  const resolved = normalizeRepoUrl(url);
  if (resolved.type === "invalid") {
    throw new Error(`Invalid repository URL: ${url}`);
  }
  return resolved.repo;
}

export function estimateDownloadTime(
  totalBytes: number,
  avgSpeed: number = 5 * 1024 * 1024,
): number {
  return Math.ceil(totalBytes / avgSpeed);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(1)} ${units[i] as string}`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function computeHash(data: string): string {
  return hash(data);
}

export function isValidProvider(provider: string): boolean {
  const valid = ["github", "gitlab", "bitbucket", "azure", "gitea", "forgejo"];
  return valid.includes(provider);
}

export function buildFullUrl(repo: RepoIdentifier): string {
  switch (repo.provider) {
    case "github":
      return `https://github.com/${repo.owner}/${repo.repo}`;
    case "gitlab":
      return `https://gitlab.com/${repo.owner}/${repo.repo}`;
    case "bitbucket":
      return `https://bitbucket.org/${repo.owner}/${repo.repo}`;
    case "azure":
      return `https://dev.azure.com/${repo.owner}/${repo.repo}`;
    case "gitea":
      return `https://gitea.com/${repo.owner}/${repo.repo}`;
    case "forgejo":
      return `https://codeberg.org/${repo.owner}/${repo.repo}`;
    default:
      return `https://github.com/${repo.owner}/${repo.repo}`;
  }
}

export function pathJoin(...parts: string[]): string {
  return parts.filter(Boolean).join("/");
}

export function simpleGlobMatch(pattern: string, str: string): boolean {
  let regexStr = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i] as string;
    if (ch === "*" && pattern[i + 1] === "*") {
      regexStr += ".*";
      i++;
    } else if (ch === "*") {
      regexStr += "[^/]*";
    } else if (ch === "?") {
      regexStr += ".";
    } else if (ch === ".") {
      regexStr += "\\.";
    } else {
      regexStr += ch;
    }
  }
  return new RegExp(`^${regexStr}$`).test(str);
}

export function detectRepoFromGitRemote(cwd?: string): string | null {
  try {
    const remote = execSync("git remote get-url origin", {
      cwd,
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    if (!remote) {
      return null;
    }

    const httpsMatch = remote.match(
      /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/#@:.]+)(?:\.git)?$/,
    );
    if (httpsMatch) {
      return `https://github.com/${httpsMatch[1]}/${httpsMatch[2]}`;
    }

    const sshMatch = remote.match(/^git@github\.com:([^/]+)\/([^/#@:.]+)(?:\.git)?$/);
    if (sshMatch) {
      return `https://github.com/${sshMatch[1]}/${sshMatch[2]}`;
    }

    return null;
  } catch {
    return null;
  }
}

export interface ResolveRepoUrlOptions {
  envVar?: string;
  prompt?: boolean;
  autoDetect?: boolean;
  cwd?: string;
}

export async function resolveRepoUrl(options?: ResolveRepoUrlOptions): Promise<string | null> {
  const envVarName = options?.envVar ?? "GITHUB_REPO_URL";
  const shouldPrompt = options?.prompt !== false;
  const shouldAutoDetect = options?.autoDetect !== false;

  const envUrl = process.env[envVarName];
  if (envUrl) {
    const normalized = normalizeRepoUrl(envUrl);
    if (normalized.type !== "invalid") {
      return envUrl;
    }
  }

  if (shouldAutoDetect) {
    const detected = detectRepoFromGitRemote(options?.cwd);
    if (detected) {
      return detected;
    }
  }

  if (shouldPrompt) {
    const prompts = await import("@clack/prompts");
    const result = await prompts.text({
      message: "Enter repository URL or shorthand (e.g., user/repo):",
      placeholder: "https://github.com/user/repo",
    });
    if (typeof result === "string" && result.trim()) {
      return result.trim();
    }
  }

  return null;
}

export async function resolveRepoIdentifier(
  options?: ResolveRepoUrlOptions,
): Promise<RepoIdentifier | null> {
  const url = await resolveRepoUrl(options);
  if (!url) {
    return null;
  }
  const normalized = normalizeRepoUrl(url);
  if (normalized.type === "invalid") {
    return null;
  }
  return normalized.repo;
}
