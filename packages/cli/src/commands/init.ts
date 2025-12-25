import path from "node:path";
import fs from "node:fs/promises";
import { Command } from "commander";
import prompts from "prompts";
import type { CliConfig, PackageManager } from "../types.js";
import { ensureDir, listFilesRecursive, pathExists, writeJsonFile, writeTextFile } from "../utils/fs.js";
import {
  detectPackageManager,
  getMissingDeps,
  installDeps,
  readPackageJson,
} from "../utils/pm.js";
import { DEFAULT_CONFIG_PATH, defaultConfig, loadConfigCompat } from "../utils/registry.js";
import { copyTemplateSubdir } from "../utils/templates.js";

function looksLikeNuxtProject(cwd: string) {
  return Promise.all([
    pathExists(path.join(cwd, "nuxt.config.ts")),
    pathExists(path.join(cwd, "nuxt.config.js")),
    pathExists(path.join(cwd, "nuxt.config.mjs")),
  ]).then((arr) => arr.some(Boolean));
}

function isTailwindConfig(content: string) {
  return content.includes("tailwind") || content.includes("content:");
}

function makeDefaultTailwindConfig(params: {
  contentGlobs: string[];
}) {
  const { contentGlobs } = params;
  const globs = contentGlobs.map((g) => `    "${g}",`).join("\n");
  return `/** @type {import('tailwindcss').Config} */\nexport default {\n  darkMode: ['class'],\n  content: [\n${globs}\n  ],\n  theme: {\n    extend: {\n      colors: {\n        border: 'hsl(var(--border))',\n        input: 'hsl(var(--input))',\n        ring: 'hsl(var(--ring))',\n        background: 'hsl(var(--background))',\n        foreground: 'hsl(var(--foreground))',\n        primary: {\n          DEFAULT: 'hsl(var(--primary))',\n          foreground: 'hsl(var(--primary-foreground))',\n        },\n        secondary: {\n          DEFAULT: 'hsl(var(--secondary))',\n          foreground: 'hsl(var(--secondary-foreground))',\n        },\n        destructive: {\n          DEFAULT: 'hsl(var(--destructive))',\n          foreground: 'hsl(var(--destructive-foreground))',\n        },\n        muted: {\n          DEFAULT: 'hsl(var(--muted))',\n          foreground: 'hsl(var(--muted-foreground))',\n        },\n        accent: {\n          DEFAULT: 'hsl(var(--accent))',\n          foreground: 'hsl(var(--accent-foreground))',\n        },\n        popover: {\n          DEFAULT: 'hsl(var(--popover))',\n          foreground: 'hsl(var(--popover-foreground))',\n        },\n        card: {\n          DEFAULT: 'hsl(var(--card))',\n          foreground: 'hsl(var(--card-foreground))',\n        },\n      },\n      borderRadius: {\n        xl: 'calc(var(--radius) + 4px)',\n        lg: 'var(--radius)',\n        md: 'calc(var(--radius) - 2px)',\n        sm: 'calc(var(--radius) - 4px)',\n      },\n    },\n  },\n  plugins: [],\n};\n`;
}

function patchTailwindContentArray(existing: string, wantedGlobs: string[]) {
  // 尽量保守：只在发现 content: [ ... ] 时往里补缺失项
  const m = existing.match(/content\s*:\s*\[([\s\S]*?)\]/m);
  if (!m) return null;
  const inner = m[1] ?? "";

  const missing = wantedGlobs.filter((g) => !inner.includes(g));
  if (!missing.length) return existing;

  const insertion = missing.map((g) => `    "${g}",`).join("\n");
  const replaced = existing.replace(
    /content\s*:\s*\[([\s\S]*?)\]/m,
    (full) => {
      // 在 ] 前插入
      return full.replace(/\]\s*$/, `${insertion}\n  ]`);
    },
  );
  return replaced;
}

