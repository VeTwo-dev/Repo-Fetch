import type { RepoIdentifier, DownloadResult, DownloadOptions, FetchOptions } from "../../types";
import { resolveRepoIdentifier, type ResolveRepoUrlOptions } from "../../utils";
import { fetchFiles, fetchFolders, fetchRepo } from "../download";

export interface FetchFromConfigOptions
  extends DownloadOptions, FetchOptions, ResolveRepoUrlOptions {
  repoUrl?: string;
  files?: string[];
  folders?: string[];
  fetchAll?: boolean;
}

export async function fetchFromConfig(options?: FetchFromConfigOptions): Promise<DownloadResult[]> {
  let repo: RepoIdentifier;

  if (options?.repoUrl) {
    const { normalizeRepoUrl } = await import("../../utils");
    const normalized = normalizeRepoUrl(options.repoUrl);
    if (normalized.type === "invalid") {
      throw new Error(`Invalid repository URL: ${options.repoUrl}`);
    }
    repo = normalized.repo;
  } else {
    const resolved = await resolveRepoIdentifier({
      envVar: options?.envVar,
      prompt: options?.prompt,
      autoDetect: options?.autoDetect,
      cwd: options?.cwd,
    });
    if (!resolved) {
      throw new Error(
        "No repository URL provided. Set GITHUB_REPO_URL in .env, pass repoUrl, or ensure git remote is configured.",
      );
    }
    repo = resolved;
  }

  const fetchOptions: DownloadOptions & FetchOptions = {
    output: options?.output ?? "./download",
    overwrite: options?.overwrite,
    merge: options?.merge,
    skipExisting: options?.skipExisting,
    clean: options?.clean,
    concurrency: options?.concurrency,
    timeout: options?.timeout,
    retries: options?.retries,
    token: options?.token,
    branch: options?.branch,
    cache: options?.cache,
  };

  if (options?.fetchAll) {
    return fetchRepo(repo, fetchOptions);
  }

  if (options?.files && options.files.length > 0) {
    return fetchFiles(repo, options.files, fetchOptions);
  }

  if (options?.folders && options.folders.length > 0) {
    return fetchFolders(repo, options.folders, fetchOptions);
  }

  return fetchRepo(repo, fetchOptions);
}
