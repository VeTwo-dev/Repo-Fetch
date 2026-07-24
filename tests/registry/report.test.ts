import { describe, it, expect, vi } from "vitest";
import type { DependencyNode, ResourceManifest } from "../../src/registry/types";
import {
  createReport,
  addInstalledResource,
  addInstalledDependency,
  addWarning,
  addError,
  addSkipped,
  finalizeReport,
  formatReport,
  printReport,
} from "../../src/registry/report";

const testDep: DependencyNode = {
  id: "dep-1",
  name: "Dep One",
  version: "1.0.0",
  type: "required",
  resolved: true,
};

const testManifest: ResourceManifest = {
  id: "res-1",
  name: "Resource One",
  displayName: "Resource One",
  version: "2.0.0",
  description: "A test resource",
  type: "plugin",
  category: "testing",
  tags: ["test"],
  keywords: [],
  author: { name: "Test Author" },
  repository: "https://github.com/test/repo",
  homepage: "https://example.com",
  license: "MIT",
  engines: {},
  vetwo: { minVersion: "1.0.0" },
  dependencies: [],
  optionalDependencies: [],
  peerDependencies: [],
  conflicts: [],
  supportedRuntimes: ["any"],
  supportedFrameworks: ["any"],
  supportedPackageManagers: ["any"],
  checksum: { algorithm: "sha256", value: "abc123" },
  downloadPath: "/test/path",
  examples: [],
  documentation: "",
  screenshots: [],
  lifecycleHooks: [],
  variables: [],
  transforms: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("createReport", () => {
  it("returns report with success=true, empty arrays, and valid startTime", () => {
    const report = createReport();
    expect(report.success).toBe(true);
    expect(report.resources).toEqual([]);
    expect(report.dependencies).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.errors).toEqual([]);
    expect(report.skipped).toEqual([]);
    expect(report.endTime).toBe("");
    expect(report.duration).toBe(0);
    expect(report.startTime).toBeTruthy();
    expect(new Date(report.startTime).getTime()).not.toBeNaN();
  });
});

describe("addInstalledResource", () => {
  it("adds to resources array with correct shape", () => {
    const report = createReport();
    addInstalledResource(report, testManifest, "/out/res-1", ["a.ts", "b.ts"], true);
    expect(report.resources).toHaveLength(1);
    expect(report.resources[0]).toEqual({
      id: "res-1",
      name: "Resource One",
      version: "2.0.0",
      type: "plugin",
      path: "/out/res-1",
      files: ["a.ts", "b.ts"],
      checksumVerified: true,
    });
  });
});

describe("addInstalledDependency", () => {
  it("adds to dependencies array", () => {
    const report = createReport();
    addInstalledDependency(report, testDep, "/out/dep-1");
    expect(report.dependencies).toHaveLength(1);
    expect(report.dependencies[0]).toEqual({
      id: "dep-1",
      name: "Dep One",
      version: "1.0.0",
      type: "required",
      path: "/out/dep-1",
    });
  });
});

describe("addWarning", () => {
  it("adds to warnings with code, message, and optional resource", () => {
    const report = createReport();
    addWarning(report, "W001", "Deprecated API usage", "res-1");
    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0]).toEqual({
      code: "W001",
      message: "Deprecated API usage",
      resource: "res-1",
    });
  });

  it("adds warning without optional resource", () => {
    const report = createReport();
    addWarning(report, "W002", "No resource specified");
    expect(report.warnings[0]).toEqual({
      code: "W002",
      message: "No resource specified",
      resource: undefined,
    });
  });
});

describe("addError", () => {
  it("adds to errors and sets report.success to false", () => {
    const report = createReport();
    expect(report.success).toBe(true);
    addError(report, "E001", "Download failed", "res-1", "stack trace");
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]).toEqual({
      code: "E001",
      message: "Download failed",
      resource: "res-1",
      stack: "stack trace",
    });
    expect(report.success).toBe(false);
  });
});

describe("addSkipped", () => {
  it("adds to skipped with reason", () => {
    const report = createReport();
    addSkipped(report, "res-2", "Resource Two", "incompatible", "Requires Node 20+");
    expect(report.skipped).toHaveLength(1);
    expect(report.skipped[0]).toEqual({
      id: "res-2",
      name: "Resource Two",
      reason: "incompatible",
      details: "Requires Node 20+",
    });
  });
});

describe("finalizeReport", () => {
  it("sets endTime and calculates non-negative duration", () => {
    const report = createReport();
    finalizeReport(report);
    expect(report.endTime).toBeTruthy();
    expect(new Date(report.endTime).getTime()).not.toBeNaN();
    expect(report.duration).toBeGreaterThanOrEqual(0);
  });
});

describe("formatReport", () => {
  it("returns string containing 'Installation Report'", () => {
    const report = createReport();
    const formatted = formatReport(report);
    expect(formatted).toContain("Installation Report");
  });

  it("includes 'SUCCESS' when report.success is true", () => {
    const report = createReport();
    const formatted = formatReport(report);
    expect(formatted).toContain("SUCCESS");
  });

  it("includes 'FAILED' when report.success is false", () => {
    const report = createReport();
    addError(report, "E001", "Something broke");
    const formatted = formatReport(report);
    expect(formatted).toContain("FAILED");
  });

  it("includes resource names when resources exist", () => {
    const report = createReport();
    addInstalledResource(report, testManifest, "/out/res-1", ["a.ts"], false);
    const formatted = formatReport(report);
    expect(formatted).toContain("Resource One");
    expect(formatted).toContain("2.0.0");
  });

  it("includes error codes when errors exist", () => {
    const report = createReport();
    addError(report, "E404", "Not found");
    const formatted = formatReport(report);
    expect(formatted).toContain("E404");
    expect(formatted).toContain("Not found");
  });
});

describe("printReport", () => {
  it("calls console.log with formatted output", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const report = createReport();
    printReport(report);
    expect(spy).toHaveBeenCalled();
    const arg = spy.mock.calls[0]?.[0] as string;
    expect(arg).toContain("Installation Report");
    spy.mockRestore();
  });
});
