const size = ["sm", "md", "lg"] as const;
const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

const shape = ["circle", "square"] as const;

/** 输入文本对齐方式 */
const align = ["left", "center", "right"] as const;

/** 形态变体：描边 / 填充 / 无边框 / 下划线 */
const variant = ["outlined", "filled", "borderless", "underlined"] as const;

export {
  align as inputNumberAligns,
  color as inputNumberColors,
  shape as inputNumberShapes,
  size as inputNumberSizes,
  variant as inputNumberVariants,
};

export default {
  slots: {
    /**
     * 根容器。默认 w-full：宽度交由外部布局决定，组件自身不设固定宽度。
     * 需要固定宽度时由使用方通过 class / ui.wrapper 传入（如 w-40）。
     * 背景与边框不在此声明，全部交给 variant 形态变体，避免相互覆盖。
     */
    wrapper:
      "group/number relative flex w-full items-center box-border overflow-hidden text-gray-8 transition-colors data-[disabled=true]:cursor-not-allowed data-[disabled=true]:text-gray-5",
    /** 左右分列布局下的增减按钮：宽高均取 --height-input-*，保持正方形 */
    button:
      "flex h-full shrink-0 items-center justify-center border-none bg-transparent p-0 text-gray-6 transition-colors disabled:cursor-not-allowed disabled:text-gray-5",
    /**
     * controls-position="left" / "right" 时上下堆叠的按钮组容器。
     * 绝对定位悬浮在输入框对应侧之上（不占布局空间，避免居中文本被挤偏），
     * 宽度取 --stack-w（由 size 变体写入，与输入框高度同值），
     * 默认平移出容器且透明（被 wrapper 的 overflow-hidden 裁掉），
     * 悬停或聚焦时滑回原位显示，同时输入框在对应侧让出同宽内边距，文本不会被按钮盖住；
     * 背景继承 wrapper。平移方向、落位侧与分割线侧边由 controlsPosition 变体决定。
     */
    stack:
      "absolute inset-y-0 flex w-(--stack-w) flex-col bg-inherit opacity-0 transition-all duration-200 group-hover/number:translate-x-0 group-hover/number:opacity-100 group-focus-within/number:translate-x-0 group-focus-within/number:opacity-100",
    /**
     * 堆叠布局下的单个按钮。
     * 悬停时通过 flex-grow 1 → 1.5 扩大自身在按钮组里的占比（另一个按钮相应收缩），
     * 分割线画在首个按钮的下边框上（gray-4），会随两按钮的分界线一起平滑移动；
     * 不能用 border-none 兜底重置，否则会把分割线的边框样式一并抹掉。
     */
    stackButton:
      "flex min-h-0 flex-1 items-center justify-center border-0 bg-transparent p-0 text-gray-6 transition-all duration-200 first:border-b first:border-gray-4 enabled:hover:grow-[1.5] disabled:cursor-not-allowed disabled:text-gray-5",
    input:
      "h-full min-w-0 flex-1 border-none bg-transparent text-gray-9 outline-none transition-[padding] duration-200 placeholder:text-gray-5 read-only:cursor-default disabled:cursor-not-allowed disabled:text-gray-5",
    divider: "h-full w-px shrink-0 bg-gray-3",
    /** 输入框内的前缀区（prefix 插槽） */
    prefix: "flex shrink-0 items-center pe-0 text-gray-6",
    /** 输入框内的后缀区（suffix 插槽） */
    suffix: "flex shrink-0 items-center ps-0 text-gray-6",
    icon: "shrink-0",
  },
  variants: {
    /**
     * 尺寸档位，全部取自 app/assets/theme/typography.css 的设计令牌：
     * 高度 --height-input-*、水平内边距 --spacing-input-px-*、图标 --size-input-icon-*。
     * 字号：sm / md 均为 14px（text-base）、lg 为 16px（text-lg）。
     * 分列按钮宽度与输入框高度取同一 token，保证按钮始终为正方形。
     */
    size: {
      sm: {
        wrapper: "h-input-sm text-base [--stack-w:var(--height-input-sm)]",
        input: "px-input-px-sm text-base",
        button: "w-(--height-input-sm)",
        prefix: "ps-input-px-sm",
        suffix: "pe-input-px-sm",
        icon: "size-(--size-input-icon-sm)",
      },
      md: {
        wrapper: "h-input-md text-base [--stack-w:var(--height-input-md)]",
        input: "px-input-px-md text-base",
        button: "w-(--height-input-md)",
        prefix: "ps-input-px-md",
        suffix: "pe-input-px-md",
        icon: "size-(--size-input-icon-md)",
      },
      lg: {
        wrapper: "h-input-lg text-lg [--stack-w:var(--height-input-lg)]",
        input: "px-input-px-lg text-lg",
        button: "w-(--height-input-lg)",
        prefix: "ps-input-px-lg",
        suffix: "pe-input-px-lg",
        icon: "size-(--size-input-icon-lg)",
      },
    },
    /**
     * 形态变体。四种形态各自负责背景与边框：
     * - outlined：底色 + 四周描边（默认）
     * - filled：灰底 + 无描边，聚焦时转为底色 + 描边
     * - borderless：完全无背景无描边，融入所在容器
     * - underlined：仅保留底部下划线，圆角强制为 0
     * 背景一律使用 gray-1 / gray-2 灰阶 token（base.css 的 .dark 会整条翻转），
     * 不可写 bg-white，白色不随主题变化会在深色模式下露出白块。
     * 描边/下划线的聚焦色由 color 变体统一提供，见下方 color。
     */
    variant: {
      outlined: {
        wrapper:
          "bg-gray-1 ring-1 ring-gray-4 focus-within:ring-1 data-[disabled=true]:bg-gray-2",
      },
      filled: {
        wrapper:
          "bg-gray-2 ring-1 ring-transparent focus-within:bg-gray-1 focus-within:ring-1 data-[disabled=true]:bg-gray-2 data-[disabled=true]:ring-gray-4",
      },
      borderless: {
        wrapper: "bg-transparent ring-0 focus-within:ring-0",
      },
      underlined: {
        wrapper:
          "border-b-1 border-gray-3 bg-transparent ring-0 focus-within:ring-0 data-[disabled=true]:border-gray-4",
        // 下划线形态下左右按钮不需要竖直分割线
        divider: "hidden",
      },
    },
    /** 输入文本对齐，对应 align 属性 */
    align: {
      left: { input: "text-left" },
      center: { input: "text-center" },
      right: { input: "text-right" },
    },
    /**
     * 配色。同时给出聚焦态的 ring 色与 border 色：
     * ring 供 outlined / filled 使用，border 供 underlined 使用，
     * 两者互不冲突，未使用的那一条在对应形态下不产生视觉效果。
     */
    color: {
      primary: {
        wrapper: "focus-within:ring-primary focus-within:border-primary",
        button: "hover:text-primary",
        stackButton: "hover:text-primary",
        input: "caret-primary",
      },
      secondary: {
        wrapper: "focus-within:ring-secondary focus-within:border-secondary",
        button: "hover:text-secondary",
        stackButton: "hover:text-secondary",
        input: "caret-secondary",
      },
      success: {
        wrapper: "focus-within:ring-success focus-within:border-success",
        button: "hover:text-success",
        stackButton: "hover:text-success",
        input: "caret-success",
      },
      info: {
        wrapper: "focus-within:ring-info focus-within:border-info",
        button: "hover:text-info",
        stackButton: "hover:text-info",
        input: "caret-info",
      },
      warning: {
        wrapper: "focus-within:ring-warning focus-within:border-warning",
        button: "hover:text-warning",
        stackButton: "hover:text-warning",
        input: "caret-warning",
      },
      error: {
        wrapper: "focus-within:ring-error focus-within:border-error",
        button: "hover:text-error",
        stackButton: "hover:text-error",
        input: "caret-error",
      },
      neutral: {
        wrapper: "focus-within:ring-neutral focus-within:border-neutral",
        button: "hover:text-neutral",
        stackButton: "hover:text-neutral",
        input: "caret-neutral",
      },
    },
    fieldGroup: {
      horizontal:
        "not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-within:z-[1]",
      vertical:
        "not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-within:z-[1]",
    },
    shape: {
      circle: { wrapper: "rounded-full" },
      square: {},
    },
    /**
     * 堆叠按钮的位置（controls-position="left" / "right"）：
     * left 置于输入框左侧、悬停时从左往右滑入；right 置于右侧、从右往左滑入。
     * 与输入区之间的分割线用 gray-4，画在 stack 自身的侧边框上，随按钮一起显隐。
     */
    controlsPosition: {
      left: {
        stack: "start-0 -translate-x-full border-e border-gray-4",
        // 按钮滑入时输入框在左侧让出同宽内边距，避免文本被按钮盖住
        input:
          "group-hover/number:ps-(--stack-w) group-focus-within/number:ps-(--stack-w)",
      },
      right: {
        stack: "end-0 translate-x-full border-s border-gray-4",
        // 按钮滑入时输入框在右侧让出同宽内边距，避免文本被按钮盖住
        input:
          "group-hover/number:pe-(--stack-w) group-focus-within/number:pe-(--stack-w)",
      },
    },
    error: {
      true: {
        wrapper:
          "ring-red-5 border-red-5 focus-within:ring-red-5 focus-within:border-red-5",
      },
    },
  },
  compoundVariants: [
    { shape: "square", size: "sm", class: { wrapper: "rounded-ui-2xs" } },
    { shape: "square", size: "md", class: { wrapper: "rounded-ui-xs" } },
    { shape: "square", size: "lg", class: { wrapper: "rounded-ui-sm" } },
    // 下划线形态必须压平圆角。这里用 ! 提权而非依赖顺序：
    // tailwind-merge 不认识自定义的 rounded-ui-* 属于 border-radius 冲突组，
    // 不加 ! 时 rounded-none 与 rounded-ui-* 会共存并由 CSS 源序决定胜负。
    { variant: "underlined", class: { wrapper: "rounded-none!" } },
    // borderless 形态本身没有描边宽度，出错时需要补一圈，否则错误态完全不可见
    { variant: "borderless", error: true, class: { wrapper: "ring-1 ring-red-5" } },
  ] as any,
  defaultVariants: {
    size: "md" as (typeof size)[number],
    color: "neutral" as (typeof color)[number],
    shape: "circle" as (typeof shape)[number],
    align: "center" as (typeof align)[number],
    variant: "outlined" as (typeof variant)[number],
  },
};