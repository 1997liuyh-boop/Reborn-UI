import type { InjectionKey } from 'vue'

export const descriptionsSizes = ['sm', 'md', 'lg'] as const
export type DescriptionsSize = (typeof descriptionsSizes)[number]

/** bordered 有边框 | divider 无框（行分割线） | none 无边框 */
export const descriptionsBorderModes = ['bordered', 'divider', 'none'] as const
export type DescriptionsBorderMode = (typeof descriptionsBorderModes)[number]

/** 标签 / 内容单元格水平对齐 */
export const descriptionsAligns = ['left', 'center', 'right'] as const
export type DescriptionsAlign = (typeof descriptionsAligns)[number]

/** 标签 / 内容字体行高预设 */
export const descriptionsLineHeights = ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'] as const
export type DescriptionsLineHeight = (typeof descriptionsLineHeights)[number]

/** 行高：预设 token 或自定义 CSS 值（如 '1.8'、'28px'） */
export type DescriptionsLineHeightValue = DescriptionsLineHeight | string

export function isDescriptionsLineHeightPreset(value: string): value is DescriptionsLineHeight {
  return (descriptionsLineHeights as readonly string[]).includes(value)
}

export interface DescriptionsContext {
  column: number
  border: DescriptionsBorderMode
  size: DescriptionsSize
  direction: 'horizontal' | 'vertical'
  colon: boolean
  labelWidth?: string
  labelAlign: DescriptionsAlign
  contentAlign: DescriptionsAlign
}

export const DescriptionsInjectionKey: InjectionKey<DescriptionsContext> = Symbol('RebornDescriptions')

const config = {
  slots: {
    root: 'reborn-descriptions w-full',
    header: 'flex items-start justify-between gap-3 mb-3',
    titleWrapper: 'flex min-w-0 flex-1 items-center',
    title: 'text-base font-semibold text-gray-900 dark:text-gray-50',
    actions: 'ml-auto flex shrink-0 items-center gap-2',
    tableWrapper: '',
    body: 'w-full border-collapse',
    label: 'font-medium text-gray-500 dark:text-gray-400 align-top min-w-24 whitespace-nowrap',
    content: 'text-gray-900 dark:text-gray-100 align-top break-words',
    colon: 'text-gray-400 dark:text-gray-500 select-none font-normal',
  },
  variants: {
    size: {
      sm: {
        label: 'px-2.5 py-1.5 text-xs',
        content: 'px-2.5 py-1.5 text-xs',
      },
      md: {
        label: 'px-4 py-2.5 text-sm',
        content: 'px-4 py-2.5 text-sm',
      },
      lg: {
        label: 'px-5 py-3.5 text-base',
        content: 'px-5 py-3.5 text-base',
      },
    },
    rounded: {
      true: {
        tableWrapper: 'rounded-xl overflow-hidden',
      },
      false: {
        tableWrapper: '',
      },
    },
    border: {
      bordered: {
        tableWrapper: 'border border-gray-200 dark:border-gray-700/60',
        label: '',
        content: '',
      },
      divider: {
        tableWrapper: '',
        label: '',
        content: '',
      },
      none: {
        tableWrapper: '',
        label: '',
        content: '',
      },
    },
    labelAlign: {
      left: { label: 'text-left' },
      center: { label: 'text-center' },
      right: { label: 'text-right' },
    },
    contentAlign: {
      left: { content: 'text-left' },
      center: { content: 'text-center' },
      right: { content: 'text-right' },
    },
    labelLineHeight: {
      none: { label: 'leading-none' },
      tight: { label: 'leading-tight' },
      snug: { label: 'leading-snug' },
      normal: { label: 'leading-normal' },
      relaxed: { label: 'leading-relaxed' },
      loose: { label: 'leading-loose' },
      custom: { label: '' },
    },
    contentLineHeight: {
      none: { content: 'leading-none' },
      tight: { content: 'leading-tight' },
      snug: { content: 'leading-snug' },
      normal: { content: 'leading-normal' },
      relaxed: { content: 'leading-relaxed' },
      loose: { content: 'leading-loose' },
      custom: { content: '' },
    },
  },
  defaultVariants: {
    size: 'md' as DescriptionsSize,
    border: 'divider' as DescriptionsBorderMode,
    rounded: true,
    labelAlign: 'left' as DescriptionsAlign,
    contentAlign: 'left' as DescriptionsAlign,
    labelLineHeight: 'relaxed' as DescriptionsLineHeight,
    contentLineHeight: 'relaxed' as DescriptionsLineHeight,
  },
}

export default config
