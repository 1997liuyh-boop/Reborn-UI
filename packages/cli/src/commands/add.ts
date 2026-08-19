import path from "node:path";
import { Command } from "commander";
import prompts from "prompts";
import type { PackageManager, RegistryComponent } from "../types.js";
import { ensureDir, pathExists, writeTextFile } from "../utils/fs.js";
import {
  detectPackageManager,
  readPackageJson,
  getMissingDeps,
  installDeps,
} from "../utils/pm.js";
import { resolveDependencies } from "../utils/dependencies.js";
import { defaultConfig, loadConfigCompat, loadRegistry } from "../utils/registry.js";
import cliProgress from "cli-progress";
import chalk from "chalk";
import { successLog } from "../utils/ui.js";

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
  onProgress?: () => void;
  platform: "web" | "uniapp";
}) {
  const { cwd, componentsDir, aliasSymbol, component, overwrite, onProgress, platform } = params;
  const baseDir = path.join(cwd, componentsDir, component.name);
  await ensureDir(baseDir);

  for (const f of component.files) {
    // 过滤逻辑：
    // 1. 如果 f.target 存在且不等于 platform，跳过
    // 2. 如果 f.target 不存在，视为通用文件，不跳过
    if (f.target && f.target !== platform) {
      continue;
    }

    const target = path.join(baseDir, ...f.path.split("/"));
    if (!overwrite && (await pathExists(target))) {
      onProgress?.();
      continue;
    }
    const nextContent = rewriteImports({ content: f.content, aliasSymbol });
    await writeTextFile(target, nextContent);
    onProgress?.();
    // 增加一个极小的延迟，让进度条看起来在“跑”
    await new Promise(r => setTimeout(r, 10));
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
        const choices = registry.components?.map((c) => ({
          // 有中文名时显示「组件名（中文名）」，描述放到 prompts 的 description 灰字
          title: c.title ? `${c.name}（${c.title}）` : c.name,
          value: c.name,
          ...(c.description ? { description: c.description } : {}),
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

      // 询问平台 (Web / UniApp)
      const { platform } = await prompts({
        type: "select",
        name: "platform",
        message: "选择目标平台",
        choices: [
          { title: "Web (默认)", value: "web" },
          { title: "UniApp", value: "uniapp" },
        ],
        initial: 0,
      });

      if (!platform) {
        throw new Error("已取消");
      }

      // 基于 registry 内容解析前置组件与 npm 依赖（替代旧的手写映射表）
      const deps = resolveDependencies({
        registryComponents: registry.components,
        targets,
        platform: platform as "web" | "uniapp",
      });

      const additionalComponents = deps.components.filter(c => !targets.includes(c));
      const npmDependenciesArray = deps.npmDependencies;

      // Prompt for NPM dependencies
      if (npmDependenciesArray.length > 0) {
        const pkg = await readPackageJson(cwd);
        const missingDeps = getMissingDeps(pkg, npmDependenciesArray);
        if (missingDeps.length > 0) {
          console.log(chalk.blue(`\n检测到当前组件需要以下未安装的 npm 依赖：${missingDeps.join(", ")}`));
          const { installNpm } = await prompts({
            type: "confirm",
            name: "installNpm",
            message: `是否需要为这些组件安装以上 npm 依赖?`,
            initial: true,
          });

          if (installNpm) {
            console.log(chalk.cyan("正在安装 npm 依赖..."));
            await installDeps({ cwd, pm, deps: missingDeps });
            successLog(`npm 依赖安装完成`);
          }
        }
      }

      let finalTargets = [...targets];
      if (additionalComponents.length > 0) {
        const missingComponents = [];
        for (const c of additionalComponents) {
          const baseDir = path.join(cwd, cfg.componentsDir, c);
          if (!(await pathExists(baseDir))) {
            missingComponents.push(c);
          }
        }

        if (missingComponents.length > 0) {
          console.log(chalk.blue(`\n检测到需要前置或关联组件：${missingComponents.join(", ")}`));
          const { installComponents } = await prompts({
            type: "confirm",
            name: "installComponents",
            message: `是否自动安装缺失的前置组件?`,
            initial: true,
          });
          if (installComponents) {
            finalTargets = [...finalTargets, ...missingComponents];
          }
        }
      }

      if (!opts.overwrite) {
        const existingComponents = [];
        for (const name of finalTargets) {
          const baseDir = path.join(cwd, cfg.componentsDir, name);
          if (await pathExists(baseDir)) {
            existingComponents.push(name);
          }
        }

        if (existingComponents.length > 0) {
          console.log(chalk.yellow(`\n遇到已存在的组件：${existingComponents.join(", ")}`));
          const { overwrite } = await prompts({
            type: "confirm",
            name: "overwrite",
            message: `是否覆盖并继续安装？`,
            initial: false,
          });

          if (!overwrite) {
            console.log(chalk.red("已终止安装"));
            return;
          }
          opts.overwrite = true;
        }
      }

      const totalFiles = finalTargets.reduce((acc, name) => {
        const c = registry.components.find((x) => x.name === name);
        return acc + (c?.files.length ?? 0);
      }, 0);

      const bar = new cliProgress.SingleBar({
        format: '正在写入文件 |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} 文件',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });

      bar.start(totalFiles, 0);

      for (const name of finalTargets) {
        const c = registry.components.find((x) => x.name === name);
        if (!c) {
          bar.stop();
          throw new Error(`registry 中不存在该组件：${name}`);
        }

        await writeComponentFiles({
          cwd,
          componentsDir: cfg.componentsDir,
          aliasSymbol: cfg.aliasSymbol ?? "@",
          component: c,
          overwrite: opts.overwrite,
          onProgress: () => bar.increment(),
          platform,
        });
      }
      bar.stop();

      console.log("");
      for (const name of finalTargets) {
        successLog(`组件 ${chalk.bold(name)} 已成功添加到项目`);
      }

      // eslint-disable-next-line no-console
      console.log(`\n${chalk.bold.green('DONE')} 已完成 ${finalTargets.length} 个组件的添加（pm=${pm}）`);
    });

  return cmd;
}


