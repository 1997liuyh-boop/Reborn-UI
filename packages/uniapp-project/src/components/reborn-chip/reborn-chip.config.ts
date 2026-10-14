const size = ['sm', 'md', 'lg'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const position = ['top-right', 'bottom-right', 'top-left', 'bottom-left'] as const
const variant = ['solid', 'outline', 'textDot', 'textOutline'] as const

export { color as chipColors, position as chipPositions, size as chipSizes, variant as chipVariants }

/*
 * 配色直接用语义色：本端 bg-primary 等语义类本身就是 6 阶（primary→red-6、neutral→gray-6），与 Web 端取 6 阶一致。
 *
 * 四种变体的尺寸（sm / md / lg，rpx = Web 端 px × 2）：
 *   solid       实心圆点  8 / 10 / 12rpx
 *   outline     空心圆环  内径 8 / 12 / 16rpx + 描边 4 / 6 / 8rpx，外径 16 / 24 / 32rpx
 *   textDot     实心文字  高 32 / 40 / 48rpx，字号 24 / 32 / 40rpx，白字
 *   textOutline 描边文字  同 textDot，2rpx 描边，文字取语义色
 *
 * outline 用 box-content：规格里的 size 指内径，描边长在外圈。若按 border-box 计算，
 * 描边宽恰好等于半径，圆心被填满，空心圆环就退化成实心点。
 * 两种描边变体都垫 bg-gray-1（纸面色），避免宿主内容透过圆环空洞或衬在文字底下。
 *
 * 描边宽度必须写成 border-[length:Nrpx]：tailwind-merge 不认识 rpx 单位，
 * 会把 border-[Nrpx] 当成边框颜色，与 border-primary 合并时只保留其一，描边宽度就丢了。
 */
export default {
  slots: {
    root: 'relative inline-flex items-center justify-center shrink-0 h-fit leading-none',
    base: 'absolute rounded-full flex items-center justify-center whitespace-nowrap',
    label: 'font-medium',
  },
  variants: {
    variant: {
      solid: {},
      outline: { base: 'box-content border-solid bg-gray-1' },
      textDot: { label: 'text-white' },
      textOutline: { base: 'border-[length:2rpx] border-solid bg-gray-1' },
    },
    /** 只声明维度，配色随变体不同（底色 / 描边 + 文字），交给复合变体 */
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
    /** 只声明维度，各变体的尺寸不同，交给复合变体 */
    size: {
      sm: {},
      md: {},
      lg: {},
    },
    position: {
      'top-right': { base: 'top-0 right-0' },
      'bottom-right': { base: 'bottom-0 right-0' },
      'top-left': { base: 'top-0 left-0' },
      'bottom-left': { base: 'bottom-0 left-0' },
    },
    inset: {
      true: { base: '' },
      false: { base: '' },
    },
    standalone: {
      true: { base: 'absolute' },
      false: { base: '' },
    },
  },
  compoundVariants: [
    // 实心类变体：底色取语义色
    { variant: ['solid', 'textDot'], color: 'primary' as const, class: { base: 'bg-primary' } },
    { variant: ['solid', 'textDot'], color: 'secondary' as const, class: { base: 'bg-secondary' } },
    { variant: ['solid', 'textDot'], color: 'success' as const, class: { base: 'bg-success' } },
    { variant: ['solid', 'textDot'], color: 'info' as const, class: { base: 'bg-info' } },
    { variant: ['solid', 'textDot'], color: 'warning' as const, class: { base: 'bg-warning' } },
    { variant: ['solid', 'textDot'], color: 'error' as const, class: { base: 'bg-error' } },
    { variant: ['solid', 'textDot'], color: 'neutral' as const, class: { base: 'bg-neutral' } },

    // 描边类变体：描边与文字取语义色
    { variant: ['outline', 'textOutline'], color: 'primary' as const, class: { base: 'border-primary', label: 'text-primary' } },
    { variant: ['outline', 'textOutline'], color: 'secondary' as const, class: { base: 'border-secondary', label: 'text-secondary' } },
    { variant: ['outline', 'textOutline'], color: 'success' as const, class: { base: 'border-success', label: 'text-success' } },
    { variant: ['outline', 'textOutline'], color: 'info' as const, class: { base: 'border-info', label: 'text-info' } },
    { variant: ['outline', 'textOutline'], color: 'warning' as const, class: { base: 'border-warning', label: 'text-warning' } },
    { variant: ['outline', 'textOutline'], color: 'error' as const, class: { base: 'border-error', label: 'text-error' } },
    { variant: ['outline', 'textOutline'], color: 'neutral' as const, class: { base: 'border-neutral', label: 'text-neutral' } },

    // solid：纯圆点
    { variant: 'solid' as const, size: 'sm' as const, class: { base: 'size-[8rpx]' } },
    { variant: 'solid' as const, size: 'md' as const, class: { base: 'size-[10rpx]' } },
    { variant: 'solid' as const, size: 'lg' as const, class: { base: 'size-[12rpx]' } },

    // outline：size 为内径（box-content），描边宽为内径的一半
    { variant: 'outline' as const, size: 'sm' as const, class: { base: 'size-[8rpx] border-[length:4rpx]' } },
    { variant: 'outline' as const, size: 'md' as const, class: { base: 'size-[12rpx] border-[length:6rpx]' } },
    { variant: 'outline' as const, size: 'lg' as const, class: { base: 'size-[16rpx] border-[length:8rpx]' } },

    // 文字类：min-w 与高度相同，单个字符时是正圆，多字符时横向撑成胶囊，px 防止文字贴到圆弧上
    { variant: ['textDot', 'textOutline'], size: 'sm' as const, class: { base: 'h-[32rpx] min-w-[32rpx] px-[8rpx]', label: 'text-24 leading-none' } },
    { variant: ['textDot', 'textOutline'], size: 'md' as const, class: { base: 'h-[40rpx] min-w-[40rpx] px-[8rpx]', label: 'text-32 leading-none' } },
    { variant: ['textDot', 'textOutline'], size: 'lg' as const, class: { base: 'h-[48rpx] min-w-[48rpx] px-[8rpx]', label: 'text-40 leading-none' } },

    {
      inset: false,
      position: 'top-right' as const,
      class: { base: '-translate-y-1/2 translate-x-1/2 transform' },
    },
    {
      inset: false,
      position: 'bottom-right' as const,
      class: { base: 'translate-y-1/2 translate-x-1/2 transform' },
    },
    {
      inset: false,
      position: 'top-left' as const,
      class: { base: '-translate-y-1/2 -translate-x-1/2 transform' },
    },
    {
      inset: false,
      position: 'bottom-left' as const,
      class: { base: 'translate-y-1/2 -translate-x-1/2 transform' },
    },
  ],
  defaultVariants: {
    variant: 'solid' as const,
    size: 'md' as const,
    color: 'primary' as const,
    position: 'top-right' as const,
    inset: false,
    standalone: false,
  },
}
