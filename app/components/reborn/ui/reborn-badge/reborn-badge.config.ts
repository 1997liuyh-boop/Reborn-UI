import type { ClassValue } from 'clsx'

/** 徽章颜色选项 */
export const badgeColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
/** 徽章变体选项 */
export const badgeVariants = ['filled', 'outlined', 'soft', 'subtle'] as const
/** 徽章尺寸选项 */
export const badgeSizes = ['sm', 'md', 'lg'] as const

/*
 * 浅底与描边按「语义色 → 色相族」映射到设计令牌的数字色阶：
 * primary→brand、secondary→secondary、success→green、info→blue、warning→orange、error→red、neutral→gray。
 * 各视觉风格的取阶规则（来自设计规格）：
 *   subtle   → bg 取 2 阶 + border 取 4 阶 + 文字取 6 阶
 *   soft     → bg 取 2 阶 + 文字取 6 阶
 *   outlined → border 取 4 阶 + 文字取 6 阶
 *   filled   → 背景与前景使用语义角色，默认背景取 6 阶，随主题切换
 * 非中性文字使用语义色角色；浅底与描边保留显式层级。
 * 例外：neutral 的非 filled 文字统一用 gray-9（正文色），避免 gray-6 文字对比度不足。
 */
const config = {
  /** 徽章插槽样式配置 */
  slots: {
    root: 'reborn-badge cursor-pointer',
    base: 'inline-flex items-center justify-center font-medium whitespace-nowrap shrink-0 overflow-hidden transition-[color,box-shadow,background-color,border-color] max-w-full min-w-0 select-none rounded-sm',
    label: 'inline-flex items-center justify-center truncate max-w-full min-w-0',
    leadingIcon: 'shrink-0',
    trailingIcon: 'shrink-0',
    // 关闭图标继承标签文字颜色，悬停时也保持一致。
    closeButton: 'inline-flex items-center justify-center rounded-full text-inherit transition-colors cursor-pointer focus:outline-none',
    closeIcon: ''
  },
  /** 徽章变体配置 */
  variants: {
    /** 字段组（组合使用）时的样式 */
    fieldGroup: {
      horizontal: 'not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]',
      vertical: 'not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]'
    },
    /** 样式变体：只挂结构类，配色一律交给复合变体 */
    variant: {
      filled: '',
      outlined: 'bg-transparent border border-solid',
      soft: 'border-transparent',
      subtle: 'border border-solid'
    },
    /** 颜色配置 */
    color: {
      primary: '',
      secondary: '',
      success: '',
      info: '',
      warning: '',
      error: '',
      neutral: ''
    },
    /** 尺寸配置：sm 18px / md 24px / lg 32px（h-badge-* 令牌），水平内边距统一 6px */
    size: {
      sm: {
        base: 'h-4.5 px-1.5 text-sm gap-1',
        label: 'leading-none',
        // 前后图标与字号同尺寸（本项目 text-sm = 12px、text-base = 14px，见 assets/theme/typography.css）
        leadingIcon: 'size-3',
        trailingIcon: 'size-3',
        closeIcon: 'size-3'
      },
      md: {
        base: 'h-6 px-1.5 text-sm gap-1',
        label: 'leading-none',
        leadingIcon: 'size-3',
        trailingIcon: 'size-3',
        closeIcon: 'size-3.5'
      },
      lg: {
        base: 'h-8 px-1.5 text-base gap-1',
        label: 'leading-none',
        leadingIcon: 'size-3.5',
        trailingIcon: 'size-3.5',
        closeIcon: 'size-4'
      }
    },
    /** 是否为正方形（等宽高） */
    square: {
      true: 'p-0 aspect-square'
    },
    /** 圆角标签：普通类按顺序覆盖默认圆角，允许外部 ui 继续覆盖。 */
    round: {
      true: {
        base: 'rounded-full'
      }
    },
    /** 圆形只改变轮廓和尺寸，不改变配色与选中态。 */
    circle: { true: { base: 'rounded-full p-0 shrink-0' } },
    /** 可选中模式的未选中态：本轴只声明维度，具体灰阶样式按 variant 在复合变体中给出 */
    unchecked: {
      true: {}
    },
    /** 禁用态（配合 check 可选中模式使用）：整体降透明度并屏蔽交互 */
    disabled: {
      true: {
        root: 'cursor-not-allowed',
        base: 'opacity-50 pointer-events-none'
      }
    },
    gap: {
      true: {
        root: '[.reborn-badge+_&]:ml-2'
      }
    }
  },
  /** 复合变体：根据颜色和样式变体组合生成的样式 */
  compoundVariants: [
    // 实底使用语义背景与配套前景，跟随主题色切换。
    { color: 'primary' as any, variant: 'filled' as any, class: 'bg-primary text-primary-foreground' },
    { color: 'secondary' as any, variant: 'filled' as any, class: 'bg-secondary text-secondary-foreground' },
    { color: 'success' as any, variant: 'filled' as any, class: 'bg-success text-success-foreground' },
    { color: 'info' as any, variant: 'filled' as any, class: 'bg-info text-info-foreground' },
    { color: 'warning' as any, variant: 'filled' as any, class: 'bg-warning text-warning-foreground' },
    { color: 'error' as any, variant: 'filled' as any, class: 'bg-error text-error-foreground' },
    { color: 'neutral' as any, variant: 'filled' as any, class: 'bg-neutral text-neutral-foreground' },

    // Outlined：border 取 4 阶，文字取 6 阶（neutral 用 gray-9 正文色）
    { color: 'primary' as any, variant: 'outlined' as any, class: 'border-brand-4 text-primary' },
    { color: 'secondary' as any, variant: 'outlined' as any, class: 'border-secondary-4 text-secondary' },
    { color: 'success' as any, variant: 'outlined' as any, class: 'border-green-4 text-success' },
    { color: 'info' as any, variant: 'outlined' as any, class: 'border-blue-4 text-info' },
    { color: 'warning' as any, variant: 'outlined' as any, class: 'border-orange-4 text-warning' },
    { color: 'error' as any, variant: 'outlined' as any, class: 'border-red-4 text-error' },
    { color: 'neutral' as any, variant: 'outlined' as any, class: 'border-gray-4 text-gray-9' },

    // Soft：bg 取 2 阶，文字取 6 阶（neutral 用 gray-9 正文色）
    { color: 'primary' as any, variant: 'soft' as any, class: 'bg-brand-2 text-primary' },
    { color: 'secondary' as any, variant: 'soft' as any, class: 'bg-secondary-2 text-secondary' },
    { color: 'success' as any, variant: 'soft' as any, class: 'bg-green-2 text-success' },
    { color: 'info' as any, variant: 'soft' as any, class: 'bg-blue-2 text-info' },
    { color: 'warning' as any, variant: 'soft' as any, class: 'bg-orange-2 text-warning' },
    { color: 'error' as any, variant: 'soft' as any, class: 'bg-red-2 text-error' },
    { color: 'neutral' as any, variant: 'soft' as any, class: 'bg-gray-2 text-gray-9' },

    // Subtle：bg 取 2 阶 + border 取 4 阶，文字取 6 阶（neutral 用 gray-9 正文色）
    { color: 'primary' as any, variant: 'subtle' as any, class: 'bg-brand-2 border-brand-4 text-primary' },
    { color: 'secondary' as any, variant: 'subtle' as any, class: 'bg-secondary-2 border-secondary-4 text-secondary' },
    { color: 'success' as any, variant: 'subtle' as any, class: 'bg-green-2 border-green-4 text-success' },
    { color: 'info' as any, variant: 'subtle' as any, class: 'bg-blue-2 border-blue-4 text-info' },
    { color: 'warning' as any, variant: 'subtle' as any, class: 'bg-orange-2 border-orange-4 text-warning' },
    { color: 'error' as any, variant: 'subtle' as any, class: 'bg-red-2 border-red-4 text-error' },
    { color: 'neutral' as any, variant: 'subtle' as any, class: 'bg-gray-2 border-gray-4 text-gray-9' },

    // 可选中模式未选中态：统一退到灰阶。必须排在配色复合变体之后——
    // 同为 bg/border/text 颜色组，tailwind-merge 保留后出现者，从而覆盖上方配色
    { variant: 'subtle' as any, unchecked: true, class: 'bg-gray-2 border-gray-4 text-gray-6' },
    { variant: 'soft' as any, unchecked: true, class: 'bg-gray-2 text-gray-6' },
    { variant: 'outlined' as any, unchecked: true, class: 'border-gray-2 text-gray-6' },
    { variant: 'filled' as any, unchecked: true, class: 'bg-gray-2 text-gray-6' },
    // 仅基底固定等宽高，外层过渡容器与图标保持原有布局。
    { circle: true, size: 'sm' as (typeof badgeSizes)[number], class: { base: 'h-4.5 w-4.5' } },
    { circle: true, size: 'md' as (typeof badgeSizes)[number], class: { base: 'h-6 w-6' } },
    { circle: true, size: 'lg' as (typeof badgeSizes)[number], class: { base: 'h-8 w-8' } }
  ],
  /** 默认变体值 */
  defaultVariants: {
    color: 'primary' as (typeof badgeColors)[number],
    variant: 'filled' as (typeof badgeVariants)[number],
    size: 'md' as (typeof badgeSizes)[number]
  }
}

/** 徽章 UI 样式覆盖接口 */
export interface BadgeUI {
  root?: ClassValue
  base?: ClassValue
  label?: ClassValue
  leadingIcon?: ClassValue
  trailingIcon?: ClassValue
  closeButton?: ClassValue
  closeIcon?: ClassValue
}

export default config
