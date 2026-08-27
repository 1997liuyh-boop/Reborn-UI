import type { DocRef } from "./sources.js";
import YAML from "yaml";
import { readTextFile } from "./sources.js";

/** 文档抽取结果 */
export interface DocsExtractResult {
  frontmatter: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
  };
  /** #api 区域手写表格解析出的三类条目 */
  apiProps: DocApiRow[];
  apiEvents: DocApiRow[];
  apiSlots: DocApiRow[];
}

export interface DocApiRow {
  name: string;
  type?: string;
  default?: string;
  description?: string;
  /** 是否来自严格 API 标题（Props/Emits/Slots 等）下的表格——仅这类行参与漂移校验 */
  strict?: boolean;
  /** 该行所属平台（来自平台 tab 或标题），双端并存的同名条目靠它对号入座 */
  platform?: "web" | "uniapp";
}

/** 去掉 markdown 单元格里的反引号与首尾空白 */
function cleanCell(cell: string): string {
  return cell.trim().replace(/^`|`$/g, "").trim();
}

/** 解析 frontmatter（--- 包围的 YAML 头） */
function parseFrontmatter(content: string): Record<string, any> {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  try {
    return YAML.parse(m[1]) ?? {};
  } catch {
    return {};
  }
}

interface MarkdownTable {
  /** 表格前最近的标题文本（小写），用于分类 */
  heading: string;
  header: string[];
  rows: string[][];
  /**
   * 表格所在的平台 tab（`:::tabs-item{label="Web"}`）。
   * 双端文档里两张表共用同一个 `###` 标题，只靠 heading 无法区分，
   * 必须靠 tab 标签才能把键位归到正确的端上。
   */
  platform?: "web" | "uniapp";
}

/** 从 tabs-item 的 label 判断平台；非平台维度的 tab（如「基础/进阶」）返回 undefined */
function platformFromTabLabel(label: string): "web" | "uniapp" | undefined {
  const l = label.toLowerCase();
  if (l.includes("uni")) return "uniapp";
  if (l.includes("web")) return "web";
  return undefined;
}

/** 从正文中提取所有 markdown 表格及其前置标题 */
function parseTables(content: string): MarkdownTable[] {
  const lines = content.split(/\r?\n/);
  const tables: MarkdownTable[] = [];
  let currentHeading = "";
  let currentPlatform: "web" | "uniapp" | undefined;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const headingMatch = line.match(/^#{1,6}\s+(.+)/);
    if (headingMatch) {
      currentHeading = headingMatch[1].trim().toLowerCase();
      i++;
      continue;
    }

    // MDC 容器：进入 tabs-item 时记下平台，容器闭合（单独一行的 :::）时清除
    const tabMatch = line.match(/^\s*:::+tabs-item\{[^}]*label="([^"]+)"/);
    if (tabMatch) {
      currentPlatform = platformFromTabLabel(tabMatch[1]);
      i++;
      continue;
    }
    if (/^\s*::+\s*$/.test(line)) {
      currentPlatform = undefined;
      i++;
      continue;
    }

    // 表格 = 表头行 + 分隔行（|---|---|）+ 若干数据行
    if (line.trim().startsWith("|") && lines[i + 1]?.trim().match(/^\|[\s:|-]+$/)) {
      const header = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      tables.push({ heading: currentHeading, header, rows, platform: currentPlatform });
      continue;
    }
    i++;
  }
  return tables;
}

/** 拆分表格行为单元格数组；转义的 \| 不作为列分隔符（如类型单元格里的 number \| string） */
function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, "|"));
}

/**
 * 严格 API 标题：仅这些标题下的表格参与文档↔源码漂移校验。
 * 覆盖 "Props"、"## API"（表格直挂其下）、以及等于组件名的标题（如 "`ContainerScroll`"）；
 * 排除 "SubMenu Props"（子组件 API）、"CascaderUI Slots"（ui 键位表）、
 * "自定义样式（ui 属性）"（样式定制表）、"ToastOptions"（类型字段表）这类
 * 不属于当前组件 API 的表格。
 */
