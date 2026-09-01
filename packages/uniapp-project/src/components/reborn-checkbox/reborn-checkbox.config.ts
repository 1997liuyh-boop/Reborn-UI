const size = ['sm', 'md', 'lg'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const variant = ['filled', 'outlined'] as const
const direction = ['horizontal', 'vertical'] as const

export {
  color as checkboxColors,
  direction as checkboxDirections,
  size as checkboxSizes,
  variant as checkboxVariants,
}

/** 多选框选项值类型 */
export type CheckboxValue = string | number | boolean

/** 复选框组 options 属性的对象写法 */
export interface CheckboxOption {
  /** 选项文案，复杂内容请改用 label 插槽 */
  label?: string
  /** 选项的值 */
  value: CheckboxValue
  /** 是否禁用该选项 */
  disabled?: boolean
  /** 该选项是否为半选状态 */
  indeterminate?: boolean
}

export default {
  slots: {
    wrapper: 'group inline-flex items-center gap-3 cursor-pointer select-none',
    input: 'sr-only',
    /** 禁用态按令牌语义取色：gray-2 是禁用填充色，gray-4 是边框色，与 web 端保持一致 */
    control:
      'flex items-center justify-center rounded-md border border-gray-4 bg-white text-white transition-colors ring-1 ring-transparent group-[.is-disabled]:cursor-not-allowed group-[.is-disabled]:bg-gray-2 group-[.is-disabled]:border-gray-4',
    /**
     * 勾选图标。小程序端没有 :checked 伪类，选中/半选态一律靠 wrapper 上的
     * is-checked / is-indeterminate 标记类驱动，显形规则与配色无关，只写一次。
     * 禁用态降到灰阶盖掉配色；不能用 gray-2 —— 那正是禁用填充色，同色会让勾看不见
     */
    icon: 'size-4 opacity-0 scale-75 transition-all group-[.is-checked]:opacity-100 group-[.is-checked]:scale-100 group-[.is-indeterminate]:opacity-100 group-[.is-indeterminate]:scale-100 group-[.is-disabled]:text-gray-4',
    /**
     * outlined 变体的半选方块：与勾选框同尺寸同圆角，再整体缩到 50%。
     * 圆角随之等比减半，形状与外框一致；transform 以中心为原点，
     * 不会像 w-1/2 h-1/2 那样因为奇数像素取整而视觉偏心。
     * 只在半选时挂载，因此不写入场过渡；显形规则挂在 icon 上，不会命中本节点。
     * 禁用态与 icon 同理降到 gray-4
     */
    dot: 'w-full h-full rounded-md scale-50 group-[.is-disabled]:bg-gray-4',
    label: 'text-gray-8 dark:text-gray-2',
  },
  variants: {
    size: {
      sm: {
        control: 'size-4',
        label: 'text-[length:var(--text-size-24)]',
      },
      md: {
        control: 'size-5',
        label: 'text-[length:var(--text-size-26)]',
      },
      lg: {
        control: 'size-6',
        label: 'text-[length:var(--text-size-28)]',
      },
    },
    /** 配色本身不带样式，实际类名由 color × variant 的复合变体给出 */
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
    /** 形态本身不带配色，同样交给复合变体 */
    variant: {
      filled: {},
      outlined: {},
    },
    error: {
      true: {
        control: 'border-error',
        label: 'text-error',
      },
    },
  },
  /**
   * 配色 × 形态：
   * - filled：选中与半选都填充配色，图标为白色（与旧版表现完全一致）
   * - outlined：选中只把边框与图标染成配色、不填充背景；
   *   半选刻意不声明 group-[.is-indeterminate]:border-*，让边框保持默认灰色，
   *   中间由 dot 区域渲染同色实心小方块
   */
  compoundVariants: [
    {
      color: 'primary' as (typeof color)[number],
      variant: 'filled' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:bg-primary group-[.is-checked]:border-primary group-[.is-indeterminate]:bg-primary group-[.is-indeterminate]:border-primary',
        icon: 'text-white',
      },
    },
    {
      color: 'primary' as (typeof color)[number],
      variant: 'outlined' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:border-primary',
        icon: 'text-primary',
        dot: 'bg-primary',
      },
    },
    {
      color: 'secondary' as (typeof color)[number],
      variant: 'filled' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:bg-secondary group-[.is-checked]:border-secondary group-[.is-indeterminate]:bg-secondary group-[.is-indeterminate]:border-secondary',
        icon: 'text-white',
      },
    },
    {
      color: 'secondary' as (typeof color)[number],
      variant: 'outlined' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:border-secondary',
        icon: 'text-secondary',
        dot: 'bg-secondary',
      },
    },
    {
      color: 'success' as (typeof color)[number],
      variant: 'filled' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:bg-success group-[.is-checked]:border-success group-[.is-indeterminate]:bg-success group-[.is-indeterminate]:border-success',
        icon: 'text-white',
      },
    },
    {
      color: 'success' as (typeof color)[number],
      variant: 'outlined' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:border-success',
        icon: 'text-success',
        dot: 'bg-success',
      },
    },
    {
      color: 'info' as (typeof color)[number],
      variant: 'filled' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:bg-info group-[.is-checked]:border-info group-[.is-indeterminate]:bg-info group-[.is-indeterminate]:border-info',
        icon: 'text-white',
      },
    },
    {
      color: 'info' as (typeof color)[number],
      variant: 'outlined' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:border-info',
        icon: 'text-info',
        dot: 'bg-info',
      },
    },
    {
      color: 'warning' as (typeof color)[number],
      variant: 'filled' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:bg-warning group-[.is-checked]:border-warning group-[.is-indeterminate]:bg-warning group-[.is-indeterminate]:border-warning',
        icon: 'text-white',
      },
    },
    {
      color: 'warning' as (typeof color)[number],
      variant: 'outlined' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:border-warning',
        icon: 'text-warning',
        dot: 'bg-warning',
      },
    },
    {
      color: 'error' as (typeof color)[number],
      variant: 'filled' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:bg-error group-[.is-checked]:border-error group-[.is-indeterminate]:bg-error group-[.is-indeterminate]:border-error',
        icon: 'text-white',
      },
    },
    {
      color: 'error' as (typeof color)[number],
      variant: 'outlined' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:border-error',
        icon: 'text-error',
        dot: 'bg-error',
      },
    },
    {
      color: 'neutral' as (typeof color)[number],
      variant: 'filled' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:bg-neutral group-[.is-checked]:border-neutral group-[.is-indeterminate]:bg-neutral group-[.is-indeterminate]:border-neutral',
        icon: 'text-white',
      },
    },
    {
      color: 'neutral' as (typeof color)[number],
      variant: 'outlined' as (typeof variant)[number],
      class: {
        control: 'group-[.is-checked]:border-neutral',
        icon: 'text-neutral',
        dot: 'bg-neutral',
      },
    },
  ],
  defaultVariants: {
    size: 'md' as (typeof size)[number],
    color: 'primary' as (typeof color)[number],
    variant: 'filled' as (typeof variant)[number],
  },
}

/** 复选框组的样式定义，仅有根节点一个区域 */
export const checkboxGroupTheme = {
  slots: {
    root: 'reborn-checkbox-group flex flex-wrap gap-[24rpx]',
  },
  variants: {
    /** 排列方向 */
    direction: {
      horizontal: {
        root: 'flex-row items-center',
      },
      vertical: {
        root: 'flex-col items-start',
      },
    },
  },
  defaultVariants: {
    direction: 'horizontal' as (typeof direction)[number],
  },
}
