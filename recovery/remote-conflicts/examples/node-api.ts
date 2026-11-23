import {
  resolveRepository,
  listRepositoryTree,
  selectAll,
  downloadSelection,
  filterRepository,
} from "@vetwo/repo-fetch";

// Single file
async function downloadSingleFile(): Promise<void> {
  const repo = resolveRepository("user/repo");
  const tree = await listRepositoryTree(repo, { branch: "main" });

  const node = tree.find((n) => n.path === "README.md");
  if (node) node.selected = true;

  await downloadSelection(tree, repo, { output: "./download" });
}

// Multiple files
async function downloadMultipleFiles(): Promise<void> {
  const repo = resolveRepository("https://github.com/user/repo");
  const tree = await listRepositoryTree(repo);

  const paths = ["package.json", "tsconfig.json", "README.md"];
  for (const path of paths) {
    const node = tree.find((n) => n.path === path);
    if (node) node.selected = true;
  }

  await downloadSelection(tree, repo, { output: "./output", overwrite: true });
}

// Single folder
async function downloadFolder(): Promise<void> {
  const repo = resolveRepository("user/repo#main");
  const tree = await listRepositoryTree(repo);

  const src = tree.find((n) => n.path === "src");
  if (src) src.selected = true;

  await downloadSelection(tree, repo, { output: "./src-output" });
}

// Multiple folders
async function downloadMultipleFolders(): Promise<void> {
  const repo = resolveRepository("user/repo");
  const tree = await listRepositoryTree(repo);

  for (const folder of ["src", "templates", "config"]) {
    const node = tree.find((n) => n.path === folder);
    if (node) node.selected = true;
  }

  await downloadSelection(tree, repo);
}

// Glob pattern
async function downloadByGlob(): Promise<void> {
  const repo = resolveRepository("user/repo");
  const tree = await listRepositoryTree(repo);
  const filtered = await filterRepository(tree, { glob: "**/*.ts" });

  for (const node of filtered) {
    node.selected = true;
  }

  await downloadSelection(tree, repo);
}

// By extension
async function downloadByExtension(): Promise<void> {
  const repo = resolveRepository("user/repo");
  const tree = await listRepositoryTree(repo);
  const filtered = await filterRepository(tree, { extensions: [".ts", ".tsx"] });

  for (const node of filtered) {
    node.selected = true;
  }

  await downloadSelection(tree, repo);
}

// Entire repository
async function downloadEntireRepo(): Promise<void> {
  const repo = resolveRepository("user/repo");
  const tree = await listRepositoryTree(repo);
  selectAll(tree, true);
  await downloadSelection(tree, repo, { output: "./full-repo" });
}

// Preview before download
async function previewAndDownload(): Promise<void> {
  const repo = resolveRepository("user/repo");
  const tree = await listRepositoryTree(repo);
  selectAll(tree, true);

  const { generatePreview, formatPreview } = await import("@vetwo/repo-fetch");
  const preview = generatePreview(tree, "./preview-output");
  console.log(formatPreview(preview));

  // User confirms...
  await downloadSelection(tree, repo, { output: "./preview-output" });
}
