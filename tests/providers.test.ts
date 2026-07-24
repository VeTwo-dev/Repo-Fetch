import { describe, it, expect } from "vitest";
import { getProvider, hasProvider, listProviders } from "../src/providers";
import { GitHubProvider } from "../src/providers/github";

describe("providers", () => {
  it("all providers are registered", () => {
    const providers = listProviders();
    expect(providers).toContain("github");
    expect(providers).toContain("gitlab");
    expect(providers).toContain("bitbucket");
    expect(providers).toContain("azure");
    expect(providers).toContain("gitea");
    expect(providers).toContain("forgejo");
  });

  it("getProvider returns correct provider", () => {
    const provider = getProvider("github");
    expect(provider).toBeInstanceOf(GitHubProvider);
    expect(provider.name).toBe("github");
  });

  it("hasProvider checks provider existence", () => {
    expect(hasProvider("github")).toBe(true);
    expect(hasProvider("unknown")).toBe(false);
  });

  it("providers have correct configs", () => {
    const github = getProvider("github");
    expect(github.config.needsToken).toBe(false);
    expect(github.config.apiBaseUrl).toContain("api.github.com");

    const gitlab = getProvider("gitlab");
    expect(gitlab.config.needsToken).toBe(true);
  });

  it("GitHubProvider has required methods", () => {
    const provider = new GitHubProvider();
    expect(provider.getTree).toBeInstanceOf(Function);
    expect(provider.getFile).toBeInstanceOf(Function);
    expect(provider.getDownloadUrl).toBeInstanceOf(Function);
    expect(provider.resolveRepository).toBeInstanceOf(Function);
    expect(provider.getDefaultBranch).toBeInstanceOf(Function);
    expect(provider.search).toBeInstanceOf(Function);
    expect(provider.testConnection).toBeInstanceOf(Function);
  });
});
