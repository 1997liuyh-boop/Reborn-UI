import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineNuxtModule, useLogger } from "@nuxt/kit";

/** 写进组件摘要的字段：示例源码、源码路径等体积大且浏览器代理用不到的字段不带 */
const SUMMARY_FIELDS = [
  "id",
  "title",
  "description",
  "category",
  "platforms",
  "props",
  "events",
  "slots",
  "exposes",
  "whenToUse",
  "whenNotToUse",
  "pitfalls",
  "related",
] as const;

/** content 下的文档文件路径 → 站内路由：去掉序号前缀与扩展名 */
function toDocRoute(segments: string[]): string {
  return `/${segments.map((s) => s.replace(/^\d+\./, "").replace(/\.md$/, "")).join("/")}`;
}

/**
 * 组件 id → 文档路由。规则与 scripts/kb/sources.ts 的 buildDocIndex 一致：
 * 文件名等于 id 的优先，正文里的 componentId 声明只作兜底。
 */
async function buildDocRoutes(docsDir: string): Promise<Map<string, string>> {
  const routes = new Map<string, string>();
  const claims: Array<[string, string]> = [];
  for (const dir of await readdir(docsDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of await readdir(join(docsDir, dir.name))) {
      if (!file.endsWith(".md")) continue;
      const route = toDocRoute(["2.components", dir.name, file]);
      routes.set(file.replace(/\.md$/, ""), route);
      const content = await readFile(join(docsDir, dir.name, file), "utf8");
      for (const m of content.matchAll(/componentId="([a-zA-Z0-9-]+)"/g)) claims.push([m[1]!, route]);
    }
  }
  for (const [id, route] of claims) {
    if (!routes.has(id)) routes.set(id, route);
  }
  return routes;
}

/**
 * WebMCP 数据生成模块
 *
 * 构建/启动时把知识库裁成浏览器代理用得到的两份静态数据写入 public/webmcp/：
 * index.json（检索索引 + 文档路由）与 components/<id>.json（props / events / slots 摘要）。
 * 放静态文件而不打进 JS：不支持 WebMCP 的浏览器一个字节都不会下载，工具被调用时才按需 fetch。
 * 目录属于生成产物（已 gitignore）。
 */
export default defineNuxtModule({
  meta: { name: "webmcp-kb" },
  async setup(_options, nuxt) {
    const logger = useLogger("webmcp-kb");
    const root = nuxt.options.rootDir;
    const outDir = join(root, "public", "webmcp");
    const componentsOut = join(outDir, "components");

    let entries: Array<Record<string, unknown> & { id: string }>;
    try {
      const raw = JSON.parse(await readFile(join(root, "knowledge", "index.json"), "utf8"));
      entries = Array.isArray(raw) ? raw : raw.components;
    } catch {
      logger.warn("未找到 knowledge/index.json，跳过 WebMCP 数据生成");
      return;
    }

    const docRoutes = await buildDocRoutes(join(root, "content", "2.components")).catch(() => new Map<string, string>());

    // 先清空再写：组件被删除后不留下过期的摘要文件
    await rm(outDir, { recursive: true, force: true });
    await mkdir(componentsOut, { recursive: true });
    await writeFile(
      join(outDir, "index.json"),
      JSON.stringify(entries.map((entry) => ({ ...entry, docPath: docRoutes.get(entry.id) ?? null }))),
      "utf8",
    );

    // 组件摘要依赖 knowledge/components（生成物不入库）；缺失时只有索引，get_component 退化为索引字段
    let written = 0;
    for (const { id } of entries) {
      try {
        const raw = JSON.parse(await readFile(join(root, "knowledge", "components", `${id}.json`), "utf8"));
        const summary: Record<string, unknown> = { docPath: docRoutes.get(id) ?? null };
        for (const field of SUMMARY_FIELDS) {
          if (raw[field] !== undefined) summary[field] = raw[field];
        }
        await writeFile(join(componentsOut, `${id}.json`), JSON.stringify(summary), "utf8");
        written++;
      } catch {
        // 单个组件缺失或解析失败不阻塞构建
      }
    }

    if (written) logger.info(`已生成 ${entries.length} 条索引、${written} 份组件摘要`);
    else logger.warn("未找到 knowledge/components，只生成了索引；组件摘要需先运行 pnpm kb:bootstrap");
  },
});
