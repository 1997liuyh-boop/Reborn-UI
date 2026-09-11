<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { CSSProperties } from 'vue'
import type { sliderColors, sliderSizes } from './reborn-slider.config'
import { computed, getCurrentInstance, ref, watch } from 'vue'

import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-slider.config'

defineOptions({
  name: 'RebornSlider',
})

const props = withDefaults(defineProps<SliderProps>(), {
  modelValue: 0,
  values: () => [0, 0],
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  editable: false,
  showStops: false,
  draggableTrack: false,
  reverse: false,
  vertical: false,
  trackHeight: 4,
  showValue: false,
  range: false,
  size: 'md',
  color: 'primary',
  ui: () => ({}),
})

const emit = defineEmits(['update:modelValue', 'update:values', 'change', 'changing', 'changeComplete'])

/**
 * 刻度标记：key 必须是 [min, max] 闭区间内的数字（越界或非法的 key 会被忽略），
 * 值为标记文案，对象形式可为单个标记设置 style 与 label。
 */
export type SliderMarks = Record<number, string | { style?: CSSProperties, label?: string | number }>

/** 气泡提示配置 */
export interface SliderTooltip {
  /** 强制常显（true）或强制隐藏（false）；缺省仅拖拽时显示 */
  open?: boolean
  /** 格式化气泡内容；显式传 null 等同隐藏气泡 */
  formatter?: ((value: number) => string | number) | null
}

export interface SliderProps {
  /** v-model 绑定的值，单值模式使用 */
  modelValue?: number
  /** v-model:values 绑定的值，范围模式使用，editable 时长度可变 */
  values?: number[]
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
  /** 步长；传 "mark" 时取值只能落在 marks 定义的刻度上（此时必须设置 marks） */
  step?: number | 'mark'
  /** 刻度标记，key 为 [min, max] 内的数字；对象形式可为单个标记设置样式 */
  marks?: SliderMarks
  /** 是否按步长在轨道上显示间断点（仅数字步长时生效，间断点过多时自动不渲染） */
  showStops?: boolean
  /**
   * 是否禁用。传数组时按下标单独禁用 range 模式下的特定滑块：
   * 被禁用的滑块不可拖动，并作为移动边界，其他滑块无法越过它。
   * 注意数组下标对应「排序后」的节点位置，editable 增删节点会使下标后移。
   */
  disabled?: boolean | boolean[]
  /**
   * 可编辑节点（仅 range 模式）：点按轨道空白处添加节点；
   * 拖拽节点垂直于滑轨方向离开超过 40px 时松手删除。至少保留一个节点。
   */
  editable?: boolean
  /**
   * range 模式下允许拖拽首尾节点之间的选区整体平移（仅当没有单独禁用的滑块、
   * 且 step 不为 "mark" 时可用；与 editable 同开时选区内的触摸优先整体拖拽）。
   */
  draggableTrack?: boolean
  /** 反向：水平模式从右向左递增，垂直模式从上向下递增 */
  reverse?: boolean
  /** 垂直模式，滑轨长度由 height 给出 */
  vertical?: boolean
  /** 垂直模式的滑轨长度（数字按 px 处理），缺省 200px */
  height?: string | number
  /** 气泡提示：默认拖拽时显示当前值，open 可强制常显/隐藏，formatter 格式化内容 */
  tooltip?: SliderTooltip
  /** 滑轨起始端图标类名（iconify 类，如 "i-lucide-volume"），#prefix 插槽可完全接管 */
  prefixIcon?: string
  /** 滑轨末尾端图标类名，#suffix 插槽可完全接管 */
  suffixIcon?: string
  /** 轨道线的粗细（px），水平为高度、垂直为宽度 */
  trackHeight?: number
  /** 是否显示当前值 */
  showValue?: boolean
  /** 是否启用范围选择 */
  range?: boolean
  /** 尺寸 */
  size?: typeof sliderSizes[number]
  /** 颜色 */
  color?: typeof sliderColors[number]
  /** 样式覆盖 */
  ui?: Partial<{
    wrapper: ClassValue
    inner: ClassValue
    picker: ClassValue
    track: ClassValue
    progress: ClassValue
    thumb: ClassValue
    thumbDot: ClassValue
    stopDot: ClassValue
    markDot: ClassValue
    markLabel: ClassValue
    tooltip: ClassValue
    prefix: ClassValue
    suffix: ClassValue
    value: ClassValue
  }>
  /** 自定义 class */
  customClass?: any
}

