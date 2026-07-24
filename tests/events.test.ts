import { describe, it, expect, vi } from "vitest";
import { EventEmitter, globalEmitter } from "../src/events";

describe("EventEmitter", () => {
  it("emits and receives events", async () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on("beforeDownload", handler);
    await emitter.emit("beforeDownload", { repo: "test" });
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "beforeDownload",
        data: { repo: "test" },
      }),
    );
  });

  it("supports multiple handlers", async () => {
    const emitter = new EventEmitter();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    emitter.on("afterDownload", handler1);
    emitter.on("afterDownload", handler2);
    await emitter.emit("afterDownload", {});
    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it("removes handlers", async () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on("error", handler);
    emitter.off("error", handler);
    await emitter.emit("error", {});
    expect(handler).not.toHaveBeenCalled();
  });

  it("does nothing when no handlers", async () => {
    const emitter = new EventEmitter();
    await expect(emitter.emit("beforeBrowse", {})).resolves.toBeUndefined();
  });

  it("registers and unregisters plugins", () => {
    const emitter = new EventEmitter();
    const plugin = {
      name: "test-plugin",
      version: "1.0.0",
      hooks: {
        beforeDownload: vi.fn(),
      },
    };
    emitter.registerPlugin(plugin);
    expect(emitter.getPlugins()).toHaveLength(1);
    emitter.unregisterPlugin("test-plugin");
    expect(emitter.getPlugins()).toHaveLength(0);
  });

  it("clears all handlers and plugins", () => {
    const emitter = new EventEmitter();
    emitter.on("beforeDownload", vi.fn());
    emitter.registerPlugin({
      name: "test",
      version: "1.0.0",
      hooks: {},
    });
    emitter.clear();
    expect(emitter.getPlugins()).toHaveLength(0);
  });

  it("has a global emitter", () => {
    expect(globalEmitter).toBeInstanceOf(EventEmitter);
  });
});
