<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { CSSProperties, VNode } from 'vue'
import type { splitterLayouts } from './reborn-splitter.config'
import { cloneVNode, Comment, computed, Fragment, h, isVNode, onBeforeUnmount, onMounted, onUpdated, provide, shallowRef, useTemplateRef } from 'vue'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import theme from './reborn-splitter.config'
import { parseSizeValue, splitterContextKey, SplitterPanelScope } from './reborn-splitter.context'
import RebornSplitterPanel from './RebornSplitterPanel.vue'

export interface SplitterProps {
  layout?: typeof splitterLayouts[number]
  lazy?: boolean
  class?: ClassValue
  ui?: Partial<{
    root: ClassValue
    panel: ClassValue
    bar: ClassValue
    collapseButton: ClassValue
  }>
}

const props = withDefaults(defineProps<SplitterProps>(), {
  layout: 'horizontal',
  lazy: false,
})

const emit = defineEmits<{
  /** 开始拖拽，index 为拖拽条后面那个面板的下标 */
  (e: 'resize-start', index: number): void
  /** 拖拽中尺寸变化（lazy 模式不触发），或外部改写面板尺寸后补偿相邻面板时触发 */
  (e: 'resize', index: number): void
  /** 拖拽结束 */
  (e: 'resize-end', index: number): void
  /** 面板折叠或展开，index 为该面板的下标，collapsed 为操作之后该面板是否处于折叠状态 */
  (e: 'collapse', index: number, collapsed: boolean): void
  /**
   * 布局提交后派发一次：拖拽结束、折叠 / 展开、外部改写 size，且面板尺寸确有变化时才派发；拖拽过程中不派发。
   * sizes 为全部面板的最新尺寸（百分比，按面板顺序）；
   * index 为尺寸发生变化的那条拖拽条的下标（拖拽条后面那个面板的下标，与 resize-start 等事件同义）
   */
  (e: 'change', sizes: number[], index: number): void
  /**
   * 拖拽中面板尺寸进入 min / max 边界时派发一次：停在边界上不重复派发，离开后再回到才再派发。
   * 未设置 min 按 0、未设置 max 按 100% 判断，与拖拽夹取用的是同一组边界；lazy 模式按幽灵条位置对应的尺寸判断。
   * index 为面板下标，boundary 为触及的边界，size 为该面板当前尺寸（百分比）
   */
  (e: 'limit', index: number, boundary: 'min' | 'max', size: number): void
}>()

const slots = defineSlots<{
  /** 放置 SplitterPanel，面板按插槽顺序排列 */
  default?: () => any
}>()

const b = tv(theme)
const uiOverrides = computed(() => props.ui ?? {})
const isDragging = shallowRef(false)

const ui = computed(() => b({
  layout: props.layout,
  isDragging: isDragging.value,
}))

const splitterRef = useTemplateRef<HTMLElement>('splitterRef')

/** 从面板 vnode 上读到的配置；每次渲染重新读取，props 变化即时生效 */
interface PanelConfig {
  size?: string | number
  min?: string | number
  max?: string | number
  resizable: boolean
  collapsible: boolean
}

/** 一次渲染收集到的面板 */
interface PanelEntry {
  /** 稳定标识：插槽结构路径 */
  key: string
  config: PanelConfig
}

/** 用户调整（拖拽、折叠、外部改写 size）后的布局快照：快照时的面板顺序与各面板尺寸 */
interface LayoutSnapshot {
  order: string[]
  sizes: Record<string, number>
}

/** 未调整过时为 null，布局完全由面板配置推导 */
const snapshot = shallowRef<LayoutSnapshot | null>(null)
/** 已折叠的面板：key → 折叠前的尺寸，展开时恢复 */
const collapsedSizes = shallowRef<Record<string, number>>({})
/** lazy 模式拖拽中幽灵条的位置（百分比） */
const dragCurrentPercent = shallowRef(0)

/**
 * 最近一次渲染的面板与尺寸，供拖拽、折叠等事件处理读取，与屏幕上的布局一致。
 * 只是渲染结果的缓存，不参与响应式追踪
 */
let rendered: { entries: PanelEntry[], sizes: number[] } = { entries: [], sizes: [] }
/** 上次渲染之后是否又应用过快照：是则快照比 rendered 更新 */
let appliedSinceRender = false

