import type { Command } from "commander";
import { cache } from "../../core/cache";
import { logger } from "../../logger";

export function registerClearCacheCommand(program: Command): void {
  program
    .command("clear-cache")
    .description("Clear all cached data")
    .action(() => {
      cache.clear();
      logger.success("Cache cleared");
    });
}
