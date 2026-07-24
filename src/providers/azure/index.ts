import type { Readable } from "stream";
import type { RepoIdentifier, TreeItem, FetchOptions } from "../../types";
import { ProviderNotImplementedError } from "../../errors";
import type { Provider } from "../types";

export class AzureProvider implements Provider {
  readonly name = "azure";
  readonly config = {
    baseUrl: "https://dev.azure.com",
    apiBaseUrl: "https://dev.azure.com",
    rawBaseUrl: "https://dev.azure.com",
    needsToken: true,
    defaultBranch: "main",
  };

  async getTree(_repo: RepoIdentifier, _options?: FetchOptions): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("azure");
  }
  async getFile(
    _repo: RepoIdentifier,
    _path: string,
    _options?: FetchOptions,
  ): Promise<Readable | null> {
    throw new ProviderNotImplementedError("azure");
  }
  getDownloadUrl(_repo: RepoIdentifier, _path: string, _options?: FetchOptions): string {
    throw new ProviderNotImplementedError("azure");
  }
  async resolveRepository(input: string): Promise<RepoIdentifier> {
    const { parseRepoUrl } = await import("../../utils");
    return parseRepoUrl(input);
  }
  async getDefaultBranch(_repo: RepoIdentifier, _options?: FetchOptions): Promise<string> {
    throw new ProviderNotImplementedError("azure");
  }
  async search(
    _repo: RepoIdentifier,
    _query: string,
    _options?: FetchOptions,
  ): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("azure");
  }
  async testConnection(_token?: string): Promise<boolean> {
    throw new ProviderNotImplementedError("azure");
  }
}
