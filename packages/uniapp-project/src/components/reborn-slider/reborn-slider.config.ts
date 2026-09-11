const size = ['sm', 'md', 'lg'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export { color as sliderColors, size as sliderSizes }

export default {
  slots: {
    wrapper: 'flex flex-row items-center w-full overflow-visible',
    /** 内层交互带：厚度取激活滑块外径（rpx，随 size 变体给出），色晕溢出不占位 */
    inner: 'flex-1 relative flex flex-row items-center overflow-visible',
    /** 触摸层：盖住整个交互带并向外扩 12rpx，保证手指按在滑块边缘也能命中 */
    picker: 'absolute inset-x-0 -inset-y-[12rpx] z-[3]',
    // 轨道条粗细固定 8rpx（4px 设计稿），不随 size 变化（垂直模式由 vertical 变体换轴）
    track: 'relative w-full h-[8rpx] rounded-full overflow-visible bg-gray-4',
    progress: 'absolute top-0 h-full rounded-full pointer-events-none',
    /**
     * 滑块：外圆取语义色（即色阶 6），中心圆 bg-gray-1，按压拖拽时叠 20% 透明度色晕环；
     * 定位交给 left/top 百分比 + translate 居中，尺寸由 size × active 组合变体给出。
     */
    thumb:
            'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center pointer-events-none z-[1] shadow-[0_0_1px_1px_rgba(100,100,100,0.1)]',
    /** 滑块中心圆 */
    thumbDot: 'rounded-full bg-gray-1',
    /**
     * 数值气泡：默认拖拽时显示在滑块上方（垂直模式显示在右侧），gray-9/gray-1 随主题自动反色；
     * 箭头用 after 伪元素的透明边框三角实现，指向方位由 vertical 变体给出。
     */
    tooltip:
            'absolute z-[4] rounded-ui-2xs bg-gray-9 px-[16rpx] py-[8rpx] text-24 text-gray-1 whitespace-nowrap pointer-events-none shadow-md after:absolute after:border-[8rpx] after:border-transparent after:content-[\'\']',
    /** 轨道节点统一样式（间断点与刻度点共用）：gray-1 底 + 色板第 3 阶边框 */
    stopDot:
            'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-[16rpx] rounded-full bg-gray-1 border-[3rpx] border-solid pointer-events-none',
    /** 轨道上的刻度点（marks），压在进度条之上、滑块之下 */
    markDot:
            'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-[16rpx] rounded-full bg-gray-1 border-[3rpx] border-solid pointer-events-none',
    /** 刻度文字（marks 的 label），点击跳转到对应刻度；单个标记的 style 以内联样式叠加 */
    markLabel: 'absolute top-full mt-[12rpx] -translate-x-1/2 text-24 text-gray-6 whitespace-nowrap',
    /** 滑轨两侧的业务含义图标容器（#prefix / #suffix 插槽或 prefix-icon / suffix-icon 图标类名） */
    prefix: 'shrink-0 inline-flex items-center text-gray-6 mr-[16rpx]',
    suffix: 'shrink-0 inline-flex items-center text-gray-6 ml-[16rpx]',
    value: 'text-center w-[100rpx] text-gray-8 dark:text-gray-1',
  },
  variants: {
    /** 尺寸只影响交互带厚度、滑块（组合变体给出）与文字，轨道粗细固定 */
    size: {
      sm: {
        inner: 'h-[24rpx]',
        value: 'text-[length:var(--text-size-24)]',
        prefix: 'text-[length:var(--text-size-24)]',
        suffix: 'text-[length:var(--text-size-24)]',
      },
      md: {
        inner: 'h-[28rpx]',
        value: 'text-[length:var(--text-size-28)]',
        prefix: 'text-[length:var(--text-size-28)]',
        suffix: 'text-[length:var(--text-size-28)]',
      },
      lg: {
        inner: 'h-[32rpx]',
        value: 'text-[length:var(--text-size-32)]',
        prefix: 'text-[length:var(--text-size-32)]',
        suffix: 'text-[length:var(--text-size-32)]',
      },
    },
    // 外圆与色晕跟随语义色（语义色即各色板的第 6 阶），色晕取 20% 透明度；
    // 轨道节点边框取同色板第 3 阶（语义色未导出 3 阶别名，直接落到具体色板）
    color: {
      primary: { progress: 'bg-primary', thumb: 'bg-primary ring-primary/20', stopDot: 'border-brand-3', markDot: 'border-brand-3' },
      secondary: { progress: 'bg-secondary', thumb: 'bg-secondary ring-secondary/20', stopDot: 'border-secondary-3', markDot: 'border-secondary-3' },
      success: { progress: 'bg-success', thumb: 'bg-success ring-success/20', stopDot: 'border-green-3', markDot: 'border-green-3' },
      info: { progress: 'bg-info', thumb: 'bg-info ring-info/20', stopDot: 'border-blue-3', markDot: 'border-blue-3' },
      warning: { progress: 'bg-warning', thumb: 'bg-warning ring-warning/20', stopDot: 'border-orange-3', markDot: 'border-orange-3' },
      error: { progress: 'bg-error', thumb: 'bg-error ring-error/20', stopDot: 'border-red-3', markDot: 'border-red-3' },
      neutral: { progress: 'bg-neutral', thumb: 'bg-neutral ring-neutral/20', stopDot: 'border-gray-3', markDot: 'border-gray-3' },
    },
    /** 激活态：尺寸更大并压在未激活滑块之上；单滑块恒为激活态，多滑块跟随最近一次触摸 */
    active: {
      true: { thumb: 'z-[2]' },
      false: {},
    },
    /** 按压拖拽中：显示 6rpx 的 20% 透明度色晕（ring 色由 color 变体给出，不占布局空间） */
    pressed: {
      true: { thumb: 'ring-[6rpx]' },
      false: {},
    },
    /** 单柄禁用（disabled 传数组时）：外圆置灰，永远不会成为激活态 */
    handleDisabled: {
      true: { thumb: 'bg-gray-5' },
      false: {},
    },
    /** 可编辑模式下正被拖离滑轨的节点：隐去作为「松手即删除」的预览 */
    removing: {
      true: { thumb: 'opacity-0' },
      false: {},
    },
    /**
     * 垂直模式：布局换轴。轨道 8rpx 粗细换到宽度轴、长度撑满内联高度；
     * 滑块定位从「top-1/2 + left%」换成「left-1/2 + top%」，进度条从宽度改为高度（内联样式给出）。
     */
    vertical: {
      true: {
        wrapper: 'flex-col w-auto',
        inner: 'flex-none flex-col justify-center w-auto',
        picker: 'inset-y-0 -inset-x-[12rpx]',
        track: 'w-[8rpx] h-full',
        thumb: 'top-auto left-1/2',
        progress: 'left-0 w-full',
        stopDot: 'top-auto left-1/2',
        markDot: 'top-auto left-1/2',
        markLabel: 'top-auto mt-0 translate-x-0 left-full ml-[24rpx] -translate-y-1/2',
        prefix: 'mr-0 mb-[16rpx]',
        suffix: 'ml-0 mt-[16rpx]',
        // 气泡在滑块右侧，箭头贴气泡左缘、指向左
        tooltip: 'left-full top-1/2 -translate-y-1/2 ml-[20rpx] after:right-full after:top-1/2 after:-translate-y-1/2 after:border-r-gray-9',
      },
      false: {
        // 气泡在滑块上方，箭头贴气泡下缘、指向下
        tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-[16rpx] after:top-full after:left-1/2 after:-translate-x-1/2 after:border-t-gray-9',
      },
    },
    /** 是否有刻度标记：为刻度文字留出空间，见 compoundVariants */
    hasMarks: {
      true: {},
      false: {},
    },
    disabled: {
      true: {
        wrapper: 'opacity-50',
      },
    },
  },
  compoundVariants: [
    // 垂直模式交互带厚度换到宽度轴
    { vertical: true, size: 'sm', class: { inner: 'h-auto w-[24rpx]' } },
    { vertical: true, size: 'md', class: { inner: 'h-auto w-[28rpx]' } },
    { vertical: true, size: 'lg', class: { inner: 'h-auto w-[32rpx]' } },
    // 激活滑块：lg 32rpx（中心圆 20rpx）/ md 28rpx（16rpx）/ sm 24rpx（16rpx）
    { size: 'lg', active: true, class: { thumb: 'size-[32rpx]', thumbDot: 'size-[20rpx]' } },
    { size: 'md', active: true, class: { thumb: 'size-[28rpx]', thumbDot: 'size-[16rpx]' } },
    { size: 'sm', active: true, class: { thumb: 'size-[24rpx]', thumbDot: 'size-[16rpx]' } },
    // 未激活滑块：无色晕且小一号，sm 档不再缩小
    { size: 'lg', active: false, class: { thumb: 'size-[28rpx]', thumbDot: 'size-[16rpx]' } },
    { size: 'md', active: false, class: { thumb: 'size-[24rpx]', thumbDot: 'size-[16rpx]' } },
    { size: 'sm', active: false, class: { thumb: 'size-[24rpx]', thumbDot: 'size-[16rpx]' } },
    // 刻度文字在滑轨下方（垂直模式在右侧），wrapper 留出对应空间
    { hasMarks: true, vertical: false, class: { wrapper: 'pb-[52rpx]' } },
    { hasMarks: true, vertical: true, class: { wrapper: 'pr-[72rpx]' } },
  ] as any,
  defaultVariants: {
    size: 'md' as (typeof size)[number],
    color: 'primary' as (typeof color)[number],
    active: true,
    pressed: false,
    handleDisabled: false,
    removing: false,
    vertical: false,
    hasMarks: false,
  },
}
