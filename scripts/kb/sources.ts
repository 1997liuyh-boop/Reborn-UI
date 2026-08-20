import type { Category } from "./schema.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** 仓库根目录（scripts/kb 向上两级） */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Web 端组件源码目录 */
export const WEB_COMPONENTS_DIR = path.join(REPO_ROOT, "app/components/reborn/ui");
/** UniApp 端组件源码目录 */
export const UNIAPP_COMPONENTS_DIR = path.join(REPO_ROOT, "packages/uniapp-project/src/components");
/** Web 端演示代码目录 */
export const WEB_EXAMPLES_DIR = path.join(REPO_ROOT, "app/components/reborn/examples");
/** UniApp 端演示页目录 */
export const UNIAPP_PAGES_DIR = path.join(REPO_ROOT, "packages/uniapp-project/src/pages");
/** 组件文档目录 */
export const DOCS_DIR = path.join(REPO_ROOT, "content/2.components");
/** 知识库输出目录 */
export const KNOWLEDGE_DIR = path.join(REPO_ROOT, "knowledge");
/** registry 数据（复用 CLI 构建产物中的依赖信息） */
export const REGISTRY_JSON = path.join(REPO_ROOT, "packages/cli/registry/registry.json");

/**
 * 读取文本文件并把 CRLF 归一为 LF。
 * 抽取结果会写进知识库 JSON 并参与 contentHash 比对，
 * 换行符必须与检出平台无关，否则 Windows 本地生成、Linux CI 校验时会全量误报 drift。
 */
export function readTextFile(absPath: string): string {
  return fs.readFileSync(absPath, "utf8").replace(/\r\n/g, "\n");
}

/** 文档子目录 → 知识库分类 的映射 */
const DOC_DIR_TO_CATEGORY: Record<string, Category> = {
  button: "basic",
  cards: "data-display",
  data: "data-display",
  "device-mocks": "media",
  "input-and-forms": "form",
  layout: "layout",
  miscellaneous: "misc",
  navigation: "navigation",
  "special-effects": "effect",
  "text-animations": "effect",
};

function listSubdirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

/** 枚举全部组件 id（两侧源码目录的并集，排序稳定） */
export function listComponentIds(): string[] {
  const set = new Set<string>([
    ...listSubdirs(WEB_COMPONENTS_DIR),
    ...listSubdirs(UNIAPP_COMPONENTS_DIR),
  ]);
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** 组件在各平台的源码目录（不存在则为 null） */
export function componentSourceDirs(id: string) {
  const web = path.join(WEB_COMPONENTS_DIR, id);
  const uniapp = path.join(UNIAPP_COMPONENTS_DIR, id);
  return {
    web: fs.existsSync(web) ? web : null,
    uniapp: fs.existsSync(uniapp) ? uniapp : null,
  };
}

export interface DocRef {
  /** content 下的相对路径（POSIX 分隔符） */
  relPath: string;
  absPath: string;
  /** 所属文档子目录（用于分类映射） */
  dirName: string;
}

let docIndexCache: Map<string, DocRef> | null = null;

/**
 * 建立 componentId → 文档文件 的索引
 * 匹配规则：文件名等于 id 的文档优先（组件的规范文档），
 * 其他文件里 ComponentViewer 的 componentId 声明仅作兜底
 * （如 reborn-loading-directive.md 也声明 componentId="reborn-loading"，不应抢占组件本档）
 */
export function buildDocIndex(): Map<string, DocRef> {
  if (docIndexCache) return docIndexCache;
  const index = new Map<string, DocRef>();
  if (!fs.existsSync(DOCS_DIR)) return index;

  const claims: { id: string; ref: DocRef }[] = [];
  for (const dir of fs.readdirSync(DOCS_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const dirAbs = path.join(DOCS_DIR, dir.name);
    for (const file of fs.readdirSync(dirAbs)) {
      if (!file.endsWith(".md")) continue;
      const absPath = path.join(dirAbs, file);
      const relPath = path.relative(REPO_ROOT, absPath).split(path.sep).join("/");
      const ref: DocRef = { relPath, absPath, dirName: dir.name };
      const content = readTextFile(absPath);

      // 文件名即 id（如 reborn-switch.md → reborn-switch），最高优先
      index.set(file.replace(/\.md$/, ""), ref);
      // 正文中 componentId="xxx" 的显式声明，留待兜底
      for (const m of content.matchAll(/componentId="([a-zA-Z0-9-]+)"/g)) {
        claims.push({ id: m[1], ref });
      }
    }
  }
  for (const { id, ref } of claims) {
    if (!index.has(id)) index.set(id, ref);
  }
  docIndexCache = index;
  return index;
}

/** 根据文档所在子目录推断分类；无文档时返回 misc */
export function categoryForDoc(doc: DocRef | undefined): Category {
  if (!doc) return "misc";
  return DOC_DIR_TO_CATEGORY[doc.dirName] ?? "misc";
}

/** 查找组件的演示代码文件 */
export function findDemoFiles(id: string) {
  const result: { platform: "web" | "uniapp"; absPath: string }[] = [];

  const webDir = path.join(WEB_EXAMPLES_DIR, id);
  if (fs.existsSync(webDir)) {
    for (const f of fs.readdirSync(webDir)) {
      if (f.endsWith("Demo.vue")) result.push({ platform: "web", absPath: path.join(webDir, f) });
    }
  }

  const uniDir = path.join(UNIAPP_PAGES_DIR, id);
  if (fs.existsSync(uniDir)) {
    for (const f of fs.readdirSync(uniDir)) {
      if (f.endsWith(".vue")) result.push({ platform: "uniapp", absPath: path.join(uniDir, f) });
    }
  }
  return result;
}

/** 读取 registry，返回 id → npm 依赖 的映射 */
export function loadRegistryDependencies(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  if (!fs.existsSync(REGISTRY_JSON)) return map;
  const registry = JSON.parse(fs.readFileSync(REGISTRY_JSON, "utf8"));
  for (const c of registry.components ?? []) {
    map.set(c.name, c.dependencies ?? []);
  }
  return map;
}

/** 列出组件目录下的源码文件（相对路径，POSIX 分隔符） */
export function listComponentFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) walk(abs);
      else out.push(path.relative(dir, abs).split(path.sep).join("/"));
    }
  };
  walk(dir);
  return out.sort();
}
