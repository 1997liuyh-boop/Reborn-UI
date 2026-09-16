import { tv } from '@/lib/tv'

/**
 * 结果状态，与 Web 端一致。前四种是语义反馈，后三种是 HTTP 错误页的常见状态码。
 * 组件的 icon 属性还额外接受 null，表示不渲染图标区。
 */
export const resultIcons = ['info', 'success', 'warning', 'error', '403', '404', '500'] as const
export type ResultIcon = (typeof resultIcons)[number]

/** 图标配色，取自全局语义色 */
export const resultColors = ['info', 'success', 'warning', 'error'] as const
export type ResultColor = (typeof resultColors)[number]

/**
 * 状态 → 配色，与 Web 端一致。
 * 403 是权限拦截，归警示；404 是资源不存在，不算故障，归信息；500 是服务端故障，归错误。
 */
export const RESULT_ICON_COLOR: Record<ResultIcon, ResultColor> = {
  'info': 'info',
  'success': 'success',
  'warning': 'warning',
  'error': 'error',
  '403': 'warning',
  '404': 'info',
  '500': 'error',
}

/** 状态 → 默认图标类名。字形与 Web 端同名，只是换成 @egoist/tailwindcss-icons 的写法 */
export const RESULT_ICON_NAME: Record<ResultIcon, string> = {
  'info': 'i-lucide-info',
  'success': 'i-lucide-circle-check',
  'warning': 'i-lucide-circle-alert',
  'error': 'i-lucide-circle-x',
  '403': 'i-lucide-lock',
  '404': 'i-lucide-file-question',
  '500': 'i-lucide-server-crash',
}

export const resultTheme = tv({
  slots: {
    // 图标 /（标题 + 描述）/ 额外区三段，段间 48rpx（24px），整体居中
    root: 'reborn-result flex w-full flex-col items-center gap-[48rpx] text-center',
    // 144rpx 圆形底板，承载 64rpx 字形
    icon: 'flex size-[144rpx] shrink-0 items-center justify-center rounded-full',
    iconGlyph: 'size-[64rpx] shrink-0',
    // 标题与描述同属一段，段内 16rpx（8px）
    content: 'flex min-w-0 max-w-full flex-col items-center gap-[16rpx]',
    title: 'text-48 font-medium leading-[1.5] text-gray-8 dark:text-gray-1',
    subTitle: 'text-28 font-normal leading-[1.5] text-gray-7 dark:text-gray-4',
    // 额外区通常放按钮，横向排列、可换行
    extra: 'flex flex-wrap items-center justify-center gap-[24rpx]',
  },
  variants: {
    color: {
      info: { icon: 'bg-info/10 text-info' },
      success: { icon: 'bg-success/10 text-success' },
      warning: { icon: 'bg-warning/10 text-warning' },
      error: { icon: 'bg-error/10 text-error' },
    },
    /**
     * icon 传 null、图标区完全由 icon 插槽接管时开启：
     * 底板退化成无尺寸无底色的透明容器，让自定义内容自己决定大小。
     */
    bare: {
      true: { icon: 'size-auto rounded-none bg-transparent' },
    },
  },
  // 不设 defaultVariants：color 由组件按 icon 推导，icon 为 null 时不传，底板就不着色
})

/** 结果页 UI 样式覆盖接口 */
export interface ResultUI {
  root?: string
  icon?: string
  iconGlyph?: string
  content?: string
  title?: string
  subTitle?: string
  extra?: string
}

export default resultTheme
