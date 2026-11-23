import { describe, it, expect } from "vitest";
import { DependencyResolver } from "../../src/registry/resolver";
import type {
  RegistryIndex,
  ResourceManifest,
  ResourceDependency,
  ResourceConflict,
} from "../../src/registry/types";

function createTestIndex(): RegistryIndex {
  return {
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    resources: [
      {
        id: "a",
        name: "Resource A",
        displayName: "A",
        version: "1.0.0",
        type: "plugin",
        category: "util",
        tags: [],
        description: "",
        author: "test",
        license: "MIT",
        checksum: { algorithm: "sha256", value: "abc" },
        downloadPath: "/a",
        manifestVersion: "1.0.0",
      },
      {
        id: "b",
        name: "Resource B",
        displayName: "B",
        version: "1.0.0",
        type: "module",
        category: "util",
        tags: [],
        description: "",
        author: "test",
        license: "MIT",
        checksum: { algorithm: "sha256", value: "def" },
        downloadPath: "/b",
        manifestVersion: "1.0.0",
      },
      {
        id: "c",
        name: "Resource C",
        displayName: "C",
        version: "1.0.0",
        type: "template",
        category: "util",
        tags: [],
        description: "",
        author: "test",
        license: "MIT",
        checksum: { algorithm: "sha256", value: "ghi" },
        downloadPath: "/c",
        manifestVersion: "1.0.0",
      },
      {
        id: "x",
        name: "Resource X",
        displayName: "X",
        version: "1.0.0",
        type: "plugin",
        category: "util",
        tags: [],
        description: "",
        author: "test",
        license: "MIT",
        checksum: { algorithm: "sha256", value: "aaa" },
        downloadPath: "/x",
        manifestVersion: "1.0.0",
      },
      {
        id: "y",
        name: "Resource Y",
        displayName: "Y",
        version: "1.0.0",
        type: "plugin",
        category: "util",
        tags: [],
        description: "",
        author: "test",
        license: "MIT",
        checksum: { algorithm: "sha256", value: "bbb" },
        downloadPath: "/y",
        manifestVersion: "1.0.0",
      },
      {
        id: "z",
        name: "Resource Z",
        displayName: "Z",
        version: "1.0.0",
        type: "plugin",
        category: "util",
        tags: [],
        description: "",
        author: "test",
        license: "MIT",
        checksum: { algorithm: "sha256", value: "ccc" },
        downloadPath: "/z",
        manifestVersion: "1.0.0",
      },
      {
        id: "missing",
        name: "Missing",
        displayName: "Missing",
        version: "1.0.0",
        type: "plugin",
        category: "util",
        tags: [],
        description: "",
        author: "test",
        license: "MIT",
        checksum: { algorithm: "sha256", value: "xxx" },
        downloadPath: "/m",
        manifestVersion: "1.0.0",
      },
    ],
    categories: [],
    tags: [],
    searchIndex: [],
  };
}

