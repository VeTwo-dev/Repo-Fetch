import type { Readable } from "stream";
import type { RepoIdentifier, TreeItem, FetchOptions } from "../types";

export interface Provider {
  readonly name: string;
  readonly config: {
    baseUrl: string;
    apiBaseUrl: string;
    rawBaseUrl: string;
    needsToken: boolean;
    defaultBranch: string;
  };

  getTree(repo: RepoIdentifier, options?: FetchOptions): Promise<TreeItem[]>;
  getFile(repo: RepoIdentifier, path: string, options?: FetchOptions): Promise<Readable | null>;
  getDownloadUrl(repo: RepoIdentifier, path: string, options?: FetchOptions): string;
  resolveRepository(input: string): Promise<RepoIdentifier>;
  getDefaultBranch(repo: RepoIdentifier, options?: FetchOptions): Promise<string>;
  search(repo: RepoIdentifier, query: string, options?: FetchOptions): Promise<TreeItem[]>;
  testConnection(token?: string): Promise<boolean>;
}
