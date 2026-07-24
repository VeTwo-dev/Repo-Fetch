import { describe, it, expect } from "vitest";
import type { ResourceManifest, VariableDef } from "../../src/registry/types";
import {
  resolveVariables,
  applyVariables,
  getRequiredVariables,
  getOptionalVariables,
  validateVariableValue,
} from "../../src/registry/variables";

function createManifestWithVariables(variables: VariableDef[] = []): ResourceManifest {
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
    lifecycleHooks: [],
    variables,
    transforms: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("resolveVariables", () => {
  it("resolves from context when context provided", () => {
    const manifest = createManifestWithVariables([
      { name: "projectName", type: "string", description: "Project name", required: true },
    ]);
    const result = resolveVariables(manifest, { projectName: "my-app" });
    expect(result).toEqual([{ name: "projectName", value: "my-app", source: "context" }]);
  });

  it("falls back to default value when no context", () => {
    const manifest = createManifestWithVariables([
      { name: "port", type: "number", description: "Port", required: false, defaultValue: 3000 },
    ]);
    const result = resolveVariables(manifest);
    expect(result).toEqual([{ name: "port", value: 3000, source: "default" }]);
  });

  it("returns source=prompt when no context, no default, no env", () => {
    const manifest = createManifestWithVariables([
      { name: "name", type: "string", description: "Name", required: true },
    ]);
    const result = resolveVariables(manifest);
    expect(result).toEqual([{ name: "name", value: "", source: "prompt" }]);
  });

  it("resolves from env when VETWO_VAR_{NAME} is set", () => {
    const manifest = createManifestWithVariables([
      { name: "apiKey", type: "string", description: "API key", required: true },
    ]);
    process.env["VETWO_VAR_APIKEY"] = "secret123";
    try {
      const result = resolveVariables(manifest);
      expect(result).toEqual([{ name: "apiKey", value: "secret123", source: "env" }]);
    } finally {
      delete process.env["VETWO_VAR_APIKEY"];
    }
  });

  it("context takes priority over env", () => {
    const manifest = createManifestWithVariables([
      { name: "apiKey", type: "string", description: "API key", required: true },
    ]);
    process.env["VETWO_VAR_APIKEY"] = "from-env";
    try {
      const result = resolveVariables(manifest, { apiKey: "from-context" });
      expect(result).toEqual([{ name: "apiKey", value: "from-context", source: "context" }]);
    } finally {
      delete process.env["VETWO_VAR_APIKEY"];
    }
  });

  it("context takes priority over default", () => {
    const manifest = createManifestWithVariables([
      { name: "port", type: "number", description: "Port", required: false, defaultValue: 3000 },
    ]);
    const result = resolveVariables(manifest, { port: 8080 });
    expect(result).toEqual([{ name: "port", value: 8080, source: "context" }]);
  });
});

describe("applyVariables", () => {
  it("replaces {{ varName }} in template", () => {
    const result = applyVariables("Hello {{ name }}!", [
      { name: "name", value: "World", source: "context" },
    ]);
    expect(result).toBe("Hello World!");
  });

  it("handles multiple variables", () => {
    const result = applyVariables("{{ a }} and {{ b }}", [
      { name: "a", value: "foo", source: "context" },
      { name: "b", value: "bar", source: "context" },
    ]);
    expect(result).toBe("foo and bar");
  });

  it("leaves unmatched patterns unchanged", () => {
    const result = applyVariables("{{ known }} and {{ unknown }}", [
      { name: "known", value: "yes", source: "context" },
    ]);
    expect(result).toBe("yes and {{ unknown }}");
  });

  it("handles regex special chars in variable names", () => {
    const result = applyVariables("{{ my.var }} and {{ my-var }}", [
      { name: "my.var", value: "dotted", source: "context" },
      { name: "my-var", value: "dashed", source: "context" },
    ]);
    expect(result).toBe("dotted and dashed");
  });
});

describe("getRequiredVariables", () => {
  it("returns only required ones", () => {
    const manifest = createManifestWithVariables([
      { name: "a", type: "string", description: "A", required: true },
      { name: "b", type: "string", description: "B", required: false },
      { name: "c", type: "string", description: "C", required: true },
    ]);
    const result = getRequiredVariables(manifest);
    expect(result).toHaveLength(2);
    expect(result.map((v) => v.name)).toEqual(["a", "c"]);
  });
});

describe("getOptionalVariables", () => {
  it("returns only optional ones", () => {
    const manifest = createManifestWithVariables([
      { name: "a", type: "string", description: "A", required: true },
      { name: "b", type: "string", description: "B", required: false },
    ]);
    const result = getOptionalVariables(manifest);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("b");
  });
});

describe("validateVariableValue", () => {
  it("required field with empty value → invalid", () => {
    const variable: VariableDef = {
      name: "name",
      type: "string",
      description: "Name",
      required: true,
    };
    const result = validateVariableValue(variable, "");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("required");
  });

  it("number type with non-number string → invalid", () => {
    const variable: VariableDef = {
      name: "port",
      type: "number",
      description: "Port",
      required: false,
    };
    const result = validateVariableValue(variable, "abc");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("must be a number");
  });

  it("select type with invalid option → invalid", () => {
    const variable: VariableDef = {
      name: "color",
      type: "select",
      description: "Color",
      required: false,
      options: [
        { label: "Red", value: "red" },
        { label: "Blue", value: "blue" },
      ],
    };
    const result = validateVariableValue(variable, "green");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("must be one of");
  });

  it("valid value → valid", () => {
    const variable: VariableDef = {
      name: "name",
      type: "string",
      description: "Name",
      required: true,
    };
    const result = validateVariableValue(variable, "hello");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
