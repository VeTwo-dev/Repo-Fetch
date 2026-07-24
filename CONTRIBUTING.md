# Contributing to @vetwo/repo-fetch

Thank you for your interest in contributing to `@vetwo/repo-fetch`! This document provides guidelines and information about contributing to this project, including the Vetwo Registry Client.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Registry System](#registry-system)
- [Community](#community)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [security@vetwo.dev](mailto:security@vetwo.dev).

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm
- Git

### Development Setup

1. Fork the repository on GitHub

2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/repo-fetch.git
   cd repo-fetch
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Start development:
   ```bash
   pnpm dev
   ```

5. Run tests to verify setup:
   ```bash
   pnpm test
   ```

## Project Overview

`@vetwo/repo-fetch` is both:
- A **GitHub folder downloader** — fetch specific files/folders without cloning entire repos
- The **Vetwo Registry Client** — discover, install, and manage plugins, modules, templates, presets, generators, snippets, recipes, blueprints, integrations, adapters, examples, themes, and configurations

## Architecture

```
src/
├── cli/                    # CLI commands (Commander.js)
│   └── commands/
│       ├── browse.ts       # Interactive browse
│       ├── download.ts     # Download files
│       ├── tree.ts         # Show tree
│       ├── registry.ts     # Registry commands (search, install, info, list, check)
│       └── index.ts        # Command registration
├── core/                   # Core engine
│   ├── providers/          # GitHub, GitLab, etc.
│   ├── download/           # Download engine
│   ├── tree/               # Tree builder
│   ├── search/             # File search
│   ├── browse/             # Interactive browse
│   ├── cache/              # LRU cache
│   ├── config/             # Configuration
│   ├── events/             # Event system
│   ├── errors/             # Error classes
│   └── fetch-config/       # fetchFromConfig() dev dependency
├── registry/               # Vetwo Registry Client
│   ├── types.ts            # Type definitions
│   ├── schema/             # Zod validation
│   ├── core/               # RegistryClient
│   ├── cache/              # TTL-based caching
│   ├── search/             # Fuzzy search engine
│   ├── resolver/           # Dependency resolver
│   ├── compatibility/      # Environment detection
│   ├── variables/          # Variable resolution
│   ├── transforms/         # AST transforms
│   ├── integrity/          # Checksum verification
│   ├── lifecycle/          # Hook execution
│   └── report/             # Installation report
├── utils/                  # Shared utilities
│   └── index.ts            # resolveRepoUrl(), etc.
└── index.ts                # Main exports
tests/
├── registry/               # 10 registry test suites
│   ├── schema.test.ts
│   ├── search.test.ts
│   ├── resolver.test.ts
│   ├── compatibility.test.ts
│   ├── variables.test.ts
│   ├── transforms.test.ts
│   ├── integrity.test.ts
│   ├── lifecycle.test.ts
│   ├── report.test.ts
│   └── cache.test.ts
└── core/                   # Core tests
```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Environment information** (OS, Node.js version, package version)
- **Relevant logs or screenshots**

Use the [Bug Report template](https://github.com/vetwo/repo-fetch/issues/new?template=bug_report.yml).

### Suggesting Features

Feature suggestions are welcome. Please provide:

- **Clear description** of the proposed feature
- **Use case** - why this feature would be useful
- **Possible implementation** - if you have ideas

Use the [Feature Request template](https://github.com/vetwo/repo-fetch/issues/new?template=feature_request.yml).

### Contributing Code

1. Find an issue to work on (or create one)
2. Comment on the issue to let others know you're working on it
3. Create a feature branch from `main`
4. Make your changes
5. Write or update tests
6. Update documentation if needed
7. Submit a pull request

## Pull Request Process

### Before Submitting

- [ ] Code compiles without errors (`pnpm typecheck`)
- [ ] Tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Code is formatted (`pnpm format:check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated (if applicable)

### PR Title Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add GitLab provider support`
- `fix: handle rate limiting for private repos`
- `docs: update API reference`
- `refactor: simplify tree building logic`
- `test: add integration tests for download engine`
- `chore: update dependencies`

### PR Description

Include:

1. **What** - Summary of changes
2. **Why** - Motivation for the changes
3. **How** - Implementation details
4. **Testing** - How to verify the changes
5. **Screenshots** - If applicable (UI changes)

## Coding Standards

### TypeScript

- Strict mode enabled
- No `any` types
- Explicit return types for public functions
- Prefer `type` imports with `import type`
- Use `noUncheckedIndexedAccess`

### Code Style

- Follow existing patterns
- Single responsibility principle
- Composition over inheritance
- Clear, descriptive variable names
- Comments explain *why*, not *what*

### File Organization

- One exported symbol per file (for large symbols)
- Group related functionality
- Keep files under 300 lines when possible

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test -- tests/registry/search.test.ts
```

### Writing Tests

- Test file location: `tests/` directory
- File naming: `*.test.ts`
- Use `describe` blocks for grouping
- Use descriptive `it` blocks
- Mock external dependencies
- Test both success and error cases

### Test Coverage

- Maintain 90%+ coverage
- New features must include tests
- Bug fixes must include regression tests

### Registry Test Suites

| Suite | Tests | Coverage |
|-------|-------|----------|
| `schema.test.ts` | 13 | Schema validation, defaults, version regex |
| `search.test.ts` | 19 | Fuzzy search, filtering, sorting |
| `resolver.test.ts` | 10 | Dependencies, cycles, conflicts |
| `compatibility.test.ts` | 7 | Environment detection, compatibility |
| `variables.test.ts` | 16 | Resolution chain, validation |
| `transforms.test.ts` | 16 | AST transforms, backup/rollback |
| `integrity.test.ts` | 12 | Checksum verification |
| `lifecycle.test.ts` | 9 | Hook execution |
| `report.test.ts` | 14 | Installation report |
| `cache.test.ts` | 12 | TTL-based caching |

## Documentation

### README

- Keep README.md up to date
- Include examples for new features
- Update the table of contents

### API Documentation

- Document all public functions and types
- Include JSDoc comments
- Provide usage examples

### CHANGELOG

- Add entries for user-facing changes
- Follow [Keep a Changelog](https://keepachangelog.com/) format
- Group changes by type (Added, Changed, Fixed, etc.)

## Registry System

### Adding New Resource Types

1. Add type to `ResourceType` union in `src/registry/types.ts`
2. Add any type-specific fields to `ResourceManifest`
3. Add validation rules to `src/registry/schema/index.ts`
4. Update CLI commands if needed in `src/cli/commands/registry.ts`
5. Add tests in `tests/registry/`

### Adding New Lifecycle Hooks

1. Add hook name to `LifecycleHook` type in `src/registry/types.ts`
2. Add to `LIFECYCLE_HOOKS` array in `src/registry/lifecycle/index.ts`
3. Add execution logic in `executeLifecycleHooks()`
4. Add tests in `tests/registry/lifecycle.test.ts`

### Adding New Transforms

1. Add transform type to `TransformType` union in `src/registry/types.ts`
2. Implement transform logic in `src/registry/transforms/index.ts`
3. Add tests in `tests/registry/transforms.test.ts`

### Registry Cache

The registry cache uses TTL-based caching:
- Index: 24 hours
- Manifests: 1 hour

To modify cache behavior, edit `src/registry/cache/index.ts`.

## Community

- [GitHub Issues](https://github.com/vetwo/repo-fetch/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/vetwo/repo-fetch/discussions) - General questions and discussions
- [Twitter](https://twitter.com/vetwo) - Follow for updates

## Recognition

Contributors will be recognized in:

- The README.md file
- Release notes
- The project's contributors page

## Questions?

If you have questions about contributing, feel free to:

1. Open a [GitHub Discussion](https://github.com/vetwo/repo-fetch/discussions)
2. Comment on an existing issue
3. Reach out on [Twitter](https://twitter.com/vetwo)

---

Thank you for contributing to @vetwo/repo-fetch!
