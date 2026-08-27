const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

/** 形态变体：描边 / 填充 / 无边框 / 下划线（与 web 端同一套形态语言） */
const variants = ['outlined', 'filled', 'borderless', 'underlined'] as const

/** 外形轮廓：circle 为胶囊圆角，square 为按尺寸取圆角令牌（4/6/8rpx） */
const shapes = ['circle', 'square'] as const

/**
 * 注意：uniapp 侧的 theme.css 没有 .dark 代码块，gray-1~gray-8 不会随主题翻转，
 * 深色适配必须逐条写显式 dark: 变体（与 web 侧的自动翻转策略不同）。
 * 小程序不支持 :focus-within，聚焦态由组件内 JS 维护的 focus 变体驱动。
 */
const config = {
  slots: {
    /** 最外层：纵向容纳「输入组 + 外置字数统计」 */
    root: 'flex w-full min-w-0 flex-col gap-1',
    /**
     * 输入组：prepend + wrapper + append 横向连体。
     * 尺寸高度令牌压在这一层，并用 grow 吃满 root 的剩余高度：
     * 外部在 root 上设高度时，group → wrapper / prepend / append 逐层拉伸占满。
     */
    group: 'flex w-full min-w-0 grow items-stretch',
    /** 前置块（#prepend 插槽），与输入框连体，仅单行模式渲染 */
    prepend: 'flex shrink-0 items-center px-3 bg-gray-2 dark:bg-gray-8 text-gray-6 dark:text-gray-4',
    /** 后置块（#append 插槽），与输入框连体，仅单行模式渲染 */
    append: 'flex shrink-0 items-center px-3 bg-gray-2 dark:bg-gray-8 text-gray-6 dark:text-gray-4',
    /**
     * 输入框主体容器。背景与边框交给 variant 形态变体；
     * 禁用态统一为 bg-gray-2 / text-gray-5 / 边框 gray-4（与 web 端对齐）。
     */
    wrapper:
      'relative flex w-full min-w-0 items-center transition-colors overflow-hidden text-gray-9 dark:text-gray-1 data-[disabled=true]:text-gray-5',
    input:
      'flex-1 min-w-0 h-full pl-3 text-gray-9 dark:text-gray-1 focus-visible:outline-none focus:outline-none disabled:cursor-not-allowed disabled:text-gray-5 disabled:pointer-events-none transition-colors',
    inputItem: 'h-full w-full',
    /** 前缀区（#prefix / #leading 插槽或 prefix-icon） */
    leading: 'absolute left-3 top-0 bottom-0 flex items-center justify-center text-gray-6 dark:text-gray-4',
    /** 尾部功能区：清除按钮 / 密码开关 / 字数统计 / 后缀 */
    iconBox: 'h-full flex-shrink-0 flex items-center gap-[16rpx] pr-3',
    iconSection: 'flex cursor-pointer items-center justify-center text-gray-5 transition-all hover:opacity-80',
    icon: '',
    /** 尾部功能区内的竖分割线，聚焦时颜色跟随 color */
    separator: 'w-px transition-colors bg-gray-4',
    /** 字数统计文本（inside 位于尾部功能区 / textarea 右下角，outside 位于输入框下方） */
    count: 'pointer-events-none text-22 text-gray-5',
  },
  variants: {
    size: {
      sm: {
        group: 'h-input-sm',
        input: 'text-26 leading-normal',
        prepend: 'text-26',
        append: 'text-26',
        icon: 'text-40',
        separator: 'h-[var(--text-size-32)]',
      },
      md: {
        group: 'h-input-md',
        input: 'text-28 leading-normal',
        prepend: 'text-28',
        append: 'text-28',
        icon: 'text-40',
        separator: 'h-[var(--text-size-36)]',
      },
      lg: {
        group: 'h-input-lg',
        input: 'text-28 leading-normal',
        prepend: 'text-28',
        append: 'text-28',
        icon: 'text-40',
        separator: 'h-[var(--text-size-40)]',
      },
    },
    /**
     * 形态变体。四种形态各自负责背景与边框（与 web 端同规格）：
     * - outlined：底色 + 四周描边
     * - filled（默认，衔接旧默认外观）：灰底，聚焦时转白底 + 描边（颜色由 focus × color 组合给出）
     * - borderless：完全无背景无描边，融入所在容器
     * - underlined：仅保留底部下划线，圆角强制为 0
     */
    variant: {
      outlined: {
        wrapper:
          'bg-white dark:bg-gray-800 ring-1 ring-gray-4 dark:ring-gray-7 data-[disabled=true]:bg-gray-2 dark:data-[disabled=true]:bg-gray-900',
      },
      filled: {
        wrapper:
          'bg-gray-2 dark:bg-gray-8 ring-1 ring-transparent data-[disabled=true]:bg-gray-2 data-[disabled=true]:ring-gray-4 dark:data-[disabled=true]:bg-gray-900',
      },
      borderless: {
        wrapper: 'bg-transparent ring-0',
      },
      underlined: {
        wrapper:
          'border-b border-gray-3 dark:border-gray-7 bg-transparent ring-0 data-[disabled=true]:border-gray-4',
        // 下划线形态下分割线保持灰阶即可
      },
    },
    /** 外形轮廓：circle 胶囊；square 的圆角按尺寸在 compoundVariants 中给出 */
    shape: {
      circle: { wrapper: 'rounded-full' },
      square: {},
    },
    error: {
      true: {
        wrapper: 'ring-error/50 border-error/50 bg-error/5',
        input: 'text-error placeholder:text-error/50',
      },
    },
    /** 多行（textarea）模式：高度由内容决定，字数统计悬浮在右下角 */
    multiline: {
      true: {
        // h-auto 必须 ! 提权：tailwind-merge 不认识自定义 h-input-* 属于 height 冲突组
        group: '!h-auto',
        wrapper: 'h-auto py-2 items-start',
        input: 'h-auto min-h-[120rpx] resize-none',
        count: 'absolute bottom-1 right-3',
      },
    },
    fieldGroup: {
      horizontal: {
        wrapper: 'first:rounded-r-none last:rounded-l-none',
      },
      vertical: {
        wrapper: 'first:rounded-b-none last:rounded-t-none',
      },
    },
    hasLeading: {
      true: {
        input: 'pl-9',
      },
    },
    hasTrailing: {
      true: {},
    },
    /** 有前置块时输入框左侧圆角压平，与 prepend 连体 */
    hasPrepend: {
      true: { wrapper: '!rounded-l-none' },
    },
    /** 有后置块时输入框右侧圆角压平，与 append 连体 */
    hasAppend: {
      true: { wrapper: '!rounded-r-none' },
    },
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
    focus: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    // 聚焦高亮：描边 / 下划线 / 分割线跟随 color（小程序无 :focus-within，由 JS focus 态驱动）
    { color: 'primary', focus: true, class: { wrapper: 'ring-primary border-primary', separator: 'bg-primary' } },
    { color: 'secondary', focus: true, class: { wrapper: 'ring-secondary border-secondary', separator: 'bg-secondary' } },
    { color: 'success', focus: true, class: { wrapper: 'ring-success border-success', separator: 'bg-success' } },
    { color: 'info', focus: true, class: { wrapper: 'ring-info border-info', separator: 'bg-info' } },
    { color: 'warning', focus: true, class: { wrapper: 'ring-warning border-warning', separator: 'bg-warning' } },
    { color: 'error', focus: true, class: { wrapper: 'ring-error border-error', separator: 'bg-error' } },
    { color: 'neutral', focus: true, class: { wrapper: 'ring-gray-4 border-gray-4', separator: 'bg-gray-4' } },
    // filled 形态聚焦时背景由灰底转白底（与 web 端 focus-within:bg-gray-1 对齐）
    { variant: 'filled', focus: true, class: { wrapper: 'bg-white dark:bg-gray-900' } },
    // borderless 聚焦不上描边，保持无边框语义
    { variant: 'borderless', focus: true, class: { wrapper: 'ring-0' } },
    // square 外形的圆角按尺寸取令牌：sm 4rpx / md 6rpx / lg 8rpx。
    // 带 ! 强制：rounded-ui-* 是自定义令牌，tailwind-merge 不会与其它圆角类互斥
    { shape: 'square', size: 'sm', class: { wrapper: '!rounded-ui-2xs', prepend: '!rounded-l-ui-2xs', append: '!rounded-r-ui-2xs' } },
    { shape: 'square', size: 'md', class: { wrapper: '!rounded-ui-xs', prepend: '!rounded-l-ui-xs', append: '!rounded-r-ui-xs' } },
    { shape: 'square', size: 'lg', class: { wrapper: '!rounded-ui-sm', prepend: '!rounded-l-ui-sm', append: '!rounded-r-ui-sm' } },
    // 胶囊外形时前后置块随之取全圆角
    { shape: 'circle', class: { prepend: 'rounded-l-full', append: 'rounded-r-full' } },
    // 下划线形态必须压平圆角
    { variant: 'underlined', class: { wrapper: '!rounded-none', prepend: '!rounded-none', append: '!rounded-none' } },
    // borderless 形态没有描边宽度，错误态需要补一圈，否则完全不可见
    { variant: 'borderless', error: true, class: { wrapper: 'ring-1 ring-error' } },
  ] as any,
  defaultVariants: {
    size: 'sm',
    color: 'primary',
    variant: 'filled',
    shape: 'square',
    focus: false,
  },
} as const

export { colors as inputColors, shapes as inputShapes, sizes as inputSizes, variants as inputVariants }
export default config
