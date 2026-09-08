/**
 * 单选框组件基础常量定义（与 Web 端 reborn-radio.config.ts 同一套 API 面）
 *
 * 尺寸一律使用 rpx：本项目 postcss 未开启 px → rpx 转换，
 * tailwind 默认刻度（px-3 / gap-2 / size-4 等）都是 px，禁止用于尺寸。
 */

/** 单选尺寸：sm / md / lg（type=radio 时圆形图标直径分别为 24 / 28 / 32rpx） */
export const radioSizes = ['sm', 'md', 'lg'] as const

/** 单选类型：radio 圆点风格 / button 分段按钮风格 / pure-button 实体按钮拼接风格（复用 RebornButton） */
export const radioTypes = ['radio', 'button', 'pure-button'] as const

/** 单选框组方向：水平 / 垂直 */
export const radioDirections = ['horizontal', 'vertical'] as const

/** 语义色板，与 RebornButton 同一套取值 */
export const radioColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

/** 样式变体：filled 实底（语义色背景 + 白色前景）/ outlined 描边（语义色描边 + 语义色前景，默认） */
export const radioVariants = ['filled', 'outlined'] as const

/** 单选尺寸类型 */
export type RadioSize = (typeof radioSizes)[number]

/** 单选类型 */
export type RadioType = (typeof radioTypes)[number]

/** 单选框组方向类型 */
export type RadioDirection = (typeof radioDirections)[number]

/** 单选语义色类型 */
export type RadioColor = (typeof radioColors)[number]

/** 单选样式变体类型 */
export type RadioVariant = (typeof radioVariants)[number]

/** 单选绑定值类型 */
export type RadioValue = string | number | boolean

/** options 传参时的选项对象 */
export interface RadioOption {
  /** 选项文案 */
  label?: string
  /** 选项的 value */
  value: string | number
  /** 是否禁用该选项 */
  disabled?: boolean
}

/**
 * 单选框样式配置（tailwind-variants）
 *
 * 颜色只用灰阶与语义 token（主题变量随系统深色模式翻转），不写 dark: 前缀，
 * 否则深色模式下会被二次翻转。
 * 与 Web 端的差异：小程序端没有 hover 态，Web 端的 group-hover / hover 预示样式在此不再声明。
 */
