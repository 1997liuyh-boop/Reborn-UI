import type { ContentNavigationItem } from "@nuxt/content";

/** 文档站当前浏览的平台：顶栏开关的两个档位 */
export type DocsPlatform = "web" | "uniapp";

/** 组件文档 frontmatter 的 `platform` 取值：仅 Web / 仅 UniApp / 双端通用 */
export type ComponentPlatform = DocsPlatform | "both";

/** 组件文档目录前缀：只有这个分区下的叶子节点参与平台筛选 */
const COMPONENTS_PATH_PREFIX = "/components/";

/** localStorage 键：跨会话记住上次选择的平台 */
export const DOCS_PLATFORM_STORAGE_KEY = "reborn-docs-platform";

/** 校验读入的字符串是否为合法档位（localStorage 内容不可信） */
export function isDocsPlatform(value: unknown): value is DocsPlatform {
    return value === "web" || value === "uniapp";
}

/**
 * 判断某个组件在当前平台下是否可见：
 * `both` 两端都显示；缺省视为仅 Web（站内绝大多数第三方动效组件只有 Web 实现）。
 */
export function matchesPlatform(itemPlatform: unknown, current: DocsPlatform): boolean {
    const platform: ComponentPlatform = itemPlatform === "uniapp" || itemPlatform === "both" ? itemPlatform : "web";
    return platform === "both" || platform === current;
}

/**
 * 按平台裁剪导航树：
 * - 仅处理组件分区下的叶子节点（组件文档页），其余分区（入门指南、组合式函数等）原样透传；
 * - 分组（系列 / 分类的虚拟节点，或真实目录）在子项被筛空后一并移除，避免侧栏出现空标题。
 * 节点上的 `platform` 由 app.vue 查询导航时通过 extraFields 带出。
 *
 * 是否在组件分区内由入口节点决定后沿递归传下去（`insideComponents`），
 * 不看子孙节点自己的 path：app.vue 重组后的系列 / 分类节点 path 形如 `/components#series-reborn`，
 * 按前缀判断会被误当成其它分区而整棵透传，平台筛选就失效了。
 */
export function filterNavigationByPlatform(
    items: ContentNavigationItem[] | undefined,
    current: DocsPlatform,
    insideComponents = false,
): ContentNavigationItem[] {
    if (!items?.length) return [];

    const result: ContentNavigationItem[] = [];
    for (const item of items) {
        const path = String(item.path);
        const inComponents = insideComponents || path === "/components" || path.startsWith(COMPONENTS_PATH_PREFIX);

        // 非组件分区：不参与筛选，整棵子树原样透传
        if (!inComponents) {
            result.push(item);
            continue;
        }

        // 组件文档页（叶子）：按 platform 判定
        if (!item.children?.length) {
            if (matchesPlatform(item.platform, current)) result.push(item);
            continue;
        }

        // 分组：递归裁剪，子项筛空即整组移除，避免侧栏出现空标题
        const children = filterNavigationByPlatform(item.children, current, true);
        if (children.length) result.push({ ...item, children });
    }
    return result;
}

/**
 * useDocsPlatform —— 文档站的平台开关状态（Web / UniApp）
 *
 * 顶栏开关写入，侧栏、总览、组件预览读取：
 * - Web：列出仅 Web 与双端通用的组件，不渲染任何 UniApp 预览；
 * - UniApp：列出仅 UniApp 与双端通用的组件，并展示 UniApp H5 预览（右侧面板或内联手机壳）。
 *
 * 状态用 useState 共享；持久化在 plugins/docs-platform.client.ts 完成——
 * 文档页会被预渲染，首屏必须保持默认档位，等水合完成后再从 localStorage 恢复，否则会产生水合差异。
 */
export function useDocsPlatform() {
    const platform = useState<DocsPlatform>("docs-platform", () => "web");

    /** 当前是否为 UniApp 档位 */
    const isUniapp = computed(() => platform.value === "uniapp");

    function setPlatform(next: DocsPlatform) {
        platform.value = next;
    }

    /** 当前档位下的可见性判断（供总览等直接拿到 frontmatter 的场景使用） */
    function isVisible(itemPlatform: unknown): boolean {
        return matchesPlatform(itemPlatform, platform.value);
    }

    /** 当前档位下裁剪后的导航树 */
    function filterNavigation(items: ContentNavigationItem[] | undefined): ContentNavigationItem[] {
        return filterNavigationByPlatform(items, platform.value);
    }

    return { platform, isUniapp, setPlatform, isVisible, filterNavigation };
}
