<script setup lang="ts">
import { provide, toRef } from 'vue'
import type { radioColors, radioSizes } from './reborn-radio.config'

export interface RadioGroupProps {
    modelValue?: any
    disabled?: boolean
    size?: (typeof radioSizes)[number]
    color?: (typeof radioColors)[number]
    class?: any
}

const props = withDefaults(defineProps<RadioGroupProps>(), {
    disabled: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void
    (e: 'change', value: any): void
}>()

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
    <div class="reborn-radio-group flex flex-wrap gap-4" :class="props.class" role="radiogroup">
        <slot />
    </div>
</template>
