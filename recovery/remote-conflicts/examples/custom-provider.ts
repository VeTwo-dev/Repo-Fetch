import { registerProvider, getProvider } from "@vetwo/repo-fetch";
import type { RepoIdentifier, TreeItem, FetchOptions, Provider } from "@vetwo/repo-fetch";

class GitLabProvider implements Provider {
  readonly name = "gitlab";
  readonly config = {
    baseUrl: "https://gitlab.com",
    apiBaseUrl: "https://gitlab.com/api/v4",
    rawBaseUrl: "https://gitlab.com",
    needsToken: true,
    defaultBranch: "main",
  };

  async getTree(repo: RepoIdentifier, options?: FetchOptions): Promise<TreeItem[]> {
    // Implement GitLab tree API
    const url = `${this.config.apiBaseUrl}/projects/${encodeURIComponent(
      `${repo.owner}/${repo.repo}`,
    )}/repository/tree?recursive=true&per_page=100`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${options?.token ?? ""}`,
        "User-Agent": "@vetwo/repo-fetch",
      },
    });
    const data = await response.json() as Array<Record<string, unknown>>;
    return data.map((item) => ({
      path: item.path as string,
      type: (item.type as string) === "tree" ? "tree" : "blob",
      sha: item.id as string,
      size: (item.size as number) ?? 0,
      url: "",
    }));
  }

  async getFile(repo: RepoIdentifier, path: string, options?: FetchOptions): Promise<import("stream").Readable | null> {
    // Implement GitLab file download
    const url = `${this.config.rawBaseUrl}/${repo.owner}/${repo.repo}/-/raw/${options?.branch ?? "main"}/${path}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.body as unknown as import("stream").Readable;
  }

  getDownloadUrl(repo: RepoIdentifier, path: string, options?: FetchOptions): string {
    return `${this.config.rawBaseUrl}/${repo.owner}/${repo.repo}/-/raw/${options?.branch ?? "main"}/${path}`;
  }

  async resolveRepository(input: string): Promise<RepoIdentifier> {
    // Parse GitLab URL
    const match = input.match(/gitlab\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error("Invalid GitLab URL");
    return { provider: "gitlab", owner: match[1]!, repo: match[2]! };
  }

  async getDefaultBranch(repo: RepoIdentifier): Promise<string> {
    return "main";
  }

  async search(repo: RepoIdentifier, query: string, options?: FetchOptions): Promise<TreeItem[]> {
    const tree = await this.getTree(repo, options);
    return tree.filter((item) => item.path.includes(query) && item.type === "blob");
  }

  async testConnection(token?: string): Promise<boolean> {
    try {
      const res = await fetch("https://gitlab.com/api/v4");
      return res.ok;
    } catch {
      return false;
    }
  }
}

// Register custom provider
registerProvider("gitlab", new GitLabProvider());

// Use it
const provider = getProvider("gitlab");
console.log(provider.name); // "gitlab"