const { proxy } = getCurrentInstance()!

// reborn-form 上下文
const { disabled: fieldGroupDisabled, size: fieldGroupSize, validate } = useFormInject(props)

/**
 * 整体禁用：表单注入禁用或 disabled 传布尔 true。
 * 注意必须用 === true 判断：disabled 传数组（单柄禁用）时数组本身是真值，
 * useFormInject 会原样透传，直接取真值会把整个组件误判为禁用。
 */
const isDisabled = computed(() => fieldGroupDisabled.value === true || props.disabled === true)
const resolvedSize = computed(() => fieldGroupSize.value || props.size)

/** 单个滑块是否禁用（数组下标对应排序后的节点位置） */
function handleDisabled(index: number): boolean {
  if (isDisabled.value) { return true }
  return Array.isArray(props.disabled) ? !!props.disabled[index] : false
}

/** 归一化后的刻度列表：过滤非法与越界 key，按值升序 */
const markList = computed(() => {
  if (!props.marks) { return [] }
  return Object.entries(props.marks)
    .map(([key, raw]) => {
      const val = Number(key)
      const entry = typeof raw === 'object' && raw !== null ? raw : { label: raw }
      return { value: val, label: entry.label ?? key, style: (entry as any).style }
    })
    .filter(m => Number.isFinite(m.value) && m.value >= props.min && m.value <= props.max)
    .sort((a, b2) => a.value - b2.value)
})

/** 刻度值序列（升序），step="mark" 的吸附基于它 */
const markValues = computed(() => markList.value.map(m => m.value))

/** 间断点位置：仅数字步长时有效；点数过多（>100）时不渲染，避免节点爆炸 */
const stopValues = computed(() => {
  if (!props.showStops || typeof props.step !== 'number' || props.step <= 0) { return [] }
  const count = Math.floor((props.max - props.min) / props.step) - 1
  if (count <= 0 || count > 100) { return [] }
  const list: number[] = []
  for (let i = 1; i <= count; i++) {
    list.push(props.min + i * props.step)
  }
  return list
})

// ui 样式系统
const uiOverrides = computed(() => props.ui || {})
const b = tv(theme)

const ui = computed(() => {
  const styles = b({
    size: resolvedSize.value as any,
    color: props.color,
    vertical: props.vertical,
    hasMarks: markList.value.length > 0,
    disabled: isDisabled.value,
  })

  interface ThumbOpts { class?: any, active?: boolean, pressed?: boolean, handleDisabled?: boolean, removing?: boolean }
  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    inner: (opts?: { class?: any }) =>
      styles.inner({ class: cn(opts?.class, uiOverrides.value.inner) }),
    picker: (opts?: { class?: any }) =>
      styles.picker({ class: cn(opts?.class, uiOverrides.value.picker) }),
    track: (opts?: { class?: any }) =>
      styles.track({ class: cn(opts?.class, uiOverrides.value.track) }),
    progress: (opts?: { class?: any }) =>
      styles.progress({ class: cn(opts?.class, uiOverrides.value.progress) }),
    // 激活 / 按压 / 单柄禁用 / 删除预览态在调用处按滑块逐个传入，覆盖组合变体
    thumb: (opts?: ThumbOpts) =>
      styles.thumb({
        active: opts?.active ?? true,
        pressed: opts?.pressed ?? false,
        handleDisabled: opts?.handleDisabled ?? false,
        removing: opts?.removing ?? false,
        class: cn(opts?.class, uiOverrides.value.thumb),
      } as any),
    thumbDot: (opts?: ThumbOpts) =>
      styles.thumbDot({
        active: opts?.active ?? true,
        handleDisabled: opts?.handleDisabled ?? false,
        class: cn(opts?.class, uiOverrides.value.thumbDot),
      } as any),
    stopDot: (opts?: { class?: any }) =>
      styles.stopDot({ class: cn(opts?.class, uiOverrides.value.stopDot) }),
    markDot: (opts?: { class?: any }) =>
      styles.markDot({ class: cn(opts?.class, uiOverrides.value.markDot) }),
    markLabel: (opts?: { class?: any }) =>
      styles.markLabel({ class: cn(opts?.class, uiOverrides.value.markLabel) }),
    tooltip: (opts?: { class?: any }) =>
      styles.tooltip({ class: cn(opts?.class, uiOverrides.value.tooltip) }),
    prefix: (opts?: { class?: any }) =>
      styles.prefix({ class: cn(opts?.class, uiOverrides.value.prefix) }),
    suffix: (opts?: { class?: any }) =>
      styles.suffix({ class: cn(opts?.class, uiOverrides.value.suffix) }),
    value: (opts?: { class?: any }) =>
      styles.value({ class: cn(opts?.class, uiOverrides.value.value) }),
  }
})

