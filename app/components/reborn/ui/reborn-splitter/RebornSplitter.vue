<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { computed, provide, ref, toRef, type CSSProperties } from 'vue'
import { cn } from '~/lib/utils'
import { tv } from '~/lib/tv'
import theme, { splitterLayouts } from './reborn-splitter.config'

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
  lazy: false
})

const emit = defineEmits<{
  (e: 'resize-start', index: number): void
  (e: 'resize', index: number): void
  (e: 'resize-end', index: number): void
  (e: 'collapse', index: number): void
}>()

const b = tv(theme)
const layout = toRef(props, 'layout')
const lazy = toRef(props, 'lazy')
const uiOverrides = computed(() => props.ui ?? {})

const ui = computed(() => b({
  layout: layout.value,
  isDragging: isDragging.value
}))

// 面板注册相关
const panels = ref<Array<{
  size?: string | number
  min?: string | number
  max?: string | number
  resizable: boolean
  collapsible: boolean
}>>([])

const panelSizes = ref<number[]>([])
const tempPanelSizes = ref<number[]>([]) // 用于 lazy 模式的临时尺寸
const isDragging = ref(false)
const dragIndex = ref<number>(-1)
const dragStartPos = ref(0)
const dragStartSizes = ref<number[]>([])
const dragCurrentPercent = ref(0) // 用于 lazy 模式下的幽灵条显示
const collapsedStates = ref<boolean[]>([]) // 记录每个面板的折叠状态
const originalSizes = ref<number[]>([]) // 记录折叠前的尺寸

function registerPanel(config: {
  size?: string | number
  min?: string | number
  max?: string | number
  resizable: boolean
  collapsible: boolean
}) {
  const index = panels.value.length
  panels.value.push(config)

  // 智能分配面板尺寸
  const calculateSizes = () => {
    const totalPanels = panels.value.length
    if (totalPanels === 0) return []

    // 1. 收集显式指定的尺寸和需要自动分配的索引
    let explicitTotal = 0
    let autoCount = 0
    const configs = panels.value.map(p => {
      if (p.size !== undefined) {
        const val = typeof p.size === 'string' ? parseFloat(p.size) : p.size
        explicitTotal += val
        return val
      }
      autoCount++
      return null
    })

    // 2. 计算自动分配的平均值
    const remaining = Math.max(0, 100 - explicitTotal)
    const autoSize = autoCount > 0 ? remaining / autoCount : 0

    // 3. 生成最终尺寸数组
    return configs.map(val => (val === null ? autoSize : val))
  }

  panelSizes.value = calculateSizes()
  collapsedStates.value[index] = false

  return index
}

function unregisterPanel(index: number) {
  panels.value.splice(index, 1)
  panelSizes.value.splice(index, 1)
}

function getContainerSize(): number {
  const container = splitterRef.value
  if (!container) return 0

  return props.layout === 'horizontal'
    ? container.offsetWidth
    : container.offsetHeight
}

function handleDragStart(index: number, event: MouseEvent | TouchEvent) {
  event.preventDefault()

  isDragging.value = true
  dragIndex.value = index

  const clientPos: 'clientX' | 'clientY' = props.layout === 'horizontal'
    ? 'clientX'
    : 'clientY'

  dragStartPos.value = event instanceof MouseEvent
    ? event[clientPos]
    : (event as TouchEvent).touches[0]?.[clientPos] || 0

  dragStartSizes.value = [...panelSizes.value]

  // lazy 模式下使用临时尺寸
  if (props.lazy) {
    tempPanelSizes.value = [...panelSizes.value]
    dragCurrentPercent.value = panelSizes.value.slice(0, index).reduce((a, b) => a + b, 0)
  }

  emit('resize-start', index)

  // 增加全局游标样式
  document.body.style.cursor = props.layout === 'horizontal' ? 'col-resize' : 'row-resize'
  document.body.style.userSelect = 'none'

  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
  document.addEventListener('touchmove', handleDragMove)
  document.addEventListener('touchend', handleDragEnd)
}

