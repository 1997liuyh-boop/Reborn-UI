<script setup lang="ts">
import type { chipColors, chipPositions, chipSizes, chipVariants } from './reborn-chip.config'
import { computed } from 'vue'
import { useBooleanModel } from '@/composables/useBooleanModel'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-chip.config'

defineOptions({
  name: 'RebornChip',
})

const props = withDefaults(defineProps<ChipProps>(), {
  color: 'primary',
  size: 'md',
  position: 'top-right',
  inset: false,
  standalone: false,
})

const b = tv(theme)

type Theme = typeof theme
type ChipColor = keyof Theme['variants']['color']
type ChipSize = keyof Theme['variants']['size']
type ChipPosition = keyof Theme['variants']['position']
type ChipVariant = typeof chipVariants[number]

export interface ChipProps {
  /** 语义色：solid / textDot 用作底色，outline / textOutline 用作描边与文字色 */
  color?: typeof chipColors[number]
  /** 尺寸档位，各变体的具体尺寸不同：圆点 8~12rpx、圆环外径 16~32rpx、文字角标高 32~48rpx */
  size?: typeof chipSizes[number]
  /**
   * 视觉变体：solid 实心圆点、outline 空心圆环、textDot 实心文字角标、textOutline 描边文字角标。
   * 不传时按 text 自动选择：有文本取 textDot，否则取 solid。
   */
  variant?: ChipVariant
  /** 角标文本，仅 textDot / textOutline 渲染；按真值判断，0 与空字符串都不显示 */
  text?: string | number
  /** 角标吸附在宿主的哪个角 */
  position?: typeof chipPositions[number]
  /** 为 true 时取消向外平移，角标整个落在宿主内部 */
  inset?: boolean
  /** 只给角标节点追加 absolute，而角标节点本身已是 absolute，目前没有可见效果 */
  standalone?: boolean
  /** 追加到根元素的自定义类名 */
  customClass?: any
}

/** 是否渲染角标节点，配合 `v-model:show` 同步；组件内部不会改写它 */
defineModel<boolean>('show', { default: undefined })
const show = useBooleanModel('show', true)

/** 实际生效的变体：未指定时按有无文本自动选择，「传 text 显示计数、不传显示圆点」的用法保持不变 */
const variant = computed<ChipVariant>(() => props.variant ?? (props.text ? 'textDot' : 'solid'))

/** 只有文字类变体渲染文本节点：solid / outline 的圆点只有 8~32rpx，放不下文字 */
const showLabel = computed(() => !!props.text && (variant.value === 'textDot' || variant.value === 'textOutline'))

const ui = computed(() => b({
  variant: variant.value,
  color: props.color as ChipColor,
  size: props.size as ChipSize,
  position: props.position as ChipPosition,
  inset: props.inset,
  standalone: props.standalone,
}))
</script>

<template>
  <view>
    <view :class="ui.root({ class: cn(props.customClass) })">
      <slot />
      <view v-if="show" :class="ui.base()">
        <text v-if="showLabel" :class="ui.label()">{{ props.text }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>

</style>
