const size = ['sm', 'md', 'lg'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const shape = ['circle', 'square'] as const

/** 形态变体：描边 / 填充 / 无边框 / 下划线 */
const variant = ['outlined', 'filled', 'borderless', 'underlined'] as const

export {
  color as inputNumberColors,
  shape as inputNumberShapes,
  size as inputNumberSizes,
  variant as inputNumberVariants,
}

export default {
  slots: {
    /**
     * 根容器。背景与边框不在此声明，全部交给 variant 形态变体，避免相互覆盖。
     * 注意：uniapp 侧的 theme.css 没有 .dark 代码块，gray-1~gray-8 不会随主题翻转，
     * 因此深色适配必须逐条写显式 dark: 变体（与 web 侧的自动翻转策略不同）。
     */
    wrapper:
      'group relative inline-flex items-center overflow-hidden text-gray-8 transition-colors data-[disabled=true]:cursor-not-allowed data-[disabled=true]:text-gray-4 dark:text-gray-200 dark:data-[disabled=true]:text-gray-600',
    button:
      'flex h-full items-center justify-center text-gray-8 transition-all active:scale-[0.85] active:opacity-75 data-[disabled=true]:!scale-100 data-[disabled=true]:!opacity-100 data-[disabled=true]:!cursor-not-allowed data-[disabled=true]:!text-gray-4 dark:text-gray-4 dark:hover:text-gray-2',
    /**
     * controls-position="left" / "right" 时上下堆叠的按钮组容器。
     * 端差异：触屏端没有 hover，堆叠按钮为常显（web 端为悬停 / 聚焦时滑入）；
     * 与输入区之间的分割线画在自身侧边框上（gray-4），侧边由 controlsPosition 变体决定。
     */
    stack: 'flex h-full flex-col self-stretch',
    /** 堆叠布局下的单个按钮；两按钮之间的分割线画在首个按钮的下边框上（gray-4） */
    stackButton:
      'flex min-h-0 flex-1 items-center justify-center text-gray-8 transition-all first:border-b first:border-gray-4 active:scale-[0.85] active:opacity-75 data-[disabled=true]:!scale-100 data-[disabled=true]:!opacity-100 data-[disabled=true]:!cursor-not-allowed data-[disabled=true]:!text-gray-4 dark:text-gray-4 dark:hover:text-gray-2',
    input:
      'min-w-0 flex-1 bg-transparent text-center text-gray-8 outline-none placeholder:text-gray-4 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:text-gray-200 dark:placeholder:text-gray-500',
    divider: 'h-full w-[1px] bg-gray-4',
    /** 输入框内的前缀区（prefix 插槽） */
    prefix: 'flex shrink-0 items-center text-gray-7 dark:text-gray-4',
    /** 输入框内的后缀区（suffix 插槽） */
    suffix: 'flex shrink-0 items-center text-gray-7 dark:text-gray-4',
    icon: 'shrink-0',
  },
  variants: {
    size: {
      sm: {
        wrapper: 'h-[calc(var(--text-size-26)*2)] text-26',
        input: 'w-[calc(var(--text-size-26)*2.5)] text-26',
        button: 'p-1.5',
        stackButton: 'px-1.5',
        prefix: 'pl-1.5 text-26',
        suffix: 'pr-1.5 text-26',
        icon: 'size-3.5',
      },
      md: {
        wrapper: 'h-[calc(var(--text-size-28)*2)] text-28',
        input: 'w-[calc(var(--text-size-28)*2.5)] text-28',
        button: 'p-2',
        stackButton: 'px-2',
        prefix: 'pl-2 text-28',
        suffix: 'pr-2 text-28',
        icon: 'size-4',
      },
      lg: {
        wrapper: 'h-[calc(var(--text-size-32)*2)] text-32',
        input: 'w-[calc(var(--text-size-32)*5)] text-32',
        button: 'p-2',
        stackButton: 'px-2',
        prefix: 'pl-2 text-32',
        suffix: 'pr-2 text-32',
        icon: 'size-5',
      },
    },
    /**
     * 形态变体。四种形态各自负责背景与边框：
     * - outlined：白底 + 四周描边（默认）
     * - filled：灰底 + 无描边，聚焦时转为白底描边
     * - borderless：完全无背景无描边，融入所在容器
     * - underlined：仅保留底部下划线，圆角强制为 0
     * 下划线宽度写 border-b 而非 border-b-1：uniapp 侧是 Tailwind v3，没有 border-b-1。
     */
    variant: {
      outlined: {
        wrapper:
          'bg-white ring-1 ring-gray-4 focus-within:ring-2 data-[disabled=true]:bg-gray-2 dark:bg-gray-800 dark:data-[disabled=true]:bg-gray-900',
      },
      filled: {
        wrapper:
          'bg-gray-2 ring-1 ring-transparent focus-within:bg-white focus-within:ring-2 data-[disabled=true]:bg-gray-3 dark:bg-gray-900 dark:focus-within:bg-gray-800 dark:data-[disabled=true]:bg-gray-900',
      },
      borderless: {
        wrapper: 'bg-transparent ring-0 focus-within:ring-0',
      },
      underlined: {
        wrapper:
          'border-b border-gray-4 bg-transparent ring-0 focus-within:ring-0 data-[disabled=true]:border-gray-3 dark:border-gray-700',
        // 下划线形态下左右按钮不需要竖直分割线
        divider: 'hidden',
      },
    },
    color: {
      primary: {
        wrapper: 'focus-within:ring-primary focus-within:border-primary',
        button: 'hover:text-primary',
        stackButton: 'hover:text-primary',
        divider: 'group-focus-within:bg-primary',
      },
      secondary: {
        wrapper: 'focus-within:ring-secondary focus-within:border-secondary',
        button: 'hover:text-secondary',
        stackButton: 'hover:text-secondary',
        divider: 'group-focus-within:bg-secondary',
      },
      success: {
        wrapper: 'focus-within:ring-success focus-within:border-success',
        button: 'hover:text-success',
        stackButton: 'hover:text-success',
        divider: 'group-focus-within:bg-success',
      },
      info: {
        wrapper: 'focus-within:ring-info focus-within:border-info',
        button: 'hover:text-info',
        stackButton: 'hover:text-info',
        divider: 'group-focus-within:bg-info',
      },
      warning: {
        wrapper: 'focus-within:ring-warning focus-within:border-warning',
        button: 'hover:text-warning',
        stackButton: 'hover:text-warning',
        divider: 'group-focus-within:bg-warning',
      },
      error: {
        wrapper: 'focus-within:ring-error focus-within:border-error',
        button: 'hover:text-error',
        stackButton: 'hover:text-error',
        divider: 'group-focus-within:bg-error',
      },
      neutral: {
        wrapper: 'focus-within:ring-gray-4 focus-within:border-gray-4',
        button: 'hover:text-neutral',
        stackButton: 'hover:text-neutral',
        divider: 'group-focus-within:bg-gray-4',
      },
    },
    shape: {
      circle: {
        wrapper: 'rounded-full',
      },
      square: {
        wrapper: 'rounded-md',
      },
    },
    /**
     * 堆叠按钮的位置（controls-position="left" / "right"）：
     * left 置于输入框左侧（order-first 挪到最前）、right 置于右侧。
     * 与输入区之间的分割线画在 stack 的侧边框上，颜色 gray-4，与 web 端一致。
     */
    controlsPosition: {
      left: {
        stack: 'order-first border-r border-gray-4',
      },
      right: {
        stack: 'border-l border-gray-4',
      },
    },
    error: {
      true: {
        wrapper: 'ring-error border-error',
        divider: 'bg-error',
      },
    },
    fieldGroup: {
      horizontal:
        'not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-within:z-[1]',
      vertical:
        'not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-within:z-[1]',
    },
  },
  compoundVariants: [
    // 下划线形态必须压平圆角。放在 compoundVariants 里以保证排在 shape 之后，
    // rounded-none 与 rounded-full / rounded-md 属于同一 tailwind-merge 冲突组，后者会被正确剔除。
    { variant: 'underlined', class: { wrapper: 'rounded-none' } },
    // borderless 形态本身没有描边宽度，出错时需要补一圈，否则错误态完全不可见
    { variant: 'borderless', error: true, class: { wrapper: 'ring-1 ring-error' } },
  ] as any,
  defaultVariants: {
    size: 'sm' as (typeof size)[number],
    color: 'neutral' as (typeof color)[number],
    shape: 'circle' as (typeof shape)[number],
    variant: 'outlined' as (typeof variant)[number],
  },
}