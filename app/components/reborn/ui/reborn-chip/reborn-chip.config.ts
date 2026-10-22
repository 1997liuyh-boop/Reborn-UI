const size = ['sm', 'md', 'lg'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const position = ['top-right', 'bottom-right', 'top-left', 'bottom-left'] as const
const variant = ['solid', 'outline', 'textDot', 'textOutline'] as const

export { color as chipColors, position as chipPositions, size as chipSizes, variant as chipVariants }

/*
 * 配色按「语义色 → 色相族」取 6 阶，与 reborn-badge 的映射一致：
 * primary→brand、secondary→secondary、success→green、info→blue、warning→orange、error→red、neutral→gray。
 * 不直接用 bg-neutral：Web 端 --color-neutral 指向 gray-4，不是 6 阶。
 *
 * 四种变体的尺寸（sm / md / lg）：
 *   solid       实心圆点  4 / 5 / 6px
 *   outline     空心圆环  内径 4 / 6 / 8px + 描边 2 / 3 / 4px，外径 8 / 12 / 16px
 *   textDot     实心文字  高 16 / 20 / 24px，字号 12 / 16 / 20px，白字
 *   textOutline 描边文字  同 textDot，1px 描边，文字取 6 阶
 *
 * outline 用 box-content：规格里的 size 指内径，描边长在外圈。若按 border-box 计算，
 * 描边宽恰好等于半径，圆心被填满，空心圆环就退化成实心点。
 * 两种描边变体都垫 bg-gray-1（纸面色，暗色模式随之反转），避免宿主内容透过圆环空洞或衬在文字底下。
 */
export default {
  slots: {
    root: 'relative inline-flex items-center justify-center shrink-0 h-fit leading-none',
    base: 'absolute rounded-full flex items-center justify-center whitespace-nowrap',
    label: 'font-medium'
  },
  variants: {
    variant: {
      solid: {},
      outline: { base: 'box-content border-solid bg-gray-1' },
      textDot: { label: 'text-white' },
      textOutline: { base: 'border border-solid bg-gray-1' }
    },
    /** 只声明维度，配色随变体不同（底色 / 描边 + 文字），交给复合变体 */
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {}
    },
    /** 只声明维度，各变体的像素不同，交给复合变体 */
    size: {
      sm: {},
      md: {},
      lg: {}
    },
    position: {
      'top-right': { base: 'top-0 right-0' },
      'bottom-right': { base: 'bottom-0 right-0' },
      'top-left': { base: 'top-0 left-0' },
      'bottom-left': { base: 'bottom-0 left-0' }
    },
    inset: {
      true: { base: '' },
      false: { base: '' }
    },
    standalone: {
      true: { base: 'absolute' },
      false: { base: '' }
    }
  },
  compoundVariants: [
    // 实心类变体：底色取 6 阶
    { variant: ['solid', 'textDot'], color: 'primary' as const, class: { base: 'bg-brand-6' } },
    { variant: ['solid', 'textDot'], color: 'secondary' as const, class: { base: 'bg-secondary-6' } },
    { variant: ['solid', 'textDot'], color: 'success' as const, class: { base: 'bg-green-6' } },
    { variant: ['solid', 'textDot'], color: 'info' as const, class: { base: 'bg-blue-6' } },
    { variant: ['solid', 'textDot'], color: 'warning' as const, class: { base: 'bg-orange-6' } },
    { variant: ['solid', 'textDot'], color: 'error' as const, class: { base: 'bg-red-6' } },
    { variant: ['solid', 'textDot'], color: 'neutral' as const, class: { base: 'bg-gray-6' } },

    // 描边类变体：描边与文字取 6 阶
    { variant: ['outline', 'textOutline'], color: 'primary' as const, class: { base: 'border-brand-6', label: 'text-brand-6' } },
    { variant: ['outline', 'textOutline'], color: 'secondary' as const, class: { base: 'border-secondary-6', label: 'text-secondary-6' } },
    { variant: ['outline', 'textOutline'], color: 'success' as const, class: { base: 'border-green-6', label: 'text-green-6' } },
    { variant: ['outline', 'textOutline'], color: 'info' as const, class: { base: 'border-blue-6', label: 'text-blue-6' } },
    { variant: ['outline', 'textOutline'], color: 'warning' as const, class: { base: 'border-orange-6', label: 'text-orange-6' } },
    { variant: ['outline', 'textOutline'], color: 'error' as const, class: { base: 'border-red-6', label: 'text-red-6' } },
    { variant: ['outline', 'textOutline'], color: 'neutral' as const, class: { base: 'border-gray-6', label: 'text-gray-6' } },

    // solid：纯圆点
    { variant: 'solid' as const, size: 'sm' as const, class: { base: 'size-1' } },
    { variant: 'solid' as const, size: 'md' as const, class: { base: 'size-chip-solid-md' } },
    { variant: 'solid' as const, size: 'lg' as const, class: { base: 'size-1.5' } },

    // outline：size 为内径（box-content），描边宽为内径的一半
    { variant: 'outline' as const, size: 'sm' as const, class: { base: 'size-1 border-2' } },
    { variant: 'outline' as const, size: 'md' as const, class: { base: 'size-1.5 border-3' } },
    { variant: 'outline' as const, size: 'lg' as const, class: { base: 'size-2 border-4' } },

    /*
     * 文字类：min-w 与高度相同，单个字符时是正圆，多字符时横向撑成胶囊，px-1 防止文字贴到圆弧上。
     * 字号用 12 / 16 / 20px 令牌（text-sm / text-lg / text-xl），它们各自带 20 / 24 / 28px 行高，
     * 比圆点还高，所以 leading-none 必须写在字号之后：tailwind-merge 会让后出现的字号类删掉前面的行高类。
     */
    { variant: ['textDot', 'textOutline'], size: 'sm' as const, class: { base: 'h-4 min-w-4 px-1', label: 'text-sm leading-none' } },
    { variant: ['textDot', 'textOutline'], size: 'md' as const, class: { base: 'h-5 min-w-5 px-1', label: 'text-lg leading-none' } },
    { variant: ['textDot', 'textOutline'], size: 'lg' as const, class: { base: 'h-6 min-w-6 px-1', label: 'text-xl leading-none' } },

    {
      inset: false,
      position: 'top-right' as const,
      class: { base: '-translate-y-1/2 translate-x-1/2 transform' }
    },
    {
      inset: false,
      position: 'bottom-right' as const,
      class: { base: 'translate-y-1/2 translate-x-1/2 transform' }
    },
    {
      inset: false,
      position: 'top-left' as const,
      class: { base: '-translate-y-1/2 -translate-x-1/2 transform' }
    },
    {
      inset: false,
      position: 'bottom-left' as const,
      class: { base: 'translate-y-1/2 -translate-x-1/2 transform' }
    }
  ],
  defaultVariants: {
    variant: 'solid' as const,
    size: 'md' as const,
    color: 'primary' as const,
    position: 'top-right' as const,
    inset: false,
    standalone: false
  }
}