function defaultCssVariables() {
  return `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer base {\n  :root {\n    --background: 0 0% 100%;\n    --foreground: 222.2 84% 4.9%;\n\n    --card: 0 0% 100%;\n    --card-foreground: 222.2 84% 4.9%;\n\n    --popover: 0 0% 100%;\n    --popover-foreground: 222.2 84% 4.9%;\n\n    --primary: 222.2 47.4% 11.2%;\n    --primary-foreground: 210 40% 98%;\n\n    --secondary: 210 40% 96.1%;\n    --secondary-foreground: 222.2 47.4% 11.2%;\n\n    --muted: 210 40% 96.1%;\n    --muted-foreground: 215.4 16.3% 46.9%;\n\n    --accent: 210 40% 96.1%;\n    --accent-foreground: 222.2 47.4% 11.2%;\n\n    --destructive: 0 84.2% 60.2%;\n    --destructive-foreground: 210 40% 98%;\n\n    --border: 214.3 31.8% 91.4%;\n    --input: 214.3 31.8% 91.4%;\n    --ring: 222.2 84% 4.9%;\n\n    --radius: 0.5rem;\n  }\n\n  .dark {\n    --background: 222.2 84% 4.9%;\n    --foreground: 210 40% 98%;\n\n    --card: 222.2 84% 4.9%;\n    --card-foreground: 210 40% 98%;\n\n    --popover: 222.2 84% 4.9%;\n    --popover-foreground: 210 40% 98%;\n\n    --primary: 210 40% 98%;\n    --primary-foreground: 222.2 47.4% 11.2%;\n\n    --secondary: 217.2 32.6% 17.5%;\n    --secondary-foreground: 210 40% 98%;\n\n    --muted: 217.2 32.6% 17.5%;\n    --muted-foreground: 215 20.2% 65.1%;\n\n    --accent: 217.2 32.6% 17.5%;\n    --accent-foreground: 210 40% 98%;\n\n    --destructive: 0 62.8% 30.6%;\n    --destructive-foreground: 210 40% 98%;\n\n    --border: 217.2 32.6% 17.5%;\n    --input: 217.2 32.6% 17.5%;\n    --ring: 212.7 26.8% 83.9%;\n  }\n}\n`;
}

function cnUtilsTs(params: { importPath?: string }) {
  // importPath 预留：如果用户想从别处导入 clsx/twMerge
  void params;
  return `import { type ClassValue, clsx } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n`;
}