export default {
  slots: {
    /** 单选框组容器（radio 风格默认 gap-[32rpx]，button/pure-button 由 type 变体覆盖间距） */
    group: 'reborn-radio-group inline-flex flex-wrap items-center gap-[32rpx]',
    /** 单个单选框根节点 */
    root: 'reborn-radio inline-flex items-center transition-colors',
    /** 圆形图标外圈（type=radio）；relative 为圆点的绝对居中提供定位参照 */
    icon: 'relative box-border inline-flex shrink-0 rounded-full border border-solid bg-transparent transition-all duration-200',
    /** 选中态实心圆点：绝对定位 + transform 居中，避免奇偶像素下 flex 居中出现半像素偏移 */
    dot: 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200',
    /** 标签文本 */
    label: 'leading-[1.5] transition-colors',
  },
  variants: {
    type: {
      'radio': {
        root: 'gap-[16rpx]',
        label: 'text-gray-8',
      },
      'button': {
        icon: 'hidden',
        dot: 'hidden',
        root: 'justify-center rounded-ui-2xs',
        group: 'gap-[4rpx] rounded-ui-xs bg-gray-2 p-[4rpx]',
      },
      /**
       * 实体按钮拼接风格：每项渲染一个 RebornButton。
       * 组容器负责拼接细节——全员去圆角，相邻项 -1px 折叠边框与首尾圆角随方向、尺寸在
       * compoundVariants 里给出；选中项的层级由 root 的 z-[1] 保证（见下方复合变体）。
       * 注意：uniapp 端 RebornButton 的可视节点是 .reborn-button（内部 button 仅为透明点击层），
       * 所以后代选择器指向 .reborn-button 而非 Web 端的 button 标签。
       */
      'pure-button': {
        icon: 'hidden',
        dot: 'hidden',
        group: [
          'gap-0 items-stretch',
          '[&>.reborn-radio]:relative',
          '[&>.reborn-radio_.reborn-button]:rounded-none',
        ].join(' '),
      },
    },
    direction: {
      horizontal: { group: 'flex-row' },
      vertical: { group: 'flex-col items-start' },
    },
    size: {
      sm: { icon: 'size-[24rpx]', dot: 'size-[12rpx]', label: 'text-24' },
      md: { icon: 'size-[28rpx]', dot: 'size-[14rpx]', label: 'text-26' },
      lg: { icon: 'size-[32rpx]', dot: 'size-[16rpx]', label: 'text-28' },
    },
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
    /** 样式变体：具体外观按 type × variant × color 在 compoundVariants 中展开 */
    variant: {
      filled: {},
      outlined: {},
    },
    checked: {
      true: {},
      false: {},
    },
    disabled: {
      true: { root: 'pointer-events-none opacity-50' },
      false: {},
    },
    error: {
      true: { icon: 'border-error' },
      false: {},
    },
  },
  compoundVariants: [
    // 圆点风格 · 选中 · outlined（默认）：透明底，外圈与圆点同取语义色
    { type: 'radio', variant: 'outlined', checked: true, color: 'primary', class: { icon: 'border-primary', dot: 'bg-primary' } },
    { type: 'radio', variant: 'outlined', checked: true, color: 'secondary', class: { icon: 'border-secondary', dot: 'bg-secondary' } },
    { type: 'radio', variant: 'outlined', checked: true, color: 'success', class: { icon: 'border-success', dot: 'bg-success' } },
    { type: 'radio', variant: 'outlined', checked: true, color: 'info', class: { icon: 'border-info', dot: 'bg-info' } },
    { type: 'radio', variant: 'outlined', checked: true, color: 'warning', class: { icon: 'border-warning', dot: 'bg-warning' } },
    { type: 'radio', variant: 'outlined', checked: true, color: 'error', class: { icon: 'border-error', dot: 'bg-error' } },
    { type: 'radio', variant: 'outlined', checked: true, color: 'neutral', class: { icon: 'border-neutral', dot: 'bg-neutral' } },

    // 圆点风格 · 选中 · filled：外圈实底语义色，中心圆点为白色（前景对比色，两种主题下都取白）
    { type: 'radio', variant: 'filled', checked: true, color: 'primary', class: { icon: 'border-primary bg-primary', dot: 'bg-white' } },
    { type: 'radio', variant: 'filled', checked: true, color: 'secondary', class: { icon: 'border-secondary bg-secondary', dot: 'bg-white' } },
    { type: 'radio', variant: 'filled', checked: true, color: 'success', class: { icon: 'border-success bg-success', dot: 'bg-white' } },
    { type: 'radio', variant: 'filled', checked: true, color: 'info', class: { icon: 'border-info bg-info', dot: 'bg-white' } },
    { type: 'radio', variant: 'filled', checked: true, color: 'warning', class: { icon: 'border-warning bg-warning', dot: 'bg-white' } },
    { type: 'radio', variant: 'filled', checked: true, color: 'error', class: { icon: 'border-error bg-error', dot: 'bg-white' } },
    { type: 'radio', variant: 'filled', checked: true, color: 'neutral', class: { icon: 'border-neutral bg-neutral', dot: 'bg-white' } },

    // 圆点风格 · 未选中：灰色空心圆（小程序无 hover，不做悬停预示）
    { type: 'radio', checked: false, class: { icon: 'border-gray-4', dot: 'hidden' } },

    // 分段按钮风格 · 选中：加粗为两种变体共用
    { type: 'button', checked: true, class: { label: 'font-medium' } },

    // 分段按钮风格 · 选中 · outlined（默认）：浮起并高亮语义色（gray-1 亮色为白，不可写 bg-white）
    { type: 'button', variant: 'outlined', checked: true, class: { root: 'bg-gray-1 shadow-sm' } },
    { type: 'button', variant: 'outlined', checked: true, color: 'primary', class: { root: 'text-primary' } },
    { type: 'button', variant: 'outlined', checked: true, color: 'secondary', class: { root: 'text-secondary' } },
    { type: 'button', variant: 'outlined', checked: true, color: 'success', class: { root: 'text-success' } },
    { type: 'button', variant: 'outlined', checked: true, color: 'info', class: { root: 'text-info' } },
    { type: 'button', variant: 'outlined', checked: true, color: 'warning', class: { root: 'text-warning' } },
    { type: 'button', variant: 'outlined', checked: true, color: 'error', class: { root: 'text-error' } },
    { type: 'button', variant: 'outlined', checked: true, color: 'neutral', class: { root: 'text-neutral' } },

    // 分段按钮风格 · 选中 · filled：语义色实底 + 白色字体
    { type: 'button', variant: 'filled', checked: true, color: 'primary', class: { root: 'bg-primary text-white shadow-sm' } },
    { type: 'button', variant: 'filled', checked: true, color: 'secondary', class: { root: 'bg-secondary text-white shadow-sm' } },
    { type: 'button', variant: 'filled', checked: true, color: 'success', class: { root: 'bg-success text-white shadow-sm' } },
    { type: 'button', variant: 'filled', checked: true, color: 'info', class: { root: 'bg-info text-white shadow-sm' } },
    { type: 'button', variant: 'filled', checked: true, color: 'warning', class: { root: 'bg-warning text-white shadow-sm' } },
    { type: 'button', variant: 'filled', checked: true, color: 'error', class: { root: 'bg-error text-white shadow-sm' } },
    { type: 'button', variant: 'filled', checked: true, color: 'neutral', class: { root: 'bg-neutral text-white shadow-sm' } },

    // 分段按钮风格 · 未选中：灰字
    { type: 'button', checked: false, class: { root: 'text-gray-6' } },

    // 分段按钮风格尺寸：高度取 RebornButton 同款令牌（56 / 64 / 76rpx），与 pure-button 对齐
    { type: 'button', size: 'sm', class: { root: 'h-button-sm px-[16rpx]' } },
    { type: 'button', size: 'md', class: { root: 'h-button-md px-[24rpx]' } },
    { type: 'button', size: 'lg', class: { root: 'h-button-lg px-[32rpx]' } },

    // 实体按钮拼接风格 · 选中项抬升层级，保证彩色边框盖住相邻灰边
    { type: 'pure-button', checked: true, class: { root: 'z-[1]' } },

    // 实体按钮拼接风格 · 禁用：视觉交给 RebornButton 自带的禁用灰阶精确呈现，
    // 压掉根节点的整体半透明，避免二次淡化
    { type: 'pure-button', disabled: true, class: { root: 'opacity-100' } },

    // 实体按钮拼接 · 水平：相邻项 -1px 折叠左右边框（1px 描边保留 px 单位）
    { type: 'pure-button', direction: 'horizontal', class: { group: '[&>.reborn-radio:not(:first-child)]:-ml-px' } },
    // 实体按钮拼接 · 垂直：相邻项 -1px 折叠上下边框，成员等宽拉伸对齐
    {
      type: 'pure-button',
      direction: 'vertical',
      class: { group: 'items-stretch [&>.reborn-radio:not(:first-child)]:-mt-px [&>.reborn-radio_.reborn-button]:w-full' },
    },

    // 实体按钮拼接 · 首尾圆角：随尺寸取 RebornButton 同款圆角令牌（sm→4rpx / md→6rpx / lg→8rpx），
    // 水平恢复首左尾右，垂直恢复首顶尾底
    {
      type: 'pure-button',
      direction: 'horizontal',
      size: 'sm',
      class: { group: '[&>.reborn-radio:first-child_.reborn-button]:rounded-s-ui-2xs [&>.reborn-radio:last-child_.reborn-button]:rounded-e-ui-2xs' },
    },
    {
      type: 'pure-button',
      direction: 'horizontal',
      size: 'md',
      class: { group: '[&>.reborn-radio:first-child_.reborn-button]:rounded-s-ui-xs [&>.reborn-radio:last-child_.reborn-button]:rounded-e-ui-xs' },
    },
    {
      type: 'pure-button',
      direction: 'horizontal',
      size: 'lg',
      class: { group: '[&>.reborn-radio:first-child_.reborn-button]:rounded-s-ui-sm [&>.reborn-radio:last-child_.reborn-button]:rounded-e-ui-sm' },
    },
    {
      type: 'pure-button',
      direction: 'vertical',
      size: 'sm',
      class: { group: '[&>.reborn-radio:first-child_.reborn-button]:rounded-t-ui-2xs [&>.reborn-radio:last-child_.reborn-button]:rounded-b-ui-2xs' },
    },
    {
      type: 'pure-button',
      direction: 'vertical',
      size: 'md',
      class: { group: '[&>.reborn-radio:first-child_.reborn-button]:rounded-t-ui-xs [&>.reborn-radio:last-child_.reborn-button]:rounded-b-ui-xs' },
    },
    {
      type: 'pure-button',
      direction: 'vertical',
      size: 'lg',
      class: { group: '[&>.reborn-radio:first-child_.reborn-button]:rounded-t-ui-sm [&>.reborn-radio:last-child_.reborn-button]:rounded-b-ui-sm' },
    },
  ] as const,
  defaultVariants: {
    type: 'radio' as RadioType,
    direction: 'horizontal' as RadioDirection,
    size: 'md' as RadioSize,
    color: 'primary' as RadioColor,
    variant: 'outlined' as RadioVariant,
    checked: false,
    disabled: false,
    error: false,
  },
} as const