// 当前滑块的值，单值模式
const value = ref<number>(props.modelValue)

/** range 模式的节点数组，始终保持升序，editable 时长度可变 */
const rangeValue = ref<number[]>([...props.values])

/** 激活节点下标：默认最右侧，此后跟随用户最近一次触摸的滑块 */
const activeThumbIndex = ref<number>(Math.max(0, props.values.length - 1))

/** 是否处于触摸拖拽中（色晕与气泡据此显示） */
const dragging = ref(false)

/** 是否处于选区整体平移中（draggableTrack） */
const trackDragging = ref(false)
let trackDragStartValue = 0
let trackDragBaseNodes: number[] = []

/** 可编辑模式下正被拖离滑轨的节点下标，松手即删除；拖回则恢复 */
const removingIndex = ref<number | null>(null)

/** 轨道与交互带的测量结果（touchstart 时刷新，拖拽期间复用） */
const trackRect = ref({ left: 0, top: 0, width: 0, height: 0 })
const innerRect = ref({ left: 0, top: 0, width: 0, height: 0 })

/** 触摸点距滑块中心多少像素内算「抓住滑块」（手指精度放宽到 16px） */
const GRAB_THRESHOLD = 16
/** 垂直于滑轨方向拖离多少像素进入删除预览 */
const REMOVE_DISTANCE = 40

/** 垂直模式滑轨长度 */
const innerStyle = computed(() => {
  if (!props.vertical) { return {} }
  const h = typeof props.height === 'number' ? `${props.height}px` : (props.height || '200px')
  return { height: h }
})

/** 轨道粗细由 trackHeight（px）内联控制，水平为高度、垂直为宽度 */
const trackStyle = computed(() => {
  return props.vertical ? { width: `${props.trackHeight}px` } : { height: `${props.trackHeight}px` }
})

function toPct(val: number) {
  return ((val - props.min) / (props.max - props.min)) * 100
}

/**
 * 值百分比 → 距定位起始边的显示百分比。
 * 水平以 left 定位（正向 min 在左），垂直以 top 定位（正向 min 在下），reverse 时各自翻转。
 */
function toDisplayPct(pctVal: number) {
  const fromStart = props.vertical ? 100 - pctVal : pctVal
  return props.reverse ? 100 - fromStart : fromStart
}

// 计算当前值在滑块轨道上的百分比位置（单值模式专用）
const percentage = computed(() => {
  if (props.range) { return 0 }
  return toPct(value.value)
})

const nodePercentages = computed(() => rangeValue.value.map(toPct))

/** 进度条覆盖选区（单滑块从 min 端到当前值），换算成显示轴上的起点与长度 */
const progressStyle = computed(() => {
  const startPct = props.range ? (nodePercentages.value[0] ?? 0) : 0
  const endPct = props.range
    ? (nodePercentages.value[nodePercentages.value.length - 1] ?? 0)
    : percentage.value
  const d1 = toDisplayPct(startPct)
  const d2 = toDisplayPct(endPct)
  const start = Math.min(d1, d2)
  const size2 = Math.abs(d2 - d1)
  return props.vertical
    ? { top: `${start}%`, height: `${size2}%` }
    : { left: `${start}%`, width: `${size2}%` }
})

