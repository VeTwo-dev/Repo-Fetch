import type {
  ResourceManifest,
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  RegistryIndex,
} from "../types";
import { logger } from "../../logger";

export class DependencyResolver {
  private index: RegistryIndex;
  private manifestCache: Map<string, ResourceManifest> = new Map();

  constructor(index: RegistryIndex) {
    this.index = index;
  }

  setManifest(id: string, manifest: ResourceManifest): void {
    this.manifestCache.set(id, manifest);
  }

  async resolve(rootManifest: ResourceManifest): Promise<DependencyGraph> {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const cycles: string[][] = [];

    const allDeps = [
      ...rootManifest.dependencies,
      ...rootManifest.optionalDependencies,
      ...rootManifest.peerDependencies,
    ];

    for (const dep of allDeps) {
      this.resolveDependency(dep.id, dep.type, nodes, edges, visited, visiting, cycles, []);
    }

    const order = this.topologicalSort(nodes, edges);

    for (const conflict of rootManifest.conflicts) {
      const existing = nodes.find((n) => n.id === conflict.id);
      if (existing?.resolved) {
        cycles.push([rootManifest.id, conflict.id]);
        logger.warn(
          `Conflict detected: ${rootManifest.id} conflicts with ${conflict.id} (${conflict.reason})`,
        );
      }
    }

    return { nodes, edges, order, cycles };
  }

  private resolveDependency(
    id: string,
    type: "required" | "optional" | "peer",
    nodes: DependencyNode[],
    edges: DependencyEdge[],
    visited: Set<string>,
    visiting: Set<string>,
    cycles: string[][],
    path: string[],
  ): void {
    if (visited.has(id)) {
      const existing = nodes.find((n) => n.id === id);
      if (existing) {
        existing.type = type === "required" ? existing.type : type;
      }
      return;
    }

    if (visiting.has(id)) {
      cycles.push([...path, id]);
      return;
    }

    visiting.add(id);

    const entry = this.index.resources.find((r) => r.id === id);
    if (!entry) {
      logger.warn(`Dependency "${id}" not found in registry`);
      nodes.push({ id, name: id, version: "*", type, resolved: false });
      visiting.delete(id);
      visited.add(id);
      return;
    }

    const manifest = this.manifestCache.get(id);
    nodes.push({
      id,
      name: entry.name,
      version: entry.version,
      type,
      resolved: true,
      manifest,
    });

    if (manifest) {
      const deps = [
        ...manifest.dependencies,
        ...manifest.optionalDependencies,
        ...manifest.peerDependencies,
      ];

      for (const dep of deps) {
        edges.push({ from: id, to: dep.id, type: dep.type });
        this.resolveDependency(dep.id, dep.type, nodes, edges, visited, visiting, cycles, [
          ...path,
          id,
        ]);
      }
    }

    visiting.delete(id);
    visited.add(id);
  }

  private topologicalSort(nodes: DependencyNode[], edges: DependencyEdge[]): string[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const edge of edges) {
      const current = inDegree.get(edge.to) ?? 0;
      inDegree.set(edge.to, current + 1);
      const adj = adjacency.get(edge.from);
      if (adj) {
        adj.push(edge.to);
      }
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) {
        break;
      }
      sorted.push(current);
      const neighbors = adjacency.get(current) ?? [];
      for (const neighbor of neighbors) {
        const deg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, deg);
        if (deg === 0) {
          queue.push(neighbor);
        }
      }
    }

    return sorted;
  }

  detectCircularDeps(graph: DependencyGraph): string[][] {
    return graph.cycles;
  }

  getRequiredDeps(graph: DependencyGraph): DependencyNode[] {
    return graph.nodes.filter((n) => n.type === "required");
  }

  getOptionalDeps(graph: DependencyGraph): DependencyNode[] {
    return graph.nodes.filter((n) => n.type === "optional");
  }

  getPeerDeps(graph: DependencyGraph): DependencyNode[] {
    return graph.nodes.filter((n) => n.type === "peer");
  }

  getMissingDeps(graph: DependencyGraph): DependencyNode[] {
    return graph.nodes.filter((n) => !n.resolved);
  }

  hasConflicts(graph: DependencyGraph): boolean {
    return graph.cycles.length > 0;
  }
}
