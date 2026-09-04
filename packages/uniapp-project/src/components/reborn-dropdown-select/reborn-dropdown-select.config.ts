const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const sizes = ['sm', 'md', 'lg'] as const

const config = {
  slots: {
    wrapper: 'relative w-full',
    trigger: 'w-full',
    /*
     * 面板外壳：负责定位、底色描边阴影与展开动画。
     * 展开走高度 0 → 实测高度（与 Web 端 Select 的 select-collapse 一致），动画期间必须 overflow-hidden 裁剪内容；
     * 高度由组件用 createSelectorQuery 测得 content 的高度后内联写入，reborn-dropdown-select__* 即测量用的选择器类名。
     */
    panel: 'reborn-dropdown-select__panel absolute top-full left-0 right-0 z-[999] mt-1 overflow-hidden rounded-ui-base border border-gray-2 bg-white shadow-lg transition-[height,opacity] duration-200 ease-out will-change-[height,opacity] dark:border-gray-7 dark:bg-gray-8',
    // 面板内容：真正的滚动容器，高度上限在这里，外壳测量到的就是它被上限裁过之后的高度
    content: 'reborn-dropdown-select__content max-h-[400rpx] overflow-y-auto',
    item: 'leading-normal text-sm text-gray-8 dark:text-gray-2 border-b border-gray-100 dark:border-gray-7 last:border-b-0 active:bg-gray-50 dark:active:bg-gray-7 flex items-center justify-between',
    itemText: 'flex-1 truncate',
    itemIcon: 'w-4 h-4 text-blue-6 dark:text-blue-400',
    empty: 'py-3 text-center text-gray-400 text-sm',
    mask: 'fixed inset-0 z-[998]',
  },
  variants: {
    color: {
      primary: {
        item: 'active:bg-primary/10',
        itemIcon: 'text-primary',
      },
      secondary: {
        item: 'active:bg-secondary/10',
        itemIcon: 'text-secondary',
      },
      success: {
        item: 'active:bg-success/10',
        itemIcon: 'text-success',
      },
      info: {
        item: 'active:bg-info/10',
        itemIcon: 'text-info',
      },
      warning: {
        item: 'active:bg-warning/10',
        itemIcon: 'text-warning',
      },
      error: {
        item: 'active:bg-error/10',
        itemIcon: 'text-error',
      },
      neutral: {
        item: 'active:bg-neutral/10',
        itemIcon: 'text-neutral',
      },
    },
    size: {
      sm: {
        // trigger: 'h-input-sm px-2 text-26 gap-1 leading-none',
        item: 'h-input-sm text-26 leading-none px-2',
      },
      md: {
        // trigger: 'h-input-md px-3 text-28 gap-2',
        item: 'h-input-md text-28 leading-normal px-3',
      },
      lg: {
        // trigger: 'h-input-lg px-3 text-28 gap-2',
        item: 'h-input-lg px-3 text-base',
      },
    },
    disabled: {
      true: {
        wrapper: 'opacity-50 pointer-events-none',
      },
    },
    selected: {
      true: {
        itemText: 'font-medium',
      },
    },
  },
  compoundVariants: [
    { color: 'primary' as (typeof colors)[number], selected: true as const, class: { item: 'bg-primary/10 text-primary' } },
    { color: 'secondary' as (typeof colors)[number], selected: true as const, class: { item: 'bg-secondary/10 text-secondary' } },
    { color: 'success' as (typeof colors)[number], selected: true as const, class: { item: 'bg-success/10 text-success' } },
    { color: 'info' as (typeof colors)[number], selected: true as const, class: { item: 'bg-info/10 text-info' } },
    { color: 'warning' as (typeof colors)[number], selected: true as const, class: { item: 'bg-warning/10 text-warning' } },
    { color: 'error' as (typeof colors)[number], selected: true as const, class: { item: 'bg-error/10 text-error' } },
    { color: 'neutral' as (typeof colors)[number], selected: true as const, class: { item: 'bg-neutral/10 text-neutral' } },
  ],
  defaultVariants: {
    color: 'primary' as (typeof colors)[number],
    size: 'md' as (typeof sizes)[number],
    disabled: false,
    selected: false,
  },
}

export { colors as dropdownSelectColors, sizes as dropdownSelectSizes }
export default config
