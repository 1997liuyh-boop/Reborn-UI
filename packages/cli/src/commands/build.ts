import path from "node:path";
import fs from "node:fs/promises";
import fssync from "node:fs";
import { Command } from "commander";
import type { RegistryComponent, RegistryFile } from "../types.js";
import { listFilesRecursive, sha1, writeJsonFile } from "../utils/fs.js";
import { extractNpmDependenciesFromText } from "../utils/imports.js";

/**
 * 读取要嵌入 registry 的源码文本，并把 CRLF 归一为 LF。
 * registry JSON 参与 CI 幂等校验（重建后与提交版本比对），
 * 嵌入内容必须与构建平台无关，否则 Windows 本地生成、Linux CI 重建时全量不一致。
 */
async function readEmbeddedText(absPath: string): Promise<string> {
  return (await fs.readFile(absPath, "utf8")).replace(/\r\n/g, "\n");
}

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

import { transformToUniapp } from "../utils/transformers.js";

function findWorkspaceRoot(startDir: string) {
  let current = path.resolve(startDir);
  for (; ;) {
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
      "app/components/reborn/ui",
    )
    .option(
      "--uniapp-source <path>",
      "UniApp 组件源码目录（相对 root），如果不提供则通过转换生成",
      "",
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
    .option(
      "--kb-index <path>",
      "知识库索引文件路径（相对 root），用于注入 title/description/category/tags",
      "knowledge/index.json",
    )
    .option(
      "--strict-kb",
      "知识库索引缺失或损坏时直接失败（发布与 CI 必开，防止发出没有标题描述的 registry）",
      false,
    )
    .action(async (opts) => {
      const rootDir = opts.root
        ? path.resolve(opts.root)
        : findWorkspaceRoot(process.cwd());
      const sourceDir = path.join(rootDir, opts.source);
      const uniappSourceDir = opts.uniappSource
        ? path.join(rootDir, opts.uniappSource)
        : "";
      const outPath = path.join(rootDir, opts.out);
      const alsoOutPaths: string[] = (opts.alsoOut ?? [])?.map((p: string) =>
        path.join(rootDir, p),
      );

      // 读取知识库索引，按组件 id 注入 title/description/category/tags
      // 默认静默降级（在无 knowledge/ 的环境单独跑 CLI build）；
      // --strict-kb 下缺失或损坏一律失败 —— registry 已不入库，发布时全靠这一步现生成，
      // 静默降级会让 npm 上出现一份没有标题和描述的 registry，且事后无人察觉。
      type KbIndexEntry = {
        id: string;
        title?: string;
        description?: string;
        category?: string;
        tags?: string[];
      };
      const kbMeta = new Map<string, KbIndexEntry>();
      const kbIndexPath = path.join(rootDir, opts.kbIndex);
      const kbFail = (reason: string) => {
        if (opts.strictKb) {
          // eslint-disable-next-line no-console
          console.error(`${reason}：${kbIndexPath}\n请先在仓库根运行 pnpm kb:build`);
          process.exit(1);
        }
        // eslint-disable-next-line no-console
        console.warn(`${reason}，跳过元数据注入：${kbIndexPath}`);
      };

      if (!fssync.existsSync(kbIndexPath)) {
        kbFail("知识库索引不存在");
      } else {
        try {
          const raw = JSON.parse(await fs.readFile(kbIndexPath, "utf8"));
          const entries: KbIndexEntry[] = Array.isArray(raw) ? raw : raw.components;
          for (const e of entries ?? []) {
            if (e?.id) kbMeta.set(e.id, e);
          }
          if (kbMeta.size === 0) kbFail("知识库索引为空");
        } catch {
          kbFail("知识库索引解析失败");
        }
      }

      const dirents = await fs.readdir(sourceDir, { withFileTypes: true });
      let componentDirs = dirents
        .filter((d) => d.isDirectory())
        ?.map((d) => d.name);

      if (uniappSourceDir && fssync.existsSync(uniappSourceDir)) {
        const uniappDirents = await fs.readdir(uniappSourceDir, { withFileTypes: true });
        const uniappDirs = uniappDirents
          .filter((d) => d.isDirectory())
          ?.map((d) => d.name);
        for (const dir of uniappDirs) {
          if (!componentDirs.includes(dir)) {
            componentDirs.push(dir);
          }
        }
      }

      componentDirs = componentDirs.sort((a, b) => a.localeCompare(b));

      const components: RegistryComponent[] = [];

      for (const componentName of componentDirs) {
        const name = componentName;
        const absComponentDir = path.join(sourceDir, componentName);
        let absFiles: string[] = [];

        if (fssync.existsSync(absComponentDir)) {
          absFiles = (await listFilesRecursive(absComponentDir)).filter(isAllowedFile);
        }
        const files: RegistryComponent["files"] = [];
        const depSet = new Set<string>();

        for (const absFile of absFiles) {
          const rel = path
            .relative(absComponentDir, absFile)
            .split(path.sep)
            .join("/");
          const content = await readEmbeddedText(absFile);

          const ext = path.extname(absFile).toLowerCase();

          // 1. Web 版本（原样）
          if (ext === ".vue") {
            files.push({ path: rel, content, target: "web" });
          } else {
            // Check for collision with UniApp source
            let target: "web" | "uniapp" | undefined;
            if (uniappSourceDir) {
              const parts = rel.split("/");
              const uniappFile = path.join(uniappSourceDir, name, ...parts);
              if (fssync.existsSync(uniappFile)) {
                target = "web";
              }
            }
            if (target) {
              files.push({ path: rel, content, target });
            } else {
              files.push({ path: rel, content });
            }
          }

          // 只从代码文件里抽依赖
          if (ext === ".ts" || ext === ".js" || ext === ".vue") {
            for (const dep of extractNpmDependenciesFromText(content)) {
              depSet.add(dep);
            }
          }
        }

        // 2. UniApp 版本
        // 如果提供了 uniappSourceDir，从那里读取；否则通过转换生成
        if (uniappSourceDir) {
          const uniappComponentDir = path.join(uniappSourceDir, name);
          if (fssync.existsSync(uniappComponentDir)) {
            const uniappFiles = (await listFilesRecursive(uniappComponentDir)).filter(
              isAllowedFile,
            );

            for (const absFile of uniappFiles) {
              const rel = path
                .relative(uniappComponentDir, absFile)
                .split(path.sep)
                .join("/");
              const content = await readEmbeddedText(absFile);
              const ext = path.extname(absFile).toLowerCase();

              files.push({ path: rel, content, target: "uniapp" });

              // 抽取依赖
              if (ext === ".ts" || ext === ".js" || ext === ".vue") {
                for (const dep of extractNpmDependenciesFromText(content)) {
                  depSet.add(dep);
                }
              }
            }
          }
        } else {
          // 通过转换生成 UniApp 版本
          for (const absFile of absFiles) {
            const ext = path.extname(absFile).toLowerCase();
            if (ext === ".vue") {
              const rel = path
                .relative(absComponentDir, absFile)
                .split(path.sep)
                .join("/");
              const content = await readEmbeddedText(absFile);
              files.push({
                path: rel,
                content: transformToUniapp(content),
                target: "uniapp",
              });
            }
          }
        }

        const meta = kbMeta.get(name);
        components.push({
          name,
          // 知识库缺该组件时字段留空，不阻塞生成
          ...(meta?.title ? { title: meta.title } : {}),
          ...(meta?.description ? { description: meta.description } : {}),
          ...(meta?.category ? { category: meta.category } : {}),
          ...(meta?.tags?.length ? { tags: meta.tags } : {}),
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

        // 先清空 components 目录再重建，避免已删除组件的 JSON 残留成孤儿
        await fs.rm(outComponentsDir, { recursive: true, force: true });

        // 额外输出每个组件的 json，方便调试/按需读取
        await fs.mkdir(outComponentsDir, { recursive: true });
        for (const c of components) {
          await writeJsonFile(
            path.join(outComponentsDir, `${c.name}.json`),
            {
              ...c,
              fileCount: c.files.length,
              contentHash: sha1(JSON.stringify(c.files?.map((f) => f.content))),
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


