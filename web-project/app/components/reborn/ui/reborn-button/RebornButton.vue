<script setup lang="ts">
import { computed, toRef } from 'vue'
import theme, { buttonColors, buttonVariants, buttonSizes } from './reborn-button.config'
import { useFieldGroup } from '~/composables/useFieldGroup'
import { tv } from '~/lib/tv'

const b = tv(theme)

export interface ButtonProps {
    label?: string
    color?: typeof buttonColors[number]
    variant?: typeof buttonVariants[number]
    size?: typeof buttonSizes[number]
    loading?: boolean
    disabled?: boolean
    square?: boolean
    class?: any
    ui?: any
}

const props = withDefaults(defineProps<ButtonProps>(), {
    color: 'primary',
    variant: 'solid',
    size: 'md',
    loading: false,
    disabled: false,
    square: false
})

const slots = defineSlots<{
    leading(props: { ui: any }): any
    default(props: { ui: any }): any
    trailing(props: { ui: any }): any
}>()

const { orientation, size: fieldGroupSize } = useFieldGroup(props)

const isDisabled = computed(() => props.disabled || props.loading)

const color = toRef(props, 'color')
const variant = toRef(props, 'variant')
const size = toRef(props, 'size')
const square = toRef(props, 'square')

const ui = computed(() => b({
    color: color.value,
    variant: variant.value,
    size: (fieldGroupSize.value || size.value) as any,
    square: square.value,
    fieldGroup: orientation.value
}))
</script>

<template>
    <button :disabled="isDisabled" :class="ui.base({ class: props.class })" v-bind="$attrs">
        <slot name="leading" :ui="ui">
            <Icon name="svg-spinners:270-ring" v-if="props.loading" :class="ui.leadingIcon()" />
        </slot>

        <slot :ui="ui">
            <span v-if="label" :class="ui.base()">
                {{ label }}
            </span>
            <slot v-else :ui="ui" />
        </slot>


        <slot name="trailing" :ui="ui" />
    </button>
</template>
