import ora, { type Ora } from "ora";
import pc from "picocolors";
import type { ProgressData } from "../../types";
import { formatBytes, formatDuration, formatSpeed } from "../../utils";

export class ProgressTracker {
  private spinner: Ora;
  private startTime: number = 0;
  private data: ProgressData = {
    total: 0,
    completed: 0,
    failed: 0,
    currentFile: "",
    bytesDownloaded: 0,
    totalBytes: 0,
    elapsed: 0,
    speed: 0,
  };

  constructor() {
    this.spinner = ora();
  }

  start(total: number, totalBytes: number): void {
    this.startTime = Date.now();
    this.data.total = total;
    this.data.totalBytes = totalBytes;
    this.spinner.start("Preparing download...");
  }

  update(file: string, bytes: number): void {
    this.data.completed++;
    this.data.currentFile = file;
    this.data.bytesDownloaded += bytes;
    this.data.elapsed = Date.now() - this.startTime;
    this.data.speed =
      this.data.elapsed > 0 ? (this.data.bytesDownloaded / this.data.elapsed) * 1000 : 0;

    const percent =
      this.data.total > 0 ? Math.round((this.data.completed / this.data.total) * 100) : 0;

    this.spinner.text = [
      `${pc.cyan(`${percent}%`)}`,
      `[${this.data.completed}/${this.data.total}]`,
      formatBytes(this.data.bytesDownloaded),
      formatSpeed(this.data.speed),
      pc.dim(this.data.currentFile),
    ].join(" ");
  }

  fail(file: string): void {
    this.data.failed++;
    this.data.currentFile = file;
  }

  succeed(): void {
    const elapsed = formatDuration(Date.now() - this.startTime);
    this.spinner.succeed(
      pc.green(
        `Downloaded ${this.data.completed} files ` +
          `(${formatBytes(this.data.bytesDownloaded)}) ` +
          `in ${elapsed}` +
          (this.data.failed > 0 ? `, ${this.data.failed} failed` : ""),
      ),
    );
  }

  error(message: string): void {
    this.spinner.fail(pc.red(message));
  }

  getData(): ProgressData {
    return { ...this.data };
  }

  stop(): void {
    this.spinner.stop();
  }
}
