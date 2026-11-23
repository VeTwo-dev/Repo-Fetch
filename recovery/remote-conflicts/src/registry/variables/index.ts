import type { ResourceManifest, VariableDef, VariableContext, VariableResolution } from "../types";

export function resolveVariables(
  manifest: ResourceManifest,
  context?: VariableContext,
): VariableResolution[] {
  const resolutions: VariableResolution[] = [];

  for (const variable of manifest.variables) {
    const value = resolveVariable(variable, context);
    resolutions.push(value);
  }

  return resolutions;
}

function resolveVariable(variable: VariableDef, context?: VariableContext): VariableResolution {
  if (context) {
    const ctxValue = context[variable.name];
    if (ctxValue !== undefined) {
      return {
        name: variable.name,
        value: ctxValue,
        source: "context",
      };
    }
  }

  const envKey = `VETWO_VAR_${variable.name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  const envValue = process.env[envKey];
  if (envValue !== undefined) {
    return {
      name: variable.name,
      value: castValue(envValue, variable.type),
      source: "env",
    };
  }

  if (variable.defaultValue !== undefined) {
    return {
      name: variable.name,
      value: variable.defaultValue,
      source: "default",
    };
  }

  return {
    name: variable.name,
    value: "",
    source: "prompt",
  };
}

function castValue(value: string, type: VariableDef["type"]): string | number | boolean {
  switch (type) {
    case "number":
      return Number(value) || 0;
    case "boolean":
      return value === "true" || value === "1";
    default:
      return value;
  }
}

export async function promptVariables(
  manifest: ResourceManifest,
  context?: VariableContext,
): Promise<VariableResolution[]> {
  const prompts = await import("@clack/prompts");
  const resolutions: VariableResolution[] = [];

  for (const variable of manifest.variables) {
    const existing = resolveVariable(variable, context);

    if (existing.source !== "prompt") {
      resolutions.push(existing);
      continue;
    }

    let value: string | number | boolean;

    if (variable.type === "select" && variable.options) {
      const result = await prompts.select({
        message: variable.prompt ?? variable.description,
        options: variable.options.map((opt) => ({
          label: opt.label,
          value: opt.value,
        })),
        initialValue: variable.defaultValue as string | undefined,
      });

      if (prompts.isCancel(result)) {
        throw new Error("Cancelled by user");
      }
      value = result as string;
    } else if (variable.type === "boolean") {
      const result = await prompts.confirm({
        message: variable.prompt ?? variable.description,
        initialValue: variable.defaultValue as boolean | undefined,
      });

      if (prompts.isCancel(result)) {
        throw new Error("Cancelled by user");
      }
      value = result as boolean;
    } else if (variable.type === "number") {
      const result = await prompts.text({
        message: variable.prompt ?? variable.description,
        placeholder: String(variable.defaultValue ?? ""),
        validate: (val) => {
          if (variable.required && !val?.trim()) {
            return "Required";
          }
          if (val && isNaN(Number(val))) {
            return "Must be a number";
          }
          return undefined;
        },
      });

      if (prompts.isCancel(result)) {
        throw new Error("Cancelled by user");
      }
      value = Number(result as string) || (variable.defaultValue as number) || 0;
    } else {
      const result = await prompts.text({
        message: variable.prompt ?? variable.description,
        placeholder: String(variable.defaultValue ?? ""),
        defaultValue: variable.defaultValue as string | undefined,
        validate: (val) => {
          if (variable.required && !val?.trim()) {
            return "Required";
          }
          return undefined;
        },
      });

      if (prompts.isCancel(result)) {
        throw new Error("Cancelled by user");
      }
      value = (result as string) || (variable.defaultValue as string) || "";
    }

    resolutions.push({
      name: variable.name,
      value,
      source: "prompt",
    });
  }

  return resolutions;
}

export function applyVariables(template: string, variables: VariableResolution[]): string {
  let result = template;

  for (const variable of variables) {
    const pattern = new RegExp(`\\{\\{\\s*${escapeRegex(variable.name)}\\s*\\}\\}`, "g");
    result = result.replace(pattern, String(variable.value));
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getRequiredVariables(manifest: ResourceManifest): VariableDef[] {
  return manifest.variables.filter((v) => v.required);
}

export function getOptionalVariables(manifest: ResourceManifest): VariableDef[] {
  return manifest.variables.filter((v) => !v.required);
}

export function validateVariableValue(
  variable: VariableDef,
  value: string | number | boolean,
): { valid: boolean; error?: string } {
  if (variable.required && (value === "" || value === undefined || value === null)) {
    return { valid: false, error: `${variable.name} is required` };
  }

  if (variable.type === "number" && typeof value === "string") {
    if (isNaN(Number(value))) {
      return { valid: false, error: `${variable.name} must be a number` };
    }
  }

  if (variable.type === "select" && variable.options) {
    const validValues = variable.options.map((o) => o.value);
    if (!validValues.includes(String(value))) {
      return {
        valid: false,
        error: `${variable.name} must be one of: ${validValues.join(", ")}`,
      };
    }
  }

  return { valid: true };
}
