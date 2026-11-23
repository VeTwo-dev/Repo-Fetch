import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

// Minimal retained ESLint for Repo-Fetch: type-aware rules only (projectService).
export default defineConfig(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/*.config.*",
      "examples/**",
    ],
  },
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    extends: [tseslint.configs.base],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
    },
  },
);
