<script setup lang="ts">
import { computed } from 'vue'
import theme from './reborn-chip.config'
import { tv } from '~/lib/tv'

const b = tv(theme)

type Theme = typeof theme

type ChipColor = keyof Theme['variants']['color']
type ChipSize = keyof Theme['variants']['size']
type ChipPosition = keyof Theme['variants']['position']

export interface ChipProps {
  color?: ChipColor | (string & {})
  size?: ChipSize | (string & {})
  text?: string | number
  position?: ChipPosition | (string & {})
  show?: boolean
  class?: any
  ui?: any
}

const props = withDefaults(defineProps<ChipProps>(), {
  color: 'primary',
  size: 'md',
  position: 'top-right',
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
}))
</script>

<template>
  <span :class="ui.root({ class: props.class })">
    <slot />
    <span v-if="show" :class="ui.base()">
      <span v-if="props.text">
        {{ props.text }}
      </span>
    </span>
  </span>
</template>
