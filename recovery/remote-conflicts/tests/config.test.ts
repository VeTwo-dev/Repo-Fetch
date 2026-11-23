import { describe, it, expect, beforeEach } from "vitest";
import { setConfig, getConfig, resetConfig, validateConfig, defineConfig } from "../src/config";
import { ValidationError } from "../src/errors";

describe("config", () => {
  beforeEach(() => {
    resetConfig();
  });

  it("sets and gets config", () => {
    setConfig({ provider: "github", output: "./downloads" });
    const config = getConfig();
    expect(config.provider).toBe("github");
    expect(config.output).toBe("./downloads");
  });

  it("merges config", () => {
    setConfig({ provider: "github" });
    setConfig({ output: "./custom" });
    const config = getConfig();
    expect(config.provider).toBe("github");
    expect(config.output).toBe("./custom");
  });

  it("resets config", () => {
    setConfig({ provider: "gitlab" });
    resetConfig();
    expect(getConfig()).toEqual({});
  });

  it("validates provider", () => {
    expect(() => validateConfig({ provider: "invalid" as never })).toThrow(ValidationError);
  });

  it("validates concurrency range", () => {
    expect(() => validateConfig({ concurrency: 0 })).toThrow(ValidationError);
    expect(() => validateConfig({ concurrency: 51 })).toThrow(ValidationError);
    expect(() => validateConfig({ concurrency: 5 })).not.toThrow();
  });

  it("validates timeout minimum", () => {
    expect(() => validateConfig({ timeout: 500 })).toThrow(ValidationError);
    expect(() => validateConfig({ timeout: 5000 })).not.toThrow();
  });

  it("validates retries", () => {
    expect(() => validateConfig({ retries: -1 })).toThrow(ValidationError);
    expect(() => validateConfig({ retries: 3 })).not.toThrow();
  });

  it("defineConfig validates and returns config", () => {
    const config = defineConfig({ provider: "github", output: "./download" });
    expect(config.provider).toBe("github");
    expect(config.output).toBe("./download");
  });
});
