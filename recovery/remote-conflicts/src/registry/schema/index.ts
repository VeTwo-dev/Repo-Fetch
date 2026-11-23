import { z } from "zod";

const ResourceTypeSchema = z.enum([
  "plugin",
  "module",
  "template",
  "preset",
  "generator",
  "snippet",
  "recipe",
  "blueprint",
  "integration",
  "adapter",
  "example",
  "theme",
  "configuration",
]);

const RuntimeSchema = z.enum(["node", "bun", "deno", "browser", "any"]);
const FrameworkSchema = z.enum([
  "react",
  "vue",
  "svelte",
  "angular",
  "solid",
  "next",
  "nuxt",
  "astro",
  "express",
  "fastify",
  "hono",
  "elysia",
  "nest",
  "any",
]);
const PackageManagerSchema = z.enum(["npm", "pnpm", "yarn", "bun", "any"]);

const ResourceAuthorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  url: z.string().url().optional(),
  github: z.string().optional(),
});

const ResourceEnginesSchema = z.object({
  node: z.string().optional(),
  bun: z.string().optional(),
  vetwo: z.string().optional(),
});

const VetwoCompatibilitySchema = z.object({
  minVersion: z.string(),
  maxVersion: z.string().optional(),
  experimental: z.boolean().optional(),
});

const ResourceDependencySchema = z.object({
  id: z.string().min(1),
  version: z.string(),
  name: z.string().min(1),
  type: z.enum(["required", "optional", "peer"]),
});

const ResourceConflictSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  reason: z.string(),
});

const ResourceChecksumSchema = z.object({
  algorithm: z.enum(["sha256", "sha512", "md5"]),
  value: z.string().min(1),
});

const ResourceExampleSchema = z.object({
  title: z.string(),
  description: z.string(),
  code: z.string().optional(),
});

const LifecycleHookNameSchema = z.enum([
  "beforeInstall",
  "afterInstall",
  "beforeUpdate",
  "afterUpdate",
  "beforeRemove",
  "afterRemove",
  "beforeGenerate",
  "afterGenerate",
]);

const LifecycleHookDefSchema = z.object({
  name: LifecycleHookNameSchema,
  script: z.string(),
  description: z.string().optional(),
});

const VariableDefSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["string", "number", "boolean", "select"]),
  description: z.string(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  required: z.boolean(),
  prompt: z.string().optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  validate: z.string().optional(),
});

const TransformDefSchema = z.object({
  type: z.enum(["packageJson", "tsConfig", "imports", "routes", "config", "custom"]),
  target: z.string(),
  action: z.enum(["merge", "prepend", "append", "replace", "remove"]),
  data: z.unknown(),
  description: z.string().optional(),
});

export const ResourceManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  displayName: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/),
  description: z.string().min(1),
  type: ResourceTypeSchema,
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  author: ResourceAuthorSchema,
  repository: z.string(),
  homepage: z.string(),
  license: z.string(),
  engines: ResourceEnginesSchema,
  vetwo: VetwoCompatibilitySchema,
  dependencies: z.array(ResourceDependencySchema).default([]),
  optionalDependencies: z.array(ResourceDependencySchema).default([]),
  peerDependencies: z.array(ResourceDependencySchema).default([]),
  conflicts: z.array(ResourceConflictSchema).default([]),
  supportedRuntimes: z.array(RuntimeSchema).default(["any"]),
  supportedFrameworks: z.array(FrameworkSchema).default(["any"]),
  supportedPackageManagers: z.array(PackageManagerSchema).default(["any"]),
  checksum: ResourceChecksumSchema,
  downloadPath: z.string().min(1),
  examples: z.array(ResourceExampleSchema).default([]),
  documentation: z.string().default(""),
  screenshots: z.array(z.string()).default([]),
  lifecycleHooks: z.array(LifecycleHookDefSchema).default([]),
  variables: z.array(VariableDefSchema).default([]),
  transforms: z.array(TransformDefSchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const RegistryResourceEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  displayName: z.string().min(1),
  version: z.string(),
  type: ResourceTypeSchema,
  category: z.string(),
  tags: z.array(z.string()),
  description: z.string(),
  author: z.string(),
  license: z.string(),
  checksum: ResourceChecksumSchema,
  downloadPath: z.string(),
  manifestVersion: z.string(),
});

const CategoryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  resourceCount: z.number().int().min(0),
});

const TagEntrySchema = z.object({
  name: z.string(),
  count: z.number().int().min(0),
});

const SearchIndexEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  tags: z.array(z.string()),
  type: ResourceTypeSchema,
  category: z.string(),
});

export const RegistryIndexSchema = z.object({
  version: z.string(),
  updatedAt: z.string().datetime(),
  resources: z.array(RegistryResourceEntrySchema),
  categories: z.array(CategoryEntrySchema),
  tags: z.array(TagEntrySchema),
  searchIndex: z.array(SearchIndexEntrySchema),
});

export type ValidatedManifest = z.infer<typeof ResourceManifestSchema>;
export type ValidatedRegistryIndex = z.infer<typeof RegistryIndexSchema>;