async function patchNuxtConfigAddCss(params: { cwd: string; cssPath: string }) {
  const { cwd, cssPath } = params;
  const nuxtConfigPath = path.join(cwd, "nuxt.config.ts");
  if (!(await pathExists(nuxtConfigPath))) return false;
  const raw = await fs.readFile(nuxtConfigPath, "utf8");
  if (raw.includes(cssPath)) return true;

  // 1) 已有 css: [] -> 补进去
  if (raw.match(/\bcss\s*:\s*\[/)) {
    const patched = raw.replace(/\bcss\s*:\s*\[/, `css: ["${cssPath}", `);
    await fs.writeFile(nuxtConfigPath, patched, "utf8");
    return true;
  }

  // 2) 没有 css 字段：在 defineNuxtConfig({ 后插入
  const m = raw.match(/defineNuxtConfig\(\s*\{\s*/);
  if (!m) return false;
  const patched = raw.replace(
    /defineNuxtConfig\(\s*\{\s*/,
    (s) => `${s}\n  css: ["${cssPath}"],\n`,
  );
  await fs.writeFile(nuxtConfigPath, patched, "utf8");
  return true;
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
    .description("初始化新项目：安装依赖、生成 lib/utils.ts、配置 tailwind 与 CSS 变量，并写入 components.json")
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
            {
              type: "text",
              name: "registry",
              message: "registry（包名或路径）",
              initial: cfg.registry,
            },
            {
              type: "confirm",
              name: "installBaseDeps",
              message: `安装基础依赖（clsx、tailwind-merge、tailwindcss 等）？`,
              initial: true,
            },
            {
              type: nuxt ? "confirm" : null,
              name: "installDocs",
              message: `检测到 Nuxt：若缺失则安装 shadcn-docs-nuxt？`,
              initial: true,
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
        cfg.registry = res.registry ?? cfg.registry;

        // 写配置
        const cfgPath = path.join(cwd, opts.config);
        await writeJsonFile(cfgPath, cfg);

        const pkg = await readPackageJson(cwd);
        const wantDeps: string[] = [];
        if (res.installBaseDeps)
          wantDeps.push("clsx", "tailwind-merge", "tailwindcss", "postcss", "autoprefixer");
        if (res.installDocs) wantDeps.push("shadcn-docs-nuxt");
        const missing = getMissingDeps(pkg, wantDeps);
        // tailwind 相关更适合 devDependencies，但为简化：统一装到 dependencies（pnpm add）
        await installDeps({ cwd, pm, deps: missing });

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

        // 写 CSS 变量文件
        const cssRel = "assets/css/reborn-ui.css";
        const cssAbs = path.join(cwd, cssRel);
        if (!(await pathExists(cssAbs))) {
          await writeTextFile(cssAbs, defaultCssVariables());
        }

        // tailwind.config.js：存在则补 content；不存在则生成
        const contentGlobs = [
          "./components/**/*.{vue,js,ts}",
          "./layouts/**/*.{vue,js,ts}",
          "./pages/**/*.{vue,js,ts}",
          "./plugins/**/*.{js,ts}",
          "./app.vue",
          "./error.vue",
          "./content/**/*.{md,yml,yaml,json}",
          `./${cfg.componentsDir}/**/*.{vue,js,ts}`,
          `./${cfg.composablesDir}/**/*.{js,ts}`,
        ];
        const twPath = path.join(cwd, "tailwind.config.js");
        if (await pathExists(twPath)) {
          const rawTw = await fs.readFile(twPath, "utf8");
          if (isTailwindConfig(rawTw)) {
            const patched = patchTailwindContentArray(rawTw, contentGlobs);
            if (patched && patched !== rawTw) {
              await fs.writeFile(twPath, patched, "utf8");
            }
          }
        } else {
          await writeTextFile(
            twPath,
            makeDefaultTailwindConfig({ contentGlobs }),
          );
        }

        // Nuxt：把 CSS 文件加入 nuxt.config.ts（尽量自动化）
        await patchNuxtConfigAddCss({ cwd, cssPath: `~/${cssRel}` });

        // eslint-disable-next-line no-console
        console.log(
          `已写入配置：${path.relative(process.cwd(), cfgPath)}；并生成 cn/utils、tailwind 配置与 CSS 变量（pm=${pm}）`,
        );
        return;
      }

      // --yes：直接写默认配置并安装基础依赖（缺失则补）
      const cfgPath = path.join(cwd, opts.config);
      await ensureDir(path.dirname(cfgPath));
      await fs.writeFile(cfgPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");

      const pkg = await readPackageJson(cwd);
      const wantDeps = ["clsx", "tailwind-merge", "tailwindcss", "postcss", "autoprefixer"];
      if (await looksLikeNuxtProject(cwd)) wantDeps.push("shadcn-docs-nuxt");
      const missing = getMissingDeps(pkg, wantDeps);
      await installDeps({ cwd, pm, deps: missing });

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

      // 写 CSS 变量文件
      const cssRel = "assets/css/reborn-ui.css";
      const cssAbs = path.join(cwd, cssRel);
      if (!(await pathExists(cssAbs))) {
        await writeTextFile(cssAbs, defaultCssVariables());
      }

      // tailwind.config.js：存在则补 content；不存在则生成
      const contentGlobs = [
        "./components/**/*.{vue,js,ts}",
        "./layouts/**/*.{vue,js,ts}",
        "./pages/**/*.{vue,js,ts}",
        "./plugins/**/*.{js,ts}",
        "./app.vue",
        "./error.vue",
        "./content/**/*.{md,yml,yaml,json}",
        `./${cfg.componentsDir}/**/*.{vue,js,ts}`,
        `./${cfg.composablesDir}/**/*.{js,ts}`,
      ];
      const twPath = path.join(cwd, "tailwind.config.js");
      if (await pathExists(twPath)) {
        const rawTw = await fs.readFile(twPath, "utf8");
        const patched = patchTailwindContentArray(rawTw, contentGlobs);
        if (patched && patched !== rawTw) await fs.writeFile(twPath, patched, "utf8");
      } else {
        await writeTextFile(twPath, makeDefaultTailwindConfig({ contentGlobs }));
      }

      await patchNuxtConfigAddCss({ cwd, cssPath: `~/${cssRel}` });

      // eslint-disable-next-line no-console
      console.log(
        `已初始化：${path.relative(process.cwd(), cfgPath)}；并生成 cn/utils、tailwind 配置与 CSS 变量（pm=${pm}）`,
      );
    });

  return cmd;
}


