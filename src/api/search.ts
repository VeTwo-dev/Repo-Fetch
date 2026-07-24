import type { RepoIdentifier, TreeItem, FetchOptions } from "../types";
import { getProvider } from "../providers";

export async function searchRepository(
  repo: RepoIdentifier,
  query: string,
  options?: FetchOptions,
): Promise<TreeItem[]> {
  const provider = getProvider(repo.provider);
  return provider.search(repo, query, options);
}
