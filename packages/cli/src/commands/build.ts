import path from "node:path";
import fs from "node:fs/promises";
import fssync from "node:fs";
import { Command } from "commander";
import type { RegistryComponent, RegistryFile } from "../types.js";
import { listFilesRecursive, sha1, writeJsonFile } from "../utils/fs.js";
import { extractNpmDependenciesFromText } from "../utils/imports.js";

function isAllowedFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return [
    ".vue",
    ".ts",
    ".js",
    ".json",
    ".css",
    ".md",
    ".svg",
  ].includes(ext);
}

function findWorkspaceRoot(startDir: string) {
  let current = path.resolve(startDir);
  for (;;) {
    const marker = path.join(current, "pnpm-workspace.yaml");
    if (fssync.existsSync(marker)) return current;
    const parent = path.dirname(current);
    if (parent === current) return startDir;
    current = parent;
  }
}

export function buildCommand() {
  const cmd = new Command("build")
    .description("（内部）扫描组件源码并生成 registry JSON")
    .option("--root <path>", "仓库根目录（默认自动向上查找 pnpm-workspace.yaml）")
    .option(
      "--source <path>",
      "组件源码目录（相对 root）",
      "components/content/reborn",
    )
    .option(
      "--out <path>",
      "输出 registry.json 路径（相对 root）",
      "packages/cli/registry/registry.json",
    )
    .option(
      "--also-out <path>",
      "额外再输出一份 registry.json（可重复传参）",
      (val, acc: string[]) => {
        acc.push(val);
        return acc;
      },
      [],
    )
    .action(async (opts) => {
      const rootDir = opts.root
        ? path.resolve(opts.root)
        : findWorkspaceRoot(process.cwd());
      const sourceDir = path.join(rootDir, opts.source);
      const outPath = path.join(rootDir, opts.out);
      const alsoOutPaths: string[] = (opts.alsoOut ?? []).map((p: string) =>
        path.join(rootDir, p),
      );

      const dirents = await fs.readdir(sourceDir, { withFileTypes: true });
      const componentDirs = dirents
        .filter((d) => d.isDirectory())
        .map((d) => path.join(sourceDir, d.name))
        .sort((a, b) => a.localeCompare(b));

      const components: RegistryComponent[] = [];

      for (const absComponentDir of componentDirs) {
        const name = path.basename(absComponentDir);
        const absFiles = (await listFilesRecursive(absComponentDir)).filter(
          isAllowedFile,
        );

        const files: RegistryComponent["files"] = [];
        const depSet = new Set<string>();

        for (const absFile of absFiles) {
          const rel = path
            .relative(absComponentDir, absFile)
            .split(path.sep)
            .join("/");
          const content = await fs.readFile(absFile, "utf8");
          files.push({ path: rel, content });

          // 只从代码文件里抽依赖
          const ext = path.extname(absFile).toLowerCase();
          if (ext === ".ts" || ext === ".js" || ext === ".vue") {
            for (const dep of extractNpmDependenciesFromText(content)) {
              depSet.add(dep);
            }
          }
        }

        components.push({
          name,
          dependencies: [...depSet].sort(),
          files,
        });
      }

      const registry: RegistryFile = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        source: {
          rootDir: rootDir.split(path.sep).join("/"),
          componentsDir: opts.source,
        },
        components,
      };

      async function writeOut(targetRegistryPath: string) {
        const outComponentsDir = path.join(
          path.dirname(targetRegistryPath),
          "components",
        );
        await writeJsonFile(targetRegistryPath, registry);

        // 额外输出每个组件的 json，方便调试/按需读取
        await fs.mkdir(outComponentsDir, { recursive: true });
        for (const c of components) {
          await writeJsonFile(
            path.join(outComponentsDir, `${c.name}.json`),
            {
              ...c,
              fileCount: c.files.length,
              contentHash: sha1(JSON.stringify(c.files.map((f) => f.content))),
            },
          );
        }
      }

      await writeOut(outPath);
      for (const p of alsoOutPaths) await writeOut(p);

      // eslint-disable-next-line no-console
      console.log(
        `registry 已生成：${path.relative(process.cwd(), outPath)}（${components.length} 个组件）`,
      );
    });

  return cmd;
}


