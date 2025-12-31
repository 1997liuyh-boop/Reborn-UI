import path from "node:path";
import fs from "node:fs/promises";
import { Command } from "commander";
import prompts from "prompts";
import type { CliConfig, PackageManager } from "../types.js";
import { ensureDir, listFilesRecursive, pathExists, writeJsonFile, writeTextFile } from "../utils/fs.js";
import { detectPackageManager, readPackageJson } from "../utils/pm.js";
import { DEFAULT_CONFIG_PATH, defaultConfig, loadConfigCompat } from "../utils/registry.js";
import { copyTemplateSubdir } from "../utils/templates.js";
import { gradientText, showLogo, typewriter } from "../utils/ui.js";

function looksLikeNuxtProject(cwd: string) {
  return Promise.all([
    pathExists(path.join(cwd, "nuxt.config.ts")),
    pathExists(path.join(cwd, "nuxt.config.js")),
    pathExists(path.join(cwd, "nuxt.config.mjs")),
  ]).then((arr) => arr.some(Boolean));
}


// function makeDefaultTailwindConfig removed in favor of template file




function cnUtilsTs(params: { importPath?: string }) {
  // importPath 预留：如果用户想从别处导入 clsx/twMerge
  void params;
  return `import { type ClassValue, clsx } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n`;
}

async function rewriteAliasInDir(params: {
  cwd: string;
  targetDir: string;
  aliasSymbol: string;
}) {
  const { cwd, targetDir, aliasSymbol } = params;
  if (!aliasSymbol || aliasSymbol === "@") return;
  const absDir = path.join(cwd, targetDir);
  if (!(await pathExists(absDir))) return;

  const files = await listFilesRecursive(absDir);
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    // 只处理常见文本文件，避免误改二进制
    if (![".ts", ".tsx", ".js", ".jsx", ".vue", ".mjs", ".cjs"].includes(ext)) continue;
    const raw = await fs.readFile(f, "utf8");
    const next = raw.replaceAll("@/", `${aliasSymbol}/`);
    if (next !== raw) await fs.writeFile(f, next, "utf8");
  }
}

