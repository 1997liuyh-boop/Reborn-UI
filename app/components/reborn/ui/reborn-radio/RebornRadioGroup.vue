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

const {
    disabled: fieldGroupDisabled,
    size: fieldGroupSize,
    isError,
    validate
} = useFormInject(props);

const updateValue = (value: any) => {
    emit('update:modelValue', value)
    emit('change', value)
    validate('change')
}

provide('RebornRadioGroup', {
    modelValue: toRef(props, 'modelValue'),
    disabled: computed(() => fieldGroupDisabled.value || props.disabled),
    size: computed(() => fieldGroupSize.value || props.size),
    color: toRef(props, 'color'),
    isError: isError,
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
