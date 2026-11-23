import type { Command } from "commander";
import pc from "picocolors";
import { request } from "undici";
import { resolve } from "pathe";
import fs from "fs-extra";
import { cache } from "../../core/cache";
import { logger } from "../../logger";
import { GITHUB_API_BASE } from "../../constants";
import type { DoctorResult } from "../../types";

function statusIcon(status: "ok" | "error"): string {
  return status === "ok" ? pc.green("\u2714") : pc.red("\u2716");
}

async function checkInternet(): Promise<DoctorResult["internet"]> {
  try {
    const res = await request("https://github.com", { method: "HEAD" });
    return {
      status: "ok",
      message: `Internet reachable (${res.statusCode})`,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Internet unreachable: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

async function checkApi(): Promise<DoctorResult["api"]> {
  try {
    const res = await request(GITHUB_API_BASE, {
      headers: { "User-Agent": "@vetwo/repo-fetch" },
    });
    const body: Record<string, unknown> = (await res.body.json()) as Record<string, unknown>;
    const rateInfo = body["rate"] as Record<string, unknown> | undefined;
    return {
      status: "ok",
      message: `GitHub API reachable (rate limit remaining: ${String(rateInfo?.["remaining"] ?? "unknown")})`,
    };
  } catch (error) {
    return {
      status: "error",
      message: `GitHub API error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

function checkNodeVersion(): DoctorResult["nodeVersion"] {
  const version = process.version;
  const major = parseInt(version.slice(1).split(".")[0] as string, 10);
  return {
    status: major >= 18 ? "ok" : "error",
    message: `Node.js ${version} (${major >= 18 ? "supported" : "minimum required: 18"})`,
  };
}

async function checkPermissions(): Promise<DoctorResult["permissions"]> {
  try {
    const testDir = resolve(process.cwd(), ".repo-fetch-doctor");
    await fs.ensureDir(testDir);
    await fs.writeFile(resolve(testDir, "test.txt"), "ok");
    await fs.remove(testDir);
    return {
      status: "ok",
      message: "Write permissions in current directory",
    };
  } catch (error) {
    return {
      status: "error",
      message: `Permission issue: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

async function checkOutput(): Promise<DoctorResult["output"]> {
  try {
    const outputDir = resolve(process.cwd(), "download");
    await fs.ensureDir(outputDir);
    return {
      status: "ok",
      message: `Output directory ready: ${outputDir}`,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Output directory issue: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

function checkCache(): DoctorResult["cache"] {
  const stats = cache.getStats();
  return {
    status: stats.size >= 0 ? "ok" : "error",
    message: `Cache healthy (${stats.size}/${stats.maxSize} entries)`,
  };
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Check system health and configuration")
    .action(async () => {
      logger.step("Running system diagnostics...\n");

      const results = await Promise.all([
        checkInternet(),
        checkApi(),
        Promise.resolve(checkNodeVersion()),
        checkPermissions(),
        checkOutput(),
        Promise.resolve(checkCache()),
      ]);

      const labels: (keyof DoctorResult)[] = [
        "internet",
        "api",
        "nodeVersion",
        "permissions",
        "output",
        "cache",
      ];

      const displayLabels: Record<string, string> = {
        internet: "Internet",
        api: "GitHub API",
        nodeVersion: "Node.js",
        permissions: "Permissions",
        output: "Output Directory",
        cache: "Cache",
      };

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i] as string;
        const result = results[i] as DoctorResult[keyof DoctorResult];
        console.log(
          `  ${statusIcon(result.status)} ${displayLabels[label] as string}: ${result.message}`,
        );
      }

      const allOk = results.every((r) => r.status === "ok");
      console.log(
        allOk ? `\n${pc.green("All checks passed!")}` : `\n${pc.yellow("Some checks failed")}`,
      );
    });
}
