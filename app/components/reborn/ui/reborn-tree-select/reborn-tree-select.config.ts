import type { ClassValue } from "clsx";
import selectTheme from "../reborn-select/reborn-select.config";

// 直接复用选择器主题，避免两类表单控件的尺寸、颜色与交互状态逐渐分叉。
export { selectColors as treeSelectColors, selectSizes as treeSelectSizes, selectVariants as treeSelectVariants } from "../reborn-select/reborn-select.config";
export type TreeSelectValue = string | number | (string | number)[] | null;
export type TreeSelectUI = Partial<Record<"dropdown" | "empty" | "tagList" | "tag" | "collapseTag", ClassValue>>;
export default selectTheme;
