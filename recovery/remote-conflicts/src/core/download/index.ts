import fs from "fs-extra";
import { request } from "undici";
import pLimit from "p-limit";
import pRetry from "p-retry";
import { resolve } from "pathe";
import type {
  RepoIdentifier,
  TreeNode,
  DownloadItem,
  DownloadResult,
  DownloadOptions,
  FetchOptions,
} from "../../types";
import { getProvider } from "../../providers";
import type { Provider } from "../../providers/types";
import { getSelectedDownloadItems } from "../selection";
import { expandSelectionToChildren } from "../selection";
import { globalEmitter } from "../../events";
import { ProgressTracker } from "../progress";
import { DEFAULT_CONCURRENCY, DEFAULT_MAX_RETRIES } from "../../constants";
import { NetworkError, PermissionDeniedError } from "../../errors";

async function downloadSingleFile(
  provider: Provider,
  repo: RepoIdentifier,
  item: DownloadItem,
  outputDir: string,
  options: DownloadOptions,
): Promise<DownloadResult> {
  const startTime = Date.now();
  const filePath = resolve(outputDir, item.path);

  try {
    if (!options.overwrite && !options.merge) {
      try {
        await fs.access(filePath);
        if (options.skipExisting) {
          return { success: true, path: filePath, bytes: 0, elapsed: 0 };
        }
        return { success: true, path: filePath, bytes: 0, elapsed: 0 };
      } catch {
        // File does not exist, proceed
      }
    }

    if (options.clean) {
      await fs.remove(outputDir);
    }

    await fs.ensureDir(resolve(outputDir, item.path.split("/").slice(0, -1).join("/")));

    const response = await pRetry(
      async () => {
        const res = await request(item.url, {
          method: "GET",
          headers: {
            "User-Agent": "@vetwo/repo-fetch",
          },
          signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined,
        });

        if (res.statusCode === 403) {
          throw new PermissionDeniedError(item.path);
        }
        if (!res.statusCode.toString().startsWith("2")) {
          throw new NetworkError(`Download failed for ${item.path}: ${res.statusCode}`);
        }

        return res;
      },
      { retries: options.retries ?? DEFAULT_MAX_RETRIES },
    );

    const chunks: Buffer[] = [];
    for await (const chunk of response.body) {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
    const buffer = Buffer.concat(chunks);

    await fs.writeFile(filePath, buffer);

    return {
      success: true,
      path: filePath,
      bytes: buffer.length,
      elapsed: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      path: filePath,
      bytes: 0,
      elapsed: Date.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

function mergeOptions(
  a: (DownloadOptions & FetchOptions) | undefined,
  _b: Partial<DownloadOptions>,
): DownloadOptions {
  const output = a?.output ?? "./download";
  return {
    output,
    overwrite: a?.overwrite,
    merge: a?.merge,
    skipExisting: a?.skipExisting,
    clean: a?.clean,
    concurrency: a?.concurrency,
    timeout: a?.timeout,
    retries: a?.retries,
  };
}

export async function downloadFile(
  repo: RepoIdentifier,
  filePath: string,
  options?: DownloadOptions & FetchOptions,
): Promise<DownloadResult> {
  const provider = getProvider(repo.provider);
  const url = provider.getDownloadUrl(repo, filePath, options);
  const outputDir = options?.output ?? "./download";

  const item: DownloadItem = {
    path: filePath,
    url,
    size: 0,
    type: "file",
  };

  return downloadSingleFile(provider, repo, item, outputDir, mergeOptions(options, {}));
}

export async function downloadFolder(
  repo: RepoIdentifier,
  folderPath: string,
  options?: DownloadOptions & FetchOptions,
): Promise<DownloadResult[]> {
  const provider = getProvider(repo.provider);
  const tree = await provider.getTree(repo, options);
  const folderFiles = tree.filter(
    (item) => item.type === "blob" && item.path.startsWith(folderPath),
  );

  const items: DownloadItem[] = folderFiles.map((item) => ({
    path: item.path,
    url: provider.getDownloadUrl(repo, item.path, options),
    size: item.size,
    type: "file" as const,
  }));

  return downloadItemsImpl(items, repo, options);
}

export async function downloadSelection(
  nodes: TreeNode[],
  repo: RepoIdentifier,
  options?: DownloadOptions & FetchOptions,
): Promise<DownloadResult[]> {
  expandSelectionToChildren(nodes);
  const provider = getProvider(repo.provider);
  const items = getSelectedDownloadItems(nodes).map((item) => ({
    ...item,
    url: provider.getDownloadUrl(repo, item.path, options),
  }));

  return downloadItemsImpl(items, repo, options);
}

async function downloadItemsImpl(
  items: DownloadItem[],
  repo: RepoIdentifier,
  options?: DownloadOptions & FetchOptions,
): Promise<DownloadResult[]> {
  const outputDir = options?.output ?? "./download";
  const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;
  const limit = pLimit(concurrency);
  const tracker = new ProgressTracker();

  const totalBytes = items.reduce((acc, item) => acc + item.size, 0);
  tracker.start(items.length, totalBytes);

  await globalEmitter.emit("beforeDownload", {
    repo,
    items,
    options,
  });

  const results: DownloadResult[] = [];

  const tasks = items.map((item) =>
    limit(async () => {
      const provider = getProvider(repo.provider);
      const result = await downloadSingleFile(
        provider,
        repo,
        item,
        outputDir,
        mergeOptions(options, {}),
      );
      if (result.success) {
        tracker.update(item.path, result.bytes);
      } else {
        tracker.fail(item.path);
      }
      results.push(result);
      return result;
    }),
  );

  await Promise.all(tasks);

  tracker.succeed();

  await globalEmitter.emit("afterDownload", {
    repo,
    items,
    results,
  });

  return results;
}

export async function downloadItems(
  items: DownloadItem[],
  repo: RepoIdentifier,
  options?: DownloadOptions & FetchOptions,
): Promise<DownloadResult[]> {
  return downloadItemsImpl(items, repo, options);
}

export async function fetchRepo(
  repo: RepoIdentifier,
  options?: FetchOptions & DownloadOptions,
): Promise<DownloadResult[]> {
  const provider = getProvider(repo.provider);
  const tree = await provider.getTree(repo, options);
  const { buildTree } = await import("../tree");
  const nodes = buildTree(tree);

  return downloadSelection(nodes, repo, options);
}

export async function fetchFiles(
  repo: RepoIdentifier,
  paths: string[],
  options?: DownloadOptions & FetchOptions,
): Promise<DownloadResult[]> {
  const provider = getProvider(repo.provider);
  const items: DownloadItem[] = paths.map((path) => ({
    path,
    url: provider.getDownloadUrl(repo, path, options),
    size: 0,
    type: "file" as const,
  }));

  return downloadItemsImpl(items, repo, options);
}

export async function fetchFolders(
  repo: RepoIdentifier,
  folders: string[],
  options?: DownloadOptions & FetchOptions,
): Promise<DownloadResult[]> {
  const results: DownloadResult[] = [];
  for (const folder of folders) {
    const res = await downloadFolder(repo, folder, options);
    results.push(...res);
  }
  return results;
}
