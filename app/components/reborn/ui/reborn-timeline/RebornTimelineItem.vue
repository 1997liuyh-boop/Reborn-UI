<script setup lang="ts">
import type { Component } from 'vue'
import type { TimelineLabelPosition, TimelinePlacement, TimelinePresetColor, TimelineUI } from './reborn-timeline.config'
import { computed, inject, onBeforeUnmount, useSlots, watchEffect } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { TIMELINE_INJECTION_KEY, TIMELINE_PRESET_COLORS } from './reborn-timeline.config'

export interface RebornTimelineItemProps {
    /** 时间戳文本 */
    timestamp?: string
    /** 节点颜色：primary / secondary / success / info / warning / error / neutral，或任意 CSS 色值 */
    color?: TimelinePresetColor | (string & {})
    /** 节点内容，按 HTML 渲染；默认插槽或 content 插槽存在时忽略 */
    content?: string
    /** 自定义节点图标：Iconify 名称或组件 */
    icon?: string | Component
    /** 是否为加载中节点，节点底圆内显示旋转的加载图标 */
    loading?: boolean
    /** 内容位于轴线的哪一侧，仅 vertical 方向生效 */
    labelPosition?: TimelineLabelPosition
    /** 时间戳位置：top / bottom 堆叠在内容上下，left / right 放到轴线的对应一侧 */
    placement?: TimelinePlacement
    /** 细粒度样式覆盖对象，优先级高于父组件的 ui */
    ui?: TimelineUI
}

const props = withDefaults(defineProps<RebornTimelineItemProps>(), {
    color: 'primary',
    loading: false,
    labelPosition: 'right',
    placement: 'bottom',
    ui: () => ({})
})

const slots = useSlots()
const context = inject<any>(TIMELINE_INJECTION_KEY, null)

// --- 登记：向父组件上报内容侧，父组件据此决定竖向网格的列轨道 ---
const itemId = context ? context.registerItem() : -1
watchEffect(() => context?.reportSide(itemId, props.labelPosition))
onBeforeUnmount(() => context?.unregisterItem(itemId))

const direction = computed(() => context?.direction ?? 'vertical')
const isVertical = computed(() => direction.value === 'vertical')

// --- 时间戳落位 ---
/**
 * 竖向：top / bottom 堆叠在内容上下；left / right 按轴线两侧理解——
 * 与内容同侧时和内容并排、贴在远离轴线的一端，与内容异侧时越过轴线放进对侧格。
 * 横向：top 越过轴线放到上方，bottom 堆叠在内容下方，left / right 与内容同行并排。
 */
const hasTimestamp = computed(() => !!slots.timestamp || !!props.timestamp)

const timestampSlot = computed<'opposite' | 'before' | 'after'>(() => {
    const placement = props.placement
    if (isVertical.value) {
        if (placement === 'top') { return 'before' }
        if (placement === 'bottom') { return 'after' }
        if (placement !== props.labelPosition) { return 'opposite' }
        // 同侧并排：右侧内容的时间戳排在后面，左侧内容的时间戳排在前面，都远离轴线
        return placement === 'right' ? 'after' : 'before'
    }
    if (placement === 'top') { return 'opposite' }
    return placement === 'left' ? 'before' : 'after'
})

const flow = computed(() => {
    const placement = props.placement
    return placement === 'left' || placement === 'right' ? 'inline' : 'stacked'
})

// --- 颜色 ---
/** 用自有属性判断而不是 in：避免 toString 之类的原型属性被误认成预设色 */
const presetColor = computed(() =>
    Object.prototype.hasOwnProperty.call(TIMELINE_PRESET_COLORS, props.color)
        ? TIMELINE_PRESET_COLORS[props.color as TimelinePresetColor]
        : null
)

/** 非预设色走内联样式，作为实心圆的填充色 */
const customColorStyle = computed(() => (presetColor.value ? undefined : { backgroundColor: props.color }))

const hasIcon = computed(() => !!slots.icon || !!props.icon || props.loading)
const hasContent = computed(() => !!slots.default || !!slots.content || !!props.content)

// --- 样式计算：类名优先级为 config 基础类 < 父组件 ui < 本节点 ui ---
const b = tv(theme)
const ui = computed(() => {
    const styles = b({
        direction: direction.value,
        side: isVertical.value ? props.labelPosition : undefined,
        iconed: hasIcon.value,
        flow: flow.value
    })
    const inherited: TimelineUI = context?.ui || {}
    const own = props.ui || {}
    const slot = (key: keyof TimelineUI) => (opts?: { class?: any }) =>
        (styles as any)[key]({ class: cn(opts?.class, inherited[key], own[key]) }) as string
    return {
        item: slot('item'),
        axis: slot('axis'),
        dotWrapper: slot('dotWrapper'),
        dot: slot('dot'),
        icon: slot('icon'),
        line: slot('line'),
        body: slot('body'),
        opposite: slot('opposite'),
        content: slot('content'),
        timestamp: slot('timestamp')
    }
})
</script>

<template>
  <li :class="ui.item()">
    <!-- 对侧格：只在时间戳越过轴线时渲染，空格子不占列宽 -->
    <div v-if="hasTimestamp && timestampSlot === 'opposite'" :class="ui.opposite()">
      <div :class="ui.timestamp()">
        <slot name="timestamp">{{ props.timestamp }}</slot>
      </div>
    </div>

    <!-- 轴线格：连接线在前、节点在后，节点叠在线上方 -->
    <div :class="ui.axis()">
      <span :class="ui.line()" aria-hidden="true" />
      <div :class="ui.dotWrapper()">
        <!-- 实心圆：带图标时放大为底圆，图标（含 icon 插槽内容）以白色居中 -->
        <span :class="ui.dot({ class: presetColor })" :style="customColorStyle">
          <template v-if="hasIcon">
            <slot name="icon">
              <Icon v-if="props.loading" name="lucide:loader-circle" :class="ui.icon({ class: 'animate-spin' })" />
              <component :is="props.icon" v-else-if="typeof props.icon !== 'string'" :class="ui.icon()" />
              <Icon v-else :name="props.icon" :class="ui.icon()" />
            </slot>
          </template>
        </span>
      </div>
    </div>

    <!-- 内容格：内容以及同侧的时间戳 -->
    <div :class="ui.body()">
      <div v-if="hasTimestamp && timestampSlot === 'before'" :class="ui.timestamp()">
        <slot name="timestamp">{{ props.timestamp }}</slot>
      </div>
      <div v-if="hasContent" :class="ui.content()">
        <slot name="content">
          <slot>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="props.content" />
          </slot>
        </slot>
      </div>
      <div v-if="hasTimestamp && timestampSlot === 'after'" :class="ui.timestamp()">
        <slot name="timestamp">{{ props.timestamp }}</slot>
      </div>
    </div>
  </li>
</template>
