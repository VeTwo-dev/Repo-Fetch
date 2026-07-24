import type { Command } from "commander";
import { resolveRepository } from "../../core/resolver";
import { getProvider } from "../../providers";
import { formatBytes } from "../../utils";
import { logger } from "../../logger";

export function registerSearchCommand(program: Command): void {
  program
    .command("search <repository> <query>")
    .description("Search files in repository")
    .option("-t, --token <token>", "Authentication token")
    .option("-b, --branch <branch>", "Branch name")
    .option("--case-sensitive", "Case-sensitive search")
    .option("--max <number>", "Maximum results", "50")
    .action(
      async (
        repository: string,
        query: string,
        options: { token?: string; branch?: string; caseSensitive?: boolean; max?: string },
      ) => {
        try {
          const repo = resolveRepository(repository);
          if (options.branch) {
            repo.branch = options.branch;
          }

          logger.step(`Searching "${query}" in ${repo.owner}/${repo.repo}...`);

          const provider = getProvider(repo.provider);
          const results = await provider.search(repo, query, {
            token: options.token,
            branch: options.branch,
          });

          const maxResults = Number(options.max) || 50;
          const limited = results.slice(0, maxResults);

          if (limited.length === 0) {
            logger.info("No results found");
            return;
          }

          console.log(`\nFound ${results.length} result(s):\n`);
          for (const item of limited) {
            const size = item.type === "blob" ? `(${formatBytes(item.size)})` : "";
            console.log(`  📄 ${item.path} ${size}`);
          }

          if (results.length > maxResults) {
            console.log(`\n... and ${results.length - maxResults} more results`);
          }
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
      },
    );
}