export function initCommand() {
  const cmd = new Command("init")
    .description("初始化新项目")
    .option("--cwd <path>", "目标项目目录", process.cwd())
    .option("--pm <pm>", "包管理器：pnpm|npm|yarn|bun")
    .option("--yes", "跳过交互，使用默认值", false)
    .option("--overwrite", "覆盖已存在的模板文件（lib/composables）", false)
    .option(
      "--config <path>",
      "配置文件路径（相对 cwd）",
      DEFAULT_CONFIG_PATH,
    )
    .option(
      "--components-dir <path>",
      "组件写入目录",
      defaultConfig().componentsDir,
    )
    .option(
      "--lib-dir <path>",
      "lib 目录（cn/utils）",
      defaultConfig().libDir,
    )
    .option(
      "--composables-dir <path>",
      "composables 目录",
      defaultConfig().composablesDir,
    )
    .option(
      "--alias-symbol <symbol>",
      "项目根目录映射别名符号（默认 @）",
      defaultConfig().aliasSymbol,
    )
    .option("--registry <pkgOrPath>", "registry 来源（默认 builtin）", defaultConfig().registry)
    .action(async (opts) => {
      const cwd = path.resolve(opts.cwd);

      // eslint-disable-next-line no-console
      console.log(
        "提示：项目中有部分依赖需要使用@/ 路径进行配置，请您安装到项目中配置好的路径下，请慎重选择文件位置",
      );

      const pkgPath = path.join(cwd, "package.json");
      if (!(await pathExists(pkgPath))) {
        throw new Error(`未找到 package.json：${pkgPath}`);
      }

      const pm: PackageManager =
        opts.pm ?? (await detectPackageManager(cwd));

      const cfg: CliConfig = {
        schemaVersion: 1,
        componentsDir: opts.componentsDir,
        libDir: opts.libDir,
        composablesDir: opts.composablesDir,
        aliasSymbol: opts.aliasSymbol,
        registry: opts.registry,
      };

      // 如果已存在 components.json，默认沿用（除非用户显式传参覆盖）
      const existing = await loadConfigCompat(cwd);
      if (existing) {
        cfg.componentsDir = opts.componentsDir ?? existing.componentsDir ?? cfg.componentsDir;
        cfg.libDir = opts.libDir ?? existing.libDir ?? cfg.libDir;
        cfg.composablesDir = opts.composablesDir ?? existing.composablesDir ?? cfg.composablesDir;
        cfg.aliasSymbol = opts.aliasSymbol ?? existing.aliasSymbol ?? cfg.aliasSymbol;
        cfg.registry = opts.registry ?? existing.registry ?? cfg.registry;
      }

      if (!opts.yes) {
        const nuxt = await looksLikeNuxtProject(cwd);
        const res = await prompts(
          [
            {
              type: "text",
              name: "componentsDir",
              message: "组件目录（componentsDir）",
              initial: cfg.componentsDir,
            },
            {
              type: "text",
              name: "libDir",
              message: "lib 目录（libDir，用于 cn/utils）",
              initial: cfg.libDir,
            },
            {
              type: "text",
              name: "composablesDir",
              message: "composables 目录（composablesDir）",
              initial: cfg.composablesDir,
            },
            {
              type: "text",
              name: "aliasSymbol",
              message: "基于项目根目录的“映射”的符号是？（aliasSymbol）",
              initial: cfg.aliasSymbol ?? "@",
            },
          ],
          {
            onCancel: () => {
              throw new Error("已取消");
            },
          },
        );

        cfg.componentsDir = res.componentsDir ?? cfg.componentsDir;
        cfg.libDir = res.libDir ?? cfg.libDir;
        cfg.composablesDir = res.composablesDir ?? cfg.composablesDir;
        cfg.aliasSymbol = res.aliasSymbol ?? cfg.aliasSymbol;

        // 写配置
        const cfgPath = path.join(cwd, opts.config);
        await writeJsonFile(cfgPath, cfg);

        // 复制模板：lib/ + composables/
        await copyTemplateSubdir({
          subdir: "lib",
          cwd,
          targetDir: cfg.libDir,
          overwrite: opts.overwrite,
        });
        await copyTemplateSubdir({
          subdir: "composables",
          cwd,
          targetDir: cfg.composablesDir,
          overwrite: opts.overwrite,
        });
        // 仅替换 "@/..." 的别名符号，不改其它路径内容
        await rewriteAliasInDir({ cwd, targetDir: cfg.libDir, aliasSymbol: cfg.aliasSymbol ?? "@" });
        await rewriteAliasInDir({
          cwd,
          targetDir: cfg.composablesDir,
          aliasSymbol: cfg.aliasSymbol ?? "@",
        });

        // 兜底：如果用户模板里没有 utils.ts，则生成 cn
        const libUtilsPath = path.join(cwd, cfg.libDir, "utils.ts");
        if (!(await pathExists(libUtilsPath))) await writeTextFile(libUtilsPath, cnUtilsTs({}));

        console.log(`已写入配置：${path.relative(process.cwd(), cfgPath)}；并生成 cn/utils（pm=${pm}）`);
        console.log("请按照 https://tw.icebreaker.top/docs/quick-start/v4/uni-app-vite 指引进行项目配置初始化");

        console.log("");
        await showLogo();
        await typewriter(gradientText("感谢使用 Reborn UI ! ✨"), 20);
        return;
      }

      // --yes：直接写默认配置
      const cfgPath = path.join(cwd, opts.config);
      await ensureDir(path.dirname(cfgPath));
      await fs.writeFile(cfgPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");

      // 复制模板：lib/ + composables/
      await copyTemplateSubdir({
        subdir: "lib",
        cwd,
        targetDir: cfg.libDir,
        overwrite: opts.overwrite,
      });
      await copyTemplateSubdir({
        subdir: "composables",
        cwd,
        targetDir: cfg.composablesDir,
        overwrite: opts.overwrite,
      });
      // 仅替换 "@/..." 的别名符号，不改其它路径内容
      await rewriteAliasInDir({ cwd, targetDir: cfg.libDir, aliasSymbol: cfg.aliasSymbol ?? "@" });
      await rewriteAliasInDir({
        cwd,
        targetDir: cfg.composablesDir,
        aliasSymbol: cfg.aliasSymbol ?? "@",
      });

      // 兜底：如果用户模板里没有 utils.ts，则生成 cn
      const libUtilsPath = path.join(cwd, cfg.libDir, "utils.ts");
      if (!(await pathExists(libUtilsPath))) await writeTextFile(libUtilsPath, cnUtilsTs({}));

      // eslint-disable-next-line no-console
      console.log(`已初始化：${path.relative(process.cwd(), cfgPath)}；并生成 cn/utils（pm=${pm}）`);
      console.log("请按照 https://tw.icebreaker.top/docs/quick-start/v4/uni-app-vite 指引进行项目配置初始化");

      console.log("");
      await showLogo();
      await typewriter(gradientText("感谢使用 Reborn UI ! ✨"), 2);
    });

  return cmd;
}


