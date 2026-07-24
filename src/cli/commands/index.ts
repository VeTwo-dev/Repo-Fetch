import type { Command } from "commander";
import { registerBrowseCommand } from "./browse";
import { registerDownloadCommand } from "./download";
import { registerTreeCommand } from "./tree";
import { registerSearchCommand } from "./search";
import { registerDoctorCommand } from "./doctor";
import { registerCacheCommand } from "./cache";
import { registerClearCacheCommand } from "./clear-cache";
import { registerRegistryCommands } from "./registry";

export function registerCommands(program: Command): void {
  registerBrowseCommand(program);
  registerDownloadCommand(program);
  registerTreeCommand(program);
  registerSearchCommand(program);
  registerDoctorCommand(program);
  registerCacheCommand(program);
  registerClearCacheCommand(program);
  registerRegistryCommands(program);
}
