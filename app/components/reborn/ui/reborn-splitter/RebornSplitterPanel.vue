<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { cn } from '~/lib/utils'
import { tv } from '~/lib/tv'
import theme from './reborn-splitter.config'

export interface SplitterPanelProps {
  size?: string | number
  min?: string | number
  max?: string | number
  resizable?: boolean
  collapsible?: boolean
  class?: ClassValue
  ui?: Partial<{
    panel: ClassValue
    bar: ClassValue
    collapseButton: ClassValue
  }>
}

const props = withDefaults(defineProps<SplitterPanelProps>(), {
  resizable: true,
  collapsible: false
})

const emit = defineEmits<{
  (e: 'update:size', value: string | number): void
}>()

const b = tv(theme)

// 注入父组件上下文
const context = inject<any>('SplitterContext')
if (!context) {
  throw new Error('SplitterPanel must be used within Splitter')
}

const { layout, panels, panelSizes, collapsedStates, registerPanel, unregisterPanel, handleDragStart, handleCollapse, isDragging } = context

const index = ref<number>(-1)

onMounted(() => {
  index.value = registerPanel({
    size: props.size,
    min: props.min,
    max: props.max,
    resizable: props.resizable,
    collapsible: props.collapsible
  })
})

onUnmounted(() => {
  if (index.value !== -1) {
    unregisterPanel(index.value)
  }
})

// 监听 size 变化
watch(() => props.size, (newSize) => {
  if (newSize !== undefined && index.value !== -1) {
    const sizeValue = typeof newSize === 'string' ? parseFloat(newSize) : newSize
    panelSizes.value[index.value] = sizeValue
  }
})

// 监听面板尺寸变化并触发事件
watch(() => panelSizes.value[index.value], (newSize) => {
  if (newSize !== undefined) {
    emit('update:size', newSize)
  }
})

const panelStyle = computed(() => {
  const size = panelSizes.value[index.value]
  if (size === undefined) return {}

  const sizeValue = typeof size === 'number' ? `${size}%` : size

  return {
    flex: `0 0 ${sizeValue}`,
    [layout.value === 'horizontal' ? 'width' : 'height']: sizeValue
  }
})

const showBar = computed(() => {
  return index.value < panels.value.length - 1
})

const canResize = computed(() => {
  if (!props.resizable) return false
  const nextPanel = panels.value[index.value + 1]
  return nextPanel?.resizable !== false
})

const uiOverrides = computed(() => props.ui ?? {})

const ui = computed(() => b({
  layout: layout.value,
  resizable: props.resizable,
  collapsible: props.collapsible
}))
</script>

<template>
  <div
    :class="cn(ui.panel(), uiOverrides.panel, props.class)"
    :style="panelStyle"
  >
    <div class="flex-1 min-w-0 min-h-0 overflow-hidden">
      <slot />
    </div>

    <!-- 拖拽条 -->
    <div
      v-if="showBar"
      :class="cn(ui.bar(), uiOverrides.bar)"
      @mousedown="canResize && handleDragStart(index + 1, $event)"
      @touchstart="canResize && handleDragStart(index + 1, $event)"
    >
      <slot name="bar" />

      <!-- 左/上按钮：控制前一个面板 (index) -->
      <button
        v-if="collapsible && !collapsedStates[index + 1]"
        :class="cn(
          ui.collapseButton(),
          uiOverrides.collapseButton,
          layout === 'horizontal' 
            ? (collapsedStates[index] ? 'right-0 translate-x-full top-1/2 -translate-y-1/2' : 'left-0 -translate-x-full top-1/2 -translate-y-1/2')
            : (collapsedStates[index] ? 'bottom-0 translate-y-full left-1/2 -translate-x-1/2' : 'top-0 -translate-y-full left-1/2 -translate-x-1/2')
        )"
        @mousedown.stop
        @click.stop="handleCollapse(index)"
      >
        <Icon
          :name="layout === 'horizontal'
            ? (collapsedStates[index] ? 'lucide:chevron-right' : 'lucide:chevron-left')
            : (collapsedStates[index] ? 'lucide:chevron-down' : 'lucide:chevron-up')"
          class="w-3 h-3"
        />
      </button>

      <!-- 右/下按钮：控制后一个面板 (index + 1) -->
      <button
        v-if="collapsible && !collapsedStates[index]"
        :class="cn(
          ui.collapseButton(),
          uiOverrides.collapseButton,
          layout === 'horizontal'
            ? (collapsedStates[index + 1] ? 'left-0 -translate-x-full top-1/2 -translate-y-1/2' : 'right-0 translate-x-full top-1/2 -translate-y-1/2')
            : (collapsedStates[index + 1] ? 'top-0 -translate-y-full left-1/2 -translate-x-1/2' : 'bottom-0 translate-y-full left-1/2 -translate-x-1/2')
        )"
        @mousedown.stop
        @click.stop="handleCollapse(index + 1)"
      >
        <Icon
          :name="layout === 'horizontal'
            ? (collapsedStates[index + 1] ? 'lucide:chevron-left' : 'lucide:chevron-right')
            : (collapsedStates[index + 1] ? 'lucide:chevron-up' : 'lucide:chevron-down')"
          class="w-3 h-3"
        />
      </button>
    </div>
  </div>

  <!-- 自定义折叠按钮插槽 -->
  <slot v-if="collapsible" name="start-collapsible" />
  <slot v-if="collapsible" name="end-collapsible" />
</template>