interface CollectedNode {
  node: VNode
  key: string
  isPanel: boolean
}

/** 异步组件包装器上 Vue 挂的加载信息（defineAsyncComponent 生成） */
interface AsyncWrapperType {
  __asyncLoader?: unknown
  __asyncResolved?: unknown
}

/**
 * 只有 SplitterPanel 本身才算面板，其他组件、原生元素、文本都原样渲染，不参与尺寸分配。
 * 全局异步注册（Nuxt 的 components.global、运行时编译的模板）解析出来的是异步包装器：
 * 已加载完就比对加载结果；尚未加载时拿不到组件对象，按面板处理，保证这种写法首屏就有尺寸
 */
function isPanelNode(node: VNode): boolean {
  if (node.type === RebornSplitterPanel) return true
  const type = node.type as AsyncWrapperType | null
  if (!type || typeof type !== 'object' || !('__asyncLoader' in type)) return false
  return type.__asyncResolved === undefined || type.__asyncResolved === RebornSplitterPanel
}

/** 展开 Fragment 并按祖先路径生成稳定 key：两个 v-for 使用相同 key 也不会串实例，v-if 占位让其余面板的下标不变 */
function collectNodes(nodes: unknown[], ancestors: string[] = []): CollectedNode[] {
  return nodes.flatMap((node, index) => {
    if (!isVNode(node) || node.type === Comment) return []
    const segment = node.key == null ? `index:${index}` : `key:${typeof node.key}:${String(node.key)}`
    const path = [...ancestors, segment]
    if (node.type === Fragment && Array.isArray(node.children)) return collectNodes(node.children, path)
    return [{ node, key: JSON.stringify(path), isPanel: isPanelNode(node) }]
  })
}

/** 按 Vue 的布尔 prop 规则读取：未传取默认值，只写属性名（空串）为 true */
function readBooleanProp(value: unknown, fallback: boolean) {
  if (value === undefined) return fallback
  return value === '' || !!value
}

function readPanelConfig(node: VNode): PanelConfig {
  const raw = (node.props ?? {}) as Record<string, any>
  return {
    size: raw.size,
    min: raw.min,
    max: raw.max,
    resizable: readBooleanProp(raw.resizable, true),
    collapsible: readBooleanProp(raw.collapsible, false),
  }
}

/** 按配置分配尺寸：显式 size 原样采用（百分比），其余面板平分剩余空间 */
function configSizes(entries: PanelEntry[]): number[] {
  let explicitTotal = 0
  let autoCount = 0
  const explicit = entries.map(({ config }) => {
    const value = config.size === undefined || config.size === null || config.size === '' ? Number.NaN : parseSizeValue(config.size)
    if (!Number.isFinite(value)) {
      autoCount++
      return null
    }
    explicitTotal += value
    return value
  })
  const autoSize = autoCount > 0 ? Math.max(0, 100 - explicitTotal) / autoCount : 0
  return explicit.map(value => value ?? autoSize)
}

/** 在顺序表里找离 index 最近、且仍在场的面板（先往前，再往后），优先跳过已折叠的面板 */
function nearestPresent(order: string[], index: number, present: Set<string>): string | undefined {
  const candidates = [
    ...order.slice(0, index).reverse(),
    ...order.slice(index + 1),
  ].filter(key => present.has(key))
  return candidates.find(key => !(key in collapsedSizes.value)) ?? candidates[0]
}

/**
 * 解析当前面板的尺寸。未调整过时完全按配置推导（服务端首屏与客户端一致）；
 * 调整过之后以快照为准，增删面板只动相邻面板：
 * - 被移除面板的份额补给快照顺序里离它最近的面板；
 * - 新面板按自身配置取份额，从当前顺序里离它最近的已有面板扣出。
 * 纯函数推导，不写状态；面板再加回来时布局原样恢复
 */
