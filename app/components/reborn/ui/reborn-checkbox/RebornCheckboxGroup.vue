<script setup lang="ts">
import { provide, toRef, computed } from 'vue'
import type { checkboxColors, checkboxSizes } from './reborn-checkbox.config'
import { useFormInject } from "~/composables/useFieldGroup";

export interface CheckboxGroupProps {
    modelValue?: any[]
    disabled?: boolean
    size?: (typeof checkboxSizes)[number]
    color?: (typeof checkboxColors)[number]
    class?: any
}

const props = withDefaults(defineProps<CheckboxGroupProps>(), {
    modelValue: () => [],
    disabled: false,
    size: "md",
    color: "primary",
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: any[]): void
    (e: 'change', value: any[]): void
}>()

const {
    disabled: fieldGroupDisabled,
    size: fieldGroupSize,
    isError,
    validate
} = useFormInject(props);

const updateValue = (value: any) => {
    const nextValue = [...(props.modelValue || [])]
    const index = nextValue.indexOf(value)
    if (index > -1) {
        nextValue.splice(index, 1)
    } else {
        nextValue.push(value)
    }
    emit('update:modelValue', nextValue)
    emit('change', nextValue)
    validate('change')
}

provide('RebornCheckboxGroup', {
    modelValue: toRef(props, 'modelValue'),
    disabled: computed(() => fieldGroupDisabled.value || props.disabled),
    size: computed(() => fieldGroupSize.value || props.size),
    color: toRef(props, 'color'),
    isError: isError,
    updateValue
})
</script>

<template>
    <div class="reborn-checkbox-group flex flex-wrap gap-4" :class="props.class" role="group">
        <slot />
    </div>
</template>
