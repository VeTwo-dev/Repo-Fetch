import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import { resolve } from "pathe";
import { tmpdir } from "os";
import { applyTransforms } from "../../src/registry/transforms";
import type { ResourceManifest, TransformDef, VariableResolution } from "../../src/registry/types";

function createManifestWithTransforms(transforms: TransformDef[] = []): ResourceManifest {
  return {
    id: "test",
    name: "Test",
    displayName: "Test",
    version: "1.0.0",
    description: "A test resource",
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
    lifecycleHooks: [],
    variables: [],
    transforms,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("applyTransforms", () => {
  let tmpDir: string;
  const variables: VariableResolution[] = [];

  beforeEach(async () => {
    tmpDir = resolve(
      tmpdir(),
      `transforms-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await fs.ensureDir(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("returns empty results when no transforms", async () => {
    const manifest = createManifestWithTransforms([]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results).toEqual([]);
  });

  it("packageJson merge creates package.json if missing", async () => {
    const manifest = createManifestWithTransforms([
      {
        type: "packageJson",
        target: "package.json",
        action: "merge",
        data: { name: "my-project", dependencies: { lodash: "^4.0.0" } },
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(true);
    expect(results[0]?.message).toBe("Created package.json");

    const pkg = await fs.readJson(resolve(tmpDir, "package.json"));
    expect(pkg.name).toBe("my-project");
    expect(pkg.dependencies.lodash).toBe("^4.0.0");
  });

  it("packageJson merge merges into existing package.json", async () => {
    await fs.writeJson(resolve(tmpDir, "package.json"), {
      name: "existing",
      dependencies: { react: "^18.0.0" },
    });
    const manifest = createManifestWithTransforms([
      {
        type: "packageJson",
        target: "package.json",
        action: "merge",
        data: { dependencies: { lodash: "^4.0.0" } },
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(true);

    const pkg = await fs.readJson(resolve(tmpDir, "package.json"));
    expect(pkg.name).toBe("existing");
    expect(pkg.dependencies.react).toBe("^18.0.0");
    expect(pkg.dependencies.lodash).toBe("^4.0.0");
  });

  it("packageJson replace replaces keys in existing package.json", async () => {
    await fs.writeJson(resolve(tmpDir, "package.json"), {
      name: "old-name",
      version: "0.0.1",
    });
    const manifest = createManifestWithTransforms([
      {
        type: "packageJson",
        target: "package.json",
        action: "replace",
        data: { name: "new-name", version: "1.0.0" },
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(true);

    const pkg = await fs.readJson(resolve(tmpDir, "package.json"));
    expect(pkg.name).toBe("new-name");
    expect(pkg.version).toBe("1.0.0");
  });

  it("packageJson remove removes keys from package.json", async () => {
    await fs.writeJson(resolve(tmpDir, "package.json"), {
      name: "my-project",
      deprecated: true,
      unwanted: "data",
    });
    const manifest = createManifestWithTransforms([
      {
        type: "packageJson",
        target: "package.json",
        action: "remove",
        data: { deprecated: true, unwanted: "data" },
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(true);

    const pkg = await fs.readJson(resolve(tmpDir, "package.json"));
    expect(pkg.name).toBe("my-project");
    expect(pkg.deprecated).toBeUndefined();
    expect(pkg.unwanted).toBeUndefined();
  });

  it("tsConfig merge merges into existing tsconfig.json", async () => {
    await fs.writeJson(resolve(tmpDir, "tsconfig.json"), {
      compilerOptions: { strict: true, target: "ES2020" },
    });
    const manifest = createManifestWithTransforms([
      {
        type: "tsConfig",
        target: "tsconfig.json",
        action: "merge",
        data: { compilerOptions: { esModuleInterop: true } },
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(true);

    const tsconfig = await fs.readJson(resolve(tmpDir, "tsconfig.json"));
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.esModuleInterop).toBe(true);
  });

  it("tsConfig merge fails if tsconfig.json doesn't exist", async () => {
    const manifest = createManifestWithTransforms([
      {
        type: "tsConfig",
        target: "tsconfig.json",
        action: "merge",
        data: { compilerOptions: { esModuleInterop: true } },
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(false);
    expect(results[0]?.message).toContain("not found");
  });

  it("imports replace replaces string in file", async () => {
    await fs.ensureDir(resolve(tmpDir, "src"));
    await fs.writeFile(resolve(tmpDir, "src/index.ts"), 'import { foo } from "./old";\n');
    const manifest = createManifestWithTransforms([
      {
        type: "imports",
        target: "src/index.ts",
        action: "replace",
        data: { find: "./old", replace: "./new" },
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(true);

    const content = await fs.readFile(resolve(tmpDir, "src/index.ts"), "utf-8");
    expect(content).toContain('./new"');
    expect(content).not.toContain('./old"');
  });

  it("imports prepend prepends content to file", async () => {
    await fs.ensureDir(resolve(tmpDir, "src"));
    await fs.writeFile(resolve(tmpDir, "src/index.ts"), 'console.log("hello");\n');
    const manifest = createManifestWithTransforms([
      {
        type: "imports",
        target: "src/index.ts",
        action: "prepend",
        data: { find: "", replace: 'import "./setup";' },
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(true);

    const content = await fs.readFile(resolve(tmpDir, "src/index.ts"), "utf-8");
    expect(content.startsWith('import "./setup";')).toBe(true);
    expect(content).toContain('console.log("hello")');
  });

  it("imports append appends content to file", async () => {
    await fs.ensureDir(resolve(tmpDir, "src"));
    await fs.writeFile(resolve(tmpDir, "src/index.ts"), 'console.log("hello");\n');
    const manifest = createManifestWithTransforms([
      {
        type: "imports",
        target: "src/index.ts",
        action: "append",
        data: { find: "", replace: 'console.log("cleanup");' },
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(true);

    const content = await fs.readFile(resolve(tmpDir, "src/index.ts"), "utf-8");
    expect(content).toContain('console.log("cleanup")');
    expect(content.indexOf("cleanup")).toBeGreaterThan(content.indexOf("hello"));
  });

  it("imports replace fails if file doesn't exist", async () => {
    const manifest = createManifestWithTransforms([
      {
        type: "imports",
        target: "src/nonexistent.ts",
        action: "replace",
        data: { find: "foo", replace: "bar" },
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(false);
    expect(results[0]?.message).toContain("not found");
  });

  it("config remove removes config file", async () => {
    await fs.writeJson(resolve(tmpDir, ".eslintrc.json"), { rules: {} });
    const manifest = createManifestWithTransforms([
      {
        type: "config",
        target: ".eslintrc.json",
        action: "remove",
        data: {},
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(true);
    expect(await fs.pathExists(resolve(tmpDir, ".eslintrc.json"))).toBe(false);
  });

  it("config merge creates config if missing", async () => {
    const manifest = createManifestWithTransforms([
      {
        type: "config",
        target: ".prettierrc.json",
        action: "merge",
        data: { semi: true, singleQuote: true },
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(true);

    const config = await fs.readJson(resolve(tmpDir, ".prettierrc.json"));
    expect(config.semi).toBe(true);
    expect(config.singleQuote).toBe(true);
  });

  it("custom transform always succeeds", async () => {
    const manifest = createManifestWithTransforms([
      {
        type: "custom",
        target: "my-script",
        action: "merge",
        data: {},
        description: "Run custom setup",
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(true);
    expect(results[0]?.type).toBe("custom");
    expect(results[0]?.target).toBe("my-script");
  });

  it("unknown transform type returns failure", async () => {
    const manifest = createManifestWithTransforms([
      {
        type: "unknown" as TransformDef["type"],
        target: "foo",
        action: "merge",
        data: {},
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results[0]?.success).toBe(false);
    expect(results[0]?.message).toContain("Unknown transform type");
  });

  it("results contain correct type/target/action/success/message fields", async () => {
    await fs.writeJson(resolve(tmpDir, "package.json"), { name: "proj" });
    const manifest = createManifestWithTransforms([
      {
        type: "packageJson",
        target: "package.json",
        action: "merge",
        data: { version: "2.0.0" },
      },
    ]);
    const results = await applyTransforms(manifest, tmpDir, variables);
    expect(results).toHaveLength(1);

    const r = results[0];
    expect(r?.type).toBe("packageJson");
    expect(r?.target).toBe("package.json");
    expect(r?.action).toBe("merge");
    expect(r?.success).toBe(true);
    expect(typeof r?.message).toBe("string");
    expect(r?.message.length).toBeGreaterThan(0);
  });
});
