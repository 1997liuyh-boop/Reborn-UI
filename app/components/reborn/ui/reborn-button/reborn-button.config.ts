const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

/** 视觉风格与形状独立；旧形状变体仅保留兼容，不展示在选项中。 */
export const buttonVariants = ["filled", "outlined", "soft", "subtle", "text"] as const;
const variant = [...buttonVariants, "round", "circle"] as const;

const size = ["sm", "md", "lg"] as const;

const borderStyle = ["solid", "dashed"] as const;

export {
  borderStyle as buttonBorderStyles,
  color as buttonColors,
  size as buttonSizes,
};

export default {
  slots: {
    base: "reborn-button inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    label: "truncate leading-none",
    leadingIcon: "shrink-0",
    leadingAvatar: "shrink-0",
    leadingAvatarSize: "",
    trailingIcon: "shrink-0",
  },
  variants: {
    fieldGroup: {
      horizontal:
        "not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]",
      vertical:
        "not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]",
    },
    color: {
      primary: "",
      secondary: "",
      success: "",
      info: "",
      warning: "",
      error: "",
      neutral: "",
    },
    /**
     * 三档尺寸：高度 24 / 32 / 40，水平内边距统一 12px（px-3）；text 变体另见 compoundVariants。
     * 行高由字号令牌自带（12/20、14/22、16/24），不再叠 leading-：按钮是定高盒子 + 单行居中，
     * 行高只影响行盒高度、不影响按钮外形。
     * 直角圆角随尺寸取设计令牌：sm → rounded-sm(4px) / md → rounded-md(6px) / lg → rounded-lg(8px)；
     * round / circle / text 变体在 variant 轴覆盖此圆角（本轴刻意置于 variant 之前，保证后者在 tailwind-merge 中胜出）。
     */
    size: {
      sm: {
        base: "h-button-sm text-sm gap-1.5 px-3 rounded-sm",
      },
      md: {
        base: "h-button-md text-base px-3 rounded-md",
      },
      lg: {
        base: "h-button-lg text-lg px-3 rounded-lg",
      },
    },
    variant: {
      filled: "",
      outlined: "",
      soft: "",
      subtle: "",
      // 文字按钮：无背景/边框，高度跟随文字（见 compoundVariants 覆盖 size 的固定高度）
      text: "",
      // 胶囊按钮：形状类，着色复合规则与 filled 一致（见 compoundVariants）
      // ! 是历史遗留：size 轴原先用自定义的 rounded-ui-*，不在 tailwind-merge 的
      // border-radius 冲突组里，两个圆角类会共存、由 CSS 源序决定胜负。现在 size 轴
      // 已改回原生 rounded-*，合并正常，! 只剩提权作用；保留是为了不动既有覆盖顺序。
      round: "!rounded-full",
      // 圆形纯图标按钮：宽高相等、内边距归零，着色复合规则与 filled 一致（见 compoundVariants）
      circle: "!aspect-square !w-auto !p-0 has-[>svg]:!p-0 !rounded-full",
    },
    /**
     * 边框线型，对渲染了边框的变体生效：outlined 与 subtle。
     * 边框宽度固定 1px，由对应变体的 `border` 提供；filled / soft / text 无边框，此项不产生视觉效果。
     */
    borderStyle: {
      solid: {
        base: "border-solid",
      },
      dashed: {
        base: "border-dashed",
      },
    },
    /** 胶囊只改变圆角，不改变风格配色。 */
    round: { true: "!rounded-full" },
    /** 圆形固定宽高，尺寸规则放在复合变体末尾，覆盖文字按钮的自动高度。 */
    circle: { true: "!rounded-full !p-0 shrink-0" },
    gap: {
      true: {
        base: '[.reborn-button_+_&]:ml-2',
      },
      false: '',
    },
    disabled: {
      true: "cursor-not-allowed",
      false: ""
    },
  },
  compoundVariants: [
    // 实底按钮：悬停反馈仅在可用状态生效（加载状态也不触发）。
    {
      color: "primary" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-primary text-white enabled:hover:bg-primary/75",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-secondary text-white enabled:hover:bg-secondary/75",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-success text-white enabled:hover:bg-success/75",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-info text-white enabled:hover:bg-info/75",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-warning text-white enabled:hover:bg-warning/75",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-error text-white enabled:hover:bg-error/75",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-neutral text-gray-10 enabled:hover:bg-neutral/75",
    },

    // Round Variants：胶囊形状，着色规则与 filled 一致
    {
      color: "primary" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-primary text-white enabled:hover:bg-primary/75",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-secondary text-white enabled:hover:bg-secondary/75",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-success text-white enabled:hover:bg-success/75",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-info text-white enabled:hover:bg-info/75",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-warning text-white enabled:hover:bg-warning/75",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-error text-white enabled:hover:bg-error/75",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-neutral text-gray-10 enabled:hover:bg-neutral/75",
    },

    // Circle Variants：圆形纯图标按钮，着色规则与 filled 一致
    {
      color: "primary" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-primary text-white enabled:hover:bg-primary/75",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-secondary text-white enabled:hover:bg-secondary/75",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-success text-white enabled:hover:bg-success/75",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-info text-white enabled:hover:bg-info/75",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-warning text-white enabled:hover:bg-warning/75",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-error text-white enabled:hover:bg-error/75",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-neutral text-gray-10 enabled:hover:bg-neutral/75",
    },

    {
      color: "primary" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-primary border border-primary enabled:hover:bg-primary/10",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-secondary border border-secondary enabled:hover:bg-secondary/10",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-success border border-success enabled:hover:bg-success/10",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-info border border-info enabled:hover:bg-info/10",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-warning border border-warning enabled:hover:bg-warning/10",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-error border border-error enabled:hover:bg-error/10",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-gary-10 border border-neutral enabled:hover:bg-neutral/10",
    },
    // 实底与胶囊按钮使用对应色系的第 3 阶，不叠加整体透明度。
    {
      color: "primary" as (typeof color)[number],
      variant: ["filled", "round"],
      disabled: true,
      class: "bg-primary-3",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: ["filled", "round"],
      disabled: true,
      class: "bg-secondary-3",
    },
    {
      color: "success" as (typeof color)[number],
      variant: ["filled", "round"],
      disabled: true,
      class: "bg-green-3",
    },
    {
      color: "info" as (typeof color)[number],
      variant: ["filled", "round"],
      disabled: true,
      class: "bg-blue-3",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: ["filled", "round"],
      disabled: true,
      class: "bg-orange-3",
    },
    {
      color: "error" as (typeof color)[number],
      variant: ["filled", "round"],
      disabled: true,
      class: "bg-red-3",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: ["filled", "round"],
      disabled: true,
      class: "bg-gray-3",
    },
    // 描边与圆形按钮的禁用态统一使用灰阶，圆形按钮同时补齐边框宽度。
    {
      variant: ["outlined", "circle"],
      disabled: true,
      class: "bg-gray-2 border border-gray-4 text-gray-5",
    },
    {
      variant: "soft" as (typeof variant)[number],
      disabled: true,
      class: "bg-gray-6 dark:bg-gray-2 text-gray-4 opacity-70",
    },
    {
      variant: "subtle" as (typeof variant)[number],
      disabled: true,
      class: "bg-gray-6 dark:bg-gray-2 border border-gray-7 text-gray-4 opacity-70",
    },

    {
      color: "primary" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-primary/10 text-primary enabled:hover:bg-primary/20",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-secondary/10 text-secondary enabled:hover:bg-secondary/20",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-success/10 text-success enabled:hover:bg-success/20",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-info/10 text-info enabled:hover:bg-info/20",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-warning/10 text-warning enabled:hover:bg-warning/20",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-error/10 text-error enabled:hover:bg-error/20",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-gray-2 text-gray-10 enabled:hover:bg-gray-2/20",
    },

    {
      color: "primary" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-primary/10 border border-primary text-primary enabled:hover:bg-primary/20",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class:
        "bg-secondary/10 border border-secondary text-secondary enabled:hover:bg-secondary/20",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-success/10 border border-success text-success enabled:hover:bg-success/20",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-info/10 border border-info text-info enabled:hover:bg-info/20",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-warning/10 border border-warning text-warning enabled:hover:bg-warning/20",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-error/10 border border-error text-error enabled:hover:bg-error/20",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-gray-2 border border-gray-4 text-gray-10 enabled:hover:bg-gray-2/20"
    },

    // Text Variants：无背景/边框，高度与水平内边距跟随文字
    {
      // text 无背景，不参与尺寸圆角：显式归零，避免继承 size 轴的 rounded-*
      variant: "text" as (typeof variant)[number],
      class: "rounded-none",
    },
    {
      color: "primary" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-primary enabled:hover:text-primary/75 !h-auto !px-0",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-secondary enabled:hover:text-secondary/75 !h-auto !px-0",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-success enabled:hover:text-success/75 !h-auto !px-0",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-info enabled:hover:text-info/75 !h-auto !px-0",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-warning enabled:hover:text-warning/75 !h-auto !px-0",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-error enabled:hover:text-error/75 !h-auto !px-0",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-neutral enabled:hover:text-neutral/75 !h-auto !px-0",
    },
    {
      variant: "text" as (typeof variant)[number],
      disabled: true,
      class: "bg-transparent",
    },
    // 胶囊按钮保留原有禁用文字颜色。
    {
      variant: "round" as (typeof variant)[number],
      disabled: true,
      class: "text-white/50",
    },
    // 仅实底、描边和文字按钮统一禁用文字颜色，明暗模式均使用灰阶 5。
    {
      variant: ["filled", "outlined", "text"],
      disabled: true,
      class: "text-gray-5",
    },
    // 形状尺寸最后应用，circle 与 round 同时开启时采用圆形。
    { circle: true, size: "sm" as (typeof size)[number], class: "!h-[var(--height-button-sm)] !w-[var(--height-button-sm)]" },
    { circle: true, size: "md" as (typeof size)[number], class: "!h-[var(--height-button-md)] !w-[var(--height-button-md)]" },
    { circle: true, size: "lg" as (typeof size)[number], class: "!h-[var(--height-button-lg)] !w-[var(--height-button-lg)]" },
  ],
  defaultVariants: {
    color: "primary" as (typeof color)[number],
    variant: variant[0],
    size: "md" as (typeof size)[number],
    borderStyle: "solid" as (typeof borderStyle)[number],
  },
};
