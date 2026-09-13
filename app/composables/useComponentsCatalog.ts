import type { ContentNavigationItem } from "@nuxt/content";

/**
 * 组件目录：系列与分类的唯一定义处
 *
 * 文档站的组件分区不再按 content 目录分组，而是按「系列 → 分类 → 组件」两级虚拟分组：
 * - 系列：Reborn 自研 / 社区移植，按 componentId 的 `reborn-` 前缀判定，frontmatter `series` 可覆盖；
 * - 分类：取 frontmatter `category`，两大区共用同一套分类名与顺序。
 * 侧栏、移动端抽屉（app.vue 重组导航树）与组件总览（ComponentsList）都从这里取规则，
 * 文件位置与 URL 不受影响。
 */

/** 组件所属系列：Reborn 自研 / 社区移植 */
export type ComponentSeries = "reborn" | "community";

export interface ComponentSeriesMeta {
  id: ComponentSeries;
  title: string;
  /** 总览页大区标题下的一句说明 */
  description: string;
}

/** 组件分区路径：只有这个分区参与系列 / 分类重组 */
export const COMPONENTS_PATH = "/components";

/** 两大区的展示顺序与文案：Reborn 自研在前，社区移植在后 */
export const COMPONENT_SERIES: readonly ComponentSeriesMeta[] = [
  {
    id: "reborn",
    title: "Reborn 组件",
    description: "Reborn UI 自研的基础组件，双端组件在 Web 与 UniApp 同名同构。",
  },
  {
    id: "community",
    title: "社区移植",
    description: "移植自 Magic UI、Aceternity UI 等开源项目的动效与展示组件，来源见各组件页的 credits。",
  },
];

/** 分类展示顺序（两大区共用）；未列出的分类追加在后并按中文排序 */
export const CATEGORY_ORDER: readonly string[] = [
  "按钮",
  "通用",
  "布局",
  "导航",
  "表单与输入",
  "数据展示",
  "反馈",
  "卡片",
  "文字动画",
  "特效",
  "设备模型",
];

/** 缺省 / 未知分类的兜底名 */
export const FALLBACK_CATEGORY = "其他";

/** 历史分类名 → 现行分类名：文档里残留旧名时并入现行分类，不另起一组 */
const CATEGORY_ALIASES: Record<string, string> = {
  输入与表单: "表单与输入",
  数据: "数据展示",
  杂项: FALLBACK_CATEGORY,
};

/** 规范化 frontmatter 的 category：去空白、映射旧名、缺省兜底 */
export function normalizeCategory(raw: unknown): string {
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) return FALLBACK_CATEGORY;
  return CATEGORY_ALIASES[name] ?? name;
}

/**
 * 判定组件系列：frontmatter `series` 显式声明优先，否则按文档 slug 的 `reborn-` 前缀。
 * 自研但未带前缀的组件（如 scrollbar）需在 frontmatter 写 `series: reborn`。
 */
export function resolveSeries(path: string, explicit?: unknown): ComponentSeries {
  if (explicit === "reborn" || explicit === "community") return explicit;
  const slug = path.split("/").filter(Boolean).pop() ?? "";
  return slug.startsWith("reborn-") ? "reborn" : "community";
}

/** 按 CATEGORY_ORDER 排序分类名；未收录的分类排在后面并按中文排序 */
export function sortCategories(names: Iterable<string>): string[] {
  const set = new Set(names);
  const known = CATEGORY_ORDER.filter((name) => set.has(name));
  const rest = [...set]
    .filter((name) => !CATEGORY_ORDER.includes(name))
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
  return [...known, ...rest];
}

export interface CategoryGroup<T> {
  name: string;
  items: T[];
}

export interface SeriesGroup<T> extends ComponentSeriesMeta {
  categories: CategoryGroup<T>[];
  /** 该系列下的组件总数 */
  count: number;
}

/**
 * 通用分组：任意条目 → 系列 → 分类 → 条目。
 * 系列按 COMPONENT_SERIES 顺序、分类按 CATEGORY_ORDER 顺序输出；空系列不输出。
 * 条目在分类内保持传入顺序，由调用方决定排序。
 */
export function groupBySeriesAndCategory<T>(
  items: T[],
  pick: (item: T) => { series: ComponentSeries; category: string },
): SeriesGroup<T>[] {
  const buckets = new Map<ComponentSeries, Map<string, T[]>>();
  for (const item of items) {
    const { series, category } = pick(item);
    const byCategory = buckets.get(series) ?? new Map<string, T[]>();
    const list = byCategory.get(category) ?? [];
    list.push(item);
    byCategory.set(category, list);
    buckets.set(series, byCategory);
  }

  return COMPONENT_SERIES.flatMap((meta) => {
    const byCategory = buckets.get(meta.id);
    if (!byCategory?.size) return [];
    const categories = sortCategories(byCategory.keys()).map((name) => ({
      name,
      items: byCategory.get(name)!,
    }));
    const count = categories.reduce((total, category) => total + category.items.length, 0);
    return [{ ...meta, categories, count }];
  });
}

/** 收集导航子树里的叶子节点（组件文档页） */
function collectNavigationLeaves(items: ContentNavigationItem[]): ContentNavigationItem[] {
  return items.flatMap((item) => (item.children?.length ? collectNavigationLeaves(item.children) : [item]));
}

/** 统计导航子树里的叶子数（侧栏「当前平台 N 个组件」用） */
export function countNavigationLeaves(items: ContentNavigationItem[] | undefined): number {
  if (!items?.length) return 0;
  return items.reduce(
    (total, item) => total + (item.children?.length ? countNavigationLeaves(item.children) : 1),
    0,
  );
}

/** 组件在分类内的排序：按 slug（componentId）字母序，与 URL 一致、与目录无关 */
function slugOf(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? "";
}

/**
 * 把组件分区的导航子树从「目录 → 组件」重组为「系列 → 分类 → 组件」。
 * 系列与分类是虚拟节点（`page: false`，不对应页面），path 只作为唯一 key 与总览锚点；
 * 叶子节点原样保留（含 platform 等 extraFields），因此后续的平台筛选照常工作。
 */
export function regroupComponentsNavigation(children: ContentNavigationItem[]): ContentNavigationItem[] {
  const leaves = collectNavigationLeaves(children).sort((a, b) => slugOf(a.path).localeCompare(slugOf(b.path)));
  const groups = groupBySeriesAndCategory(leaves, (leaf) => ({
    series: resolveSeries(leaf.path, leaf.series),
    category: normalizeCategory(leaf.category),
  }));

  return groups.map((group) => ({
    title: group.title,
    path: `${COMPONENTS_PATH}#series-${group.id}`,
    page: false,
    series: group.id,
    children: group.categories.map((category) => ({
      title: category.name,
      path: `${COMPONENTS_PATH}#series-${group.id}-${category.name}`,
      page: false,
      children: category.items,
    })),
  }));
}

/** 在整棵导航树上定位组件分区并重组其子树；其它分区（入门指南、组合式函数等）原样返回 */
export function regroupNavigationTree(items: ContentNavigationItem[]): ContentNavigationItem[] {
  return items.map((item) =>
    item.path === COMPONENTS_PATH && item.children?.length
      ? { ...item, children: regroupComponentsNavigation(item.children) }
      : item,
  );
}
