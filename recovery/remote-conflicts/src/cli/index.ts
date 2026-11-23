#!/usr/bin/env node
import { program } from "commander";
import { PACKAGE_VERSION } from "../constants";
import { registerCommands } from "./commands";

program
  .name("repo-fetch")
  .description("Download selected files/folders from Git repositories without cloning")
  .version(PACKAGE_VERSION, "-v, --version", "Output the current version")
  .usage("[command] [options] [repository]")
  .helpCommand(false);

registerCommands(program);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.help();
}
