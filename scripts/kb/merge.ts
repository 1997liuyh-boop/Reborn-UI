import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { ComponentKnowledge, EventInfo, ExampleInfo, PropInfo, SlotInfo } from "./schema.js";
import type { DocsExtractResult } from "./extract-docs.js";
import type { VueExtractResult } from "./extract-vue.js";
import {
  categoryForDoc,
  componentSourceDirs,
  buildDocIndex,
  findDemoFiles,
  listComponentFiles,
  loadRegistryDependencies,
  KNOWLEDGE_DIR,
  REPO_ROOT,
} from "./sources.js";
import {
  extractVueFile,
  extractConfigConstants,
  applyConfigOptions,
  collectTypeDeclsFromTsFile,
  type TypeDeclEntry,
} from "./extract-vue.js";
import { extractDocs } from "./extract-docs.js";

/** 单个组件的构建报告 */
export interface ComponentReport {
  id: string;
  extractors: ComponentKnowledge["_meta"]["extractors"];
  warnings: string[];
  /** 文档与源码的偏差（文档有而代码没有的 prop、类型不一致等） */
  drifts: string[];
}

/** 匹配组件间引用（与 CLI 的依赖解析保持一致） */
const COMPONENT_IMPORT_RE = /["'](?:@\/components|\.\.)\/([a-zA-Z0-9-]+)\//g;

/** 计算内容哈希：排除 _meta 与 $schema */
export function contentHashOf(component: Omit<ComponentKnowledge, "_meta"> & { _meta?: unknown }): string {
  const { _meta, $schema, ...rest } = component as any;
  return crypto.createHash("sha1").update(JSON.stringify(rest)).digest("hex");
}

/** 合并单平台的多文件抽取结果（一个组件目录可能有多个 .vue） */
function mergeVueResults(results: VueExtractResult[]): VueExtractResult {
  const merged: VueExtractResult = { props: [], events: [], slots: [], exposes: [], status: "ok", warnings: [] };
  for (const r of results) {
    for (const p of r.props) if (!merged.props.some((x) => x.name === p.name)) merged.props.push(p);
    for (const e of r.events) if (!merged.events.some((x) => x.name === e.name)) merged.events.push(e);
    for (const s of r.slots) if (!merged.slots.some((x) => x.name === s.name)) merged.slots.push(s);
    for (const ex of r.exposes) if (!merged.exposes.some((x) => x.name === ex.name)) merged.exposes.push(ex);
    merged.warnings.push(...r.warnings);
    if (r.status === "failed") merged.status = "partial";
  }
  if (results.length > 0 && results.every((r) => r.status === "failed")) merged.status = "failed";
  else if (merged.warnings.length > 0) merged.status = "partial";
  return merged;
}

/** 抽取一个平台目录下全部主组件文件 */
function extractPlatform(dir: string | null): { result: VueExtractResult | null; files: string[] } {
  if (!dir) return { result: null, files: [] };
  const files = listComponentFiles(dir);
  const vueFiles = files.filter((f) => f.endsWith(".vue"));

  // 同目录 .ts 文件（types.ts 等）里的类型定义，供 defineProps<X> 跨文件解析
  const externalTypes = new Map<string, TypeDeclEntry>();
  for (const f of files) {
    if (!f.endsWith(".ts") || f.endsWith(".config.ts")) continue;
    for (const [name, entry] of collectTypeDeclsFromTsFile(path.join(dir, f))) {
      if (!externalTypes.has(name)) externalTypes.set(name, entry);
    }
  }

  const results = vueFiles.map((f) => extractVueFile(path.join(dir, f), externalTypes));

  // config.ts 的枚举常量 → 填充 options
  const configFile = files.find((f) => f.endsWith(".config.ts"));
  const merged = mergeVueResults(results);
  if (configFile) {
    const constants = extractConfigConstants(path.join(dir, configFile));
    applyConfigOptions(merged.props, constants);
  }
  return { result: merged, files };
}

/** 用文档表格补充源码抽取缺失的描述；记录偏差 */
function enrichWithDocs(
  target: { props: PropInfo[]; events: EventInfo[]; slots: SlotInfo[] },
  docs: DocsExtractResult,
  drifts: string[],
) {
  for (const row of docs.apiProps) {
    const prop = target.props.find((p) => p.name === row.name);
    if (!prop) {
      drifts.push(`文档 Props 表格中的「${row.name}」在源码中不存在`);
      continue;
    }
    if (!prop.description && row.description) prop.description = row.description;
    if (prop.default === undefined && row.default && row.default !== "-") prop.default = row.default;
  }
  for (const row of docs.apiEvents) {
    const event = target.events.find((e) => e.name === row.name);
    if (!event) {
      drifts.push(`文档 Emits 表格中的「${row.name}」在源码中不存在`);
      continue;
    }
    if (!event.description && row.description) event.description = row.description;
    if (!event.payload && row.type) event.payload = row.type;
  }
  for (const row of docs.apiSlots) {
    const slot = target.slots.find((s) => s.name === row.name);
    if (!slot) {
      drifts.push(`文档 Slots 表格中的「${row.name}」在源码中不存在`);
      continue;
    }
    if (!slot.description && row.description) slot.description = row.description;
  }
}

/** 读取 overrides/<id>.json（若存在） */
function loadOverride(id: string): Record<string, any> | null {
  const p = path.join(KNOWLEDGE_DIR, "overrides", `${id}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

/**
 * 应用 overrides：
 * - 标量与数组字段整体替换
 * - props/events/slots/exposes 按 name 合并字段（不新增源码里不存在的条目，examples 除外）
 */
function applyOverride(component: ComponentKnowledge, override: Record<string, any>) {
  const scalarKeys = ["title", "description", "category"] as const;
  for (const key of scalarKeys) {
    if (typeof override[key] === "string") (component as any)[key] = override[key];
  }
  const arrayKeys = ["tags", "related", "whenToUse", "whenNotToUse", "pitfalls"] as const;
  for (const key of arrayKeys) {
    if (Array.isArray(override[key])) (component as any)[key] = override[key];
  }
  if (Array.isArray(override.examples)) {
    // 人工示例追加在 demo 示例之后
    component.examples.push(
      ...override.examples.map((e: any) => ({ source: "manual", ...e })),
    );
  }
  for (const listKey of ["props", "events", "slots", "exposes"] as const) {
    if (!Array.isArray(override[listKey])) continue;
    for (const item of override[listKey]) {
      const existing = (component[listKey] as any[]).find((x) => x.name === item.name);
      if (existing) Object.assign(existing, item);
    }
  }
}

/** 构建单个组件的知识条目 */
export function buildComponent(id: string): { component: ComponentKnowledge; report: ComponentReport } {
  const dirs = componentSourceDirs(id);
  const docIndex = buildDocIndex();
  const doc = docIndex.get(id);
  const registryDeps = loadRegistryDependencies();

  const web = extractPlatform(dirs.web);
  const uniapp = extractPlatform(dirs.uniapp);

  const warnings: string[] = [...(web.result?.warnings ?? []), ...(uniapp.result?.warnings ?? [])];
  const drifts: string[] = [];

  // 以 uniapp 为主骨架（本库跨端组件的 API 基准），web-only 组件用 web
  const primary = uniapp.result ?? web.result;
  const secondary = uniapp.result ? web.result : null;

  const props = [...(primary?.props ?? [])];
  const events = [...(primary?.events ?? [])];
  const slots = [...(primary?.slots ?? [])];
  const exposes = [...(primary?.exposes ?? [])];

  // 双平台组件：并入 web 侧独有的成员
  if (secondary) {
    for (const p of secondary.props) if (!props.some((x) => x.name === p.name)) props.push(p);
    for (const e of secondary.events) if (!events.some((x) => x.name === e.name)) events.push(e);
    for (const s of secondary.slots) if (!slots.some((x) => x.name === s.name)) slots.push(s);
    for (const ex of secondary.exposes) if (!exposes.some((x) => x.name === ex.name)) exposes.push(ex);
  }

  // 文档补充描述 + 记录偏差
  let docsResult: DocsExtractResult | null = null;
  if (doc) {
    docsResult = extractDocs(doc);
    enrichWithDocs({ props, events, slots }, docsResult, drifts);
  }

  // 演示代码 → examples
  const examples: ExampleInfo[] = findDemoFiles(id).map((d) => ({
    title: `${d.platform === "web" ? "Web" : "UniApp"} 演示`,
    code: fs.readFileSync(d.absPath, "utf8"),
    source: "demo" as const,
    platform: d.platform,
  }));

  // 相关组件：扫描源码中的组件间引用
  const related = new Set<string>();
  const allIds = new Set([...docIndex.keys()]);
  for (const side of [dirs.web, dirs.uniapp]) {
    if (!side) continue;
    for (const f of listComponentFiles(side)) {
      if (![".vue", ".ts"].includes(path.extname(f))) continue;
      const content = fs.readFileSync(path.join(side, f), "utf8");
      for (const m of content.matchAll(COMPONENT_IMPORT_RE)) {
        if (m[1] !== id) related.add(m[1]);
      }
    }
  }
  void allIds;

  const platforms: ("web" | "uniapp")[] = [];
  if (dirs.web) platforms.push("web");
  if (dirs.uniapp) platforms.push("uniapp");

  const statusOf = (r: VueExtractResult | null, exists: boolean) => {
    if (!exists) return "absent" as const;
    if (!r) return "failed" as const;
    return r.status === "ok" ? ("ok" as const) : r.status === "partial" ? ("partial" as const) : ("failed" as const);
  };

  const component: ComponentKnowledge = {
    $schema: "../schema/component.schema.json",
    id,
    title: docsResult?.frontmatter.title ?? id,
    description: docsResult?.frontmatter.description ?? "",
    category: categoryForDoc(doc),
    tags: docsResult?.frontmatter.tags ?? [],
    platforms,
    props,
    events,
    slots,
    exposes,
    examples,
    related: [...related].sort(),
    whenToUse: [],
    whenNotToUse: [],
    pitfalls: [],
    dependencies: registryDeps.get(id) ?? [],
    install: { cli: `npx reborn-ui@latest add ${id}` },
    sourceRefs: {
      web: dirs.web ? listComponentFiles(dirs.web).map((f) => `app/components/reborn/ui/${id}/${f}`) : undefined,
      uniapp: dirs.uniapp
        ? listComponentFiles(dirs.uniapp).map((f) => `packages/uniapp-project/src/components/${id}/${f}`)
        : undefined,
    },
    docPath: doc ? doc.relPath : null,
    _meta: {
      generatedAt: "",
      contentHash: "",
      hasOverride: false,
      extractors: {
        web: statusOf(web.result, !!dirs.web),
        uniapp: statusOf(uniapp.result, !!dirs.uniapp),
        docs: doc ? "found" : "missing",
      },
    },
  };

  // 应用人工覆盖层
  const override = loadOverride(id);
  if (override) {
    applyOverride(component, override);
    component._meta.hasOverride = true;
  }

  component._meta.contentHash = contentHashOf(component);

  return {
    component,
    report: { id, extractors: component._meta.extractors, warnings, drifts },
  };
}

export { REPO_ROOT };
