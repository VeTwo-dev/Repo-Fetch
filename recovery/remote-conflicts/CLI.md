# CLI Reference

Complete command-line interface reference for `@vetwo/repo-fetch`.

## Table of Contents

- [Installation](#installation)
- [Global Options](#global-options)
- [Commands](#commands)
  - [browse](#browse)
  - [download](#download)
  - [tree](#tree)
  - [search](#search)
  - [doctor](#doctor)
  - [cache](#cache)
  - [clear-cache](#clear-cache)
- [Registry Commands](#registry-commands)
  - [registry search](#registry-search)
  - [registry install](#registry-install)
  - [registry info](#registry-info)
  - [registry list](#registry-list)
  - [registry check](#registry-check)
  - [registry categories](#registry-categories)
  - [registry tags](#registry-tags)
  - [registry cache](#registry-cache)
  - [registry clear-cache](#registry-clear-cache)
- [Environment Variables](#environment-variables)
- [GitHub Repo URL Resolution](#github-repo-url-resolution)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## Installation

### Global Installation

```bash
npm install -g @vetwo/repo-fetch
```

### Local Installation

```bash
npm install --save-dev @vetwo/repo-fetch
npx repo-fetch --help
```

### Using Without Installation

```bash
npx @vetwo/repo-fetch --help
```

---

## Global Options

| Option | Description |
|--------|-------------|
| `-v, --version` | Output the current version |
| `-h, --help` | Display help for command |
| `--env-var <variable>` | Environment variable name for repo URL |
| `--no-prompt` | Disable interactive prompts |
| `--no-auto-detect` | Disable auto-detection from git remote |

---

## Commands

### browse

Open interactive repository browser.

```bash
repo-fetch browse [repository] [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `[repository]` | Repository URL or shorthand (e.g., `user/repo`) |

**Options:**

| Option | Description |
|--------|-------------|
| `-t, --token <token>` | Authentication token |
| `-b, --branch <branch>` | Branch name |

**Examples:**

```bash
# Browse with prompt
repo-fetch browse

# Browse specific repository
repo-fetch browse octocat/hello-world

# Browse with specific branch
repo-fetch browse octocat/hello-world --branch develop

# Browse with token
repo-fetch browse octocat/hello-world --token ghp_xxxxxxxxxxxx
```

**Interactive Features:**

- Navigate directory structure
- Select files/folders for download
- Preview file contents
- Search for files

---

### download

Download files/folders from a repository.

```bash
repo-fetch download [repository] [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `[repository]` | Repository URL or shorthand |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --token <token>` | Authentication token | - |
| `-b, --branch <branch>` | Branch name | - |
| `-o, --output <path>` | Output directory | `./download` |
| `--overwrite` | Overwrite existing files | `false` |
| `--merge` | Merge with existing files | `false` |
| `--skip-existing` | Skip files that already exist | `false` |
| `--clean` | Clean output directory before download | `false` |
| `--concurrency <number>` | Download concurrency | `5` |
| `--timeout <ms>` | Timeout per file in ms | `30000` |
| `--retries <number>` | Retry count | `3` |
| `--yes` | Skip confirmation | `false` |
| `--path <path>` | Specific path to download | - |
| `--glob <pattern>` | Glob pattern for file selection | - |
| `--ext <extensions>` | File extensions (comma-separated) | - |

**Examples:**

```bash
# Download entire repository
repo-fetch download octocat/hello-world

# Download specific path
repo-fetch download octocat/hello-world --path src

# Download by glob pattern
repo-fetch download octocat/hello-world --glob "*.ts"

# Download by extension
repo-fetch download octocat/hello-world --ext ts,tsx,js

# Download to specific directory
repo-fetch download octocat/hello-world --output ./my-project

# Skip confirmation
repo-fetch download octocat/hello-world --yes

# Download with custom concurrency
repo-fetch download octocat/hello-world --concurrency 10

# Download with authentication
repo-fetch download octocat/hello-world --token ghp_xxxxxxxxxxxx

# Download with overwrite
repo-fetch download octocat/hello-world --overwrite

# Download with timeout
repo-fetch download octocat/hello-world --timeout 60000
```

**Download Strategies:**

| Strategy | Command | Description |
|----------|---------|-------------|
| Full download | `repo-fetch download user/repo` | Downloads everything |
| Path-specific | `--path src` | Downloads specific directory |
| Glob pattern | `--glob "*.ts"` | Downloads matching files |
| Extension filter | `--ext ts,tsx` | Downloads by file extension |

---

### tree

Display repository tree.

```bash
repo-fetch tree [repository] [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `[repository]` | Repository URL or shorthand |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --token <token>` | Authentication token | - |
| `-b, --branch <branch>` | Branch name | - |
| `-d, --depth <depth>` | Maximum depth | `10` |
| `--no-color` | Disable colored output | `false` |

**Examples:**

```bash
# Display tree
repo-fetch tree octocat/hello-world

# Display with depth limit
repo-fetch tree octocat/hello-world --depth 3

# Display specific branch
repo-fetch tree octocat/hello-world --branch develop

# Display without colors
repo-fetch tree octocat/hello-world --no-color
```

**Output Example:**

```
├── 📁 .github
│   ├── 📁 workflows
│   │   └── 📄 ci.yml
│   └── 📄 dependabot.yml
├── 📁 src
│   ├── 📄 index.ts
│   ├── 📁 utils
│   │   └── 📄 helpers.ts
│   └── 📄 types.ts
├── 📄 package.json
├── 📄 README.md
└── 📄 tsconfig.json

4 directories, 9 files
```

---

### search

Search files in repository.

```bash
repo-fetch search <repository> <query> [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<repository>` | Repository URL or shorthand |
| `<query>` | Search query |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --token <token>` | Authentication token | - |
| `-b, --branch <branch>` | Branch name | - |
| `--case-sensitive` | Case-sensitive search | `false` |
| `--max <number>` | Maximum results | `50` |

**Examples:**

```bash
# Search for files
repo-fetch search octocat/hello-world index

# Search case-sensitive
repo-fetch search octocat/hello-world Index --case-sensitive

# Search with max results
repo-fetch search octocat/hello-world test --max 10

# Search specific branch
repo-fetch search octocat/hello-world config --branch develop
```

**Output Example:**

```
Found 3 result(s):

  📄 src/index.ts (1.2 KB)
  📄 src/utils/index.ts (0.8 KB)
  📄 tests/index.test.ts (2.1 KB)
```

---

### doctor

Check system health and configuration.

```bash
repo-fetch doctor [options]
```

**Options:**

None

**Examples:**

```bash
# Run diagnostics
repo-fetch doctor
```

**Output Example:**

```
Running system diagnostics...

  ✔ Internet: Internet reachable (200)
  ✔ GitHub API: GitHub API reachable (rate limit remaining: 59)
  ✔ Node.js: Node.js v20.11.0 (supported)
  ✔ Permissions: Write permissions in current directory
  ✔ Output Directory: Output directory ready: /path/to/download
  ✔ Cache: Cache healthy (0/1000 entries)

All checks passed!
```

**Checks Performed:**

| Check | Description |
|-------|-------------|
| Internet | Tests internet connectivity |
| GitHub API | Tests GitHub API access |
| Node.js | Checks Node.js version (≥18) |
| Permissions | Tests write permissions |
| Output Directory | Tests output directory access |
| Cache | Tests cache health |

---

### cache

Show cache statistics.

```bash
repo-fetch cache [options]
```

**Options:**

None

**Examples:**

```bash
# Show cache stats
repo-fetch cache
```

**Output Example:**

```
ℹ Cache entries: 5/1000
ℹ Cached items:
  tree:octocat/hello-world/main (3600s old)
  tree:octocat/hello-world/develop (1800s old)
  search:octocat/hello-world/index (900s old)
```

---

### clear-cache

Clear all cached data.

```bash
repo-fetch clear-cache [options]
```

**Options:**

None

**Examples:**

```bash
# Clear cache
repo-fetch clear-cache
```

**Output Example:**

```
✔ Cache cleared
```

---

## Registry Commands

### registry search

Search the Vetwo Registry for resources.

```bash
repo-fetch registry search <query> [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --type <type>` | Filter by resource type | - |
| `-c, --category <category>` | Filter by category | - |
| `--tags <tags>` | Filter by tags (comma-separated) | - |
| `-l, --limit <number>` | Maximum results | `20` |
| `--fuzzy` | Enable fuzzy search | `true` |

**Examples:**

```bash
repo-fetch registry search auth
repo-fetch registry search template --type template
repo-fetch registry search react --category frontend --tags react,spa
```

### registry install

Install a resource from the Vetwo Registry.

```bash
repo-fetch registry install <resource> [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Output directory | `./` |
| `--dry-run` | Show what would be installed | `false` |
| `--force` | Force reinstall | `false` |
| `--skip-compatibility` | Skip compatibility check | `false` |
| `--skip-integrity` | Skip integrity check | `false` |
| `--skip-lifecycle` | Skip lifecycle hooks | `false` |
| `--skip-transforms` | Skip AST transforms | `false` |

**Examples:**

```bash
repo-fetch registry install plugin-auth
repo-fetch registry install template-react --output ./my-project
repo-fetch registry install module-utils --dry-run
```

### registry info

Show detailed information about a registry resource.

```bash
repo-fetch registry info <resource>
```

### registry list

List installed registry resources.

```bash
repo-fetch registry list
```

### registry check

Check environment compatibility with registry resources.

```bash
repo-fetch registry check [resource]
```

### registry categories

List all registry categories.

```bash
repo-fetch registry categories
```

### registry tags

List all registry tags.

```bash
repo-fetch registry tags
```

### registry cache

Show registry cache statistics.

```bash
repo-fetch registry cache
```

### registry clear-cache

Clear registry cache.

```bash
repo-fetch registry clear-cache
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub authentication token | `ghp_xxxxxxxxxxxx` |
| `REPO_FETCH_TOKEN` | Generic authentication token | `xxxxxxxxxxxxxxxx` |
| `GITLAB_TOKEN` | GitLab authentication token | `glpat-xxxxxxxxxxxx` |
| `BITBUCKET_TOKEN` | Bitbucket authentication token | `xxxxxxxxxxxxxxxx` |
| `NODE_DEBUG` | Enable debug output | `repo-fetch` |
| `GITHUB_REPO_URL` | Default repository URL | `https://github.com/user/repo` |
| `VETWO_VAR_*` | Template variable overrides | `VETWO_VAR_APIKEY=secret` |

**Token Priority:**

1. `--token` CLI option
2. Provider-specific env var (e.g., `GITHUB_TOKEN`)
3. `REPO_FETCH_TOKEN` env var

**Usage:**

```bash
# Using environment variable
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
repo-fetch download octocat/hello-world

# Using CLI option
repo-fetch download octocat/hello-world --token ghp_xxxxxxxxxxxx

# Using inline env var
GITHUB_TOKEN=ghp_xxxxxxxxxxxx repo-fetch download octocat/hello-world
```

---

## GitHub Repo URL Resolution

`repo-fetch` resolves the target GitHub repository URL using the following priority order:

1. **`--env-var` CLI option** - Specify a custom environment variable name to read the URL from
2. **`GITHUB_REPO_URL` env var** - Default environment variable for the repository URL
3. **`--no-auto-detect` / `--no-prompt`** - Control auto-detection and prompting behavior
4. **Git remote detection** - Auto-detects from the current git repository's remote origin
5. **Interactive prompt** - Prompts the user to enter a URL (can be disabled with `--no-prompt`)

**Options:**

| Option | Description |
|--------|-------------|
| `--env-var <variable>` | Environment variable name for repo URL |
| `--no-prompt` | Disable interactive prompts |
| `--no-auto-detect` | Disable auto-detection from git remote |

**Examples:**

```bash
# Use default resolution (env var -> git remote -> prompt)
repo-fetch browse

# Read URL from a custom env var
repo-fetch browse --env-var MY_REPO_URL

# Disable prompt (errors if no URL found)
repo-fetch download --no-prompt

# Disable auto-detection from git remote
repo-fetch tree --no-auto-detect

# Set the URL via environment variable
export GITHUB_REPO_URL=https://github.com/user/repo
repo-fetch browse
```

---

## Examples

### Basic Usage

```bash
# Browse and select files interactively
repo-fetch browse

# Download entire repository
repo-fetch download octocat/hello-world

# View repository structure
repo-fetch tree octocat/hello-world
```

### Advanced Usage

```bash
# Download TypeScript files only
repo-fetch download octocat/hello-world --ext ts,tsx

# Download with glob pattern
repo-fetch download octocat/hello-world --glob "src/**/*.ts"

# Download specific folder
repo-fetch download octocat/hello-world --path src

# Download to custom directory
repo-fetch download octocat/hello-world --output ./my-project

# Download with high concurrency
repo-fetch download octocat/hello-world --concurrency 20

# Download with custom timeout
repo-fetch download octocat/hello-world --timeout 60000
```

### CI/CD Usage

```bash
# Download and skip confirmation
repo-fetch download octocat/hello-world --yes

# Download with overwrite
repo-fetch download octocat/hello-world --overwrite --yes

# Download specific branch
repo-fetch download octocat/hello-world --branch release --yes

# Download with authentication
repo-fetch download octocat/hello-world --token $GITHUB_TOKEN --yes
```

### Scripting

```bash
#!/bin/bash

# Download and check results
repo-fetch download octocat/hello-world --yes
if [ $? -eq 0 ]; then
  echo "Download successful"
else
  echo "Download failed"
  exit 1
fi
```

---

## Troubleshooting

### Common Issues

#### Rate Limit Exceeded

```
Error: Rate limit exceeded
```

**Solution:**

```bash
# Set authentication token
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
repo-fetch download octocat/hello-world
```

#### Repository Not Found

```
Error: Repository octocat/hello-world not found
```

**Solution:**

```bash
# Check repository exists
repo-fetch tree octocat/hello-world

# Verify URL
repo-fetch browse https://github.com/octocat/hello-world
```

#### Permission Denied

```
Error: Permission denied: octocat/private-repo
```

**Solution:**

```bash
# Use token with appropriate permissions
repo-fetch download octocat/private-repo --token ghp_xxxxxxxxxxxx
```

#### Network Error

```
Error: Network error: fetch failed
```

**Solution:**

```bash
# Check internet connection
repo-fetch doctor

# Increase timeout
repo-fetch download octocat/hello-world --timeout 60000
```

#### Timeout Error

```
Error: Request timed out after 30000ms
```

**Solution:**

```bash
# Increase timeout
repo-fetch download octocat/hello-world --timeout 120000

# Reduce concurrency
repo-fetch download octocat/hello-world --concurrency 2
```

### Debug Mode

```bash
# Enable debug output
NODE_DEBUG=repo-fetch repo-fetch download octocat/hello-world
```

### Verbose Output

```bash
# Show detailed information
repo-fetch tree octocat/hello-world --depth 100

# Check system health
repo-fetch doctor

# Check cache
repo-fetch cache
```

### Getting Help

```bash
# Show help
repo-fetch --help

# Show command help
repo-fetch download --help

# Show version
repo-fetch --version
```
