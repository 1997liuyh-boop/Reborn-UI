const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

const variant = ["filled", "outlined", "soft", "subtle", "text", "round", "circle"] as const;

const size = ["sm", "md", "lg"] as const;

const borderStyle = ["solid", "dashed"] as const;

export {
  color as buttonColors,
  variant as buttonVariants,
  size as buttonSizes,
  borderStyle as buttonBorderStyles,
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
     * 直角圆角随尺寸取设计令牌：sm → rounded-ui-2xs(4px) / md → rounded-ui-xs(6px) / lg → rounded-ui-sm(8px)；
     * round / circle / text 变体在 variant 轴覆盖此圆角（本轴刻意置于 variant 之前，保证后者在 tailwind-merge 中胜出）。
     */
    size: {
      sm: {
        base: "h-button-sm text-sm leading-[1.5] gap-1.5 px-3 rounded-ui-2xs",
      },
      md: {
        base: "h-button-md text-base leading-[1.5] px-3 rounded-ui-xs",
      },
      lg: {
        base: "h-button-lg text-lg leading-[1.5] px-3 rounded-ui-sm",
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
      // 圆角带 ! 强制：size 轴的 rounded-ui-* 是自定义令牌，tailwind-merge 不会将其与
      // rounded-full 判为冲突组而合并掉，且生成 CSS 顺序靠后，不加 ! 会反向覆盖形状圆角
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
    gap: {
      true: {
        base: '[.reborn-button_+_&]:ml-2',
      },
      false: '',
    },
    disabled: {
      true: "cursor-not-allowed opacity-70",
      false: ""
    },
  },
  compoundVariants: [
    // Filled Variants
    {
      color: "primary" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-primary text-white hover:bg-primary/75",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-secondary text-white hover:bg-secondary/75",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-success text-white hover:bg-success/75",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-info text-white hover:bg-info/75",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-warning text-white hover:bg-warning/75",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-error text-white hover:bg-error/75",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "filled" as (typeof variant)[number],
      class: "bg-neutral text-white hover:bg-neutral/75",
    },

    // Round Variants：胶囊形状，着色规则与 filled 一致
    {
      color: "primary" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-primary text-white hover:bg-primary/75",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-secondary text-white hover:bg-secondary/75",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-success text-white hover:bg-success/75",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-info text-white hover:bg-info/75",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-warning text-white hover:bg-warning/75",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-error text-white hover:bg-error/75",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "round" as (typeof variant)[number],
      class: "bg-neutral text-white hover:bg-neutral/75",
    },

    // Circle Variants：圆形纯图标按钮，着色规则与 filled 一致
    {
      color: "primary" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-primary text-white hover:bg-primary/75",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-secondary text-white hover:bg-secondary/75",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-success text-white hover:bg-success/75",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-info text-white hover:bg-info/75",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-warning text-white hover:bg-warning/75",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-error text-white hover:bg-error/75",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "circle" as (typeof variant)[number],
      class: "bg-neutral text-white hover:bg-neutral/75",
    },

    {
      color: "primary" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-primary border border-primary hover:bg-primary/10",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-secondary border border-secondary hover:bg-secondary/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-success border border-success hover:bg-success/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-info border border-info hover:bg-info/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-warning border border-warning hover:bg-warning/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-error border border-error hover:bg-error/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "outlined" as (typeof variant)[number],
      class:
        "bg-transparent text-neutral border border-neutral hover:bg-neutral/10",
    },
    {
      variant: "filled" as (typeof variant)[number],
      disabled: true,
      class: "bg-gray-6 dark:bg-gray-2 text-white/50",
    },
    {
      variant: "round" as (typeof variant)[number],
      disabled: true,
      class: "bg-gray-6 dark:bg-gray-2 text-white/50",
    },
    {
      variant: "circle" as (typeof variant)[number],
      disabled: true,
      class: "bg-gray-6 dark:bg-gray-2 text-white/50",
    },
    {
      variant: "soft" as (typeof variant)[number],
      disabled: true,
      class: "bg-gray-6 dark:bg-gray-2 text-gray-4",
    },
    {
      variant: "subtle" as (typeof variant)[number],
      disabled: true,
      class: "bg-gray-6 dark:bg-gray-2 border border-gray-7 text-gray-4",
    },
    {
      variant: "outlined" as (typeof variant)[number],
      disabled: true,
      class: "bg-gray-2 dark:bg-gray-8 border-gray-4 text-gray-6",
    },

    {
      color: "primary" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-primary/10 text-primary hover:bg-primary/20",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-secondary/10 text-secondary hover:bg-secondary/20",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-success/10 text-success hover:bg-success/20",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-info/10 text-info hover:bg-info/20",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-warning/10 text-warning hover:bg-warning/20",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-error/10 text-error hover:bg-error/20",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-neutral/10 text-neutral hover:bg-neutral/20",
    },

    {
      color: "primary" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-primary/10 border border-primary text-primary hover:bg-primary/20",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class:
        "bg-secondary/10 border border-secondary text-secondary hover:bg-secondary/20",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-success/10 border border-success text-success hover:bg-success/20",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-info/10 border border-info text-info hover:bg-info/20",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-warning/10 border border-warning text-warning hover:bg-warning/20",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-error/10 border border-error text-error hover:bg-error/20",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-neutral/10 border border-neutral text-neutral hover:bg-neutral/20",
    },

    // Text Variants：无背景/边框，高度与水平内边距跟随文字
    {
      // text 无背景，不参与尺寸圆角令牌：显式归零，避免继承 size 的 rounded-ui-*
      variant: "text" as (typeof variant)[number],
      class: "rounded-none",
    },
    {
      color: "primary" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-primary hover:text-primary/75 !h-auto !px-0",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-secondary hover:text-secondary/75 !h-auto !px-0",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-success hover:text-success/75 !h-auto !px-0",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-info hover:text-info/75 !h-auto !px-0",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-warning hover:text-warning/75 !h-auto !px-0",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-error hover:text-error/75 !h-auto !px-0",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "text" as (typeof variant)[number],
      class: "bg-transparent text-neutral hover:text-neutral/75 !h-auto !px-0",
    },
    {
      variant: "text" as (typeof variant)[number],
      disabled: true,
      class: "bg-transparent text-gray-4 dark:text-gray-6",
    },
  ],
  defaultVariants: {
    color: "primary" as (typeof color)[number],
    variant: "filled" as (typeof variant)[number],
    size: "md" as (typeof size)[number],
    borderStyle: "solid" as (typeof borderStyle)[number],
  },
};
