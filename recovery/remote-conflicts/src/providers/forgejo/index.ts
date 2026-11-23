import type { Readable } from "stream";
import type { RepoIdentifier, TreeItem, FetchOptions } from "../../types";
import { ProviderNotImplementedError } from "../../errors";
import type { Provider } from "../types";

export class ForgejoProvider implements Provider {
  readonly name = "forgejo";
  readonly config = {
    baseUrl: "https://codeberg.org",
    apiBaseUrl: "https://codeberg.org/api/v1",
    rawBaseUrl: "https://codeberg.org",
    needsToken: true,
    defaultBranch: "main",
  };

  async getTree(_repo: RepoIdentifier, _options?: FetchOptions): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("forgejo");
  }
  async getFile(
    _repo: RepoIdentifier,
    _path: string,
    _options?: FetchOptions,
  ): Promise<Readable | null> {
    throw new ProviderNotImplementedError("forgejo");
  }
  getDownloadUrl(_repo: RepoIdentifier, _path: string, _options?: FetchOptions): string {
    throw new ProviderNotImplementedError("forgejo");
  }
  async resolveRepository(input: string): Promise<RepoIdentifier> {
    const { parseRepoUrl } = await import("../../utils");
    return parseRepoUrl(input);
  }
  async getDefaultBranch(_repo: RepoIdentifier, _options?: FetchOptions): Promise<string> {
    throw new ProviderNotImplementedError("forgejo");
  }
  async search(
    _repo: RepoIdentifier,
    _query: string,
    _options?: FetchOptions,
  ): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("forgejo");
  }
  async testConnection(_token?: string): Promise<boolean> {
    throw new ProviderNotImplementedError("forgejo");
  }
}
