import type { Command } from "commander";
import { RegistryClient } from "../../registry";
import { logger } from "../../logger";

export function registerRegistryCommands(program: Command): void {
  const registry = program.command("registry").description("Vetwo Registry commands");

  registry
    .command("search <query>")
    .description("Search the registry for resources")
    .option("-t, --type <type>", "Filter by resource type")
    .option("-c, --category <category>", "Filter by category")
    .option("--tags <tags>", "Filter by tags (comma-separated)")
    .option("-l, --limit <number>", "Maximum results", "20")
    .option("--no-fuzzy", "Disable fuzzy search")
    .option("--registry-url <url>", "Registry base URL")
    .option("--token <token>", "Authentication token")
    .action(
      async (
        query: string,
        options: {
          type?: string;
          category?: string;
          tags?: string;
          limit?: string;
          fuzzy?: boolean;
          registryUrl?: string;
          token?: string;
        },
      ) => {
        try {
          const client = new RegistryClient({
            config: options.registryUrl ? { baseUrl: options.registryUrl } : undefined,
            token: options.token,
          });

          const results = await client.search({
            query,
            type: options.type as never,
            category: options.category,
            tags: options.tags?.split(",").map((t) => t.trim()),
            limit: Number(options.limit) || 20,
            fuzzy: options.fuzzy !== false,
          });

          if (results.length === 0) {
            logger.info(`No results found for "${query}"`);
            return;
          }

          console.log(`\nFound ${results.length} result(s):\n`);
          for (const result of results) {
            const type = result.resource.type.padEnd(15);
            const score = `(${(result.score * 100).toFixed(0)}%)`;
            console.log(`  ${type} ${result.resource.name}@${result.resource.version} ${score}`);
            console.log(`    ${result.resource.description}`);
            console.log(`    by ${result.resource.author} | ${result.resource.license}`);
            console.log("");
          }
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
      },
    );

  registry
    .command("install <resource>")
    .description("Install a resource from the registry")
    .option("-o, --output <path>", "Output directory", "./")
    .option("--dry-run", "Show what would be installed without downloading")
    .option("--force", "Force install even if already installed")
    .option("--skip-compatibility", "Skip compatibility checks")
    .option("--skip-integrity", "Skip integrity verification")
    .option("--skip-lifecycle", "Skip lifecycle hooks")
    .option("--skip-transforms", "Skip AST transforms")
    .option("--registry-url <url>", "Registry base URL")
    .option("--token <token>", "Authentication token")
    .option("--offline", "Use cached data only")
    .action(
      async (
        resource: string,
        options: {
          output?: string;
          dryRun?: boolean;
          force?: boolean;
          skipCompatibility?: boolean;
          skipIntegrity?: boolean;
          skipLifecycle?: boolean;
          skipTransforms?: boolean;
          registryUrl?: string;
          token?: string;
          offline?: boolean;
        },
      ) => {
        try {
          const client = new RegistryClient({
            config: options.registryUrl ? { baseUrl: options.registryUrl } : undefined,
            token: options.token,
            offline: options.offline,
          });

          const report = await client.install(resource, {
            output: options.output ?? "./",
            dryRun: options.dryRun,
            force: options.force,
            skipCompatibility: options.skipCompatibility,
            skipIntegrity: options.skipIntegrity,
            skipLifecycle: options.skipLifecycle,
            skipTransforms: options.skipTransforms,
          });

          const formatted = await client.getReport(report);
          console.log(formatted);
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
      },
    );

  registry
    .command("info <resource>")
    .description("Show detailed information about a resource")
    .option("--registry-url <url>", "Registry base URL")
    .option("--token <token>", "Authentication token")
    .action(
      async (
        resource: string,
        options: {
          registryUrl?: string;
          token?: string;
        },
      ) => {
        try {
          const client = new RegistryClient({
            config: options.registryUrl ? { baseUrl: options.registryUrl } : undefined,
            token: options.token,
          });

          const entry = await client.getById(resource);
          if (!entry) {
            logger.error(`Resource "${resource}" not found`);
            process.exit(1);
          }

          const manifest = await client.getManifest(entry);

          console.log("\nResource Information");
          console.log("=".repeat(60));
          console.log(`  ID:          ${manifest.id}`);
          console.log(`  Name:        ${manifest.name}`);
          console.log(`  Display:     ${manifest.displayName}`);
          console.log(`  Version:     ${manifest.version}`);
          console.log(`  Type:        ${manifest.type}`);
          console.log(`  Category:    ${manifest.category}`);
          console.log(`  Tags:        ${manifest.tags.join(", ")}`);
          console.log(`  Description: ${manifest.description}`);
          console.log(`  Author:      ${manifest.author.name}`);
          console.log(`  License:     ${manifest.license}`);
          console.log(`  Repository:  ${manifest.repository}`);
          console.log(`  Homepage:    ${manifest.homepage}`);
          console.log("");
          console.log(`  Runtimes:    ${manifest.supportedRuntimes.join(", ")}`);
          console.log(`  Frameworks:  ${manifest.supportedFrameworks.join(", ")}`);
          console.log(`  Pkg Manager: ${manifest.supportedPackageManagers.join(", ")}`);
          console.log("");

          if (manifest.dependencies.length > 0) {
            console.log("  Dependencies:");
            for (const dep of manifest.dependencies) {
              console.log(`    - ${dep.name}@${dep.version} (${dep.type})`);
            }
            console.log("");
          }

          if (manifest.variables.length > 0) {
            console.log("  Variables:");
            for (const v of manifest.variables) {
              const req = v.required ? "required" : "optional";
              console.log(`    - ${v.name} (${v.type}, ${req}): ${v.description}`);
            }
            console.log("");
          }

          if (manifest.lifecycleHooks.length > 0) {
            console.log("  Lifecycle Hooks:");
            for (const h of manifest.lifecycleHooks) {
              console.log(`    - ${h.name}: ${h.description ?? h.script}`);
            }
            console.log("");
          }

          if (manifest.examples.length > 0) {
            console.log("  Examples:");
            for (const ex of manifest.examples) {
              console.log(`    - ${ex.title}: ${ex.description}`);
              if (ex.code) {
                console.log(`      ${ex.code}`);
              }
            }
            console.log("");
          }

          console.log("=".repeat(60));
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
      },
    );

  registry
    .command("list")
    .description("List available resources in the registry")
    .option("-t, --type <type>", "Filter by resource type")
    .option("-c, --category <category>", "Filter by category")
    .option("-l, --limit <number>", "Maximum results", "50")
    .option("--registry-url <url>", "Registry base URL")
    .option("--token <token>", "Authentication token")
    .action(
      async (options: {
        type?: string;
        category?: string;
        limit?: string;
        registryUrl?: string;
        token?: string;
      }) => {
        try {
          const client = new RegistryClient({
            config: options.registryUrl ? { baseUrl: options.registryUrl } : undefined,
            token: options.token,
          });

          const index = await client.getIndex();
          let resources = index.resources;

          if (options.type) {
            resources = resources.filter((r) => r.type === options.type);
          }
          if (options.category) {
            resources = resources.filter((r) => r.category === options.category);
          }

          const limit = Number(options.limit) || 50;
          resources = resources.slice(0, limit);

          if (resources.length === 0) {
            logger.info("No resources found");
            return;
          }

          console.log(`\nRegistry Resources (${resources.length}):\n`);
          for (const resource of resources) {
            const type = resource.type.padEnd(15);
            console.log(`  ${type} ${resource.name}@${resource.version}`);
            console.log(`    ${resource.description}`);
            console.log("");
          }
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
      },
    );

  registry
    .command("categories")
    .description("List all categories")
    .option("--registry-url <url>", "Registry base URL")
    .option("--token <token>", "Authentication token")
    .action(async (options: { registryUrl?: string; token?: string }) => {
      try {
        const client = new RegistryClient({
          config: options.registryUrl ? { baseUrl: options.registryUrl } : undefined,
          token: options.token,
        });

        const index = await client.getIndex();
        const categories = getCategories(index);

        console.log("\nCategories:\n");
        for (const cat of categories) {
          console.log(`  ${cat.displayName} (${cat.resourceCount} resources)`);
          console.log(`    ${cat.description}`);
          console.log("");
        }
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  registry
    .command("tags")
    .description("List all tags")
    .option("--registry-url <url>", "Registry base URL")
    .option("--token <token>", "Authentication token")
    .action(async (options: { registryUrl?: string; token?: string }) => {
      try {
        const client = new RegistryClient({
          config: options.registryUrl ? { baseUrl: options.registryUrl } : undefined,
          token: options.token,
        });

        const index = await client.getIndex();
        const tags = getTags(index);

        console.log("\nTags:\n");
        for (const tag of tags) {
          console.log(`  ${tag.name} (${tag.count})`);
        }
        console.log("");
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  registry
    .command("cache")
    .description("Show registry cache statistics")
    .action(async () => {
      try {
        const client = new RegistryClient();
        const stats = await client.getCacheStats();

        console.log("\nRegistry Cache Statistics:");
        console.log(`  Size:        ${(stats.size / 1024).toFixed(1)} KB`);
        console.log(`  Index Age:   ${(stats.indexAge / 1000 / 60).toFixed(1)} minutes`);
        console.log(`  Manifests:   ${stats.manifestCount}`);
        console.log("");
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  registry
    .command("clear-cache")
    .description("Clear registry cache")
    .action(async () => {
      try {
        const client = new RegistryClient();
        await client.clearCache();
        logger.success("Registry cache cleared");
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  registry
    .command("check")
    .description("Check environment compatibility")
    .option("--resource <id>", "Check compatibility with a specific resource")
    .option("--registry-url <url>", "Registry base URL")
    .option("--token <token>", "Authentication token")
    .action(async (options: { resource?: string; registryUrl?: string; token?: string }) => {
      try {
        const { detectEnvironment } = await import("../../registry/compatibility");
        const env = detectEnvironment();

        console.log("\nEnvironment:");
        console.log(`  Node.js:      ${env.nodeVersion}`);
        console.log(`  Bun:          ${env.bunVersion ?? "not installed"}`);
        console.log(`  OS:           ${env.os}`);
        console.log(`  Architecture: ${env.architecture}`);
        console.log(`  Pkg Manager:  ${env.packageManager}`);
        console.log(`  Framework:    ${env.framework}`);
        console.log(`  Runtime:      ${env.runtime}`);
        console.log("");

        if (options.resource) {
          const client = new RegistryClient({
            config: options.registryUrl ? { baseUrl: options.registryUrl } : undefined,
            token: options.token,
          });

          const entry = await client.getById(options.resource);
          if (!entry) {
            logger.error(`Resource "${options.resource}" not found`);
            process.exit(1);
          }

          const manifest = await client.getManifest(entry);
          const report = await client.checkCompatibility(manifest);

          console.log(`Compatibility with ${manifest.name}@${manifest.version}:`);
          console.log(`  Compatible: ${report.compatible ? "Yes" : "No"}`);
          console.log(`  Runtime:    ${report.runtime.supported ? "OK" : "FAIL"}`);
          console.log(`  Framework:  ${report.framework.supported ? "OK" : "WARN"}`);
          console.log(`  Node.js:    ${report.nodeVersion.supported ? "OK" : "FAIL"}`);
          console.log(`  OS:         ${report.os.supported ? "OK" : "FAIL"}`);
          console.log("");

          if (report.warnings.length > 0) {
            console.log("  Warnings:");
            for (const w of report.warnings) {
              console.log(`    - ${w}`);
            }
          }

          if (report.errors.length > 0) {
            console.log("  Errors:");
            for (const e of report.errors) {
              console.log(`    - ${e}`);
            }
          }
        }

        console.log("");
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

function getCategories(index: {
  categories: Array<{ displayName: string; resourceCount: number; description: string }>;
}) {
  return index.categories;
}

function getTags(index: { tags: Array<{ name: string; count: number }> }) {
  return index.tags;
}
