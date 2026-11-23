import type { Command } from "commander";
import { resolveRepository } from "../../core/resolver";
import { downloadSelection } from "../../core/download";
import { listRepositoryTree, selectAll, findNodeByPath } from "../../core/tree";
import { generatePreview, formatPreview } from "../../core/preview";
import { filterTreeNodes } from "../../core/filters";
import { resolveRepoUrl } from "../../utils";
import { logger } from "../../logger";

export function registerDownloadCommand(program: Command): void {
  program
    .command("download [repository]")
    .description("Download files/folders from a repository")
    .option("-t, --token <token>", "Authentication token")
    .option("-b, --branch <branch>", "Branch name")
    .option("-o, --output <path>", "Output directory", "./download")
    .option("--overwrite", "Overwrite existing files")
    .option("--merge", "Merge with existing files")
    .option("--skip-existing", "Skip files that already exist")
    .option("--clean", "Clean output directory before download")
    .option("--concurrency <number>", "Download concurrency", "5")
    .option("--timeout <ms>", "Timeout per file in ms", "30000")
    .option("--retries <number>", "Retry count", "3")
    .option("--yes", "Skip confirmation")
    .option("--path <path>", "Specific path to download")
    .option("--glob <pattern>", "Glob pattern for file selection")
    .option("--ext <extensions>", "File extensions (comma-separated)")
    .option("--env-var <name>", "Environment variable name for repo URL", "GITHUB_REPO_URL")
    .option("--no-prompt", "Disable interactive prompt")
    .option("--no-auto-detect", "Disable auto-detection from git remote")
    .action(async (repository: string | undefined, options: Record<string, string | undefined>) => {
      try {
        if (!repository) {
          const resolved = await resolveRepoUrl({
            envVar: options["env-var"],
            prompt: options["prompt"] !== "false",
            autoDetect: options["auto-detect"] !== "false",
          });
          if (!resolved) {
            logger.error("No repository provided");
            process.exit(1);
          }
          repository = resolved;
        }

        const repo = resolveRepository(repository);
        const branch = options["branch"];

        if (branch) {
          repo.branch = branch;
        }

        logger.step(`Fetching repository tree: ${repo.owner}/${repo.repo}`);
        const nodes = await listRepositoryTree(repo, {
          token: options["token"],
          branch,
        });

        const path = options["path"];

        if (path) {
          const node = findNodeByPath(nodes, path);
          if (node) {
            node.selected = true;
          }
        } else if (options["glob"]) {
          const filtered = filterTreeNodes(nodes, { glob: options["glob"] });
          for (const n of filtered) {
            const node = findNodeByPath(nodes, n.path);
            if (node) {
              node.selected = true;
            }
          }
        } else if (options["ext"]) {
          const exts = options["ext"]
            .split(",")
            .map((e: string) => (e.startsWith(".") ? e : `.${e}`));
          const filtered = filterTreeNodes(nodes, { extensions: exts });
          for (const n of filtered) {
            const node = findNodeByPath(nodes, n.path);
            if (node) {
              node.selected = true;
            }
          }
        } else {
          selectAll(nodes, true);
        }

        const output = options["output"] ?? "./download";
        const preview = generatePreview(nodes, output);
        console.log(formatPreview(preview));

        const yes = options["yes"];
        if (yes === undefined || yes !== "true") {
          const prompts = await import("@clack/prompts");
          const confirmed = await prompts.confirm({
            message: "Continue with download?",
          });
          if (!confirmed) {
            logger.info("Download cancelled");
            process.exit(0);
          }
        }

        logger.step("Downloading...");
        const results = await downloadSelection(nodes, repo, {
          token: options["token"],
          branch,
          output,
          overwrite: options["overwrite"] === "true",
          merge: options["merge"] === "true",
          skipExisting: options["skipExisting"] === "true",
          clean: options["clean"] === "true",
          concurrency: Number(options["concurrency"]) || 5,
          timeout: Number(options["timeout"]) || 30000,
          retries: Number(options["retries"]) || 3,
        });

        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        if (failed > 0) {
          logger.warn(`Downloaded ${successful} files, ${failed} failed`);
        } else {
          logger.success(`Downloaded ${successful} files to ${output}`);
        }

        process.exit(failed > 0 ? 1 : 0);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
