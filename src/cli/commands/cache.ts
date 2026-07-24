import type { Command } from "commander";
import { cache } from "../../core/cache";
import { logger } from "../../logger";

export function registerCacheCommand(program: Command): void {
  program
    .command("cache")
    .description("Show cache statistics")
    .action(() => {
      const stats = cache.getStats();
      logger.info(`Cache entries: ${stats.size}/${stats.maxSize}`);

      const entries = cache.entries();
      if (entries.length > 0) {
        logger.info("Cached items:");
        for (const entry of entries) {
          const age = Math.floor((Date.now() - entry.timestamp) / 1000);
          logger.info(`  ${entry.key} (${age}s old)`);
        }
      } else {
        logger.info("Cache is empty");
      }
    });
}
