import { describe, it, expect } from "vitest";
import {
  RepoFetchError,
  RepositoryNotFoundError,
  BranchNotFoundError,
  PathNotFoundError,
  RateLimitedError,
  InvalidRepositoryError,
  InvalidURLError,
  PermissionDeniedError,
  NetworkError,
  TimeoutError,
  ValidationError,
  ProviderNotImplementedError,
} from "../src/errors";

describe("RepoFetchError", () => {
  it("creates base error with all fields", () => {
    const error = new RepoFetchError("test", {
      code: "TEST",
      reason: "A test error",
      suggestion: "Try again",
      recovery: "Do something",
      docsUrl: "https://example.com",
    });
    expect(error.message).toBe("test");
    expect(error.code).toBe("TEST");
    expect(error.reason).toBe("A test error");
    expect(error.suggestion).toBe("Try again");
    expect(error.recovery).toBe("Do something");
    expect(error.docsUrl).toBe("https://example.com");
    expect(error.name).toBe("RepoFetchError");
  });
});

describe("RepositoryNotFoundError", () => {
  it("creates error with correct code", () => {
    const error = new RepositoryNotFoundError("owner", "repo");
    expect(error.code).toBe("REPOSITORY_NOT_FOUND");
    expect(error.message).toContain("owner/repo");
  });
});

describe("BranchNotFoundError", () => {
  it("creates error with correct code", () => {
    const error = new BranchNotFoundError("main");
    expect(error.code).toBe("BRANCH_NOT_FOUND");
    expect(error.message).toContain("main");
  });
});

describe("PathNotFoundError", () => {
  it("creates error with correct code", () => {
    const error = new PathNotFoundError("src/index.ts");
    expect(error.code).toBe("PATH_NOT_FOUND");
    expect(error.message).toContain("src/index.ts");
  });
});

describe("RateLimitedError", () => {
  it("creates error with correct code and reset time", () => {
    const resetAt = Math.floor(Date.now() / 1000) + 3600;
    const error = new RateLimitedError(resetAt);
    expect(error.code).toBe("RATE_LIMITED");
    expect(error.recovery).toContain("reset");
  });
});

describe("InvalidRepositoryError", () => {
  it("creates error with correct code", () => {
    const error = new InvalidRepositoryError("bad-input");
    expect(error.code).toBe("INVALID_REPOSITORY");
  });
});

describe("InvalidURLError", () => {
  it("creates error with correct code", () => {
    const error = new InvalidURLError("https://bad.url");
    expect(error.code).toBe("INVALID_URL");
  });
});

describe("PermissionDeniedError", () => {
  it("creates error with correct code", () => {
    const error = new PermissionDeniedError("repo/file.ts");
    expect(error.code).toBe("PERMISSION_DENIED");
  });
});

describe("NetworkError", () => {
  it("creates error with correct code", () => {
    const error = new NetworkError("ECONNREFUSED");
    expect(error.code).toBe("NETWORK_ERROR");
  });
});

describe("TimeoutError", () => {
  it("creates error with correct code", () => {
    const error = new TimeoutError(30000);
    expect(error.code).toBe("TIMEOUT");
    expect(error.message).toContain("30000");
  });
});

describe("ValidationError", () => {
  it("creates error with correct code", () => {
    const error = new ValidationError("output", "Path is invalid");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.reason).toContain("output");
  });
});

describe("ProviderNotImplementedError", () => {
  it("creates error with correct code", () => {
    const error = new ProviderNotImplementedError("gitlab");
    expect(error.code).toBe("PROVIDER_NOT_IMPLEMENTED");
    expect(error.message).toContain("gitlab");
  });
});
