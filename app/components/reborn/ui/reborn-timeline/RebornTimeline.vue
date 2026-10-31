<script setup lang="ts">
import type { VNode } from 'vue'
import type { TimelineDirection, TimelineItemData, TimelineSize, TimelineUI, TimelineVariant } from './reborn-timeline.config'
import { Comment, computed, Fragment, h, isVNode, onBeforeUpdate, provide, shallowRef, useSlots } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { TIMELINE_INJECTION_KEY } from './reborn-timeline.config'
import RebornTimelineItem from './RebornTimelineItem.vue'

export interface RebornTimelineProps {
    /** 节点数据，传入后由组件驱动渲染，无需再手写 RebornTimelineItem */
    items?: TimelineItemData[]
    /** 时间轴方向 */
    direction?: TimelineDirection
    /** 节点尺寸：sm 8px、md 12px、lg 16px，单个节点可覆盖 */
    size?: TimelineSize
    /** 节点样式：实心或空心，单个节点可覆盖 */
    variant?: TimelineVariant
    /** 是否倒序排列节点 */
    reverse?: boolean
    /** 细粒度样式覆盖对象，会级联到所有节点 */
    ui?: TimelineUI
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<RebornTimelineProps>(), {
    direction: 'vertical',
    size: 'md',
    variant: 'solid',
    reverse: false,
    ui: () => ({})
})

const slots = useSlots()

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

const b = tv(theme)

/** items 模式只挑出节点组件声明过的字段，数据里的 id、userId 等业务字段不会透传成每个 li 上的 DOM 属性 */
function toItemProps(item: TimelineItemData, index: number) {
    return {
        key: item.key ?? index,
        class: item.class,
        timestamp: item.timestamp,
        color: item.color,
        size: item.size,
        variant: item.variant,
        content: item.content,
        dangerouslyUseHTMLString: item.dangerouslyUseHTMLString,
        icon: item.icon,
        loading: item.loading,
        labelPosition: item.labelPosition,
        placement: item.placement,
        ui: item.ui
    }
}

/** 一次读取节点与轨道，服务端不依赖子级 setup 的登记副作用。 */
function getView() {
    let nodes = props.items?.length
        ? orderedItems.value.map((item, index) => h(RebornTimelineItem, toItemProps(item, index)))
        : flattenNodes(slots.default?.() ?? [])
    // 插槽模式的倒序：直接翻转插槽渲染出的节点，而不是用 CSS order 或 flex-reverse，
    // DOM 顺序与视觉顺序始终一致，键盘与读屏顺序都不需要额外换算
    if (!props.items?.length && props.reverse) nodes = [...nodes].reverse()
    const sides = nodes.map(node => node.props?.labelPosition ?? node.props?.['label-position'] ?? 'right')
    const hasLeft = sides.includes('left')
    const columns = hasLeft ? (sides.includes('right') ? 'both' : 'start') : 'end'
    const styles = b({
        direction: props.direction,
        columns: props.direction === 'vertical' ? columns : undefined
    })
    return { nodes, rootClass: styles.root({ class: cn(props.ui?.root) }) }
}

/**
 * 视图放进 computed，根节点保持单个 ol：组件 $el 指向真实元素，外层 Transition 也能作用于它。
 * 父级替换插槽函数时会强制本组件更新，更新前让缓存失效；插槽内容读到的响应式状态由 computed 自己追踪
 */
const slotVersion = shallowRef(0)
onBeforeUpdate(() => { slotVersion.value++ })
const view = computed(() => {
    void slotVersion.value
    return getView()
})

/** 节点作为显式输入，条件插槽与父级循环更新都会触发当前视图更新。 */
function TimelineNodes(input: { nodes: VNode[] }) { return input.nodes }

provide(TIMELINE_INJECTION_KEY, {
    direction: computed(() => props.direction),
    size: computed(() => props.size),
    variant: computed(() => props.variant),
    ui: computed(() => props.ui || {})
})
</script>

<template>
  <ol v-bind="$attrs" :class="view.rootClass">
    <TimelineNodes :nodes="view.nodes" />
  </ol>
</template>
