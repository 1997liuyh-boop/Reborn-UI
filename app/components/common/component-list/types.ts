import type { ComponentPlatform } from "~/composables/useDocsPlatform";
import type { ComponentSeries } from "~/utils/componentsCatalog";

/** 缩略预览右上角的标记图标 */
export interface OverviewBadgeIcon {
  icon: string;
  /** 读屏文字 */
  label: string;
}

/** 组件总览里的一个组件 */
export interface OverviewItem {
  id: string;
  path: string;
  title: string;
  description?: string;
  /** 所属系列：Reborn 自研 / 社区移植 */
  series: ComponentSeries;
  category: string;
  /** 可用平台，缺省为 web */
  platform: ComponentPlatform;
  englishName: string;
  /** 缩略预览组件名，如 RebornButtonOverview */
  demoName?: string;
  badge?: string;
  /** 由 badge 映射的标记图标 */
  badgeIcon?: OverviewBadgeIcon;
  tags?: string[];
}