function resolveSizes(entries: PanelEntry[]): number[] {
  const base = snapshot.value
  if (!base) return configSizes(entries)

  const keys = entries.map(entry => entry.key)
  const sizes: (number | undefined)[] = keys.map(key => base.sizes[key])
  if (sizes.every(size => size === undefined)) return configSizes(entries)

  const present = new Set(keys)
  base.order.forEach((key, index) => {
    if (present.has(key)) return
    const neighbor = nearestPresent(base.order, index, present)
    if (neighbor === undefined) return
    const at = keys.indexOf(neighbor)
    sizes[at] = (sizes[at] ?? 0) + (base.sizes[key] ?? 0)
  })

  const isNew = sizes.map(size => size === undefined)
  const wanted = configSizes(entries)
  isNew.forEach((fresh, index) => {
    if (!fresh) return
    let neighbor = -1
    for (let j = index - 1; j >= 0 && neighbor === -1; j--) {
      if (!isNew[j]) neighbor = j
    }
    for (let j = index + 1; j < sizes.length && neighbor === -1; j++) {
      if (!isNew[j]) neighbor = j
    }
    if (neighbor === -1) {
      sizes[index] = wanted[index]
      return
    }
    const take = Math.min(wanted[index] ?? 0, sizes[neighbor] ?? 0)
    sizes[neighbor] = (sizes[neighbor] ?? 0) - take
    sizes[index] = take
  })

  return sizes.map(size => size ?? 0)
}

/**
 * 渲染期遍历默认插槽，给每个面板包一层无 DOM 的 Scope，直接提供下标、总数与尺寸。
 * 只在渲染过程中读取插槽：setup 上下文的 slots 不会被 computed 追踪，缓存会停在旧的面板列表上
 */
function renderPanels(): VNode[] {
  const collected = collectNodes(slots.default?.() ?? [])
  const entries: PanelEntry[] = collected
    .filter(item => item.isPanel)
    .map(item => ({ key: item.key, config: readPanelConfig(item.node) }))
  const sizes = resolveSizes(entries)
  rendered = { entries, sizes }
  appliedSinceRender = false

  const collapsed = collapsedSizes.value
  let panelIndex = 0
  return collected.map((item) => {
    if (!item.isPanel) return item.node
    const index = panelIndex++
    const next = entries[index + 1]
    return h(SplitterPanelScope, {
      key: item.key,
      index,
      count: entries.length,
      panelKey: item.key,
      size: sizes[index] ?? 0,
      collapsed: item.key in collapsed,
      nextCollapsed: !!next && next.key in collapsed,
      nextResizable: next?.config.resizable !== false,
      node: cloneVNode(item.node),
    })
  })
}

/** 节点作为显式参数进入渲染器，父级插槽更新时不会被当作无变化的函数组件跳过 */
function PanelItems(itemProps: { nodes: VNode[] }) {
  return itemProps.nodes
}

/** 当前生效的尺寸：上次渲染后若又应用过快照，以快照为准 */
function currentSizes(): number[] {
  const base = snapshot.value
  if (!appliedSinceRender || !base) return [...rendered.sizes]
  return rendered.entries.map((entry, index) => base.sizes[entry.key] ?? rendered.sizes[index] ?? 0)
}

/** 面板登记的尺寸变更通知（发出 update:size） */
const sizeListeners = new Map<string, (size: number) => void>()

/**
 * 各面板对外已知的尺寸：面板首次出现时的尺寸，或最近一次通知出去的尺寸。
 * 渲染之后据此找出「实际尺寸变了却没通知」的面板，不参与响应式追踪
 */
let knownSizes = new Map<string, number>()

function notifySize(panelKey: string, size: number) {
  knownSizes.set(panelKey, size)
  sizeListeners.get(panelKey)?.(size)
}

/** 应用一组新尺寸：写入快照，并通知尺寸真正变化的面板 */
function applySizes(entries: PanelEntry[], sizes: number[]) {
  const before = currentSizes()
  const previous: Record<string, number> = {}
  rendered.entries.forEach((entry, index) => {
    previous[entry.key] = before[index] ?? 0
  })
  const record: Record<string, number> = {}
  entries.forEach((entry, index) => {
    record[entry.key] = sizes[index] ?? 0
  })
  snapshot.value = { order: entries.map(entry => entry.key), sizes: record }
  appliedSinceRender = true
  for (const entry of entries) {
    const next = record[entry.key]!
    if (previous[entry.key] !== next) notifySize(entry.key, next)
  }
}

/**
 * 一次调整提交后派发 change：与调整前的尺寸逐项比较，确有变化才派发。
 * 只点了一下拖拽条、把已经为 0 的面板再折叠这类没有改变布局的操作不派发
 */