function isStrictApiHeading(heading: string, componentId: string): boolean {
  const h = heading
    .replace(/[（(].*$/, "")
    .replace(/`/g, "")
    .trim();
  return (
    /^(?:api|props|emits|events|slots|exposes?)(?:\s+(?:属性|事件|插槽|方法))?$/.test(h) ||
    /^(?:属性|事件|插槽|通用插槽|uniapp\s*专属插槽|expose\s*方法)$/.test(h) ||
    h === componentId ||
    h === componentId.replace(/-/g, "") // PascalCase 组件名小写后即去连字符的 id
  );
}

/** 依据表头/标题判断表格属于 props / events / slots 哪一类 */
function classifyTable(table: MarkdownTable): "props" | "events" | "slots" | "other" {
  const headerText = table.header.join(" ").toLowerCase();
  const heading = table.heading;

  if (heading.includes("slot") || heading.includes("插槽") || headerText.includes("插槽"))
    return "slots";
  if (
    heading.includes("emit") ||
    heading.includes("事件") ||
    headerText.includes("事件名") ||
    headerText.includes("回调参数")
  )
    return "events";
  if (
    heading.includes("prop") ||
    heading.includes("属性") ||
    headerText.includes("属性名") ||
    headerText.includes("默认值")
  )
    return "props";
  return "other";
}

/** 按表头语义把一行映射为 DocApiRow */
function rowToApi(table: MarkdownTable, row: string[]): DocApiRow | null {
  const headerLower = table.header.map((h) => h.toLowerCase());
  const find = (...keys: string[]) => {
    for (const key of keys) {
      const idx = headerLower.findIndex((h) => h.includes(key));
      if (idx >= 0 && row[idx] !== undefined) return cleanCell(row[idx]);
    }
    return undefined;
  };

  const name = find(
    "属性名",
    "参数名",
    "事件名",
    "插槽名",
    "名称",
    "name",
    "属性",
    "参数",
    "事件",
    "插槽",
  );
  if (!name || name === "-" || name === "—") return null;
  return {
    name,
    type: find("类型", "type", "回调参数", "参数说明"),
    default: find("默认值", "default"),
    description: find("描述", "说明", "description"),
  };
}

/** 文档里写出的 ui 键位 */
export interface DocUiKeys {
  web: string[];
  uniapp: string[];
  /** 未放在平台 tab 内的表格——单端组件用单表，键位对两端都适用 */
  shared: string[];
  /** 是否存在 ui 键位表 */
  present: boolean;
}

/**
 * 标题是否在讲当前组件的 `ui` 属性。
 *
 * 只认「自定义样式」或作为独立词出现的 ui：
 * `### Web 版本 \`ui\`` 命中，而 `### Web 版本 \`triggerUi\``、`## CascaderUI Slots`
 * 不命中——后两者讲的是别的组件的子属性表，键位不属于本组件的 ui。
 */
function isUiHeading(heading: string): boolean {
  if (/自定义样式/.test(heading)) return true;
  return /(?:^|[^a-z])ui(?:[^a-z]|$)/.test(heading);
}

/** 从标题文字推断平台，用于没套 tabs 而是按 `### Web 版本 ui` 分小节的文档 */
function platformFromHeading(heading: string): "web" | "uniapp" | undefined {
  const hasUni = /uni ?app|小程序/.test(heading);
  const hasWeb = /web/.test(heading);
  if (hasUni && !hasWeb) return "uniapp";
  if (hasWeb && !hasUni) return "web";
  return undefined;
}

/**
 * 解析「键名」单元格里的键。
 * 现存文档允许一格写多个相关键（如 `` `inputWrapper` / `input` ``），
 * 因此按反引号逐个取，而不是把整格当成一个键名。
 */
function keysInCell(cell: string): string[] {
  const quoted = [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
  const candidates = quoted.length > 0 ? quoted : [cleanCell(cell)];
  return candidates.filter((k) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k));
}

/**
 * 抽取文档里「自定义样式（ui）」小节写出的键位。
 *
 * 以表头定位键名列，而非靠首列内容猜：现存文档的键名列写作
 * 「键名」「名称」「属性」「Key」，而 `| 端 | 可用键 |` 这种把整端的键挤在一格、
 * 不给逐键说明的紧凑写法**故意不认**——它对使用方（和 AI）没有节点定位价值，
 * 应当被守卫判为缺失并重写成逐键表。
 */
export function extractDocUiKeys(absPath: string): DocUiKeys {
  const content = readTextFile(absPath);
  const result: DocUiKeys = { web: [], uniapp: [], shared: [], present: false };

  for (const table of parseTables(content)) {
    const headers = table.header.map(cleanCell);
    const nameIdx = headers.findIndex((h) => /^(?:键名|键|名称|属性|key)$/i.test(h));
    if (nameIdx < 0) continue;
    // 「键名」是 ui 表专用表头，可直接采信；其余泛化表头需靠标题确认语境，
    // 以免把 API 小节里同样叫「名称」的表误收进来
    if (headers[nameIdx] !== "键名" && !isUiHeading(table.heading)) continue;
    if (table.rows.length === 0) continue;

    result.present = true;
    // 平台归属三级回退：行内「平台」列 → 所在 tabs-item → 标题文字
    const platformIdx = headers.findIndex((h) => /^(?:平台|端)$/.test(h));
    const tablePlatform = table.platform ?? platformFromHeading(table.heading);

    for (const row of table.rows) {
      const rowPlatform =
        (platformIdx >= 0 ? platformFromTabLabel(cleanCell(row[platformIdx] ?? "")) : undefined) ??
        tablePlatform;
      const buckets = rowPlatform ? [result[rowPlatform]] : [result.shared];
      for (const name of keysInCell(row[nameIdx] ?? "")) {
        for (const bucket of buckets) if (!bucket.includes(name)) bucket.push(name);
      }
    }
  }
  return result;
}

/** 解析一份组件文档；componentId 用于识别组件名标题下的 API 表格 */
export function extractDocs(doc: DocRef, componentId: string): DocsExtractResult {
  const content = readTextFile(doc.absPath);
  const fm = parseFrontmatter(content);

  const result: DocsExtractResult = {
    frontmatter: {
      title: typeof fm.title === "string" ? fm.title : undefined,
      description: typeof fm.description === "string" ? fm.description : undefined,
      category: typeof fm.category === "string" ? fm.category : undefined,
      tags: Array.isArray(fm.tags) ? fm.tags.map(String) : undefined,
    },
    apiProps: [],
    apiEvents: [],
    apiSlots: [],
  };

  for (const table of parseTables(content)) {
    const kind = classifyTable(table);
    if (kind === "other") continue;
    const strict = isStrictApiHeading(table.heading, componentId);
    for (const row of table.rows) {
      const api = rowToApi(table, row);
      if (!api) continue;
      api.strict = strict;
      api.platform = table.platform ?? platformFromHeading(table.heading);
      if (kind === "props") result.apiProps.push(api);
      if (kind === "events") result.apiEvents.push(api);
      if (kind === "slots") result.apiSlots.push(api);
    }
  }
  return result;
}
