const size = ["sm", "md", "lg"] as const;
const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
const trigger = ["click", "hover"] as const;

export { color as rateColors, size as rateSizes, trigger as rateTriggers };

/** 切换分数的触发方式：click 点击提交（悬停仅预览）/ hover 悬停即改分 */
export type RateTrigger = (typeof trigger)[number];

/**
 * 分段表的公共字段。分段表以「分段上界」为键：升序找到第一个 分值 <= 上界 的段即命中；
 * excluded 为 true 时该段不含上界本身（要求 分值 < 上界）
 */
export interface RateSegment {
    excluded?: boolean;
}

/** 分段颜色：对象形式里既可直接写颜色字符串，也可写 { value, excluded } */
export interface RateSegmentColor extends RateSegment {
    value: string;
}

/** colors 属性：数组按 lowThreshold / highThreshold 分低、中、高三段；对象自定义分段 */
export type RateColors = string[] | Record<number, string | RateSegmentColor>;

/** 分段图标来源：type 为 icon 时 url 是 Nuxt Icon 名，为 image 时 url 是图片地址 */
export interface RateIconSource extends RateSegment {
    type: "icon" | "image";
    url: string;
}

/** icons 属性：数组三段或对象自定义分段，分段规则与 colors 相同 */
export type RateIcons = RateIconSource[] | Record<number, RateIconSource>;

export default {
    slots: {
        // 星与星之间固定 4px（gap-1）；想改星距请覆盖这里
        wrapper: "inline-flex flex-row items-center gap-1",
        star: "relative cursor-pointer transition-all duration-200 ease-out",
        // 两层图标只过渡颜色：visibility / clip-path 必须瞬时切换，否则分段图标切换时未选中层会与选中层重叠 200ms
        icon: "transition-colors duration-200 ease-out dark:text-gray-2",
        iconActive: "transition-colors duration-200 ease-out",
        /**
         * 分数 / 辅助文字：取正文色 text-gray-9（灰阶令牌在暗色主题下自动翻转，不必再写 dark:）。
         * 与末颗星的 16px 间距 = wrapper 的 gap-1（4px）+ 自身 ml-3（12px）：
         * gap 对所有子项一视同仁，星距要守住 4px，多出来的 12px 只能落在文本自己的外边距上
         */
        value: "ml-3 font-medium tabular-nums text-gray-9",
    },
    variants: {
        // 图标尺寸按设计稿：md 档 20px（size-5），sm / lg 顺势取 16px / 28px；
        // 字号走 typography.css 的七级令牌（sm 12px / base 14px / lg 16px），不再引用已删除的 --text-size-*
        size: {
            sm: {
                icon: "size-4",
                iconActive: "size-4",
                value: "text-sm",
            },
            md: {
                icon: "size-5",
                iconActive: "size-5",
                value: "text-base",
            },
            lg: {
                icon: "size-7",
                iconActive: "size-7",
                value: "text-lg",
            },
        },
        color: {
            primary: { iconActive: "text-primary" },
            secondary: { iconActive: "text-secondary" },
            success: { iconActive: "text-success" },
            info: { iconActive: "text-info" },
            warning: { iconActive: "text-warning" },
            error: { iconActive: "text-error" },
            neutral: { iconActive: "text-neutral" },
        },
        disabled: {
            true: {
                wrapper: "opacity-50 pointer-events-none",
            },
        },
        readonly: {
            true: {
                star: "cursor-default active:scale-100",
            },
        },
    },
    defaultVariants: {
        size: "md" as (typeof size)[number],
        color: "warning" as (typeof color)[number],
    },
};
