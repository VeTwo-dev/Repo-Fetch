import { BasePlugin, globalEmitter, resolveRepository, listRepositoryTree, selectAll, downloadSelection } from "@vetwo/repo-fetch";

class LoggingPlugin extends BasePlugin {
  name = "logging-plugin";
  version = "1.0.0";

  hooks = {
    beforeBrowse: async (ctx) => {
      console.log(`[Plugin] Browsing repository...`, ctx.data);
    },
    afterBrowse: async (ctx) => {
      console.log(`[Plugin] Browsing complete. Found ${(ctx.data.nodes as any[])?.length ?? 0} items`);
    },
    beforeDownload: async (ctx) => {
      console.log(`[Plugin] Starting download of ${(ctx.data.items as any[])?.length ?? 0} files`);
    },
    afterDownload: async (ctx) => {
      const results = ctx.data.results as Array<{ success: boolean }>;
      const successCount = results?.filter((r) => r.success).length ?? 0;
      console.log(`[Plugin] Download complete. ${successCount} files downloaded successfully`);
    },
    beforeWrite: async (ctx) => {
      console.log(`[Plugin] Writing file: ${ctx.data.path as string}`);
    },
    afterWrite: async (ctx) => {
      console.log(`[Plugin] File written: ${ctx.data.path as string}`);
    },
    onError: async (ctx) => {
      console.error(`[Plugin] Error: ${(ctx.data.error as Error)?.message}`);
    },
  };
}

// Register the plugin
const plugin = new LoggingPlugin();
plugin.register();

// Use the API - plugin hooks will fire automatically
async function main(): Promise<void> {
  const repo = resolveRepository("user/repo");
  const tree = await listRepositoryTree(repo);
  selectAll(tree, true);
  await downloadSelection(tree, repo, { output: "./plugin-demo" });
}

main().catch(console.error);
