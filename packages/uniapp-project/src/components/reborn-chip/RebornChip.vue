<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { tv } from '@/lib/tv'
import theme, { chipColors, chipSizes, chipPositions } from './reborn-chip.config'

defineOptions({
  name: 'reborn-chip',
  inheritAttrs: false
})

const b = tv(theme)

export interface ChipProps {
  color?: typeof chipColors[number]
  size?: typeof chipSizes[number]
  text?: string | number
  position?: typeof chipPositions[number]
  inset?: boolean
  standalone?: boolean
  show?: boolean
  customClass?: any
}

const props = withDefaults(defineProps<ChipProps>(), {
  color: 'primary',
  size: 'md',
  position: 'top-right',
  inset: false,
  standalone: false,
  show: true
})

const emit = defineEmits(['update:show'])

const show = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value)
})

const ui = computed(() => {
  const styles = b({
    color: props.color,
    size: props.size,
    position: props.position,
    inset: props.inset,
    standalone: props.standalone
  })

  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class) }),
    base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class) })
  }
})
</script>

<template>
  <view v-if="show" :class="ui.root({ class: cn(props.customClass) })">
    <slot />
    <view :class="ui.base()">
      <text v-if="props.text">{{ props.text }}</text>
    </view>
  </view>
</template>

<style scoped></style>