/** 尺寸交由 size × active 变体类控制，这里只负责沿滑轨方向的定位（translate 已居中） */
function thumbStyle(pct: number) {
  const d = toDisplayPct(pct)
  return props.vertical ? { top: `${d}%` } : { left: `${d}%` }
}

const singleThumbStyle = computed(() => thumbStyle(percentage.value))

// 计算要显示的数值文本
const displayValue = computed<string>(() => {
  if (props.range) { return rangeValue.value.join(' - ') }
  return `${value.value}`
})

/** 气泡内容：formatter 显式传 null 表示隐藏，缺省显示原始值 */
function tooltipContent(val: number): string | number | null {
  const formatter = props.tooltip?.formatter
  if (formatter === null) { return null }
  return formatter ? formatter(val) : val
}

/** 该滑块是否处于按压拖拽中（整体平移与删除预览不算），色晕据此显示 */
function thumbPressed(index: number): boolean {
  if (!dragging.value || trackDragging.value) { return false }
  if (!props.range) { return true }
  return activeThumbIndex.value === index && removingIndex.value !== index
}

/** 气泡可见性：open 强制显隐，缺省仅在拖拽该滑块时显示 */
function thumbTooltipVisible(index: number): boolean {
  if (tooltipContent(0) === null) { return false }
  const open = props.tooltip?.open
  if (open === true) { return true }
  if (open === false) { return false }
  return thumbPressed(index)
}

/** 触摸开始前刷新轨道与交互带的位置尺寸（小程序无同步 getBoundingClientRect） */
function measure(): Promise<void> {
  return new Promise((resolve) => {
    const query = uni.createSelectorQuery().in(proxy)
    query.select('.reborn-slider__track').boundingClientRect()
    query.select('.reborn-slider__inner').boundingClientRect()
    query.exec((res) => {
      const [trackNode, innerNode] = res
      if (trackNode) {
        trackRect.value = {
          left: trackNode.left ?? 0,
          top: trackNode.top ?? 0,
          width: trackNode.width ?? 0,
          height: trackNode.height ?? 0,
        }
      }
      if (innerNode) {
        innerRect.value = {
          left: innerNode.left ?? 0,
          top: innerNode.top ?? 0,
          width: innerNode.width ?? 0,
          height: innerNode.height ?? 0,
        }
      }
      resolve()
    })
  })
}

/** 触摸坐标 */
interface TouchCoords {
  clientX: number
  clientY: number
}

/** 触摸坐标 → 滑轨上的值：按轴取坐标，reverse 时翻转，再按 step 量化 */
function calculateValue(e: TouchCoords): number {
  const rect = trackRect.value
  let pct = props.vertical
    ? (rect.height === 0 ? 0 : (rect.top + rect.height - e.clientY) / rect.height)
    : (rect.width === 0 ? 0 : (e.clientX - rect.left) / rect.width)
  if (props.reverse) { pct = 1 - pct }
  pct = Math.max(0, Math.min(1, pct))
  let val = props.min + pct * (props.max - props.min)
  if (props.step === 'mark') {
    // 刻度模式：取值吸附到最近刻度
    val = snapToMark(val)
  }
  else if (typeof props.step === 'number' && props.step > 0) {
    val = Math.round((val - props.min) / props.step) * props.step + props.min
  }
  return Math.max(props.min, Math.min(props.max, val))
}

/** 吸附到最近的刻度值；未提供有效 marks 时原样返回 */
function snapToMark(val: number): number {
  const values = markValues.value
  if (!values.length) { return val }
  let best = values[0]
  for (const v of values) {
    if (Math.abs(v - val) < Math.abs(best - val)) { best = v }
  }
  return best
}

