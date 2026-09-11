/**
 * 按组件 id 读取它的主题 slot 结构
 *
 * 数据来源是组件自己的 `*.config.ts`，那里有两种写法，都要认：
 *
 * 1. 配置文件里就调了 `~/lib/tv` 的 tv()，导出的是主题函数。
 *    tv() 已经把 slot 定义与指纹挂在函数上（TvSlotMeta），直接读即可。
 * 2. 配置文件只导出 tv 的「选项对象」（`export default { slots, variants, ... }`），
 *    由组件自己 `tv(theme)`。这是仓库里的多数写法，模块里没有主题函数可读，
 *    但指纹只由 slots 决定，按同一个纯函数（fingerprintThemeSlots）算一遍就对得上。
 *
 * 两种写法最终都能拼出 `<组件名称>-<slot 名>-<指纹>` 标记类——它是 tv() 生成类名时追加的，
 * 用它就能在页面上精确找到某个 slot 对应的真实节点。
 *
 * 与文档里手写的 ui 说明表不同，这份数据永远和代码同步，不会写漏或写旧。
 */

import type { TvSlotMeta } from "~/lib/tv";
import { fingerprintThemeSlots, getThemeSlotSelector } from "~/lib/tv";

/** 组件配置模块（懒加载，用到哪个组件才拉哪个） */
const configModules = import.meta.glob<Record<string, unknown>>([
    "~/components/reborn/ui/*/*.config.ts",
]);

/** 单个 slot */
export interface ComponentThemeSlot {
    /** slot 键名，即 ui 属性里的键 */
    key: string;
    /** 主题里声明的基础类名 */
    classes: string;
    /** 在页面上定位该 slot 节点的选择器 */
    selector: string;
}

/** 一份带 slots 的主题（一个配置文件里可能有多份，如主体 + 子项） */
export interface ComponentThemeGroup {
    /** 导出名，如 alertTheme */
    exportName: string;
    /** 主题指纹 */
    themeId: string;
    slots: ComponentThemeSlot[];
}

/** slot 的类名声明可能是字符串或字符串数组，统一成单行字符串 */
function normalizeClasses(value: unknown): string {
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) return value.filter(Boolean).join(" ").trim();
    return "";
}

/**
 * 从一个导出值里取出 slot 元信息，两种配置写法统一在这里收口。
 *
 * 主题函数走 tv() 挂上的元信息；tv 选项对象则现算指纹——算法与 tv() 内部同一份，
 * 得到的指纹必然一致，因为组件是把这个对象原样交给 tv() 的。
 */
function readSlotMeta(value: unknown): TvSlotMeta | null {
    if (typeof value === "function") {
        const meta = value as Partial<TvSlotMeta>;
        if (typeof meta.__rbThemeId !== "string" || !meta.__rbSlots) return null;
        return meta as TvSlotMeta;
    }

    if (!value || typeof value !== "object") return null;
    const slots = (value as { slots?: unknown }).slots;
    // 只认「slots 是非空普通对象」的形状，避免把别的导出误判成主题
    if (!slots || typeof slots !== "object" || Array.isArray(slots)) return null;

    const record = slots as Record<string, unknown>;
    if (!Object.keys(record).length) return null;

    return { __rbThemeId: fingerprintThemeSlots(record), __rbSlots: record };
}

/** 已解析过的组件 -> slot 分组。配置是静态的，同一组件不必反复解析 */
const groupCache = new Map<string, Promise<ComponentThemeGroup[]>>();

/**
 * 加载某个组件的全部主题 slot 分组（结果带缓存）。
 * 组件没有配置文件、或主题没有 slots（只有 base）时返回空数组。
 */
export function loadComponentThemeGroups(componentId: string): Promise<ComponentThemeGroup[]> {
    if (!componentId) return Promise.resolve([]);

    const cached = groupCache.get(componentId);
    if (cached) return cached;

    const pending = resolveComponentThemeGroups(componentId);
    groupCache.set(componentId, pending);
    return pending;
}

async function resolveComponentThemeGroups(componentId: string): Promise<ComponentThemeGroup[]> {
    const suffix = `/${componentId}/${componentId}.config.ts`;
    const entry = Object.entries(configModules).find(([path]) =>
        path.replaceAll("\\", "/").endsWith(suffix),
    );
    if (!entry) return [];

    const module = await entry[1]();
    const groups: ComponentThemeGroup[] = [];

    for (const [name, value] of Object.entries(module)) {
        const meta = readSlotMeta(value);
        if (!meta) continue;

        // 默认导出就是组件主体主题，用组件名当标题比 "default" 直观
        const exportName = name === "default" ? componentId : name;

        const slots = Object.entries(meta.__rbSlots).map<ComponentThemeSlot>(([key, raw]) => ({
            key,
            classes: normalizeClasses(raw),
            selector: getThemeSlotSelector(key, meta.__rbThemeId),
        }));
        if (slots.length) groups.push({ exportName, themeId: meta.__rbThemeId, slots });
    }

    // 主体主题（slot 最多的一份）排在前面
    return groups.sort((a, b) => b.slots.length - a.slots.length);
}
