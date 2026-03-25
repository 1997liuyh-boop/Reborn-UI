<script setup lang="ts">
import type { chipColors, chipPositions, chipSizes } from './reborn-chip.config'
import { computed } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-chip.config'

defineOptions({
  name: 'RebornChip',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ChipProps>(), {
  color: 'primary',
  size: 'md',
  position: 'top-right',
  show: true,
  inset: false,
  standalone: false,
})

const emit = defineEmits(['update:show'])

const b = tv(theme)

type Theme = typeof theme
type ChipColor = keyof Theme['variants']['color']
type ChipSize = keyof Theme['variants']['size']
type ChipPosition = keyof Theme['variants']['position']

export interface ChipProps {
  color?: typeof chipColors[number]
  size?: typeof chipSizes[number]
  text?: string | number
  position?: typeof chipPositions[number]
  show?: boolean
  inset?: boolean
  standalone?: boolean
  customClass?: any
}

const show = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value),
})

const ui = computed(() => b({
  color: props.color as ChipColor,
  size: props.size as ChipSize,
  position: props.position as ChipPosition,
  inset: props.inset,
  standalone: props.standalone,
}))
</script>

<template>
  <view :class="ui.root({ class: cn(props.customClass) })" style="background-color: tomato;">
    <slot />
    <view v-if="show" :class="ui.base()">
      <text v-if="props.text" :class="ui.label()">{{ props.text }}</text>
    </view>
  </view>
</template>

<style scoped>

</style>
