# Plugin Guide

Complete guide to creating and using plugins in `@vetwo/repo-fetch`.

## Table of Contents

- [Overview](#overview)
- [Plugin Architecture](#plugin-architecture)
- [Creating a Plugin](#creating-a-plugin)
- [Plugin Lifecycle](#plugin-lifecycle)
- [Plugin Hooks](#plugin-hooks)
- [Plugin Context](#plugin-context)
- [Registering Plugins](#registering-plugins)
- [Unregistering Plugins](#unregistering-plugins)
- [Built-in Plugin Examples](#built-in-plugin-examples)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

Plugins extend `@vetwo/repo-fetch` functionality by hooking into the download lifecycle. They can modify behavior, add features, integrate with external services, and more.

---

## Plugin Architecture

### Core Components

1. **Plugin Interface** - Defines the plugin contract
2. **BasePlugin** - Abstract class for easy plugin creation
3. **EventEmitter** - Manages plugin registration and event dispatching
4. **PluginContext** - Data passed to plugin hooks

### Event Flow

```
User Action
    ↓
Event Emitter
    ↓
Plugin Hooks
    ↓
Core Operations
    ↓
Results
```

---

## Creating a Plugin

### Using BasePlugin (Recommended)

```typescript
import { BasePlugin } from "@vetwo/repo-fetch";

class MyPlugin extends BasePlugin {
  name = "my-plugin";
  version = "1.0.0";

  hooks = {
    beforeDownload: async (ctx) => {
      console.log("Download starting:", ctx.data);
    },
    afterDownload: async (ctx) => {
      console.log("Download completed:", ctx.data);
    },
  };
}

export const plugin = new MyPlugin();
```

### Using Plugin Interface Directly

```typescript
import type { Plugin, PluginHooks } from "@vetwo/repo-fetch";

class MyPlugin implements Plugin {
  name = "my-plugin";
  version = "1.0.0";

  hooks: Partial<PluginHooks> = {
    beforeDownload: async (ctx) => {
      console.log("Download starting:", ctx.data);
    },
    afterDownload: async (ctx) => {
      console.log("Download completed:", ctx.data);
    },
  };
}

export const plugin = new MyPlugin();
```

---

## Plugin Lifecycle

### Registration Phase

```typescript
// 1. Create plugin instance
const plugin = new MyPlugin();

// 2. Register with event emitter
plugin.register();

// 3. Plugin is now active
console.log(plugin.name); // "my-plugin"
```

### Execution Phase

```
beforeBrowse → Browse Repository → afterBrowse
    ↓
beforeDownload → Download Files → afterDownload
    ↓
beforeWrite → Write to Disk → afterWrite
    ↓
(error) → onError
```

### Unregistration Phase

```typescript
// Unregister plugin
plugin.unregister();

// Plugin is now inactive
```

---

## Plugin Hooks

### Available Hooks

| Hook | When | Use Cases |
|------|------|-----------|
| `beforeBrowse` | Before repository browsing starts | Validate repo, log activity |
| `afterBrowse` | After browsing completes | Process results, notify |
| `beforeDownload` | Before download starts | Validate files, log, modify |
| `afterDownload` | After download completes | Process results, notify |
| `beforeWrite` | Before writing files | Validate paths, backup |
| `afterWrite` | After writing files | Post-process, notify |
| `onError` | When error occurs | Log, recover, notify |

### Hook Signatures

```typescript
interface PluginHooks {
  beforeBrowse: (ctx: PluginContext) => Promise<void> | void;
  afterBrowse: (ctx: PluginContext) => Promise<void> | void;
  beforeDownload: (ctx: PluginContext) => Promise<void> | void;
  afterDownload: (ctx: PluginContext) => Promise<void> | void;
  beforeWrite: (ctx: PluginContext) => Promise<void> | void;
  afterWrite: (ctx: PluginContext) => Promise<void> | void;
  onError: (ctx: PluginContext) => Promise<void> | void;
}
```

### Implementing Hooks

```typescript
class MyPlugin extends BasePlugin {
  name = "my-plugin";
  version = "1.0.0";

  hooks = {
    // Synchronous hook
    beforeDownload: (ctx) => {
      console.log("Download starting");
    },

    // Asynchronous hook
    afterDownload: async (ctx) => {
      await this.sendNotification(ctx.data);
    },

    // Error handling hook
    onError: async (ctx) => {
      await this.logError(ctx.data.error);
    },
  };

  private async sendNotification(data: Record<string, unknown>): Promise<void> {
    // Send notification logic
  }

  private async logError(error: unknown): Promise<void> {
    // Error logging logic
  }
}
```

---

## Plugin Context

### Context Structure

```typescript
interface PluginContext {
  event: string;
  data: Record<string, unknown>;
  plugin: Plugin;
}
```

### Context Data by Event

#### beforeBrowse / afterBrowse

```typescript
{
  event: "beforeBrowse",
  data: {
    repo: RepoIdentifier,
    options: FetchOptions
  },
  plugin: Plugin
}
```

#### beforeDownload / afterDownload

```typescript
{
  event: "beforeDownload",
  data: {
    repo: RepoIdentifier,
    items: DownloadItem[],
    options: DownloadOptions
  },
  plugin: Plugin
}

{
  event: "afterDownload",
  data: {
    repo: RepoIdentifier,
    items: DownloadItem[],
    results: DownloadResult[]
  },
  plugin: Plugin
}
```

#### beforeWrite / afterWrite

```typescript
{
  event: "beforeWrite",
  data: {
    repo: RepoIdentifier,
    items: DownloadItem[],
    outputDir: string
  },
  plugin: Plugin
}

{
  event: "afterWrite",
  data: {
    repo: RepoIdentifier,
    items: DownloadItem[],
    results: DownloadResult[]
  },
  plugin: Plugin
}
```

#### onError

```typescript
{
  event: "error",
  data: {
    error: Error,
    context: Record<string, unknown>
  },
  plugin: Plugin
}
```

### Using Context

```typescript
class LoggerPlugin extends BasePlugin {
  name = "logger-plugin";
  version = "1.0.0";

  hooks = {
    beforeDownload: (ctx) => {
      const { repo, items } = ctx.data;
      console.log(`Starting download: ${items.length} files from ${repo.owner}/${repo.repo}`);
    },
    afterDownload: (ctx) => {
      const { results } = ctx.data;
      const successful = results.filter((r: DownloadResult) => r.success).length;
      const failed = results.filter((r: DownloadResult) => !r.success).length;
      console.log(`Download completed: ${successful} successful, ${failed} failed`);
    },
  };
}
```

---

## Registering Plugins

### Programmatic Registration

```typescript
import { globalEmitter } from "@vetwo/repo-fetch";
import { MyPlugin } from "./my-plugin";

const plugin = new MyPlugin();
plugin.register();

// Or directly
globalEmitter.registerPlugin(new MyPlugin());
```

### Batch Registration

```typescript
import { globalEmitter } from "@vetwo/repo-fetch";
import { LoggerPlugin } from "./logger-plugin";
import { AnalyticsPlugin } from "./analytics-plugin";
import { BackupPlugin } from "./backup-plugin";

function registerPlugins(): void {
  globalEmitter.registerPlugin(new LoggerPlugin());
  globalEmitter.registerPlugin(new AnalyticsPlugin());
  globalEmitter.registerPlugin(new BackupPlugin());
}

registerPlugins();
```

### Registration via Config

```typescript
import { setConfig } from "@vetwo/repo-fetch";

setConfig({
  plugins: ["logger-plugin", "analytics-plugin"],
});
```

---

## Unregistering Plugins

### By Instance

```typescript
const plugin = new MyPlugin();
plugin.register();

// Later...
plugin.unregister();
```

### By Name

```typescript
import { globalEmitter } from "@vetwo/repo-fetch";

globalEmitter.unregisterPlugin("my-plugin");
```

### Clear All Plugins

```typescript
import { globalEmitter } from "@vetwo/repo-fetch";

globalEmitter.clear();
```

---

## Built-in Plugin Examples

### Logger Plugin

```typescript
import { BasePlugin } from "@vetwo/repo-fetch";

export class LoggerPlugin extends BasePlugin {
  name = "logger";
  version = "1.0.0";

  hooks = {
    beforeDownload: (ctx) => {
      const { repo, items } = ctx.data;
      console.log(`📥 Starting download: ${items.length} files from ${repo.owner}/${repo.repo}`);
    },
    afterDownload: (ctx) => {
      const { results } = ctx.data;
      const successful = results.filter((r: any) => r.success).length;
      console.log(`✅ Download completed: ${successful}/${results.length} files`);
    },
    onError: (ctx) => {
      const { error } = ctx.data;
      console.error(`❌ Error:`, error);
    },
  };
}
```

### Analytics Plugin

```typescript
import { BasePlugin } from "@vetwo/repo-fetch";

export class AnalyticsPlugin extends BasePlugin {
  name = "analytics";
  version = "1.0.0";

  private startTime = 0;
  private fileSize = 0;

  hooks = {
    beforeDownload: (ctx) => {
      this.startTime = Date.now();
      const { items } = ctx.data;
      this.fileSize = items.reduce((sum: number, item: any) => sum + item.size, 0);
    },
    afterDownload: (ctx) => {
      const elapsed = Date.now() - this.startTime;
      const { results } = ctx.data;
      const successful = results.filter((r: any) => r.success).length;

      // Send analytics
      this.track({
        files: successful,
        totalSize: this.fileSize,
        duration: elapsed,
        speed: this.fileSize / (elapsed / 1000),
      });
    },
  };

  private track(data: Record<string, unknown>): void {
    console.log("📊 Analytics:", data);
  }
}
```

### Backup Plugin

```typescript
import { BasePlugin } from "@vetwo/repo-fetch";
import fs from "fs-extra";
import path from "pathe";

export class BackupPlugin extends BasePlugin {
  name = "backup";
  version = "1.0.0";

  private backupDir = "./backups";

  hooks = {
    beforeWrite: async (ctx) => {
      const { outputDir } = ctx.data;

      // Create backup of existing files
      if (await fs.pathExists(outputDir as string)) {
        const backupPath = path.join(
          this.backupDir,
          new Date().toISOString().replace(/[:.]/g, "-")
        );
        await fs.copy(outputDir as string, backupPath);
        console.log(`📦 Backup created: ${backupPath}`);
      }
    },
  };
}
```

### Notification Plugin

```typescript
import { BasePlugin } from "@vetwo/repo-fetch";

export class NotificationPlugin extends BasePlugin {
  name = "notification";
  version = "1.0.0";

  private webhookUrl: string;

  constructor(webhookUrl: string) {
    super();
    this.webhookUrl = webhookUrl;
  }

  hooks = {
    afterDownload: async (ctx) => {
      const { repo, results } = ctx.data;
      const successful = results.filter((r: any) => r.success).length;

      await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Downloaded ${successful} files from ${repo.owner}/${repo.repo}`,
        }),
      });
    },
  };
}
```

---

## Advanced Usage

### Plugin with State

```typescript
import { BasePlugin } from "@vetwo/repo-fetch";

export class StatefulPlugin extends BasePlugin {
  name = "stateful";
  version = "1.0.0";

  private downloadCount = 0;
  private totalBytes = 0;

  hooks = {
    beforeDownload: (ctx) => {
      const { items } = ctx.data;
      this.downloadCount += items.length;
      this.totalBytes += items.reduce((sum: number, item: any) => sum + item.size, 0);
    },
    afterDownload: (ctx) => {
      console.log(`Total downloads: ${this.downloadCount}`);
      console.log(`Total bytes: ${this.totalBytes}`);
    },
  };

  getStats() {
    return {
      downloadCount: this.downloadCount,
      totalBytes: this.totalBytes,
    };
  }
}
```

### Plugin with Configuration

```typescript
import { BasePlugin } from "@vetwo/repo-fetch";

export class ConfigurablePlugin extends BasePlugin {
  name = "configurable";
  version = "1.0.0";

  private config: { maxFiles: number; notify: boolean };

  constructor(config: { maxFiles?: number; notify?: boolean } = {}) {
    super();
    this.config = {
      maxFiles: config.maxFiles ?? 100,
      notify: config.notify ?? true,
    };
  }

  hooks = {
    beforeDownload: (ctx) => {
      const { items } = ctx.data;
      if (items.length > this.config.maxFiles) {
        console.warn(
          `⚠️ Downloading ${items.length} files (max: ${this.config.maxFiles})`
        );
      }
    },
    afterDownload: (ctx) => {
      if (this.config.notify) {
        const { results } = ctx.data;
        const successful = results.filter((r: any) => r.success).length;
        console.log(`✅ Downloaded ${successful} files`);
      }
    },
  };
}
```

### Plugin with External Service Integration

```typescript
import { BasePlugin } from "@vetwo/repo-fetch";

export class SlackPlugin extends BasePlugin {
  name = "slack";
  version = "1.0.0";

  private webhookUrl: string;

  constructor(webhookUrl: string) {
    super();
    this.webhookUrl = webhookUrl;
  }

  hooks = {
    afterDownload: async (ctx) => {
      const { repo, results } = ctx.data;
      const successful = results.filter((r: any) => r.success).length;
      const failed = results.filter((r: any) => !r.success).length;

      await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Download Completed*\n*Repo:* ${repo.owner}/${repo.repo}\n*Files:* ${successful} successful, ${failed} failed`,
              },
            },
          ],
        }),
      });
    },
  };
}
```

---

## Best Practices

### 1. Keep Plugins Focused

```typescript
// Good: Single responsibility
class LoggerPlugin extends BasePlugin {
  name = "logger";
  hooks = {
    beforeDownload: (ctx) => { /* log only */ },
  };
}

// Bad: Too many responsibilities
class SuperPlugin extends BasePlugin {
  name = "super";
  hooks = {
    beforeDownload: (ctx) => { /* log, notify, backup, analytics */ },
  };
}
```

### 2. Handle Errors Gracefully

```typescript
hooks = {
  afterDownload: async (ctx) => {
    try {
      await this.sendNotification(ctx.data);
    } catch (error) {
      console.error("Plugin error:", error);
      // Don't throw - let the download continue
    }
  },
};
```

### 3. Use Async Hooks for I/O

```typescript
// Good: Async for I/O operations
hooks = {
  afterDownload: async (ctx) => {
    await this.saveToDatabase(ctx.data);
  },
};

// Bad: Sync for I/O operations
hooks = {
  afterDownload: (ctx) => {
    this.saveToDatabaseSync(ctx.data); // Blocks execution
  },
};
```

### 4. Document Plugin Behavior

```typescript
/**
 * LoggerPlugin
 * 
 * Logs download activity to console.
 * 
 * Hooks:
 * - beforeDownload: Logs download start
 * - afterDownload: Logs download completion
 * - onError: Logs errors
 */
export class LoggerPlugin extends BasePlugin {
  name = "logger";
  version = "1.0.0";
  // ...
}
```

### 5. Provide Configuration Options

```typescript
export class LoggerPlugin extends BasePlugin {
  name = "logger";
  version = "1.0.0";

  private verbose: boolean;

  constructor(options: { verbose?: boolean } = {}) {
    super();
    this.verbose = options.verbose ?? false;
  }

  hooks = {
    beforeDownload: (ctx) => {
      if (this.verbose) {
        console.log("Download starting:", ctx.data);
      }
    },
  };
}
```

---

## Troubleshooting

### Plugin Not Executing

```typescript
// Check if plugin is registered
const plugins = globalEmitter.getPlugins();
console.log("Registered plugins:", plugins.map(p => p.name));

// Check if hooks are defined
const plugin = plugins.find(p => p.name === "my-plugin");
console.log("Plugin hooks:", Object.keys(plugin?.hooks ?? {}));
```

### Hook Not Receiving Data

```typescript
// Ensure hook signature matches
hooks = {
  // Correct: ctx parameter
  beforeDownload: (ctx) => {
    console.log(ctx.data); // Should have data
  },
  
  // Wrong: missing ctx
  beforeDownload: () => {
    console.log("No data"); // No access to data
  },
};
```

### Plugin Errors Breaking Downloads

```typescript
// Always wrap plugin code in try-catch
hooks = {
  afterDownload: async (ctx) => {
    try {
      await this.riskyOperation(ctx.data);
    } catch (error) {
      console.error("Plugin error (non-fatal):", error);
      // Don't rethrow - let download continue
    }
  },
};
```

### Memory Leaks

```typescript
// Clean up resources in unregister
class MyPlugin extends BasePlugin {
  private interval: NodeJS.Timeout | null = null;

  hooks = {
    beforeDownload: () => {
      this.interval = setInterval(() => {
        // Periodic task
      }, 1000);
    },
    afterDownload: () => {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    },
  };

  unregister(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    super.unregister();
  }
}
```
