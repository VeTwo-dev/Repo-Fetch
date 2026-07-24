import type { Readable } from "stream";
import type { RepoIdentifier, TreeItem, FetchOptions } from "../../types";
import { ProviderNotImplementedError } from "../../errors";
import type { Provider } from "../types";

export class GitLabProvider implements Provider {
  readonly name = "gitlab";
  readonly config = {
    baseUrl: "https://gitlab.com",
    apiBaseUrl: "https://gitlab.com/api/v4",
    rawBaseUrl: "https://gitlab.com",
    needsToken: true,
    defaultBranch: "main",
  };

  async getTree(_repo: RepoIdentifier, _options?: FetchOptions): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("gitlab");
  }
  async getFile(
    _repo: RepoIdentifier,
    _path: string,
    _options?: FetchOptions,
  ): Promise<Readable | null> {
    throw new ProviderNotImplementedError("gitlab");
  }
  getDownloadUrl(_repo: RepoIdentifier, _path: string, _options?: FetchOptions): string {
    throw new ProviderNotImplementedError("gitlab");
  }
  async resolveRepository(input: string): Promise<RepoIdentifier> {
    const { parseRepoUrl } = await import("../../utils");
    return parseRepoUrl(input);
  }
  async getDefaultBranch(_repo: RepoIdentifier, _options?: FetchOptions): Promise<string> {
    throw new ProviderNotImplementedError("gitlab");
  }
  async search(
    _repo: RepoIdentifier,
    _query: string,
    _options?: FetchOptions,
  ): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("gitlab");
  }
  async testConnection(_token?: string): Promise<boolean> {
    throw new ProviderNotImplementedError("gitlab");
  }
}
