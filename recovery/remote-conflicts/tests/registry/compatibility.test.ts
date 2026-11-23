import { describe, it, expect } from "vitest";
import { detectEnvironment, checkCompatibility } from "../../src/registry/compatibility";
import type { ResourceManifest } from "../../src/registry/types";

function createManifestWithCompat(overrides: Partial<ResourceManifest> = {}): ResourceManifest {
  return {
    id: "test",
    name: "Test",
    displayName: "Test",
    version: "1.0.0",
    description: "",
    type: "plugin",
    category: "util",
    tags: [],
    keywords: [],
    author: { name: "test" },
    repository: "",
    homepage: "",
    license: "MIT",
    engines: { node: ">=18.0.0" },
    vetwo: { minVersion: "1.0.0" },
    dependencies: [],
    optionalDependencies: [],
    peerDependencies: [],
    conflicts: [],
    supportedRuntimes: ["any"],
    supportedFrameworks: ["any"],
    supportedPackageManagers: ["any"],
    checksum: { algorithm: "sha256", value: "abc" },
    downloadPath: "/",
    examples: [],
    documentation: "",
    screenshots: [],
    lifecycleHooks: [],
    variables: [],
    transforms: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("detectEnvironment", () => {
  it("returns object with expected shape", () => {
    const env = detectEnvironment();

    expect(env).toHaveProperty("nodeVersion");
    expect(env).toHaveProperty("os");
    expect(env).toHaveProperty("architecture");
    expect(env).toHaveProperty("packageManager");
    expect(env).toHaveProperty("framework");
    expect(env).toHaveProperty("runtime");
    expect(env).toHaveProperty("vetwoVersion");
    expect(typeof env.nodeVersion).toBe("string");
    expect(typeof env.os).toBe("string");
    expect(typeof env.architecture).toBe("string");
  });

  it("nodeVersion matches process.version", () => {
    const env = detectEnvironment();
    const expected = process.version.replace(/^v/, "");
    expect(env.nodeVersion).toBe(expected);
  });
});

describe("checkCompatibility", () => {
  it("compatible manifest returns compatible=true", () => {
    const manifest = createManifestWithCompat();
    const report = checkCompatibility(manifest);

    expect(report.compatible).toBe(true);
    expect(report.errors).toEqual([]);
  });

  it("unsupported runtime returns compatible=false with errors", () => {
    const manifest = createManifestWithCompat({
      supportedRuntimes: ["bun"],
    });

    const env = detectEnvironment();
    const report = checkCompatibility(manifest);

    if (env.runtime !== "bun") {
      expect(report.compatible).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.runtime.supported).toBe(false);
    } else {
      expect(report.compatible).toBe(true);
    }
  });

  it("version constraint met returns supported=true for nodeVersion check", () => {
    const env = detectEnvironment();
    const major = Number(env.nodeVersion.split(".")[0]);
    const manifest = createManifestWithCompat({
      engines: { node: `>=${major}.0.0` },
    });

    const report = checkCompatibility(manifest);
    expect(report.nodeVersion.supported).toBe(true);
  });

  it("unsupported package manager returns warnings but still compatible", () => {
    const manifest = createManifestWithCompat({
      supportedPackageManagers: ["bun"],
    });

    const env = detectEnvironment();
    const report = checkCompatibility(manifest);

    if (env.packageManager !== "bun") {
      expect(report.packageManager.supported).toBe(false);
      expect(report.warnings.length).toBeGreaterThan(0);
      expect(report.compatible).toBe(true);
    } else {
      expect(report.compatible).toBe(true);
    }
  });

  it("returns full report structure with all check fields", () => {
    const manifest = createManifestWithCompat();
    const report = checkCompatibility(manifest);

    expect(report).toHaveProperty("compatible");
    expect(report).toHaveProperty("runtime");
    expect(report).toHaveProperty("framework");
    expect(report).toHaveProperty("packageManager");
    expect(report).toHaveProperty("nodeVersion");
    expect(report).toHaveProperty("bunVersion");
    expect(report).toHaveProperty("os");
    expect(report).toHaveProperty("architecture");
    expect(report).toHaveProperty("vetwoVersion");
    expect(report).toHaveProperty("warnings");
    expect(report).toHaveProperty("errors");

    for (const field of [
      "runtime",
      "framework",
      "packageManager",
      "nodeVersion",
      "bunVersion",
      "os",
      "architecture",
      "vetwoVersion",
    ]) {
      const check = report[field as keyof typeof report] as {
        supported: boolean;
        current: string;
        required: string;
        message: string;
      };
      expect(typeof check.supported).toBe("boolean");
      expect(typeof check.current).toBe("string");
      expect(typeof check.required).toBe("string");
      expect(typeof check.message).toBe("string");
    }

    expect(Array.isArray(report.warnings)).toBe(true);
    expect(Array.isArray(report.errors)).toBe(true);
  });
});