/** 按值距离选出最近的可用滑块（跳过禁用）；距离相等时取靠后的 */
function nearestEnabledThumb(touch: number): number {
  let best = -1
  let bestD = Infinity
  for (let i = 0; i < rangeValue.value.length; i++) {
    if (handleDisabled(i)) { continue }
    const d = Math.abs(touch - rangeValue.value[i])
    if (d < bestD || (d === bestD && touch >= rangeValue.value[i])) {
      best = i
      bestD = d
    }
  }
  return best
}

/** 按像素距离找触摸点正压着的滑块，超出抓取阈值返回 -1 */
function findGrabbableThumb(e: TouchCoords): number {
  const rect = trackRect.value
  const cursor = props.vertical ? e.clientY : e.clientX
  let best = -1
  let bestD = Infinity
  for (let i = 0; i < rangeValue.value.length; i++) {
    if (handleDisabled(i)) { continue }
    const d100 = toDisplayPct(toPct(rangeValue.value[i])) / 100
    const px = props.vertical ? rect.top + d100 * rect.height : rect.left + d100 * rect.width
    const d = Math.abs(cursor - px)
    if (d < bestD || (d === bestD && cursor >= px)) {
      best = i
      bestD = d
    }
  }
  return best !== -1 && bestD <= GRAB_THRESHOLD ? best : -1
}

/**
 * 选区整体平移是否可用：任一滑块被单独禁用即整体不可动（禁用滑块是不可移动边界）；
 * step="mark" 时平移量无法保证所有节点同时落在刻度上，一并禁用。
 */
function canDragTrack(): boolean {
  if (!props.draggableTrack || !props.range || rangeValue.value.length < 2) { return false }
  if (props.step === 'mark') { return false }
  for (let i = 0; i < rangeValue.value.length; i++) {
    if (handleDisabled(i)) { return false }
  }
  return true
}

/** 提交节点数组：写内部状态并向外发 update:values + change（changing 兼容保留） */
function commitNodes(arr: number[]) {
  rangeValue.value = arr
  emit('update:values', [...arr])
  emit('change', [...arr])
  emit('changing', [...arr])
}

function updateValue(newValue: number) {
  if (value.value !== newValue) {
    value.value = Math.max(props.min, Math.min(props.max, newValue))
    emit('update:modelValue', newValue)
    emit('change', newValue)
    emit('changing', newValue)
  }
}

function emitChangeComplete() {
  emit('changeComplete', props.range ? [...rangeValue.value] : value.value)
  if (validate) { validate('change') }
}

/**
 * 移动激活节点：
 * 1. 先按左右最近的禁用节点钳制取值——禁用滑块是移动边界，任何滑块无法越过；
 * 2. 越过普通相邻节点时把改动值冒泡到正确的排序位置，激活下标跟着换位，
 *    否则继续拖动时移动的是错误的滑块（表现为「不跟手」）。
 */
function moveActiveThumb(raw: number) {
  const idx = activeThumbIndex.value
  if (idx < 0 || handleDisabled(idx)) { return }

  let lo = props.min
  let hi = props.max
  for (let j = 0; j < rangeValue.value.length; j++) {
    if (j === idx || !handleDisabled(j)) { continue }
    if (j < idx) { lo = Math.max(lo, rangeValue.value[j]) }
    else { hi = Math.min(hi, rangeValue.value[j]) }
  }
  const val = Math.max(lo, Math.min(hi, raw))
  if (val === rangeValue.value[idx]) { return }

  const arr = [...rangeValue.value]
  arr[idx] = val
  let ni = idx
  while (ni > 0 && arr[ni] < arr[ni - 1]) {
    [arr[ni], arr[ni - 1]] = [arr[ni - 1], arr[ni]]
    ni--
  }
  while (ni < arr.length - 1 && arr[ni] > arr[ni + 1]) {
    [arr[ni], arr[ni + 1]] = [arr[ni + 1], arr[ni]]
    ni++
  }
  activeThumbIndex.value = ni
  commitNodes(arr)
}

/** 在触摸位置插入新节点并立即激活 */
function addNode(val: number) {
  const arr = [...rangeValue.value]
  let idx = arr.findIndex(n => n > val)
  if (idx === -1) { idx = arr.length }
  arr.splice(idx, 0, val)
  activeThumbIndex.value = idx
  commitNodes(arr)
}

