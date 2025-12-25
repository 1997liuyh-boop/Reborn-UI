import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { CliConfig, RegistryFile } from "../types.js";
import { pathExists, readJsonFile } from "./fs.js";

export const DEFAULT_CONFIG_PATH = "components.json";

function findNearestPackageRoot(from: string) {
  // from: import.meta.url
  let dir = path.dirname(fileURLToPath(from));
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return dir;
    dir = parent;
  }
}

export function defaultConfig(): CliConfig {
  return {
    schemaVersion: 1,
    componentsDir: "components",
    libDir: "lib",
    composablesDir: "composables",
    // 默认使用 CLI 包内置的 registry（随 reborn-ui 一起发布）
    registry: "builtin",
    // 项目根目录映射别名符号（默认 @）
    aliasSymbol: "@",
  };
}

export async function loadConfig(cwd: string, configPath = DEFAULT_CONFIG_PATH) {
  const abs = path.isAbsolute(configPath)
    ? configPath
    : path.join(cwd, configPath);
  if (!(await pathExists(abs))) return null;
  return await readJsonFile<CliConfig>(abs);
}

export function resolveRegistryJsonPath(params: { cwd: string; registry: string }) {
  const { cwd, registry } = params;

  // 0) 内置 registry
  if (!registry || registry === "builtin") {
    // 注意：CLI 经过打包后可能变成单文件（例如 dist/index.js），
    // import.meta.url 的相对基准会变化，不能用固定的 ../../registry/...
    // 这里通过向上查找最近的 package.json 来定位包根目录。
    const pkgRoot = findNearestPackageRoot(import.meta.url);
    return path.join(pkgRoot, "registry", "registry.json");
  }

  // 1) 如果是文件路径（包含分隔符或 .json），优先当成路径处理
  const looksLikePath =
    registry.includes("/") ||
    registry.includes("\\") ||
    registry.endsWith(".json");

  if (looksLikePath) {
    const abs = path.isAbsolute(registry) ? registry : path.join(cwd, registry);
    return abs;
  }

  // 2) 当成包名处理：默认读取 <pkg>/registry/registry.json
  const require = createRequire(import.meta.url);
  // 不显式绑定 cwd，避免 npx 场景下找不到 registry 包
  return require.resolve(`${registry}/registry/registry.json`);
}

export async function loadRegistry(params: { cwd: string; registry: string }) {
  const jsonPath = resolveRegistryJsonPath(params);
  return await readJsonFile<RegistryFile>(jsonPath);
}

// 兼容旧配置文件名：shadcn-docs.json
export async function loadConfigCompat(cwd: string, configPath?: string) {
  if (configPath) return await loadConfig(cwd, configPath);
  const primary = await loadConfig(cwd, DEFAULT_CONFIG_PATH);
  if (primary) return primary;
  return await loadConfig(cwd, "shadcn-docs.json");
}


