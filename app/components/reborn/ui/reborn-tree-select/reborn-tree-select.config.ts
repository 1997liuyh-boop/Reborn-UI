import type { ClassValue } from "clsx";
import selectTheme from "../reborn-select/reborn-select.config";

// 直接复用选择器主题，避免两类表单控件的尺寸、颜色与交互状态逐渐分叉。
export { selectColors as treeSelectColors, selectSizes as treeSelectSizes, selectVariants as treeSelectVariants } from "../reborn-select/reborn-select.config";
export type TreeSelectValue = string | number | (string | number)[] | null;
export type TreeSelectUI = Partial<Record<"dropdown" | "empty" | "tagList" | "tag" | "collapseTag" | "suffix" | "count", ClassValue>>;
export default {
  ...selectTheme,
  slots: {
    ...selectTheme.slots,
    suffix: "flex shrink-0 items-center gap-1",
    count: "shrink-0 whitespace-nowrap text-sm text-gray-5 tabular-nums",
  },
  variants: {
    // 空态沿用单选内边距；有标签后只把左侧收至4px，右侧保持尺寸档位的留白。
    hasTags: { true: { trigger: "pl-1!" }, false: {} },
    ...selectTheme.variants,
    multiple: { true: {}, false: {} },
  },
};
