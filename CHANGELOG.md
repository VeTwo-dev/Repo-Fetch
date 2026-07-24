# Changelog

All notable changes to `@vetwo/repo-fetch` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-07-24

### Added

#### Vetwo Registry Client
- Full registry system for plugins, modules, templates, presets, generators, snippets, recipes, blueprints, integrations, adapters, examples, themes, and configurations
- Registry type system (`src/registry/types.ts`) — 427 lines of typed interfaces
- Zod schema validation for manifests and registry index
- Registry core client with full install pipeline
- Fuzzy search engine with Levenshtein distance, tokenization, and keyword scoring
- Dependency resolver with topological sort and cycle detection
- Compatibility engine — Node/Bun/Deno/OS/architecture/framework detection
- Variable engine — context → env → default → prompt resolution chain
- AST transforms for package.json, tsconfig, imports, routes, config, and custom
- Integrity system — SHA-256/512/MD5 checksum verification
- Lifecycle hooks — 8 hooks (before/after install/update/remove/generate)
- Installation report — typed report with formatting
- Registry cache — TTL-based index and manifest caching

#### GitHub Repo URL Resolution
- Resolution chain: `.env` (`GITHUB_REPO_URL`) → wizard prompt → auto-detect from git remote
- `detectRepoFromGitRemote()` — extract repo URL from git remote origin
- `resolveRepoUrl()` — full resolution chain with options
- `resolveRepoIdentifier()` — resolve to `RepoIdentifier` object
- `fetchFromConfig()` — dev dependency helper for fetching from configured repo

#### CLI Commands
- `repo-fetch registry search <query>` — search registry with filters
- `repo-fetch registry install <resource>` — install resource with options
- `repo-fetch registry info <resource>` — show detailed resource info
- `repo-fetch registry list` — list installed resources
- `repo-fetch registry check [resource]` — check environment compatibility
- `repo-fetch registry categories` — list all categories
- `repo-fetch registry tags` — list all tags
- `repo-fetch registry cache` — show registry cache stats
- `repo-fetch registry clear-cache` — clear registry cache
- `--env-var`, `--no-prompt`, `--no-auto-detect` options for browse, download, tree

#### Tests
- 128 new unit tests across 10 registry test suites
- Tests for: schema validation, search engine, dependency resolver, compatibility engine, variable engine, AST transforms, integrity system, lifecycle hooks, installation report, registry cache

#### Documentation
- Updated README.md with registry system and GitHub repo URL resolution
- Updated ARCHITECTURE.md with registry architecture details
- Updated API.md with all new APIs
- Updated CLI.md with all new commands
- Updated CONTRIBUTING.md with registry contribution guidelines

### Changed
- Version bumped from `0.1.0` to `1.0.0`
- Package description updated to reflect registry capabilities
- Keywords expanded to include registry-related terms
- All 235 tests passing (107 original + 128 new)
- TypeScript strict mode with 0 `any` types
- ESLint clean (0 errors)

## [0.1.0] - 2024-01-01

### Features

- Initial release
- GitHub provider with full implementation
- GitLab, Bitbucket, Azure DevOps, Gitea, Forgejo architecture-ready stubs
- Interactive browse mode with VSCode-like tree navigation
- Multi-selection with Space key
- Search with `/` key
- Filter mode (files/folders)
- Preview before download
- Download engine with parallel downloads and progress tracking
- Cache system with LRU cache
- Plugin system with lifecycle hooks
- Event system
- Error classes with recovery suggestions
- CLI with commands: browse, download, tree, search, doctor, cache, clear-cache
- Config file support
- Comprehensive TypeScript types
- Zod validation schemas
- 90%+ test coverage
