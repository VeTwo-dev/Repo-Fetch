# Provider Guide

Complete guide to understanding and implementing providers in `@vetwo/repo-fetch`.

## Table of Contents

- [Overview](#overview)
- [Built-in Providers](#built-in-providers)
- [Provider Interface](#provider-interface)
- [Implementing a Custom Provider](#implementing-a-custom-provider)
- [Registering a Provider](#registering-a-provider)
- [Provider Configuration](#provider-configuration)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Testing Your Provider](#testing-your-provider)
- [Examples](#examples)

---

## Overview

Providers are the core abstraction for interacting with different Git hosting services. Each provider implements the `Provider` interface to handle repository operations like fetching trees, downloading files, and resolving repositories.

---

## Built-in Providers

| Provider | Status | API | Raw URLs | Token Required |
|----------|--------|-----|----------|----------------|
| GitHub | ✅ Fully Implemented | Git Trees API | raw.githubusercontent.com | No (recommended) |
| GitLab | 🔧 Architecture-ready | - | - | - |
| Bitbucket | 🔧 Architecture-ready | - | - | - |
| Azure DevOps | 🔧 Architecture-ready | - | - | - |
| Gitea | 🔧 Architecture-ready | - | - | - |
| Forgejo | 🔧 Architecture-ready | - | - | - |

---

## Provider Interface

Every provider must implement the `Provider` interface:

```typescript
interface Provider {
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
```

### Method Details

#### `getTree`

Fetches the repository tree structure.

```typescript
getTree(repo: RepoIdentifier, options?: FetchOptions): Promise<TreeItem[]>
```

**Parameters:**
- `repo` - Repository identifier
- `options` - Optional fetch options (token, branch, etc.)

**Returns:** Array of `TreeItem` objects

**Implementation notes:**
- Use recursive tree fetching for large repositories
- Handle pagination if the provider requires it
- Return items with correct `type` (`blob` or `tree`)

#### `getFile`

Fetches a single file as a readable stream.

```typescript
getFile(repo: RepoIdentifier, path: string, options?: FetchOptions): Promise<Readable | null>
```

**Parameters:**
- `repo` - Repository identifier
- `path` - File path
- `options` - Optional fetch options

**Returns:** Readable stream or `null` if not found

#### `getDownloadUrl`

Returns the direct download URL for a file.

```typescript
getDownloadUrl(repo: RepoIdentifier, path: string, options?: FetchOptions): string
```

**Parameters:**
- `repo` - Repository identifier
- `path` - File path
- `options` - Optional fetch options

**Returns:** Direct download URL string

**Implementation notes:**
- Should return a URL that can be used with `undici` or similar HTTP client
- Consider authentication tokens if required
- Handle branch-specific URLs

#### `resolveRepository`

Resolves a repository input string to a `RepoIdentifier`.

```typescript
resolveRepository(input: string): Promise<RepoIdentifier>
```

**Parameters:**
- `input` - Repository input (URL, shorthand, etc.)

**Returns:** `RepoIdentifier` object

**Supported formats:**
- Full URL: `https://github.com/owner/repo`
- Shorthand: `owner/repo`
- With branch: `owner/repo#branch`

#### `getDefaultBranch`

Gets the default branch of the repository.

```typescript
getDefaultBranch(repo: RepoIdentifier, options?: FetchOptions): Promise<string>
```

**Parameters:**
- `repo` - Repository identifier
- `options` - Optional fetch options

**Returns:** Default branch name (usually `main` or `master`)

#### `search`

Searches for files in the repository.

```typescript
search(repo: RepoIdentifier, query: string, options?: FetchOptions): Promise<TreeItem[]>
```

**Parameters:**
- `repo` - Repository identifier
- `query` - Search query
- `options` - Optional fetch options

**Returns:** Array of matching `TreeItem` objects

**Implementation notes:**
- Implement case-insensitive search by default
- Support `caseSensitive` option
- Filter by file path

#### `testConnection`

Tests the connection to the provider.

```typescript
testConnection(token?: string): Promise<boolean>
```

**Parameters:**
- `token` - Optional authentication token

**Returns:** `true` if connection successful, `false` otherwise

---

## Implementing a Custom Provider

### Step 1: Create the Provider Class

```typescript
import type { Provider } from "@vetwo/repo-fetch";
import type { RepoIdentifier, TreeItem, FetchOptions } from "@vetwo/repo-fetch";
import type { Readable } from "stream";

export class MyProvider implements Provider {
  readonly name = "my-provider";

  readonly config = {
    baseUrl: "https://my-git-service.com",
    apiBaseUrl: "https://api.my-git-service.com",
    rawBaseUrl: "https://raw.my-git-service.com",
    needsToken: true,
    defaultBranch: "main",
  };

  async getTree(repo: RepoIdentifier, options?: FetchOptions): Promise<TreeItem[]> {
    // Implement tree fetching
    const response = await fetch(
      `${this.config.apiBaseUrl}/repos/${repo.owner}/${repo.repo}/tree?ref=${repo.branch ?? this.config.defaultBranch}`,
      {
        headers: {
          Authorization: `Bearer ${options?.token ?? process.env.MY_PROVIDER_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    return data.items.map((item: Record<string, unknown>) => ({
      path: item.path as string,
      type: item.type as "blob" | "tree",
      sha: item.sha as string,
      size: (item.size as number) ?? 0,
      url: item.url as string,
    }));
  }

  async getFile(repo: RepoIdentifier, path: string, options?: FetchOptions): Promise<Readable | null> {
    const url = this.getDownloadUrl(repo, path, options);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${options?.token ?? process.env.MY_PROVIDER_TOKEN}`,
      },
    });

    if (!response.ok) return null;
    return response.body as unknown as Readable;
  }

  getDownloadUrl(repo: RepoIdentifier, path: string, options?: FetchOptions): string {
    const branch = options?.branch ?? repo.branch ?? this.config.defaultBranch;
    return `${this.config.rawBaseUrl}/${repo.owner}/${repo.repo}/${branch}/${path}`;
  }

  async resolveRepository(input: string): Promise<RepoIdentifier> {
    // Parse the input string
    const urlPattern = /https?:\/\/[^/]+\/([^/]+)\/([^/]+)/;
    const match = input.match(urlPattern);

    if (match) {
      return {
        provider: this.name as "my-provider",
        owner: match[1]!,
        repo: match[2]!,
      };
    }

    // Try shorthand format
    const parts = input.split("/");
    if (parts.length === 2) {
      return {
        provider: this.name as "my-provider",
        owner: parts[0]!,
        repo: parts[1]!,
      };
    }

    throw new Error(`Invalid repository format: ${input}`);
  }

  async getDefaultBranch(repo: RepoIdentifier, options?: FetchOptions): Promise<string> {
    const response = await fetch(
      `${this.config.apiBaseUrl}/repos/${repo.owner}/${repo.repo}`,
      {
        headers: {
          Authorization: `Bearer ${options?.token ?? process.env.MY_PROVIDER_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    return data.default_branch as string;
  }

  async search(repo: RepoIdentifier, query: string, options?: FetchOptions): Promise<TreeItem[]> {
    const tree = await this.getTree(repo, options);
    const lowerQuery = query.toLowerCase();
    return tree.filter(
      (item) => item.type === "blob" && item.path.toLowerCase().includes(lowerQuery)
    );
  }

  async testConnection(token?: string): Promise<boolean> {
    try {
      const response = await fetch(this.config.apiBaseUrl, {
        headers: {
          Authorization: `Bearer ${token ?? process.env.MY_PROVIDER_TOKEN}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### Step 2: Register the Provider

```typescript
import { registerProvider } from "@vetwo/repo-fetch";
import { MyProvider } from "./my-provider";

registerProvider("my-provider", new MyProvider());
```

### Step 3: Use the Provider

```typescript
import { fetchFiles } from "@vetwo/repo-fetch";

const results = await fetchFiles(
  {
    provider: "my-provider",
    owner: "my-org",
    repo: "my-repo",
  },
  ["README.md", "src/index.ts"],
  {
    token: process.env.MY_PROVIDER_TOKEN,
    output: "./download",
  }
);
```

---

## Registering a Provider

### Runtime Registration

```typescript
import { registerProvider, getProvider } from "@vetwo/repo-fetch";
import { MyProvider } from "./my-provider";

// Register the provider
registerProvider("my-provider", new MyProvider());

// Verify registration
const provider = getProvider("my-provider");
console.log(provider.name); // "my-provider"
```

### Module Registration

Create a module that registers all custom providers:

```typescript
// providers/index.ts
import { registerProvider } from "@vetwo/repo-fetch";
import { MyProvider } from "./my-provider";
import { AnotherProvider } from "./another-provider";

export function registerCustomProviders(): void {
  registerProvider("my-provider", new MyProvider());
  registerProvider("another-provider", new AnotherProvider());
}

// Call on import
registerCustomProviders();
```

---

## Provider Configuration

### Environment Variables

Providers typically use environment variables for configuration:

```bash
# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# GitLab
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx

# Custom provider
MY_PROVIDER_TOKEN=xxxxxxxxxxxxxxxxxxxx
```

### Configuration Object

```typescript
interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiBaseUrl: string;
  rawBaseUrl: string;
  needsToken: boolean;
  defaultBranch: string;
}
```

### Example Configuration

```typescript
const providerConfig: ProviderConfig = {
  name: "github",
  baseUrl: "https://github.com",
  apiBaseUrl: "https://api.github.com",
  rawBaseUrl: "https://raw.githubusercontent.com",
  needsToken: false, // Recommended for higher rate limits
  defaultBranch: "main",
};
```

---

## Authentication

### Token Priority

Tokens are typically resolved in this order:

1. Explicit `token` option in `FetchOptions`
2. Provider-specific environment variable (e.g., `GITHUB_TOKEN`)
3. Generic `REPO_FETCH_TOKEN` environment variable

### Example Implementation

```typescript
private getToken(token?: string): string | undefined {
  return token ?? process.env.MY_PROVIDER_TOKEN ?? process.env.REPO_FETCH_TOKEN;
}
```

### Rate Limits

| Provider | Unauthenticated | Authenticated |
|----------|-----------------|---------------|
| GitHub | 60 requests/hour | 5,000 requests/hour |
| GitLab | 30 requests/minute | 60 requests/minute |
| Bitbucket | 60 requests/hour | 1,500 requests/hour |

---

## Error Handling

### Error Classes

Use the built-in error classes for consistent error handling:

```typescript
import {
  RepositoryNotFoundError,
  BranchNotFoundError,
  PathNotFoundError,
  RateLimitedError,
  PermissionDeniedError,
  NetworkError,
} from "@vetwo/repo-fetch";
```

### Example Error Handling

```typescript
async getTree(repo: RepoIdentifier, options?: FetchOptions): Promise<TreeItem[]> {
  try {
    const response = await fetch(...);

    if (response.status === 404) {
      throw new RepositoryNotFoundError(repo.owner, repo.repo);
    }

    if (response.status === 403) {
      throw new PermissionDeniedError(`${repo.owner}/${repo.repo}`);
    }

    if (response.status === 429) {
      const resetAt = Number(response.headers.get("x-ratelimit-reset"));
      throw new RateLimitedError(resetAt);
    }

    if (!response.ok) {
      throw new NetworkError(`API returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof RepoFetchError) {
      throw error;
    }
    throw new NetworkError(error instanceof Error ? error.message : "Unknown error");
  }
}
```

---

## Testing Your Provider

### Unit Tests

```typescript
import { describe, it, expect, vi } from "vitest";
import { MyProvider } from "./my-provider";

describe("MyProvider", () => {
  const provider = new MyProvider();

  it("should have correct config", () => {
    expect(provider.name).toBe("my-provider");
    expect(provider.config.needsToken).toBe(true);
  });

  it("should resolve repository input", async () => {
    const repo = await provider.resolveRepository("my-org/my-repo");
    expect(repo).toEqual({
      provider: "my-provider",
      owner: "my-org",
      repo: "my-repo",
    });
  });

  it("should get download URL", () => {
    const url = provider.getDownloadUrl(
      { provider: "my-provider", owner: "my-org", repo: "my-repo" },
      "README.md",
      { branch: "main" }
    );
    expect(url).toContain("README.md");
  });

  it("should test connection", async () => {
    const result = await provider.testConnection("test-token");
    expect(typeof result).toBe("boolean");
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { MyProvider } from "./my-provider";

describe("MyProvider Integration", () => {
  const provider = new MyProvider();
  const token = process.env.MY_PROVIDER_TOKEN;

  beforeAll(() => {
    if (!token) {
      console.warn("MY_PROVIDER_TOKEN not set, skipping integration tests");
    }
  });

  it("should fetch repository tree", async () => {
    if (!token) return;

    const tree = await provider.getTree(
      { provider: "my-provider", owner: "my-org", repo: "my-repo" },
      { token }
    );

    expect(Array.isArray(tree)).toBe(true);
    expect(tree.length).toBeGreaterThan(0);
  });

  it("should search files", async () => {
    if (!token) return;

    const results = await provider.search(
      { provider: "my-provider", owner: "my-org", repo: "my-repo" },
      "index",
      { token }
    );

    expect(Array.isArray(results)).toBe(true);
  });
});
```

---

## Examples

### GitHub Provider (Reference Implementation)

See `src/providers/github/index.ts` for a complete, production-ready implementation.

### GitLab Provider (Stub)

```typescript
import type { Provider } from "@vetwo/repo-fetch";
import { ProviderNotImplementedError } from "@vetwo/repo-fetch";

export class GitLabProvider implements Provider {
  readonly name = "gitlab";

  readonly config = {
    baseUrl: "https://gitlab.com",
    apiBaseUrl: "https://gitlab.com/api/v4",
    rawBaseUrl: "https://gitlab.com",
    needsToken: true,
    defaultBranch: "main",
  };

  async getTree(): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("gitlab");
  }

  async getFile(): Promise<Readable | null> {
    throw new ProviderNotImplementedError("gitlab");
  }

  getDownloadUrl(): string {
    throw new ProviderNotImplementedError("gitlab");
  }

  async resolveRepository(): Promise<RepoIdentifier> {
    throw new ProviderNotImplementedError("gitlab");
  }

  async getDefaultBranch(): Promise<string> {
    throw new ProviderNotImplementedError("gitlab");
  }

  async search(): Promise<TreeItem[]> {
    throw new ProviderNotImplementedError("gitlab");
  }

  async testConnection(): Promise<boolean> {
    throw new ProviderNotImplementedError("gitlab");
  }
}
```

### Self-Hosted Gitea Provider

```typescript
import type { Provider } from "@vetwo/repo-fetch";

export class SelfHostedGiteaProvider implements Provider {
  readonly name = "gitea";

  readonly config = {
    baseUrl: "https://gitea.example.com",
    apiBaseUrl: "https://gitea.example.com/api/v1",
    rawBaseUrl: "https://gitea.example.com",
    needsToken: true,
    defaultBranch: "main",
  };

  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.config.baseUrl = baseUrl;
    this.config.apiBaseUrl = `${baseUrl}/api/v1`;
    this.config.rawBaseUrl = baseUrl;
  }

  // Implement all methods...
}
```
