import type { TreeNode, PreviewData } from "../../types";
import { getSelectedNodes } from "../tree";
import { estimateDownloadTime, formatBytes } from "../../utils";
import { DEFAULT_OUTPUT_DIR } from "../../constants";

export function generatePreview(
  nodes: TreeNode[],
  destination: string = DEFAULT_OUTPUT_DIR,
): PreviewData {
  const selected = getSelectedNodes(nodes);
  const files = selected.filter((f) => f.type === "file").map((f) => f.path);
  const folders = selected.filter((f) => f.type === "directory").map((f) => f.path);
  const totalFiles = files.length;
  const totalFolders = folders.length;
  const totalSize = selected.filter((f) => f.type === "file").reduce((acc, f) => acc + f.size, 0);
  const estimatedTime = estimateDownloadTime(totalSize);

  return {
    files,
    folders,
    totalFiles,
    totalFolders,
    totalSize,
    estimatedTime,
    destination,
  };
}

export function formatPreview(data: PreviewData): string {
  const lines: string[] = ["\nWill download:\n"];

  for (const folder of data.folders.slice(0, 10)) {
    lines.push(`  \ud83d\udcc1 ${folder}`);
  }
  if (data.folders.length > 10) {
    lines.push(`  ... and ${data.folders.length - 10} more folders`);
  }

  for (const file of data.files.slice(0, 10)) {
    lines.push(`  \ud83d\udcc4 ${file}`);
  }
  if (data.files.length > 10) {
    lines.push(`  ... and ${data.files.length - 10} more files`);
  }

  lines.push("");
  lines.push(`  Files:   ${data.totalFiles}`);
  lines.push(`  Folders: ${data.totalFolders}`);
  lines.push(`  Size:    ${formatBytes(data.totalSize)}`);
  lines.push(`  Est.     ${data.estimatedTime}s`);
  lines.push(`  To:      ${data.destination}`);
  lines.push("");

  return lines.join("\n");
}

export async function previewDownload(
  nodes: TreeNode[],
  destination?: string,
): Promise<PreviewData> {
  return generatePreview(nodes, destination);
}
