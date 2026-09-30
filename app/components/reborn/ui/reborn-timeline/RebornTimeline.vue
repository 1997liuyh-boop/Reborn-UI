<script setup lang="ts">
import type { VNode } from 'vue'
import type { TimelineDirection, TimelineItemData, TimelineLabelPosition, TimelineUI } from './reborn-timeline.config'
import { Comment, computed, Fragment, isVNode, provide, reactive, ref, useSlots } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { TIMELINE_INJECTION_KEY } from './reborn-timeline.config'
import RebornTimelineItem from './RebornTimelineItem.vue'

export interface RebornTimelineProps {
    /** 节点数据，传入后由组件驱动渲染，无需再手写 RebornTimelineItem */
    items?: TimelineItemData[]
    /** 时间轴方向 */
    direction?: TimelineDirection
    /** 是否倒序排列节点 */
    reverse?: boolean
    /** 细粒度样式覆盖对象，会级联到所有节点 */
    ui?: TimelineUI
}

const props = withDefaults(defineProps<RebornTimelineProps>(), {
    direction: 'vertical',
    reverse: false,
    ui: () => ({})
})

const slots = useSlots()

// --- 节点登记：只收集各节点的内容侧，用来决定竖向网格的列轨道 ---
/**
 * 根因：竖向布局要让所有节点的轴线落在同一列，列宽取决于「内容是否出现在左侧 / 右侧」，
 * 而默认插槽里的节点由使用者书写，父组件拿不到它们的 label-position。
 * 方案：节点在 setup 阶段登记，并持续上报自己的内容侧；这里只关心集合，不关心顺序，
 * 所以节点的增删、重排都不会让结果失真。
 */
const itemSides = ref<Record<number, TimelineLabelPosition>>({})
let idSeed = 0

function registerItem() {
    return ++idSeed
}

function unregisterItem(id: number) {
    const next = { ...itemSides.value }
    delete next[id]
    itemSides.value = next
}

function reportSide(id: number, side: TimelineLabelPosition) {
    if (itemSides.value[id] === side) { return }
    itemSides.value = { ...itemSides.value, [id]: side }
}

const columns = computed(() => {
    const sides = Object.values(itemSides.value)
    const hasLeft = sides.includes('left')
    const hasRight = sides.includes('right')
    if (hasLeft && hasRight) { return 'both' }
    return hasLeft ? 'start' : 'end'
})

// --- 倒序 ---
/** items 模式直接翻转数据，DOM 顺序即视觉顺序 */
const orderedItems = computed(() => {
    const list = props.items || []
    return props.reverse ? [...list].reverse() : list
})

/** 展开 v-for / template 产生的 Fragment，丢弃注释节点，得到平铺的节点列表 */
function flattenNodes(nodes: unknown[]): VNode[] {
    return nodes.flatMap((node) => {
        if (!isVNode(node) || node.type === Comment) { return [] }
        if (node.type === Fragment && Array.isArray(node.children)) {
            return flattenNodes(node.children)
        }
        return [node]
    })
}

/**
 * 插槽模式的倒序：直接翻转插槽渲染出的节点，而不是用 CSS order 或 flex-reverse。
 * 这样 DOM 顺序与视觉顺序始终一致，键盘与读屏顺序都不需要额外换算。
 */
function SlotItems() {
    const nodes = flattenNodes(slots.default?.() ?? [])
    return props.reverse ? nodes.reverse() : nodes
}

// --- 样式计算 ---
const b = tv(theme)
const ui = computed(() => {
    const styles = b({
        direction: props.direction,
        columns: props.direction === 'vertical' ? columns.value : undefined
    })
    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.ui?.root) })
    }
})

const context = reactive({
    direction: computed(() => props.direction),
    ui: computed(() => props.ui || {}),
    registerItem,
    unregisterItem,
    reportSide
})

provide(TIMELINE_INJECTION_KEY, context)
</script>

<template>
  <ol :class="ui.root()">
    <!-- items 模式：节点由组件渲染 -->
    <template v-if="props.items?.length">
      <RebornTimelineItem
        v-for="(item, index) in orderedItems"
        :key="item.key ?? index"
        :class="item.class"
        :timestamp="item.timestamp"
        :color="item.color"
        :content="item.content"
        :icon="item.icon"
        :loading="item.loading"
        :label-position="item.labelPosition"
        :placement="item.placement"
        :ui="item.ui"
      />
    </template>

    <!-- 默认插槽模式：使用者自行书写 RebornTimelineItem -->
    <SlotItems v-else />
  </ol>
</template>
