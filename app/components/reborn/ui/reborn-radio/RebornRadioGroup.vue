<script setup lang="ts">
import { provide, toRef } from 'vue'
import type { radioColors, radioSizes } from './reborn-radio.config'

export interface RadioGroupProps {
    modelValue?: any
    disabled?: boolean
    size?: (typeof radioSizes)[number]
    color?: (typeof radioColors)[number]
    variant?: "simple" | "circle";
    activeIcon?: string;
    inactiveIcon?: string;
    showIcon?: boolean;
    class?: any
}

const props = withDefaults(defineProps<RadioGroupProps>(), {
    disabled: false,
    size: "md",
    color: "primary",
    variant: "simple",
    activeIcon: "i-lucide-check",
    inactiveIcon: "",
    showIcon: true,
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
    variant: toRef(props, 'variant'),
    activeIcon: toRef(props, 'activeIcon'),
    inactiveIcon: toRef(props, 'inactiveIcon'),
    showIcon: toRef(props, 'showIcon'),
    updateValue
})
</script>

<template>
    <div class="reborn-radio-group flex flex-wrap gap-4" :class="props.class" role="radiogroup">
        <slot />
    </div>
</template>
