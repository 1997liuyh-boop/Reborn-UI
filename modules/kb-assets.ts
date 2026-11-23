import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { defineNuxtModule, useLogger } from "@nuxt/kit";

/** 写进浏览器端组件摘要的字段：示例源码、源码路径等体积大且页面内代理用不到的字段不带 */
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

/** 知识库里 demo 示例只存 path，这里按 path 读源码内联进去；文件缺失或越出仓库的保持为空 */
async function inlineExamples(component: Record<string, unknown>, root: string): Promise<void> {
  const examples = Array.isArray(component.examples) ? (component.examples as Array<{ code?: string; path?: string }>) : [];
  for (const example of examples) {
    if (example.code || !example.path) continue;
    const file = resolve(root, example.path);
    const inside = relative(root, file);
    if (inside.startsWith("..") || isAbsolute(inside)) continue;
    example.code = await readFile(file, "utf8").then((code) => code.replace(/\r\n/g, "\n"), () => undefined);
  }
}

/**
 * 知识库运行时数据生成模块
 *
 * 构建/启动时把 knowledge/ 裁成两份数据（knowledge/ 本身不在构建产物里）：
 * - public/webmcp/：页面内 WebMCP 工具用。index.json（检索索引 + 文档路由）与
 *   components/<id>.json（props / events / slots 摘要）。放静态文件而不打进 JS，
 *   工具被调用时才按需 fetch，不支持 WebMCP 的浏览器不会下载。
 * - 服务端资源 assets:kb：/mcp 端点的组件工具用。同一份索引加完整组件条目（内联示例源码），
 *   由 Nitro 打进服务端包，见 server/utils/kb.ts。
 * 两处都是生成产物，不入库。
 */
export default defineNuxtModule({
  meta: { name: "kb-assets" },
  async setup(_options, nuxt) {
    const logger = useLogger("kb-assets");
    const root = nuxt.options.rootDir;
    const publicDir = join(root, "public", "webmcp");
    // 不放 .nuxt：构建开始时会清空该目录，早于 Nitro 打包
    const serverDir = join(root, "node_modules", ".cache", "reborn-kb");

    nuxt.options.nitro.serverAssets = [...(nuxt.options.nitro.serverAssets ?? []), { baseName: "kb", dir: serverDir }];

    // 先清空再写：组件被删除后不留下过期文件
    await Promise.all([publicDir, serverDir].map((dir) => rm(dir, { recursive: true, force: true })));
    await Promise.all([publicDir, serverDir].map((dir) => mkdir(join(dir, "components"), { recursive: true })));

    let entries: Array<Record<string, unknown> & { id: string }>;
    try {
      const raw = JSON.parse(await readFile(join(root, "knowledge", "index.json"), "utf8"));
      entries = Array.isArray(raw) ? raw : raw.components;
    } catch {
      logger.warn("未找到 knowledge/index.json，跳过知识库运行时数据生成");
      return;
    }

    const docRoutes = await buildDocRoutes(join(root, "content", "2.components")).catch(() => new Map<string, string>());
    const index = JSON.stringify(entries.map((entry) => ({ ...entry, docPath: docRoutes.get(entry.id) ?? null })));
    await Promise.all([publicDir, serverDir].map((dir) => writeFile(join(dir, "index.json"), index, "utf8")));

    // 组件条目依赖 knowledge/components（生成物不入库）；缺失时只有索引，读组件的工具退化为索引字段
    let written = 0;
    for (const { id } of entries) {
      try {
        const raw = JSON.parse(await readFile(join(root, "knowledge", "components", `${id}.json`), "utf8"));
        const docPath = docRoutes.get(id) ?? null;

        const summary: Record<string, unknown> = { docPath };
        for (const field of SUMMARY_FIELDS) {
          if (raw[field] !== undefined) summary[field] = raw[field];
        }
        await writeFile(join(publicDir, "components", `${id}.json`), JSON.stringify(summary), "utf8");

        await inlineExamples(raw, root);
        // docPath 在知识库里是 content 下的文件路径，这里换成站内路由
        await writeFile(join(serverDir, "components", `${id}.json`), JSON.stringify({ ...raw, docPath }), "utf8");
        written++;
      } catch {
        // 单个组件缺失或解析失败不阻塞构建
      }
    }

    if (written) logger.info(`已生成 ${entries.length} 条索引、${written} 份组件条目`);
    else logger.warn("未找到 knowledge/components，只生成了索引；组件条目需先运行 pnpm kb:bootstrap");
  },
});
