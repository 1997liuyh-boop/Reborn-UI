<script setup lang="ts">
import { computed } from 'vue'
import theme from './chip'
import { tv } from '~/lib/tv'

const b = tv({ extend: tv(theme) })

type Theme = typeof theme

type ChipColor = keyof Theme['variants']['color']
type ChipSize = keyof Theme['variants']['size']
type ChipPosition = keyof Theme['variants']['position']
type ChipInset = keyof Theme['variants']['inset']
type ChipStandalone = keyof Theme['variants']['standalone']

export interface ChipProps {
  color?: ChipColor | (string & {})
  size?: ChipSize | (string & {})
  text?: string | number
  position?: ChipPosition | (string & {})
  inset?: ChipInset
  standalone?: ChipStandalone
  show?: boolean
  class?: any
  ui?: any
}

const props = withDefaults(defineProps<ChipProps>(), {
  color: 'primary',
  size: 'md',
  position: 'top-right',
  inset: false,
  standalone: false,
  show: true
})

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const ui = computed(() => b({
  color: props.color as ChipColor,
  size: props.size as ChipSize,
  position: props.position as ChipPosition,
  inset: props.inset as ChipInset,
  standalone: props.standalone as ChipStandalone
}))
</script>

<template>
  <span v-if="show" :class="ui.root({ class: props.class })">
    <slot />
    <span :class="ui.base()">
      <span v-if="props.text">
        {{ props.text }}
      </span>
    </span>
  </span>
</template>
