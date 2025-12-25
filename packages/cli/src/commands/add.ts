import path from "node:path";
import { Command } from "commander";
import prompts from "prompts";
import type { PackageManager, RegistryComponent } from "../types.js";
import { ensureDir, pathExists, writeTextFile } from "../utils/fs.js";
import {
  detectPackageManager,
  getMissingDeps,
  installDeps,
  readPackageJson,
} from "../utils/pm.js";
import { defaultConfig, loadConfigCompat, loadRegistry } from "../utils/registry.js";

function rewriteImports(params: {
  content: string;
  aliasSymbol: string;
}) {
  const { content, aliasSymbol } = params;
  if (!aliasSymbol || aliasSymbol === "@") return content;

  // 仅替换项目根目录映射符号：把 "@/xxx" -> "<aliasSymbol>/xxx"
  // 注意：不要影响 scoped package（@scope/name），这里只替换 "@/" 前缀。
  return content.replaceAll("@/", `${aliasSymbol}/`);
}

async function writeComponentFiles(params: {
  cwd: string;
  componentsDir: string;
  aliasSymbol: string;
  component: RegistryComponent;
  overwrite?: boolean;
}) {
  const { cwd, componentsDir, aliasSymbol, component, overwrite } = params;
  const baseDir = path.join(cwd, componentsDir, component.name);
  await ensureDir(baseDir);

  for (const f of component.files) {
    const target = path.join(baseDir, ...f.path.split("/"));
    if (!overwrite && (await pathExists(target))) continue;
    const nextContent = rewriteImports({ content: f.content, aliasSymbol });
    await writeTextFile(target, nextContent);
  }

  return baseDir;
}

export function addCommand() {
  const cmd = new Command("add")
    .description("向项目中添加组件与相关依赖")
    .argument("[components...]", "组件名（可多个）")
    .option("--cwd <path>", "目标项目目录", process.cwd())
    .option("--pm <pm>", "包管理器：pnpm|npm|yarn|bun")
    .option("--yes", "跳过交互", false)
    .option("--overwrite", "覆盖已存在文件", false)
    .option("--config <path>", "配置文件路径（相对 cwd）", "components.json")
    .option("--registry <pkgOrPath>", "覆盖配置里的 registry")
    .option("--components-dir <path>", "覆盖配置里的 componentsDir")
    .option("--lib-dir <path>", "覆盖配置里的 libDir")
    .option("--alias-symbol <symbol>", "覆盖配置里的 aliasSymbol（默认 @）")
    .action(async (components: string[], opts) => {
      const cwd = path.resolve(opts.cwd);
      const pm: PackageManager =
        opts.pm ?? (await detectPackageManager(cwd));

      const cfg = (await loadConfigCompat(cwd, opts.config)) ?? defaultConfig();
      if (opts.registry) cfg.registry = opts.registry;
      if (opts.componentsDir) cfg.componentsDir = opts.componentsDir;
      if (opts.libDir) cfg.libDir = opts.libDir;
      if (opts.aliasSymbol) cfg.aliasSymbol = opts.aliasSymbol;

      const registry = await loadRegistry({ cwd, registry: cfg.registry });

      let targets = components ?? [];
      if (!targets.length) {
        if (opts.yes) {
          throw new Error("未指定组件名；请传入组件参数或去掉 --yes 以交互选择。");
        }
        const choices = registry.components.map((c) => ({
          title: c.name,
          value: c.name,
        }));
        const res = await prompts(
          [
            {
              type: "multiselect",
              name: "selected",
              message: "选择要添加的组件",
              choices,
              min: 1,
            },
          ],
          {
            onCancel: () => {
              throw new Error("已取消");
            },
          },
        );
        targets = res.selected ?? [];
      }

      const pkg = await readPackageJson(cwd);
      const allDeps = new Set<string>();

      for (const name of targets) {
        const c = registry.components.find((x) => x.name === name);
        if (!c) throw new Error(`registry 中不存在该组件：${name}`);

        const outDir = await writeComponentFiles({
          cwd,
          componentsDir: cfg.componentsDir,
          aliasSymbol: cfg.aliasSymbol ?? "@",
          component: c,
          overwrite: opts.overwrite,
        });

        // eslint-disable-next-line no-console
        console.log(`已写入组件：${name} -> ${path.relative(cwd, outDir)}`);

        for (const dep of c.dependencies) allDeps.add(dep);
      }

      const missing = getMissingDeps(pkg, [...allDeps]);
      await installDeps({ cwd, pm, deps: missing });

      // eslint-disable-next-line no-console
      console.log(
        `完成：添加 ${targets.length} 个组件；补装依赖 ${missing.length} 个（pm=${pm}）`,
      );
    });

  return cmd;
}


