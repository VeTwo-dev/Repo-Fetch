import { describe, it, expect } from "vitest";
import os from "os";
import type {
  ResourceManifest,
  LifecycleHookDef,
  LifecycleContext,
} from "../../src/registry/types";
import {
  executeLifecycleHooks,
  getAvailableHooks,
  hasHook,
  getHookDescription,
} from "../../src/registry/lifecycle";

function createManifestWithHooks(hooks: LifecycleHookDef[] = []): ResourceManifest {
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
    engines: {},
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
    lifecycleHooks: hooks,
    variables: [],
    transforms: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createContext(): LifecycleContext {
  return {
    resource: createManifestWithHooks(),
    projectPath: os.tmpdir(),
    variables: [],
    transforms: [],
    dependencies: { nodes: [], edges: [], order: [], cycles: [] },
  };
}

describe("getAvailableHooks", () => {
  it("returns hook names from manifest", () => {
    const manifest = createManifestWithHooks([
      { name: "beforeInstall", script: "echo before" },
      { name: "afterInstall", script: "echo after" },
    ]);
    expect(getAvailableHooks(manifest)).toEqual(["beforeInstall", "afterInstall"]);
  });

  it("returns empty array when no hooks", () => {
    const manifest = createManifestWithHooks([]);
    expect(getAvailableHooks(manifest)).toEqual([]);
  });
});

describe("hasHook", () => {
  it("returns true when hook exists", () => {
    const manifest = createManifestWithHooks([{ name: "afterInstall", script: "echo done" }]);
    expect(hasHook(manifest, "afterInstall")).toBe(true);
  });

  it("returns false when hook doesn't exist", () => {
    const manifest = createManifestWithHooks([{ name: "afterInstall", script: "echo done" }]);
    expect(hasHook(manifest, "beforeInstall")).toBe(false);
  });
});

describe("getHookDescription", () => {
  it("returns description when available", () => {
    const manifest = createManifestWithHooks([
      { name: "beforeInstall", script: "echo setup", description: "Runs setup" },
    ]);
    expect(getHookDescription(manifest, "beforeInstall")).toBe("Runs setup");
  });

  it("returns hook name as fallback when no description", () => {
    const manifest = createManifestWithHooks([{ name: "beforeInstall", script: "echo setup" }]);
    expect(getHookDescription(manifest, "beforeInstall")).toBe("beforeInstall");
  });
});

describe("executeLifecycleHooks", () => {
  it("returns empty results when no hooks for phase", async () => {
    const manifest = createManifestWithHooks([{ name: "beforeInstall", script: "echo before" }]);
    const context = createContext();
    const results = await executeLifecycleHooks(manifest, context, "remove");
    expect(results).toEqual([]);
  });

  it("returns result with success=false when hook fails", async () => {
    const manifest = createManifestWithHooks([{ name: "beforeInstall", script: "exit 1" }]);
    const context = createContext();
    const results = await executeLifecycleHooks(manifest, context, "install");
    expect(results).toHaveLength(1);
    expect(results[0]?.success).toBe(false);
    expect(results[0]?.hook).toBe("beforeInstall");
    expect(results[0]?.error).toBeDefined();
  });

  it("returns result with success=true when hook succeeds", async () => {
    const manifest = createManifestWithHooks([{ name: "afterInstall", script: "echo hello" }]);
    const context = createContext();
    const results = await executeLifecycleHooks(manifest, context, "install");
    expect(results).toHaveLength(1);
    expect(results[0]?.success).toBe(true);
    expect(results[0]?.hook).toBe("afterInstall");
    expect(results[0]?.output).toBe("hello");
    expect(results[0]?.error).toBeUndefined();
  });
});