function emitChange(before: number[], index: number) {
  const sizes = currentSizes()
  if (sizes.length === before.length && sizes.every((size, at) => size === before[at])) return
  emit('change', sizes, index)
}

/**
 * 渲染完成后核对尺寸（不在渲染函数里通知）：
 * - 调整过之后增删面板，相邻面板被补偿或扣减的尺寸要补发 update:size，v-model:size 才与界面一致；
 * - 未调整过时布局完全由配置推导，显式 size 的面板尺寸就是绑定值，自动平分的面板没有绑定值可同步，只记录不通知；
 * - 新出现的面板与挂载时一样不通知，只记下初始尺寸；已移除的面板从记录里清掉
 */
function syncRenderedSizes() {
  const sizes = currentSizes()
  const adjusted = snapshot.value !== null
  const next = new Map<string, number>()
  rendered.entries.forEach((entry, index) => {
    const size = sizes[index] ?? 0
    const known = knownSizes.get(entry.key)
    next.set(entry.key, size)
    if (adjusted && known !== undefined && known !== size) sizeListeners.get(entry.key)?.(size)
  })
  knownSizes = next
}

onMounted(syncRenderedSizes)
onUpdated(syncRenderedSizes)

function getContainerSize(): number {
  const container = splitterRef.value
  if (!container) return 0
  return props.layout === 'horizontal' ? container.offsetWidth : container.offsetHeight
}

/** 进行中的拖拽；拖拽条捕获了指针，move / up 都派发到拖拽条上，不需要 document 监听 */
interface DragState {
  barIndex: number
  pointerId: number
  startPos: number
  startSizes: number[]
  latestSizes: number[]
  entries: PanelEntry[]
  /** 拖拽条两侧面板当前停在的边界（键见 reachedLimits），用来判断「进入」边界，停留期间不重复派发 limit */
  limits: Set<string>
}

/** 面板停在的一条边界 */
interface ReachedLimit {
  /** 去重用的键，形如 `0:min` */
  key: string
  index: number
  boundary: 'min' | 'max'
}

/** 判断是否停在边界上的容差（百分比）：像素换算出的边界与夹取后的尺寸可能只差在浮点末位 */
const LIMIT_EPSILON = 1e-6

let drag: DragState | null = null
let bodyStyles = { cursor: "", userSelect: "" }

function pointerPos(event: PointerEvent) {
  return props.layout === 'horizontal' ? event.clientX : event.clientY
}

function startDrag(barIndex: number, event: PointerEvent) {
  // 鼠标只响应主键；触摸与触控笔没有按键区分
  if (drag || (event.pointerType === 'mouse' && event.button !== 0)) return
  event.preventDefault()
  ;(event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)

  const startSizes = currentSizes()
  drag = {
    barIndex,
    pointerId: event.pointerId,
    startPos: pointerPos(event),
    startSizes,
    latestSizes: startSizes,
    entries: rendered.entries,
    // 按下时已经停在边界上的面板记为「在边界内」：继续往边界方向拖不算进入，离开后再回到才派发 limit
    limits: new Set(reachedLimits(rendered.entries, startSizes, barIndex, getContainerSize()).map(limit => limit.key)),
  }
  isDragging.value = true
  if (props.lazy) {
    dragCurrentPercent.value = startSizes.slice(0, barIndex).reduce((a, b) => a + b, 0)
  }

  emit('resize-start', barIndex)

  // 拖拽期间全页统一游标、禁止选中文字；结束或卸载时由 cleanupDrag 恢复
  bodyStyles = { cursor: document.body.style.cursor, userSelect: document.body.style.userSelect }
  document.body.style.cursor = props.layout === 'horizontal' ? 'col-resize' : 'row-resize'
  document.body.style.userSelect = 'none'
}

/** 面板的 min / max 换算成百分比：字符串按百分比解析，数字按像素换算 */
function limitPercent(value: string | number | undefined, fallback: number, containerSize: number) {
  if (value === undefined) return fallback
  return typeof value === 'string' ? Number.parseFloat(value) : (value / containerSize) * 100
}

