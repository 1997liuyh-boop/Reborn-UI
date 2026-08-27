const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

/** 形态变体：描边 / 填充 / 无边框 / 下划线（与 InputNumber 同一套形态语言） */
const variants = ["outlined", "filled", "borderless", "underlined"] as const;

/** 外形轮廓：circle 为胶囊圆角，square 为按尺寸取圆角令牌 */
const shapes = ["circle", "square"] as const;

/** textarea 的 resize 合法取值 */
const resizes = ["none", "both", "horizontal", "vertical"] as const;

export {
  colors as inputColors,
  resizes as inputResizes,
  shapes as inputShapes,
  sizes as inputSizes,
  variants as inputVariants,
};

export default {
  slots: {
    /** 最外层：纵向容纳「输入组 + 外置字数统计」 */
    root: "flex w-full min-w-0 flex-col gap-1",
    /**
     * 输入组：prepend + wrapper + append 横向连体。
     * 尺寸高度令牌压在这一层（而非 wrapper），并用 grow 吃满 root 的剩余高度：
     * 外部在 root 上设高度时，group → wrapper / prepend / append 逐层拉伸占满。
     */
    group: "flex w-full min-w-0 grow items-stretch",
    /** 前置块（#prepend 插槽），与输入框连体，仅单行模式渲染 */
    prepend:
      "flex shrink-0 items-center bg-gray-2 text-gray-8 h-full border border-1 border-gray-4 border-r-0",
    /** 后置块（#append 插槽），与输入框连体，仅单行模式渲染 */
    append:
      "flex shrink-0 items-center bg-gray-2 text-gray-8 h-full border-1 border-gray-4 border-l-0",
    /**
     * 输入框主体容器。背景与边框不在此声明，全部交给 variant 形态变体；
     * 禁用态统一为 bg-gray-2 / text-gray-5 / 边框 gray-4（与 InputNumber 对齐）。
     */
    wrapper:
      "group/input relative inline-flex w-full min-w-0 items-center box-border overflow-hidden text-gray-9 transition-colors data-[disabled=true]:cursor-not-allowed data-[disabled=true]:text-gray-5",
    /**
     * 输入元素。h-full 让它撑满 wrapper 高度：单行 <input> 的文本由浏览器在内容盒内
     * 原生垂直居中，盒子必须先撑满才生效；否则 input 高度只等于自身行高，
     * 文字位置会随行高令牌漂移，且上下边缘点击不到光标。
     * 多行由 multiline 变体改回 h-auto，高度交给 rows / autosize。
     */
    input:
      "h-full min-w-0 flex-1 bg-transparent text-gray-9 outline-none placeholder:text-gray-5 read-only:cursor-default disabled:cursor-not-allowed disabled:text-gray-5",
    /** 前缀区（#prefix / #leading 插槽或 prefix-icon） */
    leading: "inline-flex shrink-0 items-center text-gray-6",
    /** 尾部功能区：清除按钮 / 密码开关 / 字数统计 / 后缀 */
    iconBox: "inline-flex shrink-0 items-center gap-2",
    icon: "",
    iconSection: "flex cursor-pointer items-center justify-center text-gray-5 transition-all hover:opacity-80",
    /** 尾部功能区内的竖分割线，聚焦时颜色跟随 color */
    separator: "w-px shrink-0 transition-colors bg-gray-4",
    /** 字数统计文本（inside 位于尾部功能区 / textarea 右下角，outside 位于输入框下方） */
    count: "pointer-events-none text-xs text-gray-5 tabular-nums",
  },
  variants: {
    /**
     * 尺寸档位，全部取自 app/assets/theme/typography.css 的设计令牌：
     * 高度 --height-input-*、水平内边距 --spacing-input-px-*、分割线高度 --spacing-input-sep-*。
     * 字号遵循全局 size 锚点：sm 12px（text-sm）/ md 14px（text-base）/ lg 16px（text-lg）。
     * text-* 令牌自带「字号 + 8px」的行高，此处不再叠加 leading-*，否则会把令牌行高覆盖掉；
     * 多行模式需要更宽松的行距，由 multiline 变体单独给 leading-relaxed。
     * wrapper 与 input 都要声明字号：input 管输入文本，wrapper 管 #prefix / #suffix
     * 等插槽内容的继承默认值，缺一档会导致插槽文字跟着外层容器走。
     */
    size: {
      sm: {
        group: "h-input-sm",
        wrapper: "px-input-px-sm text-sm",
        input: "text-sm",
        prepend: "px-input-px-sm text-sm",
        append: "px-input-px-sm text-sm",
        icon: "text-sm",
        separator: "h-input-sep-sm",
      },
      md: {
        group: "h-input-md",
        wrapper: "px-input-px-md text-base",
        input: "text-base",
        prepend: "px-input-px-md text-base",
        append: "px-input-px-md text-base",
        icon: "text-base",
        separator: "h-input-sep-md",
      },
      lg: {
        group: "h-input-lg",
        wrapper: "px-input-px-lg text-lg",
        input: "text-lg",
        prepend: "px-input-px-lg text-lg",
        append: "px-input-px-lg text-lg",
        icon: "text-lg",
        separator: "h-input-sep-lg",
      },
    },
    /**
     * 形态变体。四种形态各自负责背景与边框（与 InputNumber 同规格）：
     * - outlined：底色 + 四周描边
     * - filled（默认，与旧版视觉衔接）：灰底 bg-gray-2 无描边，聚焦时转为 bg-gray-1 + 描边（颜色由 color 变体给出，默认 primary）
     * - borderless：完全无背景无描边，融入所在容器
     * - underlined：仅保留底部下划线，圆角强制为 0
     */
    variant: {
      outlined: {
        wrapper: "bg-gray-1 border-1 border-gray-4 data-[disabled=true]:bg-gray-2",
      },
      filled: {
        wrapper:
          "bg-gray-2 border-1 border-transparent focus-within:bg-gray-1 data-[disabled=true]:bg-gray-2 data-[disabled=true]:border-gray-4",
      },
      borderless: {
        wrapper: "bg-transparent border-0 focus-within:border-0",
      },
      underlined: {
        wrapper:
          "border-b-1 border-gray-3 bg-transparent border-0 focus-within:border-0 data-[disabled=true]:border-gray-4",
      },
    },
    /** 外形轮廓：circle 胶囊；square 的圆角按尺寸在 compoundVariants 中给出 */
    shape: {
      circle: { wrapper: "rounded-full" },
      square: {},
    },
    /**
     * 配色。聚焦态的 border 供 outlined / filled 使用，border 供 underlined 使用；
     * 分割线聚焦时同步变色。
     */
    color: {
      primary: {
        wrapper: "focus-within:border-primary focus-within:border-primary",
        separator: "group-focus-within/input:bg-primary",
      },
      secondary: {
        wrapper: "focus-within:border-secondary focus-within:border-secondary",
        separator: "group-focus-within/input:bg-secondary",
      },
      success: {
        wrapper: "focus-within:border-success focus-within:border-success",
        separator: "group-focus-within/input:bg-success",
      },
      info: {
        wrapper: "focus-within:border-info focus-within:border-info",
        separator: "group-focus-within/input:bg-info",
      },
      warning: {
        wrapper: "focus-within:border-warning focus-within:border-warning",
        separator: "group-focus-within/input:bg-warning",
      },
      error: {
        wrapper: "focus-within:border-error focus-within:border-error",
        separator: "group-focus-within/input:bg-error",
      },
      neutral: {
        wrapper: "focus-within:border-neutral focus-within:border-neutral",
        separator: "group-focus-within/input:bg-neutral",
      },
    },
    error: {
      true: {
        wrapper: "border-red-5 border-red-5 focus-within:border-red-5 focus-within:border-red-5",
        input: "text-red-5 placeholder:text-red-5/50",
      },
    },
    /**
     * 多行（textarea）模式：高度由内容决定，字数统计悬浮在右下角。
     * group 的 h-auto 必须用 ! 提权：tailwind-merge 不认识自定义的 h-input-* 属于
     * height 冲突组，不加 ! 时两个类会共存并由 CSS 源序决定胜负，导致高度被钉死在单行。
     */
    multiline: {
      true: {
        group: "h-auto!",
        wrapper: "h-auto items-start py-2",
        input: "h-auto resize-none leading-relaxed",
        count: "absolute bottom-1 right-2",
      },
    },
    fieldGroup: {
      horizontal: {
        wrapper:
          "not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-within:z-[1]",
      },
      vertical: {
        wrapper:
          "not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-within:z-[1]",
      },
    },
    /** 有前置块时输入框左侧圆角压平，与 prepend 连体 */
    hasPrepend: {
      true: { wrapper: "rounded-s-none!" },
    },
    /** 有后置块时输入框右侧圆角压平，与 append 连体 */
    hasAppend: {
      true: { wrapper: "rounded-e-none!" },
    },
  },
  compoundVariants: [
    // square 外形的圆角按尺寸取令牌：sm 4px / md 6px / lg 8px
    { shape: "square", size: "sm", class: { wrapper: "rounded-ui-2xs", prepend: "rounded-s-ui-2xs", append: "rounded-e-ui-2xs" } },
    { shape: "square", size: "md", class: { wrapper: "rounded-ui-xs", prepend: "rounded-s-ui-xs", append: "rounded-e-ui-xs" } },
    { shape: "square", size: "lg", class: { wrapper: "rounded-ui-sm", prepend: "rounded-s-ui-sm", append: "rounded-e-ui-sm" } },
    // 胶囊外形时前后置块随之取全圆角
    { shape: "circle", class: { prepend: "rounded-s-full", append: "rounded-e-full" } },
    // 下划线形态必须压平圆角；用 ! 提权，tailwind-merge 不认识 rounded-ui-* 的冲突组
    { variant: "underlined", class: { wrapper: "rounded-none!", prepend: "rounded-none!", append: "rounded-none!" } },
    // borderless 形态没有描边宽度，错误态需要补一圈，否则完全不可见
    { variant: "borderless", error: true, class: { wrapper: "border-1 border-red-5" } },
  ] as any,
  defaultVariants: {
    size: "md",
    color: "primary",
    variant: "filled",
    shape: "square",
    error: false,
  },
} as const;
