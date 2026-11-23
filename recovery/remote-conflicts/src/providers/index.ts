import type { Provider } from "./types";
import type { ProviderName, RepoIdentifier, FetchOptions } from "../types";
import { GitHubProvider } from "./github";
import { GitLabProvider } from "./gitlab";
import { BitbucketProvider } from "./bitbucket";
import { AzureProvider } from "./azure";
import { GiteaProvider } from "./gitea";
import { ForgejoProvider } from "./forgejo";

const providerRegistry = new Map<ProviderName, Provider>();

export function registerProvider(name: ProviderName, provider: Provider): void {
  providerRegistry.set(name, provider);
}

export function getProvider(name: ProviderName): Provider {
  const provider = providerRegistry.get(name);
  if (!provider) {
    throw new Error(`Provider "${name}" is not registered`);
  }
  return provider;
}

export function getProviderForRepo(repo: RepoIdentifier, options?: FetchOptions): Provider {
  const name = options?.provider ?? repo.provider;
  return getProvider(name);
}

export async function getProviderFromInput(input: string): Promise<Provider> {
  const { parseRepoUrl } = await import("../utils");
  const repo = parseRepoUrl(input);
  return getProvider(repo.provider);
}

export function hasProvider(name: string): boolean {
  return providerRegistry.has(name as ProviderName);
}

export function listProviders(): ProviderName[] {
  return [...providerRegistry.keys()];
}

registerProvider("github", new GitHubProvider());
registerProvider("gitlab", new GitLabProvider());
registerProvider("bitbucket", new BitbucketProvider());
registerProvider("azure", new AzureProvider());
registerProvider("gitea", new GiteaProvider());
registerProvider("forgejo", new ForgejoProvider());

export type { Provider } from "./types";
