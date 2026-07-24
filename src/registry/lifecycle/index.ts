import { execSync } from "child_process";
import type {
  ResourceManifest,
  LifecycleHookName,
  LifecycleHookDef,
  LifecycleContext,
  LifecycleResult,
} from "../types";
import { logger } from "../../logger";

export async function executeLifecycleHooks(
  manifest: ResourceManifest,
  context: LifecycleContext,
  phase: "install" | "update" | "remove" | "generate",
): Promise<LifecycleResult[]> {
  const results: LifecycleResult[] = [];
  const hooks = getHooksForPhase(manifest, phase);

  for (const hook of hooks) {
    const result = await executeHook(hook, context);
    results.push(result);

    if (!result.success) {
      logger.warn(`Lifecycle hook "${hook.name}" failed: ${result.error}`);
    }
  }

  return results;
}

function getHooksForPhase(
  manifest: ResourceManifest,
  phase: "install" | "update" | "remove" | "generate",
): LifecycleHookDef[] {
  const hookMap: Record<string, LifecycleHookName[]> = {
    install: ["beforeInstall", "afterInstall"],
    update: ["beforeUpdate", "afterUpdate"],
    remove: ["beforeRemove", "afterRemove"],
    generate: ["beforeGenerate", "afterGenerate"],
  };

  const hookNames = hookMap[phase] ?? [];
  return manifest.lifecycleHooks.filter((h) => hookNames.includes(h.name));
}

async function executeHook(
  hook: LifecycleHookDef,
  context: LifecycleContext,
): Promise<LifecycleResult> {
  const startTime = Date.now();

  try {
    logger.step(`Executing ${hook.name}: ${hook.description ?? hook.script}`);

    const env = {
      ...process.env,
      VETWO_RESOURCE_ID: context.resource.id,
      VETWO_RESOURCE_NAME: context.resource.name,
      VETWO_RESOURCE_VERSION: context.resource.version,
      VETWO_PROJECT_PATH: context.projectPath,
    };

    const output = execSync(hook.script, {
      cwd: context.projectPath,
      encoding: "utf-8",
      timeout: 30000,
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const duration = Date.now() - startTime;

    return {
      hook: hook.name,
      success: true,
      duration,
      output: output.trim(),
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    const error = err instanceof Error ? err.message : String(err);

    return {
      hook: hook.name,
      success: false,
      duration,
      output: "",
      error,
    };
  }
}

export function getAvailableHooks(manifest: ResourceManifest): LifecycleHookName[] {
  return manifest.lifecycleHooks.map((h) => h.name);
}

export function hasHook(manifest: ResourceManifest, hookName: LifecycleHookName): boolean {
  return manifest.lifecycleHooks.some((h) => h.name === hookName);
}

export function getHookDescription(
  manifest: ResourceManifest,
  hookName: LifecycleHookName,
): string {
  const hook = manifest.lifecycleHooks.find((h) => h.name === hookName);
  return hook?.description ?? hookName;
}