function handleDragMove(event: MouseEvent | TouchEvent) {
  if (!isDragging.value) return

  const clientPos: 'clientX' | 'clientY' = props.layout === 'horizontal'
    ? 'clientX'
    : 'clientY'

  const currentPos = event instanceof MouseEvent
    ? event[clientPos]
    : (event as TouchEvent).touches[0]?.[clientPos] || 0

  const delta = currentPos - dragStartPos.value
  const containerSize = getContainerSize()

  if (containerSize === 0) return

  const deltaPercent = (delta / containerSize) * 100

  // 更新面板尺寸
  const newSizes = [...dragStartSizes.value]
  // dragIndex 是拖拽条后面那个面板的索引
  // 拖拽条在 prevIndex 和 dragIndex 之间
  const prevIndex = dragIndex.value - 1
  const nextIndex = dragIndex.value

  if (prevIndex >= 0 && nextIndex < newSizes.length) {
    const prevPanel = panels.value[prevIndex]
    const nextPanel = panels.value[nextIndex]

    const oldPrevSize = dragStartSizes.value[prevIndex]
    const oldNextSize = dragStartSizes.value[nextIndex]

    // 类型检查：确保所有必需的值都存在
    if (!prevPanel || !nextPanel || oldPrevSize === undefined || oldNextSize === undefined) {
      return
    }

    // 获取约束百分比
    const getMin = (p: typeof prevPanel) => {
      if (p.min === undefined) return 0
      return typeof p.min === 'string' ? parseFloat(p.min) : (p.min / containerSize) * 100
    }
    const getMax = (p: typeof prevPanel) => {
      if (p.max === undefined) return 100
      return typeof p.max === 'string' ? parseFloat(p.max) : (p.max / containerSize) * 100
    }

    const prevMin = getMin(prevPanel)
    const prevMax = getMax(prevPanel)
    const nextMin = getMin(nextPanel)
    const nextMax = getMax(nextPanel)

    // 计算 prev 面板允许的变化范围
    // next 面板的变化是 prev 的相反数，所以 next 的约束也要转义到 prev 上
    // prev 增加 delta -> next 减少 delta. 所以 nextMin <= oldNext - delta => delta <= oldNext - nextMin
    const minDelta = Math.max(prevMin - oldPrevSize, oldNextSize - nextMax)
    const maxDelta = Math.min(prevMax - oldPrevSize, oldNextSize - nextMin)

    const actualDelta = Math.max(minDelta, Math.min(maxDelta, deltaPercent))

    newSizes[prevIndex] = oldPrevSize + actualDelta
    newSizes[nextIndex] = oldNextSize - actualDelta

    // lazy 模式下更新临时尺寸，否则直接更新实际尺寸
    if (props.lazy) {
      tempPanelSizes.value = newSizes
      // 计算当前拖拽位置相对于容器的百分比
      const prevSizesTotal = newSizes.slice(0, prevIndex).reduce((a, b) => a + b, 0)
      const currentSize = newSizes[prevIndex]
      if (currentSize !== undefined) {
        dragCurrentPercent.value = prevSizesTotal + currentSize
      }
    } else {
      panelSizes.value = newSizes
      emit('resize', dragIndex.value)
    }
  }
}

function handleDragEnd() {
  if (isDragging.value) {
    // lazy 模式下，拖动结束时才应用尺寸
    if (props.lazy) {
      panelSizes.value = [...tempPanelSizes.value]
    }
    emit('resize-end', dragIndex.value)
  }

  isDragging.value = false
  dragIndex.value = -1

  // 恢复全局样式
  document.body.style.cursor = ''
  document.body.style.userSelect = ''

  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  document.removeEventListener('touchmove', handleDragMove)
  document.removeEventListener('touchend', handleDragEnd)
}

function handleCollapse(index: number) {
  const isCurrentlyCollapsed = collapsedStates.value[index]
  const newSizes: number[] = [...panelSizes.value]

  if (isCurrentlyCollapsed) {
    // 展开：恢复原始尺寸
    newSizes[index] = originalSizes.value[index] || (100 / panels.value.length)
    // 从相邻面板扣除尺寸
    const neighborIndex = index === panels.value.length - 1 ? index - 1 : index + 1
    newSizes[neighborIndex] = Math.max(0, newSizes[neighborIndex]! - newSizes[index]!)
    collapsedStates.value[index] = false
  } else {
    // 折叠：记录尺寸并设为 0
    originalSizes.value![index] = newSizes[index]!
    const sizeToDistribute = newSizes[index]!
    newSizes[index] = 0
    // 分配给相邻面板
    const neighborIndex = index === panels.value.length - 1 ? index - 1 : index + 1
    newSizes[neighborIndex] = (newSizes[neighborIndex] || 0) + sizeToDistribute
    collapsedStates.value[index] = true
  }

  panelSizes.value = newSizes
  emit('collapse', index)
}

const splitterRef = ref<HTMLElement | null>(null)

// 计算当前应该显示的面板尺寸
const currentPanelSizes = computed(() => {
  // lazy 模式下，拖拽时不更新面板尺寸
  if (props.lazy && isDragging.value) {
    return panelSizes.value
  }
  return panelSizes.value
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
    opacity: 0.5
  }
})

// 提供上下文给子组件
provide('SplitterContext', {
  layout,
  lazy,
  panels,
  panelSizes: currentPanelSizes,
  collapsedStates,
  registerPanel,
  unregisterPanel,
  handleDragStart,
  handleCollapse,
  isDragging
})

defineExpose({
  splitterRef
})
</script>

<template>
  <div ref="splitterRef" :class="cn(ui.root(), uiOverrides.root, props.class)">
    <slot :ui="ui" :ui-overrides="uiOverrides" />
    <div v-if="props.lazy && isDragging" :class="ui.bar()" :style="ghostBarStyle" />
  </div>
</template>
