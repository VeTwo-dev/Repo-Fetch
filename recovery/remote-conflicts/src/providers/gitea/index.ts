import type { Readable } from "stream";
import type { RepoIdentifier, TreeItem, FetchOptions } from "../../types";
import { ProviderNotImplementedError } from "../../errors";
import type { Provider } from "../types";

export class GiteaProvider implements Provider {
  readonly name = "gitea";
  readonly config = {
    baseUrl: "https://gitea.com",
    apiBaseUrl: "https://gitea.com/api/v1",
    rawBaseUrl: "https://gitea.com",
    needsToken: true,
    defaultBranch: "main",
  };

  async getTree(_repo: RepoIdentifier, _options?: FetchOptions): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("gitea");
  }
  async getFile(
    _repo: RepoIdentifier,
    _path: string,
    _options?: FetchOptions,
  ): Promise<Readable | null> {
    throw new ProviderNotImplementedError("gitea");
  }
  getDownloadUrl(_repo: RepoIdentifier, _path: string, _options?: FetchOptions): string {
    throw new ProviderNotImplementedError("gitea");
  }
  async resolveRepository(input: string): Promise<RepoIdentifier> {
    const { parseRepoUrl } = await import("../../utils");
    return parseRepoUrl(input);
  }
  async getDefaultBranch(_repo: RepoIdentifier, _options?: FetchOptions): Promise<string> {
    throw new ProviderNotImplementedError("gitea");
  }
  async search(
    _repo: RepoIdentifier,
    _query: string,
    _options?: FetchOptions,
  ): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("gitea");
  }
  async testConnection(_token?: string): Promise<boolean> {
    throw new ProviderNotImplementedError("gitea");
  }
}
