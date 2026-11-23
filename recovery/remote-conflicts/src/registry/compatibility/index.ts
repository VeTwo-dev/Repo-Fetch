import { execSync } from "child_process";
import type {
  ResourceManifest,
  CompatibilityReport,
  CompatibilityCheck,
  Runtime,
  Framework,
  PackageManager,
  Architecture,
  OperatingSystem,
} from "../types";
import { logger } from "../../logger";

interface EnvironmentInfo {
  nodeVersion: string;
  bunVersion: string | null;
  os: OperatingSystem;
  architecture: Architecture;
  packageManager: PackageManager;
  framework: Framework;
  runtime: Runtime;
  vetwoVersion: string;
}

export function detectEnvironment(): EnvironmentInfo {
  const nodeVersion = process.version.replace(/^v/, "");
  let bunVersion: string | null = null;
  try {
    bunVersion = execSync("bun --version", {
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    // bun not installed
  }

  const platform = process.platform as string;
  let os: OperatingSystem = "any";
  if (platform === "linux") {
    os = "linux";
  } else if (platform === "darwin") {
    os = "darwin";
  } else if (platform === "win32") {
    os = "win32";
  }

  const arch = process.arch as string;
  let architecture: Architecture = "any";
  if (arch === "x64") {
    architecture = "x64";
  } else if (arch === "arm64") {
    architecture = "arm64";
  }

  let packageManager: PackageManager = "npm";
  const userAgent = process.env["npm_config_user_agent"] ?? "";
  if (userAgent.includes("pnpm")) {
    packageManager = "pnpm";
  } else if (userAgent.includes("yarn")) {
    packageManager = "yarn";
  } else if (userAgent.includes("bun")) {
    packageManager = "bun";
  }

  const framework = detectFramework();
  const runtime = detectRuntime(bunVersion);

  const vetwoVersion = process.env["VETWO_VERSION"] ?? "1.0.0";

  return {
    nodeVersion,
    bunVersion,
    os,
    architecture,
    packageManager,
    framework,
    runtime,
    vetwoVersion,
  };
}

function detectFramework(): Framework {
  try {
    const pkgPath = require.resolve("./package.json", { paths: [process.cwd()] });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require(pkgPath) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (allDeps["next"]) {
      return "next";
    }
    if (allDeps["nuxt"]) {
      return "nuxt";
    }
    if (allDeps["astro"]) {
      return "astro";
    }
    if (allDeps["@angular/core"]) {
      return "angular";
    }
    if (allDeps["svelte"]) {
      return "svelte";
    }
    if (allDeps["vue"]) {
      return "vue";
    }
    if (allDeps["react"]) {
      return "react";
    }
    if (allDeps["solid-js"]) {
      return "solid";
    }
    if (allDeps["express"]) {
      return "express";
    }
    if (allDeps["fastify"]) {
      return "fastify";
    }
    if (allDeps["hono"]) {
      return "hono";
    }
    if (allDeps["elysia"]) {
      return "elysia";
    }
    if (allDeps["@nestjs/core"]) {
      return "nest";
    }
  } catch {
    // no package.json found
  }
  return "any";
}

function detectRuntime(bunVersion: string | null): Runtime {
  if (bunVersion) {
    return "bun";
  }

  const g = globalThis as Record<string, unknown>;
  if (g["Bun"] !== undefined) {
    return "bun";
  }
  if (g["Deno"] !== undefined) {
    return "deno";
  }
  return "node";
}

function versionSatisfies(current: string, range: string): boolean {
  if (range === "*" || range === "any") {
    return true;
  }

  const currentParts = current.split(".").map(Number);
  const rangeParts = range
    .replace(/[><=~^]/g, "")
    .split(".")
    .map(Number);

  if (range.startsWith(">=")) {
    return compareVersions(currentParts, rangeParts) >= 0;
  }
  if (range.startsWith(">")) {
    return compareVersions(currentParts, rangeParts) > 0;
  }
  if (range.startsWith("<=")) {
    return compareVersions(currentParts, rangeParts) <= 0;
  }
  if (range.startsWith("<")) {
    return compareVersions(currentParts, rangeParts) < 0;
  }
  if (range.startsWith("^")) {
    return (
      currentParts[0] === rangeParts[0] &&
      compareVersions(currentParts.slice(1), rangeParts.slice(1)) >= 0
    );
  }
  if (range.startsWith("~")) {
    return (
      currentParts[0] === rangeParts[0] &&
      currentParts[1] === rangeParts[1] &&
      compareVersions(currentParts.slice(2), rangeParts.slice(2)) >= 0
    );
  }

  return current === range;
}

function compareVersions(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    if (aVal > bVal) {
      return 1;
    }
    if (aVal < bVal) {
      return -1;
    }
  }
  return 0;
}

export function checkCompatibility(manifest: ResourceManifest): CompatibilityReport {
  const env = detectEnvironment();

  const runtimeCheck = checkRuntime(manifest, env);
  const frameworkCheck = checkFramework(manifest, env);
  const pmCheck = checkPackageManager(manifest, env);
  const nodeCheck = checkNodeVersion(manifest, env);
  const bunCheck = checkBunVersion(manifest, env);
  const osCheck = checkOS(manifest, env);
  const archCheck = checkArchitecture(manifest, env);
  const vetwoCheck = checkVetwoVersion(manifest, env);

  const warnings: string[] = [];
  const errors: string[] = [];

  if (!runtimeCheck.supported) {
    errors.push(runtimeCheck.message);
  }
  if (!frameworkCheck.supported) {
    warnings.push(frameworkCheck.message);
  }
  if (!pmCheck.supported) {
    warnings.push(pmCheck.message);
  }
  if (!nodeCheck.supported) {
    errors.push(nodeCheck.message);
  }
  if (!bunCheck.supported) {
    warnings.push(bunCheck.message);
  }
  if (!osCheck.supported) {
    errors.push(osCheck.message);
  }
  if (!archCheck.supported) {
    warnings.push(archCheck.message);
  }
  if (!vetwoCheck.supported) {
    errors.push(vetwoCheck.message);
  }

  const compatible = errors.length === 0;

  if (!compatible) {
    logger.warn(`Resource "${manifest.name}" is not compatible with your environment`);
    for (const error of errors) {
      logger.error(`  ${error}`);
    }
  }

  return {
    compatible,
    runtime: runtimeCheck,
    framework: frameworkCheck,
    packageManager: pmCheck,
    nodeVersion: nodeCheck,
    bunVersion: bunCheck,
    os: osCheck,
    architecture: archCheck,
    vetwoVersion: vetwoCheck,
    warnings,
    errors,
  };
}

function checkRuntime(manifest: ResourceManifest, env: EnvironmentInfo): CompatibilityCheck {
  const supported =
    manifest.supportedRuntimes.includes("any") || manifest.supportedRuntimes.includes(env.runtime);
  return {
    supported,
    current: env.runtime,
    required: manifest.supportedRuntimes.join(", "),
    message: supported
      ? `Runtime ${env.runtime} is supported`
      : `Runtime ${env.runtime} is not supported. Required: ${manifest.supportedRuntimes.join(", ")}`,
  };
}

function checkFramework(manifest: ResourceManifest, env: EnvironmentInfo): CompatibilityCheck {
  const supported =
    manifest.supportedFrameworks.includes("any") ||
    manifest.supportedFrameworks.includes(env.framework);
  return {
    supported,
    current: env.framework,
    required: manifest.supportedFrameworks.join(", "),
    message: supported
      ? `Framework ${env.framework} is supported`
      : `Framework ${env.framework} may not be fully supported. Recommended: ${manifest.supportedFrameworks.join(", ")}`,
  };
}

function checkPackageManager(manifest: ResourceManifest, env: EnvironmentInfo): CompatibilityCheck {
  const supported =
    manifest.supportedPackageManagers.includes("any") ||
    manifest.supportedPackageManagers.includes(env.packageManager);
  return {
    supported,
    current: env.packageManager,
    required: manifest.supportedPackageManagers.join(", "),
    message: supported
      ? `Package manager ${env.packageManager} is supported`
      : `Package manager ${env.packageManager} may not be fully supported`,
  };
}

function checkNodeVersion(manifest: ResourceManifest, env: EnvironmentInfo): CompatibilityCheck {
  const required = manifest.engines.node;
  if (!required) {
    return {
      supported: true,
      current: env.nodeVersion,
      required: "*",
      message: "No Node.js version requirement",
    };
  }
  const supported = versionSatisfies(env.nodeVersion, required);
  return {
    supported,
    current: env.nodeVersion,
    required,
    message: supported
      ? `Node.js ${env.nodeVersion} satisfies ${required}`
      : `Node.js ${env.nodeVersion} does not satisfy ${required}`,
  };
}

function checkBunVersion(manifest: ResourceManifest, env: EnvironmentInfo): CompatibilityCheck {
  const required = manifest.engines.bun;
  if (!required) {
    return {
      supported: true,
      current: env.bunVersion ?? "not installed",
      required: "*",
      message: "No Bun version requirement",
    };
  }
  if (!env.bunVersion) {
    return {
      supported: false,
      current: "not installed",
      required,
      message: `Bun is required but not installed (needs ${required})`,
    };
  }
  const supported = versionSatisfies(env.bunVersion, required);
  return {
    supported,
    current: env.bunVersion,
    required,
    message: supported
      ? `Bun ${env.bunVersion} satisfies ${required}`
      : `Bun ${env.bunVersion} does not satisfy ${required}`,
  };
}

function checkOS(_manifest: ResourceManifest, _env: EnvironmentInfo): CompatibilityCheck {
  return {
    supported: true,
    current: process.platform,
    required: "*",
    message: "OS is supported",
  };
}

function checkArchitecture(_manifest: ResourceManifest, env: EnvironmentInfo): CompatibilityCheck {
  return {
    supported: true,
    current: env.architecture,
    required: "any",
    message: "Architecture is supported",
  };
}

function checkVetwoVersion(manifest: ResourceManifest, env: EnvironmentInfo): CompatibilityCheck {
  const required = manifest.vetwo.minVersion;
  const supported = versionSatisfies(env.vetwoVersion, `>=${required}`);
  return {
    supported,
    current: env.vetwoVersion,
    required: `>=${required}`,
    message: supported
      ? `VeTwo ${env.vetwoVersion} satisfies >=${required}`
      : `VeTwo ${env.vetwoVersion} does not satisfy >=${required}`,
  };
}
