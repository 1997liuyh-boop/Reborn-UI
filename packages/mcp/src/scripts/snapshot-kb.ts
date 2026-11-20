import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSnapshot, sha256, verifySnapshot } from "./snapshot.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const repoRoot = path.resolve(packageRoot, "..", "..");
const source = path.join(repoRoot, "knowledge");
const target = path.join(packageRoot, "knowledge");

function git(...args: string[]) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
}

try {
  if (process.argv.includes("--check")) {
    const manifest = verifySnapshot(target);
    console.log(`快照校验通过：${manifest.snapshotVersion}（${manifest.componentCount} 个组件）`);
  } else {
    const registryPath = path.join(repoRoot, "packages/cli/registry/registry.json");
    if (!fs.existsSync(path.join(source, "components")) || !fs.existsSync(registryPath)) {
      throw new Error("知识库或 registry 尚未生成，请先运行 pnpm kb:bootstrap");
    }
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    const index = JSON.parse(fs.readFileSync(path.join(source, "index.json"), "utf8"));
    const registryIds = registry.components.map(({ name }: { name: string }) => name).sort();
    const indexIds = index.components.map(({ id }: { id: string }) => id).sort();
    if (JSON.stringify(registryIds) !== JSON.stringify(indexIds)) {
      throw new Error("registry 与知识库索引的组件集合不一致，请重跑 pnpm kb:bootstrap");
    }
    const { version: registryVersion } = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "packages/module/package.json"), "utf8"),
    );
    const manifest = buildSnapshot({
      source,
      target,
      demoRoot: repoRoot,
      provenance: {
        sourceCommit: git("rev-parse", "HEAD"),
        sourceDirty: Boolean(git("status", "--porcelain", "--untracked-files=normal")),
        registryVersion,
        registryHash: sha256(JSON.stringify({ schemaVersion: registry.schemaVersion, components: registry.components })),
      },
    });
    console.log(`知识库快照完成：${manifest.snapshotVersion}（${manifest.componentCount} 个组件）`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