/** 拖拽条两侧面板（只有它们的尺寸会被拖动改变）此刻停在的边界，边界与 moveDrag 的夹取一致 */
function reachedLimits(entries: PanelEntry[], sizes: number[], barIndex: number, containerSize: number): ReachedLimit[] {
  // 容器尚未布局时数字边界无法换算，视为不在任何边界上
  if (containerSize === 0) return []
  const reached: ReachedLimit[] = []
  for (const index of [barIndex - 1, barIndex]) {
    const config = entries[index]?.config
    const size = sizes[index]
    if (!config || size === undefined) continue
    if (size <= limitPercent(config.min, 0, containerSize) + LIMIT_EPSILON) reached.push({ key: `${index}:min`, index, boundary: 'min' })
    if (size >= limitPercent(config.max, 100, containerSize) - LIMIT_EPSILON) reached.push({ key: `${index}:max`, index, boundary: 'max' })
  }
  return reached
}

/** 与上一帧比较，只为新进入的边界派发 limit；同时到达多个边界（如两个面板各自触底）时按面板顺序各派发一次 */
function syncLimits(state: DragState, sizes: number[], containerSize: number) {
  const reached = reachedLimits(state.entries, sizes, state.barIndex, containerSize)
  const entered = reached.filter(limit => !state.limits.has(limit.key))
  state.limits = new Set(reached.map(limit => limit.key))
  for (const limit of entered) emit('limit', limit.index, limit.boundary, sizes[limit.index]!)
}

function moveDrag(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.pointerId) return

  const containerSize = getContainerSize()
  if (containerSize === 0) return

  const deltaPercent = ((pointerPos(event) - drag.startPos) / containerSize) * 100
  // 拖拽条在 prevIndex 与 nextIndex 两个面板之间
  const prevIndex = drag.barIndex - 1
  const nextIndex = drag.barIndex
  const prevPanel = drag.entries[prevIndex]?.config
  const nextPanel = drag.entries[nextIndex]?.config
  const oldPrevSize = drag.startSizes[prevIndex]
  const oldNextSize = drag.startSizes[nextIndex]
  if (!prevPanel || !nextPanel || oldPrevSize === undefined || oldNextSize === undefined) return

  const prevMin = limitPercent(prevPanel.min, 0, containerSize)
  const prevMax = limitPercent(prevPanel.max, 100, containerSize)
  const nextMin = limitPercent(nextPanel.min, 0, containerSize)
  const nextMax = limitPercent(nextPanel.max, 100, containerSize)

  // prev 增加 delta 时 next 减少 delta，next 的约束也要换算到 prev 上
  const minDelta = Math.max(prevMin - oldPrevSize, oldNextSize - nextMax)
  const maxDelta = Math.min(prevMax - oldPrevSize, oldNextSize - nextMin)
  const actualDelta = Math.max(minDelta, Math.min(maxDelta, deltaPercent))

  const newSizes = [...drag.startSizes]
  newSizes[prevIndex] = oldPrevSize + actualDelta
  newSizes[nextIndex] = oldNextSize - actualDelta
  const state = drag
  state.latestSizes = newSizes

  if (props.lazy) {
    // lazy 模式只移动幽灵条，松手才应用尺寸
    dragCurrentPercent.value = newSizes.slice(0, prevIndex).reduce((a, b) => a + b, 0) + newSizes[prevIndex]!
  }
  else {
    applySizes(state.entries, newSizes)
    emit('resize', state.barIndex)
  }
  // resize 的监听里可能卸载了面板、结束了这次拖拽，此时不再派发 limit
  if (drag === state) syncLimits(state, newSizes, containerSize)
}

/** 结束拖拽状态并恢复页面样式，不发事件；卸载时直接调用 */
function cleanupDrag() {
  drag = null
  isDragging.value = false
  document.body.style.cursor = bodyStyles.cursor
  document.body.style.userSelect = bodyStyles.userSelect
}

function endDrag(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.pointerId) return
  const state = drag
  // 先清掉拖拽状态，释放捕获时派发的 lostpointercapture 不会再结算一次
  cleanupDrag()
  ;(event.currentTarget as HTMLElement | null)?.releasePointerCapture?.(event.pointerId)
  if (props.lazy) applySizes(state.entries, state.latestSizes)
  emit('resize-end', state.barIndex)
  // 整次拖拽只在松手时提交一次；与按下时比较，拖回原位或只是点了一下拖拽条不派发
  emitChange(state.startSizes, state.barIndex)
}

