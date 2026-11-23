import fs from "fs-extra";
import { resolve } from "pathe";
import type { RegistryIndex, ResourceManifest } from "../types";
import { RegistryIndexSchema, ResourceManifestSchema } from "../schema";

export interface RegistryCacheConfig {
  dir: string;
  ttl: number;
}

const DEFAULT_CACHE_CONFIG: RegistryCacheConfig = {
  dir: resolve(process.env["HOME"] ?? "~", ".vetwo", "registry-cache"),
  ttl: 1000 * 60 * 60,
};

export class RegistryCache {
  private config: RegistryCacheConfig;
  private indexPath: string;
  private manifestsDir: string;

  constructor(config?: Partial<RegistryCacheConfig>) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.indexPath = resolve(this.config.dir, "index.json");
    this.manifestsDir = resolve(this.config.dir, "manifests");
  }

  async getIndex(): Promise<RegistryIndex | null> {
    try {
      const exists = await fs.pathExists(this.indexPath);
      if (!exists) {
        return null;
      }

      const stat = await fs.stat(this.indexPath);
      const age = Date.now() - stat.mtimeMs;
      if (age > this.config.ttl) {
        return null;
      }

      const data = await fs.readJson(this.indexPath);
      const parsed = RegistryIndexSchema.safeParse(data);
      if (!parsed.success) {
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  }

  async setIndex(index: RegistryIndex): Promise<void> {
    await fs.ensureDir(this.config.dir);
    await fs.writeJson(this.indexPath, index, { spaces: 2 });
  }

  async getManifest(resourceId: string): Promise<ResourceManifest | null> {
    try {
      const path = resolve(this.manifestsDir, `${resourceId}.json`);
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

  async setManifest(resourceId: string, manifest: ResourceManifest): Promise<void> {
    await fs.ensureDir(this.manifestsDir);
    const path = resolve(this.manifestsDir, `${resourceId}.json`);
    await fs.writeJson(path, manifest, { spaces: 2 });
  }

  async hasIndex(): Promise<boolean> {
    const index = await this.getIndex();
    return index !== null;
  }

  async isExpired(): Promise<boolean> {
    try {
      const exists = await fs.pathExists(this.indexPath);
      if (!exists) {
        return true;
      }

      const stat = await fs.stat(this.indexPath);
      const age = Date.now() - stat.mtimeMs;
      return age > this.config.ttl;
    } catch {
      return true;
    }
  }

  async clear(): Promise<void> {
    await fs.remove(this.config.dir);
  }

  async getStats(): Promise<{ size: number; indexAge: number; manifestCount: number }> {
    try {
      const indexExists = await fs.pathExists(this.indexPath);
      let indexAge = 0;
      if (indexExists) {
        const stat = await fs.stat(this.indexPath);
        indexAge = Date.now() - stat.mtimeMs;
      }

      let manifestCount = 0;
      try {
        const entries = await fs.readdir(this.manifestsDir);
        manifestCount = entries.length;
      } catch {
        // no manifests dir
      }

      const dirSize = await this.getDirSize(this.config.dir);

      return { size: dirSize, indexAge, manifestCount };
    } catch {
      return { size: 0, indexAge: 0, manifestCount: 0 };
    }
  }

  private async getDirSize(dir: string): Promise<number> {
    let size = 0;
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = resolve(dir, entry.name);
        if (entry.isDirectory()) {
          size += await this.getDirSize(fullPath);
        } else {
          const stat = await fs.stat(fullPath);
          size += stat.size;
        }
      }
    } catch {
      // ignore
    }
    return size;
  }
}
