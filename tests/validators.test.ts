import { describe, it, expect } from "vitest";
import {
  RepoIdentifierSchema,
  DownloadOptionsSchema,
  ConfigSchema,
  FilterOptionsSchema,
} from "../src/validators";

describe("RepoIdentifierSchema", () => {
  it("validates a correct repo identifier", () => {
    const result = RepoIdentifierSchema.parse({
      provider: "github",
      owner: "user",
      repo: "repo",
    });
    expect(result.owner).toBe("user");
    expect(result.repo).toBe("repo");
  });

  it("rejects empty owner", () => {
    expect(() =>
      RepoIdentifierSchema.parse({ provider: "github", owner: "", repo: "repo" }),
    ).toThrow();
  });

  it("rejects invalid provider", () => {
    expect(() =>
      RepoIdentifierSchema.parse({ provider: "invalid", owner: "user", repo: "repo" }),
    ).toThrow();
  });

  it("accepts optional fields", () => {
    const result = RepoIdentifierSchema.parse({
      provider: "github",
      owner: "user",
      repo: "repo",
      branch: "main",
      path: "src",
    });
    expect(result.branch).toBe("main");
    expect(result.path).toBe("src");
  });
});

describe("DownloadOptionsSchema", () => {
  it("provides default output", () => {
    const result = DownloadOptionsSchema.parse({});
    expect(result.output).toBe("./download");
  });

  it("validates concurrency range", () => {
    expect(() => DownloadOptionsSchema.parse({ concurrency: 0 })).toThrow();
    expect(() => DownloadOptionsSchema.parse({ concurrency: 100 })).toThrow();
    expect(() => DownloadOptionsSchema.parse({ concurrency: 5 })).not.toThrow();
  });
});

describe("ConfigSchema", () => {
  it("validates full config", () => {
    const result = ConfigSchema.parse({
      provider: "github",
      output: "./downloads",
      overwrite: true,
      concurrency: 10,
    });
    expect(result.provider).toBe("github");
    expect(result.concurrency).toBe(10);
  });
});

describe("FilterOptionsSchema", () => {
  it("validates regex option", () => {
    const result = FilterOptionsSchema.parse({ regex: /\.ts$/ });
    expect(result.regex).toBeInstanceOf(RegExp);
  });

  it("validates glob option", () => {
    const result = FilterOptionsSchema.parse({ glob: "**/*.ts" });
    expect(result.glob).toBe("**/*.ts");
  });

  it("validates extensions", () => {
    const result = FilterOptionsSchema.parse({ extensions: [".ts", ".js"] });
    expect(result.extensions).toHaveLength(2);
  });
});
