import type { Command } from "commander";
import { resolveRepository } from "../../core/resolver";
import { listRepositoryTree, flattenTree } from "../../core/tree";
import { resolveRepoUrl } from "../../utils";
import type { TreeNode } from "../../types";
import { logger } from "../../logger";

export function registerTreeCommand(program: Command): void {
  program
    .command("tree [repository]")
    .description("Display repository tree")
    .option("-t, --token <token>", "Authentication token")
    .option("-b, --branch <branch>", "Branch name")
    .option("-d, --depth <depth>", "Maximum depth", "10")
    .option("--no-color", "Disable colored output")
    .option("--env-var <name>", "Environment variable name for repo URL", "GITHUB_REPO_URL")
    .option("--no-prompt", "Disable interactive prompt")
    .option("--no-auto-detect", "Disable auto-detection from git remote")
    .action(
      async (
        repository: string,
        options: {
          token?: string;
          branch?: string;
          depth?: string;
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

          logger.step(`Fetching tree for ${repo.owner}/${repo.repo}...`);

          const nodes = await listRepositoryTree(repo, {
            token: options.token,
            branch: options.branch,
          });

          const flat = flattenTree(nodes);
          const maxDepth = Number(options.depth) || 10;

          function printTree(treeNodes: TreeNode[], prefix = ""): void {
            for (let i = 0; i < treeNodes.length; i++) {
              const node = treeNodes[i];
              if (!node) {
                continue;
              }
              const isLast = i === treeNodes.length - 1;
              const connector = isLast ? "└── " : "├── ";
              const icon = node.type === "directory" ? "📁" : "📄";

              if (node.depth <= maxDepth) {
                console.log(`${prefix}${connector}${icon} ${node.name}`);
                if (
                  node.type === "directory" &&
                  node.children.length > 0 &&
                  node.depth < maxDepth
                ) {
                  const newPrefix = prefix + (isLast ? "    " : "│   ");
                  printTree(node.children, newPrefix);
                }
              }
            }
          }

          printTree(nodes);

          const fileCount = flat.filter((n) => n.type === "file").length;
          const dirCount = flat.filter((n) => n.type === "directory").length;
          console.log(`\n${dirCount} directories, ${fileCount} files`);
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
      },
    );
}
