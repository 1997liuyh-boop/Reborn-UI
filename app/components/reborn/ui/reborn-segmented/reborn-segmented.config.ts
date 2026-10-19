import { tv } from "~/lib/tv";

const sizes = ["sm", "md", "lg"] as const;
/** 排列方向：horizontal 横排 / vertical 竖排 */
const directions = ["horizontal", "vertical"] as const;
export { directions as segmentedDirections, sizes as segmentedSizes };

/**
 * 尺寸全部取自设计稿，三档逐级收紧：
 * | 档位 | 容器内边距 | 容器圆角 | 字号 | 选项高度 | 选项水平内边距 | 选中块圆角 |
 * | lg   | 4px        | 8px      | 16px | 36px     | 12px           | 6px        |
 * | md   | 3px        | 6px      | 14px | 28px     | 12px           | 4px        |
 * | sm   | 2px        | 4px      | 14px | 20px     | 8px            | 2px        |
 * 选中块圆角 = 容器圆角 - 容器内边距（取整），选中块与容器边缘同心。
 * 颜色只用灰阶 token（base.css 的 .dark 会整条翻转），不能写 bg-white 或 dark: 前缀。
 */
export const segmentedTheme = tv({
  slots: {
    /** 容器：灰底、内边距与圆角随尺寸；relative 是选中块绝对定位的锚点 */
    root: "reborn-segmented relative inline-flex max-w-full items-stretch bg-gray-2 align-middle text-gray-8",
    /**
     * 选中块：垫在所有选项下面，位置与尺寸由脚本按选中项量出后写成行内样式，切换时滑过去。
     * 没有选中项或尚未量好时隐藏，由选中项自己画底色兜底（见 item 的 checked × sliderReady）
     */
    slider: "pointer-events-none absolute z-0 bg-gray-1 transition-all duration-300 ease-out motion-reduce:transition-none",
    /**
     * 单个选项：label 包住隐藏的原生 radio，键盘方向键切换、表单提交都走原生行为。
     * relative 同时是 sr-only input 的包含块；z-[1] 让文字盖在选中块上面。
     * 图标与文字间隔 4px（gap-1）。键盘聚焦时描边画在选项上
     */
    item: "relative z-[1] flex min-w-0 cursor-pointer items-center justify-center gap-1 whitespace-nowrap transition-colors select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-primary",
    /** 隐藏的原生 radio */
    input: "sr-only",
    /** 选项图标：随字号缩放，与文字等高 */
    icon: "size-[1em] shrink-0",
    /** 选项文本：撑满时过长截断 */
    label: "truncate",
  },
  variants: {
    size: {
      lg: {
        root: "rounded-lg p-1 text-lg",
        item: "h-9 rounded-md px-3",
        slider: "rounded-md",
      },
      md: {
        root: "rounded-md p-[3px] text-base",
        item: "h-7 rounded-sm px-3",
        slider: "rounded-sm",
      },
      sm: {
        // 14px 字号的令牌行高是 22px，比 20px 的选项还高，收到 20px 免得文字盒溢出选项
        root: "rounded-sm p-0.5 text-base",
        item: "h-5 rounded-xs px-2 leading-5",
        slider: "rounded-xs",
      },
    },
    direction: {
      horizontal: {},
      vertical: { root: "flex-col" },
    },
    /** 撑满父元素宽度：横排时各选项等分宽度，竖排时选项撑满容器宽度 */
    block: {
      true: { root: "flex w-full" },
      false: {},
    },
    checked: {
      true: { item: "text-gray-10" },
      false: { item: "hover:text-gray-10" },
    },
    disabled: {
      true: { item: "cursor-not-allowed text-gray-5 hover:text-gray-5" },
      false: {},
    },
    /** 选中块是否已就位；未就位（服务端渲染、首帧）时由选中项自己画底色，就位后交给选中块 */
    sliderReady: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    { block: true, direction: "horizontal", class: { item: "flex-1 basis-0" } },
    { checked: true, sliderReady: false, class: { item: "bg-gray-1" } },
  ],
  defaultVariants: {
    size: "md",
    direction: "horizontal",
    block: false,
    checked: false,
    disabled: false,
    sliderReady: false,
  },
});

/** 语义化结构键，供 ui 属性按节点覆盖样式 */
export interface SegmentedUI {
  /** 容器 */
  root?: string;
  /** 选中块 */
  slider?: string;
  /** 单个选项 */
  item?: string;
  /** 选项图标 */
  icon?: string;
  /** 选项文本 */
  label?: string;
}

export default segmentedTheme;
