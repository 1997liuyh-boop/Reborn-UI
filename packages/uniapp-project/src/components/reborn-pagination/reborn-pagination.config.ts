/**
 * 分页组件基础常量定义
 */

/** 分页尺寸：sm / md / lg */
export const paginationSizes = ['sm', 'md', 'lg'] as const

/** 分页尺寸类型 */
export type PaginationSize = (typeof paginationSizes)[number]

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
  /** 跳转输入框 */
  input?: string
}

/**
 * 分页组件样式配置（tailwind-variants）
 */
export default {
  slots: {
    root: 'reborn-pagination inline-flex items-center gap-[16rpx]',
    button: 'reborn-pagination-button px-[8rpx] inline-flex items-center justify-center rounded-md',
    pager: 'reborn-pagination-pager inline-flex items-center gap-[16rpx]',
    pagerItem: 'reborn-pagination-pager-item',
    ellipsis: 'reborn-pagination-ellipsis inline-flex items-center justify-center text-gray-5',
    prev: 'reborn-pagination-prev',
    next: 'reborn-pagination-next',
    jumper: 'reborn-pagination-jumper inline-flex items-center gap-[16rpx] text-gray-5',
    total: 'reborn-pagination-total text-gray-5',
    sizes: 'reborn-pagination-sizes',
    simple: 'reborn-pagination-simple inline-flex items-center gap-[16rpx] text-gray-5',
    input: 'shrink-0',
  },
  variants: {
    size: {
      sm: {
        button: 'h-[48rpx] text-[24rpx] min-w-[48rpx]',
        ellipsis: 'h-[48rpx] text-[24rpx] min-w-[48rpx]',
        jumper: 'text-[24rpx]',
        total: 'text-[24rpx]',
        simple: 'text-[24rpx]',
      },
      md: {
        button: 'h-[56rpx] text-[24rpx] min-w-[56rpx]',
        ellipsis: 'h-[56rpx] text-[24rpx] min-w-[56rpx]',
        jumper: 'text-[24rpx]',
        total: 'text-[24rpx]',
        simple: 'text-[24rpx]',
      },
      lg: {
        button: 'h-[64rpx] text-[28rpx] min-w-[64rpx]',
        ellipsis: 'h-[64rpx] text-[28rpx] min-w-[64rpx]',
        jumper: 'text-[28rpx]',
        total: 'text-[28rpx]',
        simple: 'text-[28rpx]',
      },
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
    // 无背景 + 激活：主色文字，无底
    { background: false, active: true, class: { button: 'text-primary' } },
    // 有背景 + 未激活：灰色底
    { background: true, active: false, class: { button: 'bg-gray-2 text-gray-5' } },
    // 有背景 + 激活：主色浅底
    { background: true, active: true, class: { button: 'bg-primary/50 text-primary' } },
    // 有背景时省略号带灰色底
    { background: true, class: { ellipsis: 'bg-gray-2' } },
  ] as const,
  defaultVariants: {
    size: 'md',
    active: false,
    background: false,
    disabled: false,
    simple: false,
  },
} as const
