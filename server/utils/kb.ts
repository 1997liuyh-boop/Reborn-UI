import type { KbComponent, KbIndexEntry } from "~~/packages/mcp/src/kb";

/** 索引条目：knowledge/index.json 的字段加站内文档路由 */
export type KbEntry = KbIndexEntry & { docPath: string | null };

/**
 * 服务端读知识库：数据由 modules/kb-assets.ts 生成并经 Nitro 的 serverAssets 打进服务端包
 * （knowledge/ 目录本身不在构建产物里）。组件条目已内联示例源码，docPath 是站内路由。
 */
const KB_STORAGE = "assets:kb";

/** 组件 id 的合法形状；也用来挡住拼进存储键的任意字符串 */
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

let indexPromise: Promise<KbEntry[]> | null = null;
const componentCache = new Map<string, KbComponent>();

/** 全量索引；只读一次 */
export function loadKbIndex(): Promise<KbEntry[]> {
  indexPromise ??= useStorage(KB_STORAGE)
    .getItem<KbEntry[]>("index.json")
    .then((entries) => entries ?? []);
  return indexPromise;
}

/** 按 id 读完整组件条目，不存在返回 null */
export async function loadKbComponent(id: string): Promise<KbComponent | null> {
  if (!ID_PATTERN.test(id)) return null;
  const cached = componentCache.get(id);
  if (cached) return cached;
  const component = await useStorage(KB_STORAGE).getItem<KbComponent>(`components:${id}.json`);
  if (component) componentCache.set(id, component);
  return component;
}

/**
 * 站内路径 → 完整链接。优先用配置的站点地址，没配时取本次请求的来源（反向代理后看转发头）。
 * 远程调用方碰不到用户的浏览器，只能拿链接去展示或打开。
 */
export function toSiteUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  let origin = String(useRuntimeConfig().public.SITE_URL ?? "").replace(/\/+$/, "");
  if (!origin) {
    try {
      origin = getRequestURL(useEvent(), { xForwardedHost: true, xForwardedProto: true }).origin;
    } catch {
      // 取不到请求上下文时退回站内相对路径
    }
  }
  return origin + path;
}