/** 删除节点（至少保留一个），并收敛激活下标；changeComplete 由触摸结束方触发 */
function removeNode(index: number) {
  if (rangeValue.value.length <= 1) { return }
  const arr = [...rangeValue.value]
  arr.splice(index, 1)
  commitNodes(arr)
  activeThumbIndex.value = Math.min(activeThumbIndex.value, arr.length - 1)
}

/** 点击刻度文字：单值直接跳转，范围模式移动最近的可用滑块，并视为一次完整交互 */
function onMarkClick(markValue: number) {
  if (isDisabled.value) { return }
  if (props.range) {
    const idx = nearestEnabledThumb(markValue)
    if (idx === -1) { return }
    activeThumbIndex.value = idx
    moveActiveThumb(markValue)
  }
  else {
    updateValue(markValue)
  }
  emitChangeComplete()
}

// 触摸开始事件：先测量轨道位置，再按 抓滑块 → 选区平移 → 添加节点 → 就近移动 的优先级分派
async function onTouchStart(e: TouchEvent) {
  if (isDisabled.value) { return }

  await measure()

  const touch = e.touches[0]
  if (!touch) { return }
  const coords = { clientX: touch.clientX, clientY: touch.clientY }
  const val = calculateValue(coords)

  dragging.value = true
  if (props.range) {
    const grabbed = findGrabbableThumb(coords)
    if (grabbed !== -1) {
      activeThumbIndex.value = grabbed
    }
    else if (
      canDragTrack()
      && val >= rangeValue.value[0]
      && val <= rangeValue.value[rangeValue.value.length - 1]
    ) {
      // 按在选区内且没压着滑块：整体平移选区
      trackDragging.value = true
      trackDragStartValue = val
      trackDragBaseNodes = [...rangeValue.value]
    }
    else if (props.editable) {
      // 没按在滑块上：在触摸位置添加节点并直接进入拖拽
      addNode(val)
    }
    else {
      const idx = nearestEnabledThumb(val)
      if (idx === -1) {
        dragging.value = false
        return
      }
      activeThumbIndex.value = idx
      moveActiveThumb(val)
    }
  }
  else {
    updateValue(val)
  }
}

// 触摸移动事件
function onTouchMove(e: TouchEvent) {
  if (!dragging.value) { return }

  const touch = e.touches[0]
  if (!touch) { return }
  const coords = { clientX: touch.clientX, clientY: touch.clientY }

  // 选区整体平移：位移量对首尾节点双向钳制，节点间距保持不变
  if (trackDragging.value) {
    const val = calculateValue(coords)
    let delta = val - trackDragStartValue
    const first = trackDragBaseNodes[0]
    const last = trackDragBaseNodes[trackDragBaseNodes.length - 1]
    delta = Math.max(props.min - first, Math.min(props.max - last, delta))
    commitNodes(trackDragBaseNodes.map(n => n + delta))
    return
  }

  // 可编辑模式：垂直于滑轨方向拖离进入删除预览，拖回则恢复；预览期间冻结取值
  if (props.range && props.editable && rangeValue.value.length > 1) {
    const rect = innerRect.value
    const off = props.vertical
      ? (coords.clientX < rect.left ? rect.left - coords.clientX : Math.max(0, coords.clientX - (rect.left + rect.width)))
      : (coords.clientY < rect.top ? rect.top - coords.clientY : Math.max(0, coords.clientY - (rect.top + rect.height)))
    removingIndex.value = off > REMOVE_DISTANCE ? activeThumbIndex.value : null
    if (removingIndex.value !== null) { return }
  }

  const val = calculateValue(coords)
  if (props.range) {
    moveActiveThumb(val)
  }
  else {
    updateValue(val)
  }
}

// 触摸结束事件
function onTouchEnd() {
  if (!dragging.value) { return }
  dragging.value = false
  trackDragging.value = false

  if (removingIndex.value !== null) {
    const idx = removingIndex.value
    removingIndex.value = null
    removeNode(idx)
  }
  emitChangeComplete()
}

