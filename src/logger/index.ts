import pc from "picocolors";
import type { LogLevel } from "../types";

export class Logger {
  private level: LogLevel = "info";
  private silent = false;

  constructor(level: LogLevel = "info") {
    this.level = level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setSilent(silent: boolean): void {
    this.silent = silent;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.silent) {
      return false;
    }
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  debug(...args: unknown[]): void {
    if (!this.shouldLog("debug")) {
      return;
    }
    console.debug(pc.dim("[debug]"), ...args);
  }

  info(...args: unknown[]): void {
    if (!this.shouldLog("info")) {
      return;
    }
    console.log(pc.blue("ℹ"), ...args);
  }

  success(...args: unknown[]): void {
    if (!this.shouldLog("info")) {
      return;
    }
    console.log(pc.green("✔"), ...args);
  }

  warn(...args: unknown[]): void {
    if (!this.shouldLog("warn")) {
      return;
    }
    console.warn(pc.yellow("⚠"), ...args);
  }

  error(...args: unknown[]): void {
    if (!this.shouldLog("error")) {
      return;
    }
    console.error(pc.red("✖"), ...args);
  }

  step(message: string): void {
    if (!this.shouldLog("info")) {
      return;
    }
    console.log(pc.cyan("→"), message);
  }
}

export const logger = new Logger();
