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
  SearchOptions,
  SearchResult,
  InstallOptions,
  InstallationReport,
  CompatibilityReport,
  DependencyGraph,
  VariableResolution,
} from "./types";
import { RegistryIndexSchema, ResourceManifestSchema } from "./schema";
import { RegistryCache } from "./cache";
import { searchRegistry } from "./search";
import { DependencyResolver } from "./resolver";
import { checkCompatibility } from "./compatibility";
import { resolveVariables, promptVariables } from "./variables";
import { applyTransforms } from "./transforms";
import { verifyIntegrity } from "./integrity";
import { executeLifecycleHooks } from "./lifecycle";
import {
  createReport,
  addInstalledResource,
  addInstalledDependency,
  addWarning,
  addError,
  finalizeReport,
  formatReport,
} from "./report";
import { logger } from "../logger";
import { NetworkError, ValidationError } from "../errors";

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
  private cache: RegistryCache;
  private index: RegistryIndex | null = null;

  constructor(options?: RegistryClientOptions) {
    this.config = { ...DEFAULT_REGISTRY_CONFIG, ...options?.config };
    if (options?.token) {
      this.config.token = options.token;
    }
    if (options?.offline !== undefined) {
      this.config.offline = options.offline;
    }
    this.cache = new RegistryCache({
      dir: this.config.cacheDir,
      ttl: this.config.cacheTtl,
    });
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
      const cached = await this.cache.getIndex();
      if (cached) {
        this.index = cached;
        return cached;
      }
    }

    if (this.config.offline) {
      const cached = await this.cache.getIndex();
      if (cached) {
        this.index = cached;
        return cached;
      }
      throw new NetworkError("Offline mode and no cached index available");
    }

    const index = await this.downloadIndex();
    this.index = index;
    await this.cache.setIndex(index);
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

        return (await res.body.json()) as unknown;
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

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const index = await this.getIndex();
    return searchRegistry(index, options);
  }

  async getById(id: string): Promise<RegistryResourceEntry | undefined> {
    const index = await this.getIndex();
    return index.resources.find((r) => r.id === id);
  }

  async getManifest(resource: RegistryResourceEntry): Promise<ResourceManifest> {
    const cached = await this.cache.getManifest(resource.id);
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

    await this.cache.setManifest(resource.id, parsed.data);
    return parsed.data;
  }

  async checkCompatibility(manifest: ResourceManifest): Promise<CompatibilityReport> {
    return checkCompatibility(manifest);
  }

  async resolveDependencies(manifest: ResourceManifest): Promise<DependencyGraph> {
    const index = await this.getIndex();
    const resolver = new DependencyResolver(index);

    const allDeps = [
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
      ...manifest.peerDependencies,
    ];

    for (const dep of allDeps) {
      const entry = index.resources.find((r) => r.id === dep.id);
      if (entry) {
        try {
          const depManifest = await this.getManifest(entry);
          resolver.setManifest(dep.id, depManifest);
        } catch {
          // skip manifests that fail to load
        }
      }
    }

    return resolver.resolve(manifest);
  }

  async install(resourceId: string, options: InstallOptions): Promise<InstallationReport> {
    const report = createReport();

    try {
      const resource = await this.getById(resourceId);
      if (!resource) {
        addError(report, "RESOURCE_NOT_FOUND", `Resource "${resourceId}" not found in registry`);
        finalizeReport(report);
        return report;
      }

      logger.step(`Installing ${resource.name}@${resource.version}`);

      const manifest = await this.getManifest(resource);

      if (!options.skipCompatibility) {
        const compatibility = await this.checkCompatibility(manifest);
        report.compatibility = compatibility;

        if (!compatibility.compatible) {
          addError(report, "INCOMPATIBLE", `Resource is not compatible with your environment`);
          for (const error of compatibility.errors) {
            addWarning(report, "COMPATIBILITY", error);
          }
          finalizeReport(report);
          return report;
        }
      }

      const graph = await this.resolveDependencies(manifest);

      if (graph.cycles.length > 0) {
        addError(report, "CIRCULAR_DEPENDENCY", `Circular dependencies detected`);
        finalizeReport(report);
        return report;
      }

      const missingDeps = graph.nodes.filter((n) => !n.resolved && n.type === "required");
      if (missingDeps.length > 0) {
        for (const dep of missingDeps) {
          addError(report, "MISSING_DEPENDENCY", `Required dependency "${dep.name}" not found`);
        }
        finalizeReport(report);
        return report;
      }

      let variables: VariableResolution[] = [];
      if (manifest.variables.length > 0) {
        if (options.variables) {
          variables = resolveVariables(manifest, options.variables);
          const unresolved = variables.filter((v) => v.source === "prompt");
          if (unresolved.length > 0) {
            variables = await promptVariables(manifest, options.variables);
          }
        } else {
          variables = await promptVariables(manifest);
        }
      }

      const outputPath = resolve(options.output, manifest.name);
      await fs.ensureDir(outputPath);

      if (!options.dryRun) {
        const downloadUrl = `${this.config.baseUrl}${manifest.downloadPath}`;
        await this.downloadResource(downloadUrl, outputPath, manifest, report);
      }

      if (!options.skipIntegrity) {
        const integrity = await verifyIntegrity(manifest, outputPath);
        report.integrity.push(integrity);

        if (!integrity.valid) {
          addError(report, "INTEGRITY_CHECK_FAILED", `Integrity verification failed`);
        }
      }

      if (!options.skipTransforms && manifest.transforms.length > 0) {
        const transformResults = await applyTransforms(manifest, options.output, variables);
        report.transformResults = transformResults;

        const failedTransforms = transformResults.filter((r) => !r.success);
        if (failedTransforms.length > 0) {
          for (const t of failedTransforms) {
            addWarning(report, "TRANSFORM_FAILED", `Transform failed: ${t.message}`);
          }
        }
      }

      if (!options.skipLifecycle) {
        const lifecycleResults = await executeLifecycleHooks(
          manifest,
          {
            resource: manifest,
            projectPath: options.output,
            variables,
            transforms: report.transformResults,
            dependencies: graph,
          },
          "install",
        );
        report.lifecycleResults = lifecycleResults;

        const failedHooks = lifecycleResults.filter((r) => !r.success);
        if (failedHooks.length > 0) {
          for (const h of failedHooks) {
            addWarning(report, "LIFECYCLE_FAILED", `Lifecycle hook "${h.hook}" failed: ${h.error}`);
          }
        }
      }

      addInstalledResource(report, manifest, outputPath, [], true);

      for (const dep of graph.nodes.filter((n) => n.resolved && n.type === "required")) {
        addInstalledDependency(report, dep, resolve(outputPath, "node_modules", dep.name));
      }

      logger.success(`Installed ${manifest.name}@${manifest.version}`);
    } catch (err) {
      addError(
        report,
        "INSTALL_ERROR",
        err instanceof Error ? err.message : String(err),
        resourceId,
        err instanceof Error ? err.stack : undefined,
      );
    }

    finalizeReport(report);
    return report;
  }

  private async downloadResource(
    url: string,
    outputPath: string,
    manifest: ResourceManifest,
    report: InstallationReport,
  ): Promise<void> {
    const response = await pRetry(
      async () => {
        const res = await request(url, {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!res.statusCode.toString().startsWith("2")) {
          throw new NetworkError(`Failed to download ${manifest.name}: ${res.statusCode}`);
        }

        return res;
      },
      { retries: this.config.retries },
    );

    const chunks: Buffer[] = [];
    for await (const chunk of response.body) {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
    const buffer = Buffer.concat(chunks);

    const archivePath = resolve(outputPath, `${manifest.name}.tar.gz`);
    await fs.writeFile(archivePath, buffer);

    report.installedFiles.push(archivePath);
  }

  async getReport(report: InstallationReport): Promise<string> {
    return formatReport(report);
  }

  async clearCache(): Promise<void> {
    await this.cache.clear();
    this.index = null;
  }

  async getCacheStats() {
    return this.cache.getStats();
  }

  getConfig(): RegistryConfig {
    return { ...this.config };
  }
}

export {
  searchRegistry,
  searchByCategory,
  searchByTag,
  searchByType,
  getCategories,
  getTags,
  getPopularResources,
} from "./search";

export { DependencyResolver } from "./resolver";
export { checkCompatibility, detectEnvironment } from "./compatibility";
export { resolveVariables, promptVariables, applyVariables } from "./variables";
export { applyTransforms } from "./transforms";
export {
  verifyIntegrity,
  computeHash,
  computeFileHash,
  computeDirectoryHash,
  generateChecksum,
} from "./integrity";
export { executeLifecycleHooks, getAvailableHooks, hasHook } from "./lifecycle";
export {
  createReport,
  addInstalledResource,
  addInstalledDependency,
  addWarning,
  addError,
  addSkipped,
  finalizeReport,
  formatReport,
  printReport,
} from "./report";
export { RegistryCache } from "./cache";
export { RegistryIndexSchema, ResourceManifestSchema } from "./schema";

export type {
  ResourceType,
  Runtime,
  Framework,
  PackageManager,
  Architecture,
  OperatingSystem,
  ResourceManifest,
  ResourceAuthor,
  ResourceEngines,
  VetwoCompatibility,
  ResourceDependency,
  ResourceConflict,
  ResourceChecksum,
  ResourceExample,
  LifecycleHookName,
  LifecycleHookDef,
  VariableDef,
  TransformDef,
  RegistryIndex,
  RegistryResourceEntry,
  CategoryEntry,
  TagEntry,
  SearchIndexEntry,
  SearchResult,
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  CompatibilityReport,
  CompatibilityCheck,
  VariableContext,
  VariableResolution,
  TransformContext,
  TransformResult,
  IntegrityResult,
  LifecycleContext,
  LifecycleResult,
  InstallationReport,
  InstalledResource,
  InstalledDependency,
  InstallationWarning,
  InstallationError,
  SkippedResource,
  RegistryConfig,
  RegistryClientOptions,
  InstallOptions,
  SearchOptions,
  RegistryEventName,
  RegistryEventHandler,
} from "./types";
