import type { ComputedRef, InjectionKey } from "vue";
import type { ComponentSeries } from "~/utils/componentsCatalog";
import { normalizeCategory, resolveSeries, sortCategories } from "~/utils/componentsCatalog";

/**
 * 首页用到的组件目录数据：由首页查询 docs 集合里 /components/ 下的文档页，
 * 在这里整理成计数与分组，各区块通过 HOME_CATALOG_KEY 注入使用。
 * 数据随文档实时变化，首页上的组件数、分类数都不写死。
 */

/** 组件适用端，与 content.config.ts 的 platform 字段一致 */
export type HomePlatform = "web" | "uniapp" | "both";

/** 查询结果里首页关心的字段 */
export interface HomeComponentRow {
  path: string;
  title?: string;
  description?: string;
  category?: string;
  platform?: HomePlatform;
  series?: ComponentSeries;
}

/** 整理后的一个组件 */
export interface HomeComponent {
  path: string;
  /** 文档标题原文，如「Button 按钮」 */
  title: string;
  /** 英文名，如「Button」 */
  name: string;
  /** 中文名，如「按钮」；标题里没有中文时为空串 */
  label: string;
  description: string;
  category: string;
  platform: HomePlatform;
  series: ComponentSeries;
}

export interface HomeCategory {
  name: string;
  count: number;
  items: HomeComponent[];
}

export interface HomeCatalog {
  components: HomeComponent[];
  total: number;
  /** 各适用端的数量：web 仅 Web、uniapp 仅 UniApp、both 双端通用 */
  platforms: Record<HomePlatform, number>;
  /** 自研 / 社区移植的数量 */
  series: Record<ComponentSeries, number>;
  /** 按 CATEGORY_ORDER 排好的分类 */
  categories: HomeCategory[];
}

export const HOME_CATALOG_KEY: InjectionKey<ComputedRef<HomeCatalog>> = Symbol("home-catalog");

/** 把「Button 按钮」拆成英文名与中文名；以第一个中文字符为界 */
export function splitComponentTitle(title: string): { name: string; label: string } {
  const index = title.search(/\p{Script=Han}/u);
  if (index < 0) return { name: title.trim(), label: "" };
  return { name: title.slice(0, index).trim(), label: title.slice(index).trim() };
}

/** 查询结果 → 首页目录 */
export function buildHomeCatalog(rows: HomeComponentRow[]): HomeCatalog {
  const components = rows
    .filter((row) => row.path.startsWith("/components/"))
    .map<HomeComponent>((row) => {
      const title = row.title?.trim() || row.path.split("/").pop() || "";
      return {
        path: row.path,
        title,
        ...splitComponentTitle(title),
        description: row.description ?? "",
        category: normalizeCategory(row.category),
        platform: row.platform ?? "web",
        series: resolveSeries(row.path, row.series),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  const platforms: Record<HomePlatform, number> = { web: 0, uniapp: 0, both: 0 };
  const series: Record<ComponentSeries, number> = { reborn: 0, community: 0 };
  const byCategory = new Map<string, HomeComponent[]>();
  for (const item of components) {
    platforms[item.platform] += 1;
    series[item.series] += 1;
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }
  const categories = sortCategories(byCategory.keys()).map((name) => {
    const items = byCategory.get(name) ?? [];
    return { name, count: items.length, items };
  });

  return { components, total: components.length, platforms, series, categories };
}

/** 空目录：注入不到数据时（例如单独预览某个区块）的兜底，避免各区块判空 */
export const EMPTY_HOME_CATALOG: HomeCatalog = buildHomeCatalog([]);
