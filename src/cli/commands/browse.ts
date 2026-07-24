import type { Command } from "commander";
import { resolveRepository } from "../../core/resolver";
import { browseRepository } from "../../core/browser";
import { resolveRepoUrl } from "../../utils";
import { logger } from "../../logger";

export function registerBrowseCommand(program: Command): void {
  program
    .command("browse [repository]")
    .description("Open interactive repository browser")
    .option("-t, --token <token>", "Authentication token")
    .option("-b, --branch <branch>", "Branch name")
    .option("--env-var <name>", "Environment variable name for repo URL", "GITHUB_REPO_URL")
    .option("--no-prompt", "Disable interactive prompt")
    .option("--no-auto-detect", "Disable auto-detection from git remote")
    .action(
      async (
        repository: string | undefined,
        options: {
          token?: string;
          branch?: string;
          envVar?: string;
          prompt?: boolean;
          autoDetect?: boolean;
        },
      ) => {
        try {
          if (!repository) {
            const resolved = await resolveRepoUrl({
              envVar: options.envVar,
              prompt: options.prompt !== false,
              autoDetect: options.autoDetect !== false,
            });
            if (!resolved) {
              logger.error("No repository provided");
              process.exit(1);
            }
            repository = resolved;
          }

          const repo = resolveRepository(repository);
          if (options.branch) {
            repo.branch = options.branch;
          }

          const nodes = await browseRepository(repo, {
            token: options.token,
            branch: options.branch,
          });

          if (nodes.length > 0) {
            const selected = nodes.filter((n) => n.selected);
            if (selected.length > 0) {
              logger.success(`Selected ${selected.length} items`);
            }
          }
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
      },
    );
}
