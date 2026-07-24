import type { EventName, PluginContext, Plugin } from "../types";

type EventHandler = (context: PluginContext) => Promise<void> | void;

export class EventEmitter {
  private handlers: Map<EventName, Set<EventHandler>> = new Map();
  private plugins: Map<string, Plugin> = new Map();

  on(event: EventName, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const existing = this.handlers.get(event);
    if (existing) {
      existing.add(handler);
    }
  }

  off(event: EventName, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  async emit(event: EventName, data: Record<string, unknown>): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      await handler({ event, data, plugin: { name: "core", version: "0.1.0", hooks: {} } });
    }
  }

  registerPlugin(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
    for (const [event, handler] of Object.entries(plugin.hooks)) {
      if (handler) {
        this.on(event as EventName, handler as EventHandler);
      }
    }
  }

  unregisterPlugin(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      return;
    }

    for (const [event] of Object.entries(plugin.hooks)) {
      const handlers = this.handlers.get(event as EventName);
      if (handlers) {
        for (const handler of handlers) {
          if ((handler as unknown as { pluginName?: string }).pluginName === name) {
            handlers.delete(handler);
          }
        }
      }
    }
    this.plugins.delete(name);
  }

  getPlugins(): Plugin[] {
    return [...this.plugins.values()];
  }

  clear(): void {
    this.handlers.clear();
    this.plugins.clear();
  }
}

export const globalEmitter = new EventEmitter();
