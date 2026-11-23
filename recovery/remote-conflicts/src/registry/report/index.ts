import type {
  InstallationReport,
  ResourceManifest,
  DependencyNode,
  SkippedResource,
} from "../types";
import { logger } from "../../logger";
import { formatDuration } from "../../utils";

export function createReport(): InstallationReport {
  return {
    success: true,
    startTime: new Date().toISOString(),
    endTime: "",
    duration: 0,
    resources: [],
    dependencies: [],
    warnings: [],
    errors: [],
    skipped: [],
    compatibility: {
      compatible: true,
      runtime: { supported: true, current: "", required: "*", message: "" },
      framework: { supported: true, current: "", required: "*", message: "" },
      packageManager: { supported: true, current: "", required: "*", message: "" },
      nodeVersion: { supported: true, current: "", required: "*", message: "" },
      bunVersion: { supported: true, current: "", required: "*", message: "" },
      os: { supported: true, current: "", required: "*", message: "" },
      architecture: { supported: true, current: "", required: "*", message: "" },
      vetwoVersion: { supported: true, current: "", required: "*", message: "" },
      warnings: [],
      errors: [],
    },
    integrity: [],
    lifecycleResults: [],
    transformResults: [],
    installedFiles: [],
  };
}

export function addInstalledResource(
  report: InstallationReport,
  manifest: ResourceManifest,
  path: string,
  files: string[],
  checksumVerified: boolean,
): void {
  report.resources.push({
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    type: manifest.type,
    path,
    files,
    checksumVerified,
  });
}

export function addInstalledDependency(
  report: InstallationReport,
  dep: DependencyNode,
  path: string,
): void {
  report.dependencies.push({
    id: dep.id,
    name: dep.name,
    version: dep.version,
    type: dep.type,
    path,
  });
}

export function addWarning(
  report: InstallationReport,
  code: string,
  message: string,
  resource?: string,
): void {
  report.warnings.push({ code, message, resource });
}

export function addError(
  report: InstallationReport,
  code: string,
  message: string,
  resource?: string,
  stack?: string,
): void {
  report.errors.push({ code, message, resource, stack });
  report.success = false;
}

export function addSkipped(
  report: InstallationReport,
  id: string,
  name: string,
  reason: SkippedResource["reason"],
  details: string,
): void {
  report.skipped.push({ id, name, reason, details });
}

export function finalizeReport(report: InstallationReport): void {
  report.endTime = new Date().toISOString();
  report.duration = new Date(report.endTime).getTime() - new Date(report.startTime).getTime();
}

export function formatReport(report: InstallationReport): string {
  const lines: string[] = [];

  lines.push("");
  lines.push("Installation Report");
  lines.push("=".repeat(60));
  lines.push("");

  if (report.success) {
    lines.push("  Status: SUCCESS");
  } else {
    lines.push("  Status: FAILED");
  }
  lines.push(`  Duration: ${formatDuration(report.duration)}`);
  lines.push("");

  if (report.resources.length > 0) {
    lines.push("  Installed Resources:");
    for (const resource of report.resources) {
      const check = resource.checksumVerified ? " [verified]" : "";
      lines.push(`    - ${resource.name}@${resource.version} (${resource.type})${check}`);
      lines.push(`      Path: ${resource.path}`);
      lines.push(`      Files: ${resource.files.length}`);
    }
    lines.push("");
  }

  if (report.dependencies.length > 0) {
    lines.push("  Dependencies Installed:");
    for (const dep of report.dependencies) {
      lines.push(`    - ${dep.name}@${dep.version} (${dep.type})`);
    }
    lines.push("");
  }

  if (report.warnings.length > 0) {
    lines.push("  Warnings:");
    for (const warning of report.warnings) {
      const resource = warning.resource ? ` [${warning.resource}]` : "";
      lines.push(`    - ${warning.code}: ${warning.message}${resource}`);
    }
    lines.push("");
  }

  if (report.errors.length > 0) {
    lines.push("  Errors:");
    for (const error of report.errors) {
      const resource = error.resource ? ` [${error.resource}]` : "";
      lines.push(`    - ${error.code}: ${error.message}${resource}`);
    }
    lines.push("");
  }

  if (report.skipped.length > 0) {
    lines.push("  Skipped:");
    for (const skipped of report.skipped) {
      lines.push(`    - ${skipped.name}: ${skipped.reason} (${skipped.details})`);
    }
    lines.push("");
  }

  if (report.lifecycleResults.length > 0) {
    lines.push("  Lifecycle Hooks:");
    for (const result of report.lifecycleResults) {
      const status = result.success ? "OK" : "FAILED";
      lines.push(`    - ${result.hook}: ${status} (${formatDuration(result.duration)})`);
    }
    lines.push("");
  }

  if (report.transformResults.length > 0) {
    lines.push("  Transforms:");
    for (const result of report.transformResults) {
      const status = result.success ? "OK" : "FAILED";
      lines.push(`    - ${result.type} (${result.target}): ${status}`);
    }
    lines.push("");
  }

  if (report.installedFiles.length > 0) {
    lines.push(`  Installed Files: ${report.installedFiles.length}`);
    lines.push("");
  }

  lines.push("=".repeat(60));

  return lines.join("\n");
}

export function printReport(report: InstallationReport): void {
  const formatted = formatReport(report);
  // eslint-disable-next-line no-console
  console.log(formatted);

  if (report.success) {
    logger.success(`Installation completed: ${report.resources.length} resources installed`);
  } else {
    logger.error(`Installation failed: ${report.errors.length} errors`);
  }
}
