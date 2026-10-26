<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { computed, inject, onBeforeUnmount, provide, watch } from 'vue'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import theme from './reborn-splitter.config'
import { parseSizeValue, splitterContextKey, splitterPanelPositionKey } from './reborn-splitter.context'

export interface SplitterPanelProps {
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
  collapsible: false,
})

defineSlots<{
  /** 面板内容 */
  default?: () => any
  /** 拖拽条内容 */
  'bar'?: () => any
  /** 起始折叠按钮（控制本面板）的内容，collapsed 为本面板是否已折叠 */
  'start-collapsible'?: (props: { collapsed: boolean }) => any
  /** 结束折叠按钮（控制后一个面板）的内容，collapsed 为后一个面板是否已折叠 */
  'end-collapsible'?: (props: { collapsed: boolean }) => any
}>()

/**
 * 面板尺寸（v-model:size），按百分比解析：数字与 '30%' 字符串都可以。
 * 初始布局由 Splitter 在渲染期读取它推导；之后父级改写会经 setPanelSize 与相邻面板重新分配。
 * update:size 在用户拖拽、折叠、父级改写引起相邻面板补偿，以及调整过之后增删面板引起相邻面板补偿时发出；
 * 载荷格式跟随传入值：传字符串回写 'xx%'，否则回写数字
 */
const size = defineModel<string | number>('size')

const b = tv(theme)

// 注入 Splitter 下发的只读状态与动作，以及本面板的位置
const context = inject(splitterContextKey, null)
const position = inject(splitterPanelPositionKey, null)
// 位置只下发给 Splitter 的直接子面板：面板内容里再放的面板拿不到它，不会顶替本面板登记
provide(splitterPanelPositionKey, null)

// 不是 Splitter 的直接子节点（外面包了元素或其他组件）时降级为普通容器：不参与尺寸分配，也不抛错中断整棵树的渲染
if ((!context || !position) && import.meta.dev) {
  console.warn('[RebornSplitterPanel] 面板必须是 RebornSplitter 默认插槽的直接子节点（可以经过 v-for / v-if / <template>），外面包了元素或其他组件时不参与尺寸分配')
}

const layout = computed(() => context?.layout.value ?? 'horizontal')

if (context && position) {
  /** 面板标识在实例生命周期内不变（Scope 以它为 key） */
  const panelKey = position.key.value

  const stopNotify = context.onPanelResize(panelKey, (next) => {
    size.value = typeof size.value === 'string' ? `${next}%` : next
  })

  // 父级改写尺寸：交给 Splitter 与相邻面板重新分配，总和保持 100%。
  // 父级把刚通知出去的值写回来时，它已等于面板当前尺寸，setPanelSize 会直接忽略，不需要另记「最近一次通知值」
  watch(size, (value) => {
    if (value === undefined || value === null || value === '') return
    const parsed = parseSizeValue(value)
    if (!Number.isFinite(parsed)) return
    context.setPanelSize(panelKey, parsed)
  })

  onBeforeUnmount(() => {
    stopNotify()
    context.releasePanel(panelKey)
  })
}

/** 未接入 Splitter 时不写尺寸，由内容与外层容器决定大小 */
const panelStyle = computed(() => {
  if (!position) return undefined
  const value = `${position.size.value}%`
  return {
    flex: `0 0 ${value}`,
    [layout.value === 'horizontal' ? 'width' : 'height']: value,
  }
})

const showBar = computed(() => !!position && position.index.value < position.count.value - 1)

/** 本面板与后一个面板都允许调整时，拖拽条才可拖动 */
const canResize = computed(() => props.resizable && !!position?.nextResizable.value)

const uiOverrides = computed(() => props.ui ?? {})

const ui = computed(() => b({
  layout: layout.value,
  resizable: props.resizable,
  collapsible: props.collapsible,
}))

interface ButtonLook { position: string, icon: string }

/** 起始折叠按钮（控制本面板）：按布局方向与本面板是否已折叠取定位类与图标 */
const START_BUTTON: Record<'horizontal' | 'vertical', Record<'expanded' | 'collapsed', ButtonLook>> = {
  horizontal: {
    expanded: { position: 'left-0 -translate-x-full top-1/2 -translate-y-1/2', icon: 'lucide:chevron-left' },
    collapsed: { position: 'right-0 translate-x-full top-1/2 -translate-y-1/2', icon: 'lucide:chevron-right' },
  },
  vertical: {
    expanded: { position: 'top-0 -translate-y-full left-1/2 -translate-x-1/2', icon: 'lucide:chevron-up' },
    collapsed: { position: 'bottom-0 translate-y-full left-1/2 -translate-x-1/2', icon: 'lucide:chevron-down' },
  },
}

