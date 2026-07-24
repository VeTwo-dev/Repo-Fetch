import type { Plugin, PluginHooks } from "../types";
import { globalEmitter } from "../events";

export abstract class BasePlugin implements Plugin {
  abstract name: string;
  abstract version: string;
  abstract hooks: Partial<PluginHooks>;

  register(): void {
    globalEmitter.registerPlugin(this);
  }

  unregister(): void {
    globalEmitter.unregisterPlugin(this.name);
  }
}
