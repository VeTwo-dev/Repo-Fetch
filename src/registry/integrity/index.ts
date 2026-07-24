import { createHash } from "crypto";
import fs from "fs-extra";
import { resolve } from "pathe";
import type { ResourceManifest, ResourceChecksum, IntegrityResult } from "../types";
import { ResourceManifestSchema } from "../schema";

export async function verifyIntegrity(
  manifest: ResourceManifest,
  downloadPath: string,
): Promise<IntegrityResult> {
  const errors: string[] = [];
  const warningsList: string[] = [];

  const checksumValid = await verifyChecksum(manifest, downloadPath, warningsList);
  if (!checksumValid) {
    errors.push(`Checksum mismatch for ${manifest.name}@${manifest.version}`);
  }

  const manifestValid = verifyManifestSchema(manifest);
  if (!manifestValid) {
    errors.push(`Manifest schema validation failed for ${manifest.name}`);
  }

  const filesValid = await verifyDownloadedFiles(downloadPath);
  if (!filesValid) {
    warningsList.push(`Some files may be missing or corrupted in ${downloadPath}`);
  }

  return {
    valid: errors.length === 0,
    checksumMatch: checksumValid,
    manifestValid,
    schemaValid: manifestValid,
    errors,
    warnings: warningsList,
  };
}

async function verifyChecksum(
  manifest: ResourceManifest,
  downloadPath: string,
  warningsList: string[],
): Promise<boolean> {
  if (manifest.checksum.algorithm === "md5") {
    warningsList.push("MD5 checksums are considered insecure. Consider upgrading to SHA-256.");
  }

  try {
    const targetPath = resolve(downloadPath);
    const exists = await fs.pathExists(targetPath);
    if (!exists) {
      return false;
    }

    const stat = await fs.stat(targetPath);
    if (stat.isFile()) {
      const content = await fs.readFile(targetPath);
      const hash = computeHash(content, manifest.checksum.algorithm);
      return hash === manifest.checksum.value;
    }

    if (stat.isDirectory()) {
      const files = await getAllFiles(targetPath);
      const combinedHash = createHash(manifest.checksum.algorithm);

      for (const file of files.sort()) {
        const content = await fs.readFile(file);
        combinedHash.update(content);
      }

      return combinedHash.digest("hex") === manifest.checksum.value;
    }

    return false;
  } catch {
    return false;
  }
}

function verifyManifestSchema(manifest: ResourceManifest): boolean {
  const result = ResourceManifestSchema.safeParse(manifest);
  return result.success;
}

async function verifyDownloadedFiles(downloadPath: string): Promise<boolean> {
  try {
    const exists = await fs.pathExists(downloadPath);
    if (!exists) {
      return false;
    }

    const stat = await fs.stat(downloadPath);
    if (stat.isFile()) {
      return true;
    }

    const files = await getAllFiles(downloadPath);
    for (const file of files) {
      const fileStat = await fs.stat(file);
      if (fileStat.size === 0) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function computeHash(data: Buffer | string, algorithm: string): string {
  return createHash(algorithm).update(data).digest("hex");
}

export async function computeFileHash(filePath: string, algorithm = "sha256"): Promise<string> {
  const content = await fs.readFile(filePath);
  return computeHash(content, algorithm);
}

export async function computeDirectoryHash(dirPath: string, algorithm = "sha256"): Promise<string> {
  const files = await getAllFiles(dirPath);
  const hash = createHash(algorithm);

  for (const file of files.sort()) {
    const content = await fs.readFile(file);
    hash.update(content);
  }

  return hash.digest("hex");
}

async function getAllFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

export async function generateChecksum(
  filePath: string,
  algorithm: "sha256" | "sha512" | "md5" = "sha256",
): Promise<ResourceChecksum> {
  const value = await computeFileHash(filePath, algorithm);
  return { algorithm, value };
}