function createManifest(
  id: string,
  deps: ResourceDependency[] = [],
  opts: ResourceDependency[] = [],
  peers: ResourceDependency[] = [],
  conflicts: ResourceConflict[] = [],
): ResourceManifest {
  return {
    id,
    name: `Name ${id}`,
    displayName: `Name ${id}`,
    version: "1.0.0",
    description: "",
    type: "plugin",
    category: "util",
    tags: [],
    keywords: [],
    author: { name: "test" },
    repository: "",
    homepage: "",
    license: "MIT",
    engines: {},
    vetwo: { minVersion: "1.0.0" },
    dependencies: deps,
    optionalDependencies: opts,
    peerDependencies: peers,
    conflicts,
    supportedRuntimes: ["any"],
    supportedFrameworks: ["any"],
    supportedPackageManagers: ["any"],
    checksum: { algorithm: "sha256", value: "abc" },
    downloadPath: "/",
    examples: [],
    documentation: "",
    screenshots: [],
    lifecycleHooks: [],
    variables: [],
    transforms: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("DependencyResolver", () => {
  describe("resolve", () => {
    it("resolves root with no deps → empty graph", async () => {
      const index = createTestIndex();
      const resolver = new DependencyResolver(index);
      const root = createManifest("root");
      const graph = await resolver.resolve(root);

      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
      expect(graph.order).toEqual([]);
      expect(graph.cycles).toEqual([]);
    });

    it("resolves required deps → nodes created, edges created, topological order correct", async () => {
      const index = createTestIndex();
      const resolver = new DependencyResolver(index);

      resolver.setManifest("a", createManifest("a"));
      resolver.setManifest("b", createManifest("b"));

      const root = createManifest("root", [
        { id: "a", version: "1.0.0", name: "a", type: "required" },
        { id: "b", version: "1.0.0", name: "b", type: "required" },
      ]);

      const graph = await resolver.resolve(root);

      expect(graph.nodes).toHaveLength(2);
      expect(graph.nodes.map((n) => n.id).sort()).toEqual(["a", "b"]);
      expect(graph.edges).toEqual([]);

      const aNode = graph.nodes.find((n) => n.id === "a")!;
      expect(aNode.resolved).toBe(true);
      expect(aNode.type).toBe("required");

      expect(graph.order).toEqual(["a", "b"]);
    });

    it("resolves transitive deps (a→b→c)", async () => {
      const index = createTestIndex();
      const resolver = new DependencyResolver(index);

      resolver.setManifest(
        "a",
        createManifest("a", [{ id: "b", version: "1.0.0", name: "b", type: "required" }]),
      );
      resolver.setManifest(
        "b",
        createManifest("b", [{ id: "c", version: "1.0.0", name: "c", type: "required" }]),
      );
      resolver.setManifest("c", createManifest("c"));

      const root = createManifest("root", [
        { id: "a", version: "1.0.0", name: "a", type: "required" },
      ]);

      const graph = await resolver.resolve(root);

      expect(graph.nodes).toHaveLength(3);
      expect(graph.edges).toHaveLength(2);
      expect(graph.edges).toContainEqual({ from: "a", to: "b", type: "required" });
      expect(graph.edges).toContainEqual({ from: "b", to: "c", type: "required" });

      expect(graph.order).toHaveLength(3);
      expect(graph.order).toContain("a");
      expect(graph.order).toContain("b");
      expect(graph.order).toContain("c");
    });

    it("handles missing deps → node created with resolved=false", async () => {
      const index = createTestIndex();
      const resolver = new DependencyResolver(index);

      const root = createManifest("root", [
        { id: "not-in-index", version: "1.0.0", name: "not-in-index", type: "required" },
      ]);

      const graph = await resolver.resolve(root);

      expect(graph.nodes).toHaveLength(1);
      const missing = graph.nodes[0];
      expect(missing?.id).toBe("not-in-index");
      expect(missing?.resolved).toBe(false);
      expect(missing?.version).toBe("*");
    });

    it("detects circular deps → cycles populated", async () => {
      const index = createTestIndex();
      const resolver = new DependencyResolver(index);

      resolver.setManifest(
        "a",
        createManifest("a", [{ id: "b", version: "1.0.0", name: "b", type: "required" }]),
      );
      resolver.setManifest(
        "b",
        createManifest("b", [{ id: "a", version: "1.0.0", name: "a", type: "required" }]),
      );

      const root = createManifest("root", [
        { id: "a", version: "1.0.0", name: "a", type: "required" },
      ]);

      const graph = await resolver.resolve(root);

      expect(graph.cycles.length).toBeGreaterThan(0);
      const cycle = graph.cycles[0];
      expect(cycle).toContain("a");
      expect(cycle).toContain("b");
    });
  });

  describe("getRequiredDeps / getOptionalDeps / getPeerDeps", () => {
    it("filters correctly by type", async () => {
      const index = createTestIndex();
      const resolver = new DependencyResolver(index);

      resolver.setManifest("a", createManifest("a"));
      resolver.setManifest("b", createManifest("b"));
      resolver.setManifest("c", createManifest("c"));

      const root = createManifest(
        "root",
        [{ id: "a", version: "1.0.0", name: "a", type: "required" }],
        [{ id: "b", version: "1.0.0", name: "b", type: "optional" }],
        [{ id: "c", version: "1.0.0", name: "c", type: "peer" }],
      );

      const graph = await resolver.resolve(root);

      const required = resolver.getRequiredDeps(graph);
      const optional = resolver.getOptionalDeps(graph);
      const peers = resolver.getPeerDeps(graph);

      expect(required).toHaveLength(1);
      expect(required[0]?.id).toBe("a");

      expect(optional).toHaveLength(1);
      expect(optional[0]?.id).toBe("b");

      expect(peers).toHaveLength(1);
      expect(peers[0]?.id).toBe("c");
    });
  });

  describe("getMissingDeps", () => {
    it("returns unresolved nodes", async () => {
      const index = createTestIndex();
      const resolver = new DependencyResolver(index);

      resolver.setManifest("a", createManifest("a"));

      const root = createManifest("root", [
        { id: "a", version: "1.0.0", name: "a", type: "required" },
        { id: "ghost", version: "1.0.0", name: "ghost", type: "required" },
      ]);

      const graph = await resolver.resolve(root);
      const missing = resolver.getMissingDeps(graph);

      expect(missing).toHaveLength(1);
      expect(missing[0]?.id).toBe("ghost");
      expect(missing[0]?.resolved).toBe(false);
    });
  });

  describe("hasConflicts", () => {
    it("returns true when cycles exist", async () => {
      const index = createTestIndex();
      const resolver = new DependencyResolver(index);

      resolver.setManifest(
        "a",
        createManifest("a", [{ id: "b", version: "1.0.0", name: "b", type: "required" }]),
      );
      resolver.setManifest(
        "b",
        createManifest("b", [{ id: "a", version: "1.0.0", name: "a", type: "required" }]),
      );

      const root = createManifest("root", [
        { id: "a", version: "1.0.0", name: "a", type: "required" },
      ]);

      const graph = await resolver.resolve(root);

      expect(resolver.hasConflicts(graph)).toBe(true);
    });

    it("returns false when no cycles exist", async () => {
      const index = createTestIndex();
      const resolver = new DependencyResolver(index);

      resolver.setManifest("a", createManifest("a"));

      const root = createManifest("root", [
        { id: "a", version: "1.0.0", name: "a", type: "required" },
      ]);

      const graph = await resolver.resolve(root);

      expect(resolver.hasConflicts(graph)).toBe(false);
    });
  });

  describe("detectCircularDeps", () => {
    it("returns the cycles from the graph", async () => {
      const index = createTestIndex();
      const resolver = new DependencyResolver(index);

      resolver.setManifest(
        "x",
        createManifest("x", [{ id: "y", version: "1.0.0", name: "y", type: "required" }]),
      );
      resolver.setManifest(
        "y",
        createManifest("y", [{ id: "z", version: "1.0.0", name: "z", type: "required" }]),
      );
      resolver.setManifest(
        "z",
        createManifest("z", [{ id: "x", version: "1.0.0", name: "x", type: "required" }]),
      );

      const root = createManifest("root", [
        { id: "x", version: "1.0.0", name: "x", type: "required" },
      ]);

      const graph = await resolver.resolve(root);
      const cycles = resolver.detectCircularDeps(graph);

      expect(cycles.length).toBeGreaterThan(0);
      const allIds = cycles.flat();
      expect(allIds).toContain("x");
      expect(allIds).toContain("y");
      expect(allIds).toContain("z");
    });
  });
});
