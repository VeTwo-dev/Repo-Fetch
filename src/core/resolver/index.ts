import type { RepoIdentifier, ResolvedInput } from "../../types";
import { normalizeRepoUrl } from "../../utils";
import { InvalidRepositoryError } from "../../errors";

export function resolveRepository(input: string): RepoIdentifier {
  const resolved = normalizeRepoUrl(input);
  if (resolved.type === "invalid") {
    throw new InvalidRepositoryError(input);
  }
  return resolved.repo;
}

export function parseRepositoryInput(input: string): ResolvedInput {
  return normalizeRepoUrl(input);
}
