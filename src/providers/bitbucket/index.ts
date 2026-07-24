import type { Readable } from "stream";
import type { RepoIdentifier, TreeItem, FetchOptions } from "../../types";
import { ProviderNotImplementedError } from "../../errors";
import type { Provider } from "../types";

export class BitbucketProvider implements Provider {
  readonly name = "bitbucket";
  readonly config = {
    baseUrl: "https://bitbucket.org",
    apiBaseUrl: "https://api.bitbucket.org/2.0",
    rawBaseUrl: "https://bitbucket.org",
    needsToken: true,
    defaultBranch: "main",
  };

  async getTree(_repo: RepoIdentifier, _options?: FetchOptions): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("bitbucket");
  }
  async getFile(
    _repo: RepoIdentifier,
    _path: string,
    _options?: FetchOptions,
  ): Promise<Readable | null> {
    throw new ProviderNotImplementedError("bitbucket");
  }
  getDownloadUrl(_repo: RepoIdentifier, _path: string, _options?: FetchOptions): string {
    throw new ProviderNotImplementedError("bitbucket");
  }
  async resolveRepository(input: string): Promise<RepoIdentifier> {
    const { parseRepoUrl } = await import("../../utils");
    return parseRepoUrl(input);
  }
  async getDefaultBranch(_repo: RepoIdentifier, _options?: FetchOptions): Promise<string> {
    throw new ProviderNotImplementedError("bitbucket");
  }
  async search(
    _repo: RepoIdentifier,
    _query: string,
    _options?: FetchOptions,
  ): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("bitbucket");
  }
  async testConnection(_token?: string): Promise<boolean> {
    throw new ProviderNotImplementedError("bitbucket");
  }
}
