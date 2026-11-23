import type {
  RegistryIndex,
  RegistryResourceEntry,
  SearchIndexEntry,
  SearchResult,
  SearchOptions,
  ResourceType,
  Runtime,
  Framework,
  PackageManager,
} from "../types";

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    const row = dp[i];
    if (row) {
      row[0] = i;
    }
  }
  for (let j = 0; j <= n; j++) {
    const row = dp[0];
    if (row) {
      row[j] = j;
    }
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const row = dp[i];
      const prevRow = dp[i - 1];
      if (row && prevRow) {
        row[j] = Math.min(
          (prevRow[j] ?? 0) + 1,
          (row[j - 1] ?? 0) + 1,
          (prevRow[j - 1] ?? 0) + cost,
        );
      }
    }
  }

  const lastRow = dp[m];
  return lastRow ? (lastRow[n] ?? 0) : 0;
}

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[-_]/g, " ").trim();
}

function tokenize(str: string): string[] {
  return normalizeString(str)
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function calculateFuzzyScore(query: string, target: string): number {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  if (targetLower === queryLower) {
    return 1.0;
  }
  if (targetLower.startsWith(queryLower)) {
    return 0.9;
  }
  if (targetLower.includes(queryLower)) {
    return 0.7;
  }

  const distance = levenshteinDistance(queryLower, targetLower);
  const maxLen = Math.max(queryLower.length, targetLower.length);
  const similarity = 1 - distance / maxLen;

  if (similarity > 0.6) {
    return 0.3 + similarity * 0.4;
  }

  return 0;
}

function calculateKeywordScore(queryTokens: string[], entry: SearchIndexEntry): number {
  let score = 0;
  const allTerms = [entry.name, entry.displayName, ...entry.keywords, ...entry.tags].map(
    normalizeString,
  );

  for (const token of queryTokens) {
    for (const term of allTerms) {
      if (term === token) {
        score += 1.0;
      } else if (term.includes(token)) {
        score += 0.5;
      } else {
        const dist = levenshteinDistance(token, term);
        const maxLen = Math.max(token.length, term.length);
        if (dist <= 2 && maxLen > 2) {
          score += 0.2;
        }
      }
    }
  }

  return score / Math.max(queryTokens.length, 1);
}

export function searchRegistry(index: RegistryIndex, options: SearchOptions): SearchResult[] {
  const {
    query,
    type,
    category,
    tags,
    runtime,
    framework,
    packageManager,
    limit = 50,
    fuzzy = true,
  } = options;
  const queryTokens = tokenize(query);
  const results: SearchResult[] = [];

  for (const entry of index.searchIndex) {
    if (type && entry.type !== type) {
      continue;
    }
    if (category && entry.category !== category) {
      continue;
    }
    if (tags && tags.length > 0 && !tags.some((t) => entry.tags.includes(t))) {
      continue;
    }

    let matchType: SearchResult["matchType"] = "fuzzy";

    const nameScore = calculateFuzzyScore(query, entry.name);
    const displayNameScore = calculateFuzzyScore(query, entry.displayName);
    const keywordScore = calculateKeywordScore(queryTokens, entry);

    const score = Math.max(nameScore, displayNameScore, keywordScore);

    if (nameScore >= 0.9) {
      matchType = "exact";
    } else if (nameScore >= 0.7 || displayNameScore >= 0.7) {
      matchType = "prefix";
    } else if (keywordScore > 0.3) {
      matchType = "tag";
    }

    if (!fuzzy && matchType === "fuzzy" && score < 0.5) {
      continue;
    }
    if (score < 0.1) {
      continue;
    }

    const resourceEntry = index.resources.find((r) => r.id === entry.id);
    if (!resourceEntry) {
      continue;
    }

    if (runtime && !matchesRuntime(resourceEntry, runtime)) {
      continue;
    }
    if (framework && !matchesFramework(resourceEntry, framework)) {
      continue;
    }
    if (packageManager && !matchesPackageManager(resourceEntry, packageManager)) {
      continue;
    }

    results.push({
      resource: resourceEntry,
      score,
      matchType,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

function matchesRuntime(resource: RegistryResourceEntry, runtime: Runtime): boolean {
  const manifest = resource as unknown as { supportedRuntimes?: Runtime[] };
  if (!manifest.supportedRuntimes) {
    return true;
  }
  return manifest.supportedRuntimes.includes(runtime) || manifest.supportedRuntimes.includes("any");
}

function matchesFramework(resource: RegistryResourceEntry, framework: Framework): boolean {
  const manifest = resource as unknown as { supportedFrameworks?: Framework[] };
  if (!manifest.supportedFrameworks) {
    return true;
  }
  return (
    manifest.supportedFrameworks.includes(framework) || manifest.supportedFrameworks.includes("any")
  );
}

function matchesPackageManager(resource: RegistryResourceEntry, pm: PackageManager): boolean {
  const manifest = resource as unknown as { supportedPackageManagers?: PackageManager[] };
  if (!manifest.supportedPackageManagers) {
    return true;
  }
  return (
    manifest.supportedPackageManagers.includes(pm) ||
    manifest.supportedPackageManagers.includes("any")
  );
}

export function searchByCategory(index: RegistryIndex, category: string): RegistryResourceEntry[] {
  return index.resources.filter((r) => r.category === category);
}

export function searchByTag(index: RegistryIndex, tag: string): RegistryResourceEntry[] {
  return index.resources.filter((r) => r.tags.includes(tag));
}

export function searchByType(index: RegistryIndex, type: ResourceType): RegistryResourceEntry[] {
  return index.resources.filter((r) => r.type === type);
}

export function getCategories(index: RegistryIndex) {
  return index.categories;
}

export function getTags(index: RegistryIndex) {
  return index.tags;
}

export function getPopularResources(index: RegistryIndex, limit = 10): RegistryResourceEntry[] {
  return index.resources
    .slice()
    .sort((a, b) => {
      const aTags = a.tags.length;
      const bTags = b.tags.length;
      return bTags - aTags;
    })
    .slice(0, limit);
}
