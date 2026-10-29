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
      "group/input relative inline-flex w-full min-w-0 items-center box-border overflow-hidden text-gray-9 transition-colors ",
    /**
     * 输入元素。h-full 让它撑满 wrapper 高度：单行 <input> 的文本由浏览器在内容盒内
     * 原生垂直居中，盒子必须先撑满才生效；否则 input 高度只等于自身行高，
     * 文字位置会随行高令牌漂移，且上下边缘点击不到光标。
     * 多行由 multiline 变体改回 h-auto，高度交给 rows / autosize。
     */
    input:
      "h-full min-w-0 flex-1 bg-transparent text-gray-9 outline-none placeholder:text-gray-5 read-only:cursor-default disabled:cursor-not-allowed disabled:text-gray-5",
    /** 前缀区（#prefix 插槽或 prefix-icon） */
    prefix: "inline-flex shrink-0 items-center text-gray-6",
    /** 尾部功能区：清除按钮 / 密码开关 / 字数统计 / 后缀 */
    iconBox: "inline-flex shrink-0 items-center gap-2",
    icon: "",
    iconSection: "flex cursor-pointer items-center justify-center text-gray-5 transition-all hover:opacity-80",
    /** 尾部功能区内的竖分割线，聚焦时颜色跟随 color */
    separator: "w-px shrink-0 transition-colors bg-gray-4",
    /**
     * 字数统计文本（inside 位于尾部功能区 / textarea 右下角，outside 位于输入框下方）。
     * 字号取七级令牌 text-sm（12px）。原先的 text-xs 是 Tailwind 原生值，字号同为 12px，
     * 换令牌后只有行高从 16px 回到 20px。
     */
    count: "pointer-events-none text-sm text-gray-5 tabular-nums leading-1",
  },
  variants: {
    /**
     * 尺寸直接使用 Tailwind 刻度：高度 h-6 / h-8 / h-10，
     * 水平内边距 px-2.5 / px-3 / px-4，分隔线高度 h-3 / h-3.5 / h-4。
     * 字号遵循全局 size 锚点：sm 12px（text-sm）/ md 14px（text-base）/ lg 16px（text-lg）。
     * text-* 令牌自带「字号 + 8px」的行高，全部档位都不叠加 leading-*，否则会把令牌行高覆盖掉；
     * 多行模式同样走令牌行高（md 档 14px 字号对应 22px），不再单开比例档。
     * wrapper 与 input 都要声明字号：input 管输入文本，wrapper 管 #prefix / #suffix
     * 等插槽内容的继承默认值，缺一档会导致插槽文字跟着外层容器走。
     */
    size: {
      sm: {
        group: "h-6",
        wrapper: "px-2.5 text-sm",
        input: "text-sm",
        prepend: "text-sm",
        append: "text-sm",
        icon: "text-sm",
        separator: "h-3",
      },
      md: {
        group: "h-8",
        wrapper: "px-3 text-base",
        input: "text-base",
        prepend: "text-base",
        append: "text-base",
        icon: "text-base",
        separator: "h-3.5",
      },
      lg: {
        group: "h-10",
        wrapper: "px-4 text-lg",
        input: "text-lg",
        prepend: "text-lg",
        append: "text-lg",
        icon: "text-lg",
        separator: "h-4",
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
      // 无边框与下划线形态清空水平内边距，原生 px-* 按后写顺序正常合并。
      borderless: {
        wrapper: "bg-transparent border-0 focus-within:border-0 px-0",
        input: "px-[2px]"
      },
      underlined: {
        wrapper:
          "border-0 border-b-1 border-gray-3 bg-transparent data-[disabled=true]:border-gray-4 px-0",
        input: "px-[2px]"
      },
    },
    /** 外形轮廓：circle 胶囊；square 的圆角按尺寸在 compoundVariants 中给出 */
    shape: {
      circle: { wrapper: "rounded-full" },
      square: {},
    },
    disabled: {
      true: {
        prepend: "cursor-not-allowed text-gray-5",
        append: "cursor-not-allowed text-gray-5",
        wrapper: "cursor-not-allowed text-gray-5",
        // 后缀图标、密码切换默认是 cursor-pointer，禁用时一并换成禁止光标
        iconSection: "cursor-not-allowed",
      }
    },
    /**
     * 悬停与聚焦描边取 color-6，聚焦外圈取 color-1；分割线沿用语义色。
     * 2px 外圈使用 ring，不参与盒模型，单行与多行输入的高度都保持不变。
     */
    color: {
      primary: {
        wrapper: "hover:border-brand-6 focus-within:border-brand-6 focus-within:ring-brand-1",
        separator: "group-focus-within/input:bg-primary",
        input: "caret-primary",
      },
      secondary: {
        wrapper: "hover:border-secondary-6 focus-within:border-secondary-6 focus-within:ring-secondary-1",
        separator: "group-focus-within/input:bg-secondary",
        input: "caret-secondary",
      },
      success: {
        wrapper: "hover:border-green-6 focus-within:border-green-6 focus-within:ring-green-1",
        separator: "group-focus-within/input:bg-success",
        input: "caret-success",
      },
      info: {
        wrapper: "hover:border-blue-6 focus-within:border-blue-6 focus-within:ring-blue-1",
        separator: "group-focus-within/input:bg-info",
        input: "caret-info",
      },
      warning: {
        wrapper: "hover:border-orange-6 focus-within:border-orange-6 focus-within:ring-orange-1",
        separator: "group-focus-within/input:bg-warning",
        input: "caret-warning",
      },
      error: {
        wrapper: "hover:border-red-6 focus-within:border-red-6 focus-within:ring-red-1",
        separator: "group-focus-within/input:bg-error",
        input: "caret-error",
      },
      neutral: {
        wrapper: "hover:border-gray-6 focus-within:border-gray-6 focus-within:ring-gray-1",
        separator: "group-focus-within/input:bg-neutral",
        input: "caret-neutral",
      },
    },
    error: {
      true: {
        wrapper: "border-red-5 hover:border-red-5 focus-within:border-red-5 focus-within:ring-red-1",
        input: "text-red-5 placeholder:text-red-5/50",
      },
    },
    /**
     * 多行（textarea）模式：高度由内容决定，字数统计悬浮在右下角。
     * h-auto! 覆盖单行尺寸档位的固定高度，沿用多行模式的样式优先级。
     */
    multiline: {
      true: {
        group: "h-auto!",
        wrapper: "h-auto items-start py-2",
        // 行高跟随 size 档的 text-* 令牌，不写 leading-：textarea 的可视高度按
        // rows × 行高算，写死比例档会让三档行距各自偏离令牌 0.5~2px
        input: "h-auto resize-none",
        count: "absolute bottom-1 right-2",
      },
    },
    /** 内置统计占据底部独立区域，避免固定行数与自动高度模式的末行文字被覆盖。 */
    multilineWithCount: {
      true: {
        wrapper: "pb-6",
      },
    },
    /** 原生手柄被外层内边距挤入统计区：改由文本域承接内边距，并为统计预留底部与右侧空间。 */
    resizeWithCount: {
      true: {
        wrapper: "px-0! py-0",
        input: "py-2 pb-6",
        count: "right-6",
      },
    },
    /** 外置统计回到文档流，统一 14px；仅当前字数加深颜色，分隔符与上限沿用灰色。 */
    wordLimitPosition: {
      outside: {
        root: "gap-0.5",
        count: "static self-end text-base [&>span]:text-gray-8",
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
    // 只给描边与填充形态增加聚焦外圈，保持无边框和下划线形态的轮廓。
    { variant: ["outlined", "filled"], disabled: false, class: { wrapper: "focus-within:ring-2" } },
    { resizeWithCount: true, size: "sm", class: { input: "px-2.5" } },
    { resizeWithCount: true, size: "md", class: { input: "px-3" } },
    { resizeWithCount: true, size: "lg", class: { input: "px-4" } },
    // 下划线形态保留原有的窄文本边距，不套用描边输入框的尺寸内边距。
    { resizeWithCount: true, variant: "underlined", class: { input: "px-0.5" } },
    // square 外形的圆角按尺寸取令牌：sm 4px / md 6px / lg 8px
    { shape: "square", size: "sm", class: { wrapper: "rounded-sm", prepend: "rounded-s-sm", append: "rounded-e-sm" } },
    { shape: "square", size: "md", class: { wrapper: "rounded-md", prepend: "rounded-s-md", append: "rounded-e-md" } },
    { shape: "square", size: "lg", class: { wrapper: "rounded-lg", prepend: "rounded-s-lg", append: "rounded-e-lg" } },
    // 胶囊外形时前后置块随之取全圆角
    { shape: "circle", class: { prepend: "rounded-s-full", append: "rounded-e-full" } },
    // 下划线形态必须压平圆角。! 是历史遗留：size 轴原先用自定义的 rounded-ui-*，
    // 不在 tailwind-merge 的 border-radius 冲突组里；现已改回原生 rounded-*，合并正常。
    { variant: "underlined", class: { wrapper: "rounded-none!", prepend: "rounded-none!", append: "rounded-none!" } },
    // borderless 形态没有描边宽度，错误态需要补一圈，否则完全不可见
    { variant: "borderless", error: true, class: { wrapper: "border-1 border-red-5" } },
    // 禁用态优先于悬停与聚焦配色，尾部插槽获得焦点也不会出现聚焦外圈。
    { disabled: true, class: { wrapper: "hover:border-gray-4 focus-within:border-gray-4 focus-within:ring-0" } },
  ] as any,
  defaultVariants: {
    size: "md",
    color: "primary",
    variant: "filled",
    shape: "square",
    error: false,
    disabled: false,
  },
} as const;