// 监听外部传入的 modelValue 变化
watch(
  () => props.modelValue,
  (newModelValue: number) => {
    if (newModelValue !== value.value) {
      value.value = Math.max(props.min, Math.min(props.max, newModelValue))
    }
  },
  { immediate: true },
)

// 监听外部传入的 values 变化
watch(
  () => props.values,
  (newValues: number[]) => {
    rangeValue.value = newValues.map((singleValue) => {
      return Math.max(props.min, Math.min(props.max, singleValue))
    })
    activeThumbIndex.value = Math.min(activeThumbIndex.value, Math.max(0, newValues.length - 1))
  },
  { immediate: true },
)
</script>

<template>
  <view :class="ui.wrapper({ class: props.customClass })">
    <!-- 起始端业务图标（水平在左、垂直在上） -->
    <slot name="prefix">
      <view v-if="prefixIcon" :class="ui.prefix()">
        <view :class="prefixIcon" />
      </view>
    </slot>

    <view class="reborn-slider__inner" :class="ui.inner()" :style="innerStyle">
      <view class="reborn-slider__track" :class="ui.track()" :style="trackStyle">
        <view :class="ui.progress()" :style="progressStyle" />
        <!-- 间断点：按步长撒点 -->
        <view
          v-for="v in stopValues" :key="`stop-${v}`" :class="ui.stopDot()"
          :style="thumbStyle(toPct(v))"
        />
        <!-- 刻度点：位置与滑块共用显示轴换算 -->
        <view
          v-for="m in markList" :key="`dot-${m.value}`" :class="ui.markDot()"
          :style="thumbStyle(toPct(m.value))"
        />
      </view>

      <!-- 刻度文字：单个标记的 style 以内联样式叠加，点按精确跳转 -->
      <view
        v-for="m in markList" :key="`label-${m.value}`" :class="ui.markLabel()"
        :style="[thumbStyle(toPct(m.value)), m.style ?? {}]" @tap.stop="onMarkClick(m.value)"
      >
        {{ m.label }}
      </view>

      <!-- 单滑块模式：恒为激活态 -->
      <template v-if="!range">
        <slot name="thumb" :value="{ value: displayValue, style: singleThumbStyle }">
          <view :class="ui.thumb({ pressed: thumbPressed(0) })" :style="singleThumbStyle">
            <view :class="ui.thumbDot()" />
            <view v-if="thumbTooltipVisible(0)" :class="ui.tooltip()">
              {{ tooltipContent(value) }}
            </view>
          </view>
        </slot>
      </template>

      <!-- 多滑块模式：最近一次触摸的为激活态（默认最右侧），未激活的小一号且无色晕 -->
      <template v-if="range">
        <view
          v-for="(pct, i) in nodePercentages" :key="i" :class="ui.thumb({
            active: i === activeThumbIndex && !handleDisabled(i),
            pressed: thumbPressed(i),
            handleDisabled: handleDisabled(i),
            removing: removingIndex === i,
          })" :style="thumbStyle(pct)"
        >
          <view
            :class="ui.thumbDot({
              active: i === activeThumbIndex && !handleDisabled(i),
              handleDisabled: handleDisabled(i),
            })"
          />
          <view v-if="thumbTooltipVisible(i)" :class="ui.tooltip()">
            {{ tooltipContent(rangeValue[i]) }}
          </view>
        </view>
      </template>

      <!-- 触摸层：盖住整个交互带，滑块比轨道条粗，按在滑块任意位置都要能命中 -->
      <view
        :class="ui.picker()" @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove"
        @touchend="onTouchEnd" @touchcancel="onTouchEnd"
      />
    </view>

    <!-- 末尾端业务图标（水平在右、垂直在下） -->
    <slot name="suffix">
      <view v-if="suffixIcon" :class="ui.suffix()">
        <view :class="suffixIcon" />
      </view>
    </slot>

    <slot name="value" :value="displayValue">
      <text v-if="showValue" :class="ui.value()">
        {{ displayValue }}
      </text>
    </slot>
  </view>
</template>