/** 结束折叠按钮（控制后一个面板）：按布局方向与后一个面板是否已折叠取定位类与图标 */
const END_BUTTON: Record<'horizontal' | 'vertical', Record<'expanded' | 'collapsed', ButtonLook>> = {
  horizontal: {
    expanded: { position: 'right-0 translate-x-full top-1/2 -translate-y-1/2', icon: 'lucide:chevron-right' },
    collapsed: { position: 'left-0 -translate-x-full top-1/2 -translate-y-1/2', icon: 'lucide:chevron-left' },
  },
  vertical: {
    expanded: { position: 'bottom-0 translate-y-full left-1/2 -translate-x-1/2', icon: 'lucide:chevron-down' },
    collapsed: { position: 'top-0 -translate-y-full left-1/2 -translate-x-1/2', icon: 'lucide:chevron-up' },
  },
}

/** 起始按钮：后一个面板已折叠时隐藏（此时只能从结束按钮展开它） */
const startButton = computed(() => {
  const collapsed = !!position?.collapsed.value
  const look = START_BUTTON[layout.value][collapsed ? 'collapsed' : 'expanded']
  return {
    visible: props.collapsible && !!position && !position.nextCollapsed.value,
    collapsed,
    icon: look.icon,
    class: cn(ui.value.collapseButton(), uiOverrides.value.collapseButton, look.position),
  }
})

/** 结束按钮：本面板已折叠时隐藏 */
const endButton = computed(() => {
  const collapsed = !!position?.nextCollapsed.value
  const look = END_BUTTON[layout.value][collapsed ? 'collapsed' : 'expanded']
  return {
    visible: props.collapsible && !!position && !position.collapsed.value,
    collapsed,
    icon: look.icon,
    class: cn(ui.value.collapseButton(), uiOverrides.value.collapseButton, look.position),
  }
})

// 拖拽条与折叠按钮只在接入 Splitter 时渲染，以下处理函数里的判空只为类型收窄
function onBarPointerDown(event: PointerEvent) {
  if (canResize.value && position) context?.startDrag(position.index.value + 1, event)
}

function onBarPointerMove(event: PointerEvent) {
  context?.moveDrag(event)
}

function onBarPointerEnd(event: PointerEvent) {
  context?.endDrag(event)
}

function toggleStart() {
  if (position) context?.toggleCollapse(position.index.value)
}

function toggleEnd() {
  if (position) context?.toggleCollapse(position.index.value + 1)
}
</script>

<template>
  <div
    :class="cn(ui.panel(), uiOverrides.panel, props.class)"
    :style="panelStyle"
  >
    <div class="flex-1 min-w-0 min-h-0 overflow-hidden">
      <slot />
    </div>

    <!-- 拖拽条：按下后捕获指针，移动与松开都派发到这里 -->
    <div
      v-if="showBar"
      :class="cn(ui.bar(), uiOverrides.bar)"
      @pointerdown="onBarPointerDown"
      @pointermove="onBarPointerMove"
      @pointerup="onBarPointerEnd"
      @pointercancel="onBarPointerEnd"
      @lostpointercapture="onBarPointerEnd"
    >
      <slot name="bar" />

      <!-- 起始按钮：控制本面板；插槽替换按钮内容，按钮本身的定位与点击仍由组件负责 -->
      <button
        v-if="startButton.visible"
        type="button"
        :class="startButton.class"
        @pointerdown.stop
        @click.stop="toggleStart"
      >
        <slot name="start-collapsible" :collapsed="startButton.collapsed">
          <Icon :name="startButton.icon" class="size-3" />
        </slot>
      </button>

      <!-- 结束按钮：控制后一个面板 -->
      <button
        v-if="endButton.visible"
        type="button"
        :class="endButton.class"
        @pointerdown.stop
        @click.stop="toggleEnd"
      >
        <slot name="end-collapsible" :collapsed="endButton.collapsed">
          <Icon :name="endButton.icon" class="size-3" />
        </slot>
      </button>
    </div>
  </div>
</template>
