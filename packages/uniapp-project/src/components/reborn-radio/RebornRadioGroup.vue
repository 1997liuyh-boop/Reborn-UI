<script setup lang="ts">
import { provide, toRef } from 'vue'
import type { radioColors, radioSizes } from './reborn-radio.config'

interface Props {
  modelValue?: any
  disabled?: boolean
  size?: typeof radioSizes[number]
  color?: typeof radioColors[number]
  fill?: string // Support fill as an alias for color or custom color if needed, but for now map to color logic if it matches
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits(['update:modelValue', 'change'])

const updateValue = (value: any) => {
  emit('update:modelValue', value)
  emit('change', value)
}

provide('RebornRadioGroup', {
  modelValue: toRef(props, 'modelValue'),
  disabled: toRef(props, 'disabled'),
  size: toRef(props, 'size'),
  color: toRef(props, 'color'),
  updateValue
})
</script>

<template>
  <view class="reborn-radio-group flex flex-wrap gap-4">
    <slot />
  </view>
</template>
