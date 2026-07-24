export class RepoFetchError extends Error {
  public readonly code: string;
  public readonly reason: string;
  public readonly suggestion: string;
  public readonly recovery: string;
  public readonly docsUrl: string;

  constructor(
    message: string,
    options: {
      code: string;
      reason: string;
      suggestion: string;
      recovery: string;
      docsUrl: string;
    },
  ) {
    super(message);
    this.name = "RepoFetchError";
    this.code = options.code;
    this.reason = options.reason;
    this.suggestion = options.suggestion;
    this.recovery = options.recovery;
    this.docsUrl = options.docsUrl;
  }
}

export class RepositoryNotFoundError extends RepoFetchError {
  constructor(owner: string, repo: string) {
    super(`Repository ${owner}/${repo} not found`, {
      code: "REPOSITORY_NOT_FOUND",
      reason: `The repository "${owner}/${repo}" does not exist or is inaccessible.`,
      suggestion: "Verify the repository name and owner are correct.",
      recovery: "Check the URL or use `repo-fetch browse` to explore available repositories.",
      docsUrl: "https://github.com/vetwo/repo-fetch#errors",
    });
    this.name = "RepositoryNotFoundError";
  }
}

export class BranchNotFoundError extends RepoFetchError {
  constructor(branch: string) {
    super(`Branch "${branch}" not found`, {
      code: "BRANCH_NOT_FOUND",
      reason: `The branch "${branch}" does not exist in this repository.`,
      suggestion: "Check the branch name for typos.",
      recovery: "Use the default branch (main/master) or verify the branch exists.",
      docsUrl: "https://github.com/vetwo/repo-fetch#errors",
    });
    this.name = "BranchNotFoundError";
  }
}

export class PathNotFoundError extends RepoFetchError {
  constructor(path: string) {
    super(`Path "${path}" not found`, {
      code: "PATH_NOT_FOUND",
      reason: `The path "${path}" does not exist in this repository.`,
      suggestion: "Verify the file or directory path.",
      recovery: "Use `repo-fetch tree` to list available paths.",
      docsUrl: "https://github.com/vetwo/repo-fetch#errors",
    });
    this.name = "PathNotFoundError";
  }
}

export class RateLimitedError extends RepoFetchError {
  constructor(resetAt: number) {
    super("Rate limit exceeded", {
      code: "RATE_LIMITED",
      reason: "API rate limit has been exceeded.",
      suggestion: "Authenticate with a token to increase limits or wait until the reset time.",
      recovery: `Rate limit resets at ${new Date(resetAt * 1000).toISOString()}. Provide a token via --token or REPO_FETCH_TOKEN env var.`,
      docsUrl: "https://github.com/vetwo/repo-fetch#rate-limiting",
    });
    this.name = "RateLimitedError";
  }
}

export class InvalidRepositoryError extends RepoFetchError {
  constructor(input: string) {
    super(`Invalid repository: "${input}"`, {
      code: "INVALID_REPOSITORY",
      reason: `"${input}" is not a valid repository reference.`,
      suggestion: "Use format: user/repo, user/repo#branch, or a full URL.",
      recovery: "Provide a valid repository reference.",
      docsUrl: "https://github.com/vetwo/repo-fetch#usage",
    });
    this.name = "InvalidRepositoryError";
  }
}

export class InvalidURLError extends RepoFetchError {
  constructor(url: string) {
    super(`Invalid URL: "${url}"`, {
      code: "INVALID_URL",
      reason: `"${url}" is not a valid URL.`,
      suggestion:
        "Provide a valid Git hosting URL (GitHub, GitLab, Bitbucket, Azure, Gitea, Forgejo).",
      recovery: "Use a supported URL format.",
      docsUrl: "https://github.com/vetwo/repo-fetch#supported-providers",
    });
    this.name = "InvalidURLError";
  }
}

export class PermissionDeniedError extends RepoFetchError {
  constructor(resource: string) {
    super(`Permission denied: ${resource}`, {
      code: "PERMISSION_DENIED",
      reason: `Access to "${resource}" was denied.`,
      suggestion: "Provide an authentication token with the required permissions.",
      recovery: "Set REPO_FETCH_TOKEN environment variable or use --token.",
      docsUrl: "https://github.com/vetwo/repo-fetch#authentication",
    });
    this.name = "PermissionDeniedError";
  }
}

export class NetworkError extends RepoFetchError {
  constructor(cause: string) {
    super(`Network error: ${cause}`, {
      code: "NETWORK_ERROR",
      reason: `A network error occurred: ${cause}.`,
      suggestion: "Check your internet connection.",
      recovery: "Verify network connectivity and try again.",
      docsUrl: "https://github.com/vetwo/repo-fetch#troubleshooting",
    });
    this.name = "NetworkError";
  }
}

export class TimeoutError extends RepoFetchError {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`, {
      code: "TIMEOUT",
      reason: `The request exceeded the ${ms}ms timeout.`,
      suggestion: "Increase the timeout with --timeout or check your connection.",
      recovery: "Use a larger timeout value or a faster internet connection.",
      docsUrl: "https://github.com/vetwo/repo-fetch#configuration",
    });
    this.name = "TimeoutError";
  }
}

export class ValidationError extends RepoFetchError {
  constructor(field: string, message: string) {
    super(`Validation error: ${message}`, {
      code: "VALIDATION_ERROR",
      reason: `Invalid value for "${field}": ${message}.`,
      suggestion: "Check the provided value and try again.",
      recovery: "Refer to the documentation for valid values.",
      docsUrl: "https://github.com/vetwo/repo-fetch#configuration",
    });
    this.name = "ValidationError";
  }
}

export class ProviderNotImplementedError extends RepoFetchError {
  constructor(provider: string) {
    super(`Provider "${provider}" is not yet implemented`, {
      code: "PROVIDER_NOT_IMPLEMENTED",
      reason: `Support for "${provider}" is architecture-ready but not yet implemented.`,
      suggestion: "Use GitHub as the provider or implement the provider interface.",
      recovery: "Check the provider guide at the documentation URL.",
      docsUrl: "https://github.com/vetwo/repo-fetch#provider-guide",
    });
    this.name = "ProviderNotImplementedError";
  }
}
