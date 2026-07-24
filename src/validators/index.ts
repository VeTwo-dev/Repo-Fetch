import { z } from "zod";
import { SUPPORTED_PROVIDERS } from "../constants";

export const RepoIdentifierSchema = z.object({
  provider: z.enum(SUPPORTED_PROVIDERS),
  owner: z.string().min(1, "Owner is required").max(255),
  repo: z.string().min(1, "Repository name is required").max(255),
  branch: z.string().optional(),
  path: z.string().optional(),
  type: z.enum(["tree", "blob"]).optional(),
  ref: z.string().optional(),
});

export const FetchOptionsSchema = z.object({
  provider: z.enum(SUPPORTED_PROVIDERS).optional(),
  token: z.string().optional(),
  branch: z.string().optional(),
  path: z.string().optional(),
  depth: z.number().int().positive().optional(),
  recursive: z.boolean().optional(),
  cache: z.boolean().optional(),
});

export const DownloadOptionsSchema = z.object({
  output: z.string().default("./download"),
  overwrite: z.boolean().optional(),
  merge: z.boolean().optional(),
  skipExisting: z.boolean().optional(),
  clean: z.boolean().optional(),
  concurrency: z.number().int().min(1).max(50).optional(),
  timeout: z.number().int().min(1000).optional(),
  retries: z.number().int().min(0).optional(),
});

export const ConfigSchema = z.object({
  provider: z.enum(SUPPORTED_PROVIDERS).optional(),
  token: z.string().optional(),
  cache: z.boolean().optional(),
  output: z.string().optional(),
  overwrite: z.boolean().optional(),
  merge: z.boolean().optional(),
  skipExisting: z.boolean().optional(),
  clean: z.boolean().optional(),
  concurrency: z.number().int().min(1).max(50).optional(),
  timeout: z.number().int().min(1000).optional(),
  retries: z.number().int().min(0).optional(),
  plugins: z.array(z.string()).optional(),
});

export const FilterOptionsSchema = z.object({
  foldersOnly: z.boolean().optional(),
  filesOnly: z.boolean().optional(),
  extensions: z.array(z.string()).optional(),
  glob: z.union([z.string(), z.array(z.string())]).optional(),
  regex: z.instanceof(RegExp).optional(),
  excludeGlob: z.union([z.string(), z.array(z.string())]).optional(),
  excludeRegex: z.instanceof(RegExp).optional(),
});
