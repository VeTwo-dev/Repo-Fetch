import fs from "fs-extra";
import { resolve } from "pathe";
import type {
  ResourceManifest,
  TransformDef,
  TransformContext,
  TransformResult,
  VariableResolution,
} from "../types";
import { logger } from "../../logger";

export async function applyTransforms(
  manifest: ResourceManifest,
  projectPath: string,
  variables: VariableResolution[],
): Promise<TransformResult[]> {
  const results: TransformResult[] = [];
  const context: TransformContext = { projectPath, variables, manifest };

  for (const transform of manifest.transforms) {
    try {
      const result = await applyTransform(transform, context);
      results.push(result);
    } catch (err) {
      results.push({
        type: transform.type,
        target: transform.target,
        action: transform.action,
        success: false,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

async function applyTransform(
  transform: TransformDef,
  context: TransformContext,
): Promise<TransformResult> {
  switch (transform.type) {
    case "packageJson":
      return transformPackageJson(transform, context);
    case "tsConfig":
      return transformTsConfig(transform, context);
    case "imports":
      return transformImports(transform, context);
    case "routes":
      return transformRoutes(transform, context);
    case "config":
      return transformConfig(transform, context);
    case "custom":
      return transformCustom(transform, context);
    default:
      return {
        type: transform.type,
        target: transform.target,
        action: transform.action,
        success: false,
        message: `Unknown transform type: ${transform.type}`,
      };
  }
}

async function transformPackageJson(
  transform: TransformDef,
  context: TransformContext,
): Promise<TransformResult> {
  const targetPath = resolve(context.projectPath, transform.target);
  const backupPath = `${targetPath}.bak`;

  try {
    if (transform.action === "remove") {
      if (await fs.pathExists(targetPath)) {
        await fs.copy(targetPath, backupPath);
        const pkg = (await fs.readJson(targetPath)) as Record<string, unknown>;
        const data = transform.data as Record<string, unknown>;
        for (const key of Object.keys(data)) {
          delete pkg[key];
        }
        await fs.writeJson(targetPath, pkg, { spaces: 2 });
      }
      return successResult(transform, "Removed keys from package.json");
    }

    if (!(await fs.pathExists(targetPath))) {
      if (transform.action === "merge") {
        await fs.writeJson(targetPath, transform.data, { spaces: 2 });
        return successResult(transform, "Created package.json");
      }
      return failResult(transform, "package.json not found");
    }

    await fs.copy(targetPath, backupPath);
    const pkg = (await fs.readJson(targetPath)) as Record<string, unknown>;
    const data = transform.data as Record<string, Record<string, unknown>>;

    switch (transform.action) {
      case "merge": {
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            pkg[key] = { ...(pkg[key] as Record<string, unknown>), ...value };
          } else {
            pkg[key] = value;
          }
        }
        break;
      }
      case "prepend": {
        const dependencies = pkg["dependencies"] as Record<string, string> | undefined;
        const devDependencies = pkg["devDependencies"] as Record<string, string> | undefined;
        if (data["dependencies"] && dependencies) {
          pkg["dependencies"] = {
            ...(data["dependencies"] as Record<string, string>),
            ...dependencies,
          };
        }
        if (data["devDependencies"] && devDependencies) {
          pkg["devDependencies"] = {
            ...(data["devDependencies"] as Record<string, string>),
            ...devDependencies,
          };
        }
        break;
      }
      case "append": {
        const dependencies = pkg["dependencies"] as Record<string, string> | undefined;
        const devDependencies = pkg["devDependencies"] as Record<string, string> | undefined;
        if (data["dependencies"] && dependencies) {
          pkg["dependencies"] = {
            ...dependencies,
            ...(data["dependencies"] as Record<string, string>),
          };
        }
        if (data["devDependencies"] && devDependencies) {
          pkg["devDependencies"] = {
            ...devDependencies,
            ...(data["devDependencies"] as Record<string, string>),
          };
        }
        break;
      }
      case "replace": {
        for (const [key, value] of Object.entries(data)) {
          pkg[key] = value;
        }
        break;
      }
    }

    await fs.writeJson(targetPath, pkg, { spaces: 2 });
    return successResult(transform, `Applied ${transform.action} to package.json`);
  } catch (err) {
    if (await fs.pathExists(backupPath)) {
      await fs.copy(backupPath, targetPath);
      await fs.remove(backupPath);
    }
    return failResult(transform, err instanceof Error ? err.message : String(err));
  }
}

async function transformTsConfig(
  transform: TransformDef,
  context: TransformContext,
): Promise<TransformResult> {
  const targetPath = resolve(context.projectPath, transform.target);
  const backupPath = `${targetPath}.bak`;

  try {
    if (!(await fs.pathExists(targetPath))) {
      return failResult(transform, "tsconfig.json not found");
    }

    await fs.copy(targetPath, backupPath);
    const tsconfig = (await fs.readJson(targetPath)) as Record<string, unknown>;
    const data = transform.data as Record<string, unknown>;

    switch (transform.action) {
      case "merge": {
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            tsconfig[key] = { ...(tsconfig[key] as Record<string, unknown>), ...value };
          } else {
            tsconfig[key] = value;
          }
        }
        break;
      }
      case "replace": {
        for (const [key, value] of Object.entries(data)) {
          tsconfig[key] = value;
        }
        break;
      }
      default:
        return failResult(transform, `Unsupported action "${transform.action}" for tsConfig`);
    }

    await fs.writeJson(targetPath, tsconfig, { spaces: 2 });
    return successResult(transform, `Applied ${transform.action} to tsconfig.json`);
  } catch (err) {
    if (await fs.pathExists(backupPath)) {
      await fs.copy(backupPath, targetPath);
      await fs.remove(backupPath);
    }
    return failResult(transform, err instanceof Error ? err.message : String(err));
  }
}

async function transformImports(
  transform: TransformDef,
  context: TransformContext,
): Promise<TransformResult> {
  const targetPath = resolve(context.projectPath, transform.target);

  try {
    if (!(await fs.pathExists(targetPath))) {
      return failResult(transform, `File not found: ${transform.target}`);
    }

    let content = await fs.readFile(targetPath, "utf-8");
    const data = transform.data as { find: string; replace: string };

    switch (transform.action) {
      case "replace": {
        content = content.split(data.find).join(data.replace);
        break;
      }
      case "prepend": {
        content = `${data.replace}\n${content}`;
        break;
      }
      case "append": {
        content = `${content}\n${data.replace}`;
        break;
      }
      default:
        return failResult(transform, `Unsupported action "${transform.action}" for imports`);
    }

    await fs.writeFile(targetPath, content, "utf-8");
    return successResult(transform, `Applied ${transform.action} to ${transform.target}`);
  } catch (err) {
    return failResult(transform, err instanceof Error ? err.message : String(err));
  }
}

async function transformRoutes(
  transform: TransformDef,
  context: TransformContext,
): Promise<TransformResult> {
  return transformImports(transform, context);
}

async function transformConfig(
  transform: TransformDef,
  context: TransformContext,
): Promise<TransformResult> {
  const targetPath = resolve(context.projectPath, transform.target);

  try {
    const exists = await fs.pathExists(targetPath);

    if (transform.action === "remove" && exists) {
      await fs.remove(targetPath);
      return successResult(transform, `Removed ${transform.target}`);
    }

    if (!exists) {
      await fs.ensureDir(resolve(targetPath, ".."));
      await fs.writeJson(targetPath, transform.data, { spaces: 2 });
      return successResult(transform, `Created ${transform.target}`);
    }

    const backupPath = `${targetPath}.bak`;
    await fs.copy(targetPath, backupPath);

    const config = (await fs.readJson(targetPath)) as Record<string, unknown>;
    const data = transform.data as Record<string, unknown>;

    for (const [key, value] of Object.entries(data)) {
      config[key] = value;
    }

    await fs.writeJson(targetPath, config, { spaces: 2 });
    return successResult(transform, `Updated ${transform.target}`);
  } catch (err) {
    return failResult(transform, err instanceof Error ? err.message : String(err));
  }
}

async function transformCustom(
  transform: TransformDef,
  _context: TransformContext,
): Promise<TransformResult> {
  logger.info(`Custom transform: ${transform.description ?? transform.target}`);
  return successResult(transform, `Custom transform executed: ${transform.target}`);
}

function successResult(transform: TransformDef, message: string): TransformResult {
  return {
    type: transform.type,
    target: transform.target,
    action: transform.action,
    success: true,
    message,
  };
}

function failResult(transform: TransformDef, message: string): TransformResult {
  return {
    type: transform.type,
    target: transform.target,
    action: transform.action,
    success: false,
    message,
  };
}
