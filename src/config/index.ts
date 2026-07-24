import type { Config } from "../types";
import { ValidationError } from "../errors";
import { SUPPORTED_PROVIDERS } from "../constants";

let currentConfig: Config = {};

export function setConfig(config: Partial<Config>): void {
  validateConfig(config);
  currentConfig = { ...currentConfig, ...config };
}

export function getConfig(): Config {
  return { ...currentConfig };
}

export function resetConfig(): void {
  currentConfig = {};
}

export function validateConfig(config: Partial<Config>): void {
  if (
    config.provider &&
    !SUPPORTED_PROVIDERS.includes(config.provider as (typeof SUPPORTED_PROVIDERS)[number])
  ) {
    throw new ValidationError(
      "provider",
      `Unsupported provider: ${config.provider}. Supported: ${SUPPORTED_PROVIDERS.join(", ")}`,
    );
  }

  if (config.concurrency !== undefined && (config.concurrency < 1 || config.concurrency > 50)) {
    throw new ValidationError("concurrency", "Must be between 1 and 50");
  }

  if (config.timeout !== undefined && config.timeout < 1000) {
    throw new ValidationError("timeout", "Must be at least 1000ms");
  }

  if (config.retries !== undefined && config.retries < 0) {
    throw new ValidationError("retries", "Must be a non-negative number");
  }
}

export function defineConfig(config: Config): Config {
  validateConfig(config);
  return config;
}
