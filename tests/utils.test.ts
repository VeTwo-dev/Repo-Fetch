import { describe, it, expect } from "vitest";
import {
  normalizeRepoUrl,
  formatBytes,
  formatDuration,
  formatSpeed,
  estimateDownloadTime,
  isValidProvider,
  buildFullUrl,
  simpleGlobMatch,
} from "../src/utils";

describe("normalizeRepoUrl", () => {
  it("parses full GitHub URL", () => {
    const result = normalizeRepoUrl("https://github.com/user/repo");
    expect(result.type).toBe("full-url");
    if (result.type === "full-url") {
      expect(result.repo.owner).toBe("user");
      expect(result.repo.repo).toBe("repo");
      expect(result.repo.provider).toBe("github");
    }
  });

  it("parses GitHub URL with branch and path", () => {
    const result = normalizeRepoUrl("https://github.com/user/repo/tree/main/templates/react");
    expect(result.type).toBe("full-url");
    if (result.type === "full-url") {
      expect(result.repo.owner).toBe("user");
      expect(result.repo.repo).toBe("repo");
      expect(result.repo.branch).toBe("main");
      expect(result.repo.path).toBe("templates/react");
    }
  });

  it("parses GitHub blob URL", () => {
    const result = normalizeRepoUrl("https://github.com/user/repo/blob/main/package.json");
    expect(result.type).toBe("full-url");
    if (result.type === "full-url") {
      expect(result.repo.owner).toBe("user");
      expect(result.repo.repo).toBe("repo");
      expect(result.repo.branch).toBe("main");
      expect(result.repo.path).toBe("package.json");
      expect(result.repo.provider).toBe("github");
    }
  });

  it("parses shorthand format", () => {
    const result = normalizeRepoUrl("user/repo");
    expect(result.type).toBe("shorthand");
    if (result.type === "shorthand") {
      expect(result.repo.owner).toBe("user");
      expect(result.repo.repo).toBe("repo");
      expect(result.repo.provider).toBe("github");
    }
  });

  it("parses shorthand with branch", () => {
    const result = normalizeRepoUrl("user/repo#main");
    expect(result.type).toBe("shorthand");
    if (result.type === "shorthand") {
      expect(result.repo.branch).toBe("main");
    }
  });

  it("parses shorthand with @", () => {
    const result = normalizeRepoUrl("user/repo@develop");
    if (result.type === "shorthand") {
      expect(result.repo.branch).toBe("develop");
    }
  });

  it("parses shorthand with :", () => {
    const result = normalizeRepoUrl("user/repo:feature");
    if (result.type === "shorthand") {
      expect(result.repo.branch).toBe("feature");
    }
  });

  it("parses GitLab URL", () => {
    const result = normalizeRepoUrl("https://gitlab.com/user/repo");
    expect(result.type).toBe("full-url");
    if (result.type === "full-url") {
      expect(result.repo.provider).toBe("gitlab");
    }
  });

  it("parses Bitbucket URL", () => {
    const result = normalizeRepoUrl("https://bitbucket.org/user/repo");
    expect(result.type).toBe("full-url");
    if (result.type === "full-url") {
      expect(result.repo.provider).toBe("bitbucket");
    }
  });

  it("returns invalid for garbage input", () => {
    const result = normalizeRepoUrl("not-a-valid-input-!!!");
    expect(result.type).toBe("invalid");
  });
});

describe("formatBytes", () => {
  it("formats 0 bytes", () => expect(formatBytes(0)).toBe("0 B"));
  it("formats bytes", () => expect(formatBytes(500)).toBe("500.0 B"));
  it("formats KB", () => expect(formatBytes(2048)).toBe("2.0 KB"));
  it("formats MB", () => expect(formatBytes(1048576)).toBe("1.0 MB"));
  it("formats GB", () => expect(formatBytes(1073741824)).toBe("1.0 GB"));
});

describe("formatDuration", () => {
  it("formats seconds", () => expect(formatDuration(5000)).toBe("5s"));
  it("formats minutes and seconds", () => expect(formatDuration(125000)).toBe("2m 5s"));
  it("formats hours", () => expect(formatDuration(3661000)).toBe("1h 1m 1s"));
});

describe("formatSpeed", () => {
  it("formats speed", () => expect(formatSpeed(1048576)).toBe("1.0 MB/s"));
});

describe("estimateDownloadTime", () => {
  it("estimates time based on size and default speed", () => {
    const time = estimateDownloadTime(10 * 1024 * 1024, 5 * 1024 * 1024);
    expect(time).toBe(2);
  });
});

describe("isValidProvider", () => {
  it("returns true for valid providers", () => {
    expect(isValidProvider("github")).toBe(true);
    expect(isValidProvider("gitlab")).toBe(true);
    expect(isValidProvider("bitbucket")).toBe(true);
  });
  it("returns false for invalid providers", () => {
    expect(isValidProvider("unknown")).toBe(false);
  });
});

describe("buildFullUrl", () => {
  it("builds GitHub URL", () => {
    expect(
      buildFullUrl({
        provider: "github",
        owner: "user",
        repo: "repo",
      }),
    ).toBe("https://github.com/user/repo");
  });
});

describe("simpleGlobMatch", () => {
  it("matches exact paths", () => {
    expect(simpleGlobMatch("src/index.ts", "src/index.ts")).toBe(true);
  });
  it("matches wildcard", () => {
    expect(simpleGlobMatch("src/*.ts", "src/index.ts")).toBe(true);
  });
  it("matches double wildcard", () => {
    expect(simpleGlobMatch("**/*.ts", "src/index.ts")).toBe(true);
  });
  it("does not match non-matching patterns", () => {
    expect(simpleGlobMatch("*.js", "index.ts")).toBe(false);
  });
});
