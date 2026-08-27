/**
 * 分页组件基础常量定义
 */

/** 分页尺寸：sm / md / lg */
export const paginationSizes = ['sm', 'md', 'lg'] as const

/** 分页尺寸类型 */
export type PaginationSize = (typeof paginationSizes)[number]

/** 分页主题色：与按钮/徽章等组件共用同一套语义色（与 web 端对齐） */
export const paginationColors = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
] as const

/** 分页主题色类型 */
export type PaginationColor = (typeof paginationColors)[number]

/**
 * 分页组件 UI Slots 接口定义
 * 用于支持通过 ui 属性进行深度样式定制
 */
export interface PaginationUI {
  /** 根容器 */
  root?: string
  /** 页码列表容器 */
  pager?: string
  /** 上一页按钮 */
  prev?: string
  /** 下一页按钮 */
  next?: string
  /** 页码项（非激活态） */
  pagerItem?: string
  /** 激活页码项 */
  pagerItemActive?: string
  /** 省略号 */
  ellipsis?: string
  /** 跳转输入区 */
  jumper?: string
  /** 总数文本 */
  total?: string
  /** 每页条数选择器 */
  sizes?: string
  /** 简洁模式内容 */
  simple?: string
  /** 跳转/简洁模式输入框 */
  input?: string
}

/**
 * 分页组件样式配置（tailwind-variants）
 */
export default {
  slots: {
    root: 'reborn-pagination inline-flex items-center gap-[16rpx]',
    button: 'reborn-pagination-button px-[8rpx] inline-flex items-center justify-center rounded-md',
    pager: 'reborn-pagination-pager inline-flex items-center gap-[8rpx]',
    pagerItem: 'reborn-pagination-pager-item',
    ellipsis: 'reborn-pagination-ellipsis inline-flex items-center justify-center text-gray-5',
    prev: 'reborn-pagination-prev',
    next: 'reborn-pagination-next',
    jumper: 'reborn-pagination-jumper inline-flex items-center gap-[8rpx] text-gray-5',
    total: 'reborn-pagination-total text-gray-5',
    sizes: 'reborn-pagination-sizes',
    simple: 'reborn-pagination-simple inline-flex items-center gap-[8rpx] text-gray-5',
    /** 跳转/简洁模式输入框（作为 custom-class 传给 RebornInput），宽度由 size 变体决定 */
    input: 'shrink-0',
  },
  variants: {
    size: {
      sm: {
        button: 'h-[48rpx] text-[24rpx] min-w-[48rpx]',
        ellipsis: 'h-[48rpx] min-w-[48rpx] text-[24rpx]',
        input: 'w-[96rpx]',
      },
      md: {
        button: 'h-[56rpx] text-[24rpx] min-w-[56rpx]',
        ellipsis: 'h-[56rpx] min-w-[56rpx] text-[24rpx]',
        input: 'w-[112rpx]',
      },
      lg: {
        button: 'h-[64rpx] text-[28rpx] min-w-[64rpx]',
        ellipsis: 'h-[64rpx] min-w-[64rpx] text-[28rpx]',
        input: 'w-[128rpx]',
      },
    },
    /** 主题色：具体样式由 compoundVariants 按激活/背景态派生 */
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
    active: {
      true: { button: 'font-medium' },
      false: { button: 'text-gray-5' },
    },
    background: {
      true: {},
      false: {},
    },
    disabled: {
      true: {
        button: 'opacity-50 pointer-events-none',
        ellipsis: 'opacity-50 pointer-events-none',
      },
      false: {},
    },
    simple: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    // 激活页码：当前主题色文字（与 web 端对齐）
    { color: 'primary', active: true, class: { button: 'text-primary' } },
    { color: 'secondary', active: true, class: { button: 'text-secondary' } },
    { color: 'success', active: true, class: { button: 'text-success' } },
    { color: 'info', active: true, class: { button: 'text-info' } },
    { color: 'warning', active: true, class: { button: 'text-warning' } },
    { color: 'error', active: true, class: { button: 'text-error' } },
    { color: 'neutral', active: true, class: { button: 'text-neutral' } },
    // 有背景 + 未激活：灰色底
    { background: true, active: false, class: { button: 'bg-gray-2 text-gray-5' } },
    // 有背景 + 激活：主题色浅底（/20 与 web 端一致）
    { color: 'primary', background: true, active: true, class: { button: 'bg-primary/20 text-primary' } },
    { color: 'secondary', background: true, active: true, class: { button: 'bg-secondary/20 text-secondary' } },
    { color: 'success', background: true, active: true, class: { button: 'bg-success/20 text-success' } },
    { color: 'info', background: true, active: true, class: { button: 'bg-info/20 text-info' } },
    { color: 'warning', background: true, active: true, class: { button: 'bg-warning/20 text-warning' } },
    { color: 'error', background: true, active: true, class: { button: 'bg-error/20 text-error' } },
    { color: 'neutral', background: true, active: true, class: { button: 'bg-neutral/20 text-neutral' } },
    // 有背景时省略号带灰色底
    { background: true, class: { ellipsis: 'bg-gray-2' } },
  ] as const,
  defaultVariants: {
    size: 'md',
    color: 'primary',
    active: false,
    background: false,
    disabled: false,
    simple: false,
  },
} as const