function toggleCollapse(index: number) {
  const entries = rendered.entries
  const key = entries[index]?.key
  const neighborIndex = index === entries.length - 1 ? index - 1 : index + 1
  if (key === undefined || neighborIndex < 0) return

  const sizes = currentSizes()
  const before = [...sizes]
  const collapsed = { ...collapsedSizes.value }
  if (key in collapsed) {
    // 展开：恢复折叠前的尺寸，从相邻面板扣出，最多扣到相邻面板为 0
    const available = sizes[index]! + sizes[neighborIndex]!
    const restore = Math.min(available, collapsed[key] || 100 / entries.length)
    sizes[index] = restore
    sizes[neighborIndex] = available - restore
    delete collapsed[key]
  }
  else {
    // 折叠：记下尺寸并让给相邻面板
    collapsed[key] = sizes[index]!
    sizes[neighborIndex] = sizes[neighborIndex]! + sizes[index]!
    sizes[index] = 0
  }
  collapsedSizes.value = collapsed
  applySizes(entries, sizes)
  emit('collapse', index, key in collapsed)
  // 份额在本面板与相邻面板之间转移，change 的下标取两者之间那条拖拽条
  emitChange(before, Math.max(index, neighborIndex))
}

/** 外部改写某个面板的尺寸：与相邻面板（后一个，末尾面板取前一个）一起重新分配两者的总和 */
function setPanelSize(panelKey: string, size: number) {
  if (!Number.isFinite(size)) return
  const entries = rendered.entries
  const index = entries.findIndex(entry => entry.key === panelKey)
  const neighborIndex = index === entries.length - 1 ? index - 1 : index + 1
  if (index < 0 || neighborIndex < 0) return

  const sizes = currentSizes()
  if (sizes[index] === size) return
  const before = [...sizes]
  const available = sizes[index]! + sizes[neighborIndex]!
  sizes[index] = Math.min(available, Math.max(0, size))
  sizes[neighborIndex] = available - sizes[index]!
  applySizes(entries, sizes)
  emit('resize', Math.max(index, neighborIndex))
  // 拖拽进行中（例如父级把回写的值取整后写回）不提交，统一由松手时的 change 带出最终尺寸
  if (!drag) emitChange(before, Math.max(index, neighborIndex))
}

function onPanelResize(panelKey: string, notify: (size: number) => void) {
  sizeListeners.set(panelKey, notify)
  return () => {
    if (sizeListeners.get(panelKey) === notify) sizeListeners.delete(panelKey)
  }
}

/** 拖拽条所在的面板被卸载：拖拽无法再正常结束，直接收尾 */
function releasePanel(panelKey: string) {
  if (drag && [drag.entries[drag.barIndex - 1]?.key, drag.entries[drag.barIndex]?.key].includes(panelKey)) cleanupDrag()
}

// 拖拽中被卸载（路由跳转、v-if 切走）：恢复 body 样式，不发 resize-end
onBeforeUnmount(() => {
  if (drag) cleanupDrag()
})

const ghostBarStyle = computed<CSSProperties>(() => {
  if (!props.lazy || !isDragging.value) return {}
  const isHorizontal = props.layout === 'horizontal'
  const posKey = isHorizontal ? 'left' : 'top'
  const crossKey1 = isHorizontal ? 'top' : 'left'
  const crossKey2 = isHorizontal ? 'bottom' : 'right'

  return {
    position: 'absolute',
    [posKey]: `${dragCurrentPercent.value}%`,
    [crossKey1]: 0,
    [crossKey2]: 0,
    zIndex: 50,
    pointerEvents: 'none',
    opacity: 0.5,
  }
})

// 只读状态 + 显式动作：面板不能直接改写父级的尺寸
provide(splitterContextKey, {
  layout: computed(() => props.layout),
  isDragging: computed(() => isDragging.value),
  startDrag,
  moveDrag,
  endDrag,
  toggleCollapse,
  setPanelSize,
  onPanelResize,
  releasePanel,
})

defineExpose({
  splitterRef,
})
</script>

<template>
  <div ref="splitterRef" :class="cn(ui.root(), uiOverrides.root, props.class)">
    <PanelItems :nodes="renderPanels()" />
    <div v-if="props.lazy && isDragging" :class="ui.bar()" :style="ghostBarStyle" />
  </div>
</template>
