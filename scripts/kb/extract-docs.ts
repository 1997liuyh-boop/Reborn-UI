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
}

/** 从正文中提取所有 markdown 表格及其前置标题 */
function parseTables(content: string): MarkdownTable[] {
  const lines = content.split(/\r?\n/);
  const tables: MarkdownTable[] = [];
  let currentHeading = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const headingMatch = line.match(/^#{1,6}\s+(.+)/);
    if (headingMatch) {
      currentHeading = headingMatch[1].trim().toLowerCase();
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
      tables.push({ heading: currentHeading, header, rows });
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
      if (kind === "props") result.apiProps.push(api);
      if (kind === "events") result.apiEvents.push(api);
      if (kind === "slots") result.apiSlots.push(api);
    }
  }
  return result;
}
