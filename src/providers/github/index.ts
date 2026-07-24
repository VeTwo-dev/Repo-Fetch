import { request } from "undici";
import type { Readable } from "stream";
import pRetry from "p-retry";
import { GITHUB_API_BASE, GITHUB_RAW_BASE } from "../../constants";
import type { RepoIdentifier, TreeItem, FetchOptions } from "../../types";
import {
  RepositoryNotFoundError,
  PathNotFoundError,
  PermissionDeniedError,
  NetworkError,
} from "../../errors";
import type { Provider } from "../types";

export class GitHubProvider implements Provider {
  readonly name = "github";
  readonly config = {
    baseUrl: "https://github.com",
    apiBaseUrl: GITHUB_API_BASE,
    rawBaseUrl: GITHUB_RAW_BASE,
    needsToken: false,
    defaultBranch: "main",
  };

  private getToken(token?: string): string | undefined {
    return token ?? process.env["GITHUB_TOKEN"] ?? process.env["REPO_FETCH_TOKEN"];
  }

  private getHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "@vetwo/repo-fetch",
    };
    const t = this.getToken(token);
    if (t) {
      headers["Authorization"] = `Bearer ${t}`;
    }
    return headers;
  }

  async getTree(repo: RepoIdentifier, options?: FetchOptions): Promise<TreeItem[]> {
    const branch = options?.branch ?? repo.branch ?? (await this.getDefaultBranch(repo, options));
    const url = `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.repo}/git/trees/${branch}?recursive=1`;

    const response = await pRetry(
      async () => {
        const res = await request(url, {
          headers: this.getHeaders(options?.token),
          signal: options?.signal,
        });

        if (res.statusCode === 404) {
          throw new RepositoryNotFoundError(repo.owner, repo.repo);
        }
        if (res.statusCode === 403) {
          throw new PermissionDeniedError(`${repo.owner}/${repo.repo}`);
        }

        const body: Record<string, unknown> = (await res.body.json()) as Record<string, unknown>;

        if (!res.statusCode.toString().startsWith("2")) {
          throw new NetworkError(
            `GitHub API returned ${res.statusCode}: ${String(body["message"] ?? "Unknown error")}`,
          );
        }

        if (!body["tree"]) {
          throw new PathNotFoundError(branch);
        }

        const rawTree = body["tree"] as Array<Record<string, unknown>>;
        return rawTree.map((item) => ({
          path: item["path"] as string,
          type: item["type"] as "blob" | "tree",
          sha: item["sha"] as string,
          size: (item["size"] as number) ?? 0,
          url: item["url"] as string,
        }));
      },
      { retries: options?.retries ?? 3 },
    );

    return response;
  }

  async getFile(
    repo: RepoIdentifier,
    path: string,
    options?: FetchOptions,
  ): Promise<Readable | null> {
    const branch = options?.branch ?? repo.branch ?? (await this.getDefaultBranch(repo, options));
    const url = `${GITHUB_RAW_BASE}/${repo.owner}/${repo.repo}/${branch}/${path}`;

    const response = await pRetry(
      async () => {
        const res = await request(url, {
          headers: this.getHeaders(options?.token),
          signal: options?.signal,
        });

        if (res.statusCode === 404) {
          return null;
        }
        if (res.statusCode === 403) {
          throw new PermissionDeniedError(path);
        }

        if (!res.statusCode.toString().startsWith("2")) {
          throw new NetworkError(`GitHub raw returned ${res.statusCode}`);
        }

        return res.body;
      },
      { retries: options?.retries ?? 3 },
    );

    return response;
  }

  getDownloadUrl(repo: RepoIdentifier, path: string, options?: FetchOptions): string {
    const branch = options?.branch ?? repo.branch ?? this.config.defaultBranch;
    return `${GITHUB_RAW_BASE}/${repo.owner}/${repo.repo}/${branch}/${path}`;
  }

  async resolveRepository(input: string): Promise<RepoIdentifier> {
    const { parseRepoUrl } = await import("../../utils");
    return parseRepoUrl(input);
  }

  async getDefaultBranch(repo: RepoIdentifier, options?: FetchOptions): Promise<string> {
    const url = `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.repo}`;

    const response = await pRetry(
      async () => {
        const res = await request(url, {
          headers: this.getHeaders(options?.token),
          signal: options?.signal,
        });

        if (res.statusCode === 404) {
          throw new RepositoryNotFoundError(repo.owner, repo.repo);
        }

        const body: Record<string, unknown> = (await res.body.json()) as Record<string, unknown>;
        return body["default_branch"] as string;
      },
      { retries: options?.retries ?? 3 },
    );

    return response;
  }

  async search(repo: RepoIdentifier, query: string, options?: FetchOptions): Promise<TreeItem[]> {
    const tree = await this.getTree(repo, options);
    const lowerQuery = query.toLowerCase();
    return tree.filter(
      (item) => item.path.toLowerCase().includes(lowerQuery) && item.type === "blob",
    );
  }

  async testConnection(token?: string): Promise<boolean> {
    try {
      const res = await request("https://api.github.com", {
        headers: this.getHeaders(token),
      });
      return res.statusCode.toString().startsWith("2");
    } catch {
      return false;
    }
  }
}
