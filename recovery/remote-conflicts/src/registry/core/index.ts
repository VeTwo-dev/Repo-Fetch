import { request } from "undici";
import pRetry from "p-retry";
import { resolve } from "pathe";
import fs from "fs-extra";
import type {
  RegistryConfig,
  RegistryIndex,
  RegistryResourceEntry,
  ResourceManifest,
  RegistryClientOptions,
} from "../types";
import { RegistryIndexSchema, ResourceManifestSchema } from "../schema";
import { logger } from "../../logger";
import { NetworkError, ValidationError } from "../../errors";

const DEFAULT_REGISTRY_CONFIG: RegistryConfig = {
  baseUrl: "https://registry.vetwo.dev",
  cacheDir: resolve(process.env["HOME"] ?? "~", ".vetwo", "registry-cache"),
  cacheTtl: 1000 * 60 * 60,
  timeout: 30000,
  retries: 3,
  offline: false,
  registryPath: "/registry/index.json",
  searchIndexPath: "/registry/search-index.json",
};

export class RegistryClient {
  private config: RegistryConfig;
  private index: RegistryIndex | null = null;
  private indexCachePath: string;

  constructor(options?: RegistryClientOptions) {
    this.config = { ...DEFAULT_REGISTRY_CONFIG, ...options?.config };
    if (options?.token) {
      this.config.token = options.token;
    }
    if (options?.offline !== undefined) {
      this.config.offline = options.offline;
    }
    this.indexCachePath = resolve(this.config.cacheDir, "index.json");
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "@vetwo/repo-fetch",
    };
    if (this.config.token) {
      headers["Authorization"] = `Bearer ${this.config.token}`;
    }
    return headers;
  }

  async getIndex(forceRefresh = false): Promise<RegistryIndex> {
    if (this.index && !forceRefresh) {
      return this.index;
    }

    if (!forceRefresh) {
      const cached = await this.readCachedIndex();
      if (cached) {
        this.index = cached;
        return cached;
      }
    }

    if (this.config.offline) {
      const cached = await this.readCachedIndex();
      if (cached) {
        this.index = cached;
        return cached;
      }
      throw new NetworkError("Offline mode and no cached index available");
    }

    const index = await this.downloadIndex();
    this.index = index;
    await this.writeCachedIndex(index);
    return index;
  }

  private async downloadIndex(): Promise<RegistryIndex> {
    const url = `${this.config.baseUrl}${this.config.registryPath}`;
    logger.step(`Downloading registry index from ${url}`);

    const response = await pRetry(
      async () => {
        const res = await request(url, {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!res.statusCode.toString().startsWith("2")) {
          throw new NetworkError(`Registry returned ${res.statusCode}`);
        }

        const body = (await res.body.json()) as unknown;
        return body;
      },
      { retries: this.config.retries },
    );

    const parsed = RegistryIndexSchema.safeParse(response);
    if (!parsed.success) {
      throw new ValidationError(
        "registry-index",
        `Invalid registry index: ${parsed.error.message}`,
      );
    }

    logger.success(`Registry index downloaded: ${parsed.data.resources.length} resources`);
    return parsed.data;
  }

  private async readCachedIndex(): Promise<RegistryIndex | null> {
    try {
      const exists = await fs.pathExists(this.indexCachePath);
      if (!exists) {
        return null;
      }

      const stat = await fs.stat(this.indexCachePath);
      const age = Date.now() - stat.mtimeMs;
      if (age > this.config.cacheTtl) {
        return null;
      }

      const data = await fs.readJson(this.indexCachePath);
      const parsed = RegistryIndexSchema.safeParse(data);
      if (!parsed.success) {
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  }

  private async writeCachedIndex(index: RegistryIndex): Promise<void> {
    try {
      await fs.ensureDir(this.config.cacheDir);
      await fs.writeJson(this.indexCachePath, index, { spaces: 2 });
    } catch (err) {
      logger.warn(`Failed to cache registry index: ${String(err)}`);
    }
  }

  async getResourceManifest(resource: RegistryResourceEntry): Promise<ResourceManifest> {
    const cachePath = resolve(this.config.cacheDir, "manifests", `${resource.id}.json`);

    const cached = await this.readCachedManifest(cachePath);
    if (cached) {
      return cached;
    }

    const url = `${this.config.baseUrl}${resource.downloadPath}/manifest.json`;
    const response = await pRetry(
      async () => {
        const res = await request(url, {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!res.statusCode.toString().startsWith("2")) {
          throw new NetworkError(`Failed to fetch manifest for ${resource.id}: ${res.statusCode}`);
        }

        return (await res.body.json()) as unknown;
      },
      { retries: this.config.retries },
    );

    const parsed = ResourceManifestSchema.safeParse(response);
    if (!parsed.success) {
      throw new ValidationError(
        "manifest",
        `Invalid manifest for ${resource.id}: ${parsed.error.message}`,
      );
    }

    await this.writeCachedManifest(cachePath, parsed.data);
    return parsed.data;
  }

  private async readCachedManifest(path: string): Promise<ResourceManifest | null> {
    try {
      const exists = await fs.pathExists(path);
      if (!exists) {
        return null;
      }

      const data = await fs.readJson(path);
      const parsed = ResourceManifestSchema.safeParse(data);
      if (!parsed.success) {
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  }

  private async writeCachedManifest(path: string, manifest: ResourceManifest): Promise<void> {
    try {
      await fs.ensureDir(resolve(path, ".."));
      await fs.writeJson(path, manifest, { spaces: 2 });
    } catch {
      // silently fail cache writes
    }
  }

  async clearCache(): Promise<void> {
    await fs.remove(this.config.cacheDir);
    this.index = null;
  }

  getConfig(): RegistryConfig {
    return { ...this.config };
  }
}
