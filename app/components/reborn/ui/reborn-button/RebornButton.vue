<script setup lang="ts">
import { computed, toRef } from 'vue'
import RebornLoading from '../reborn-loading/RebornLoading.vue'
import theme, { buttonColors, buttonVariants, buttonSizes } from './reborn-button.config'
import { useFieldGroup } from '~/composables/useFieldGroup'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'


export interface ButtonProps {
    label?: string
    color?: typeof buttonColors[number]
    variant?: typeof buttonVariants[number]
    size?: typeof buttonSizes[number]
    loading?: boolean
    disabled?: boolean
    round?: boolean
    class?: any
    ui?: any
    gap?: boolean // 是否间隔按钮
    circle?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), {
    color: 'primary',
    variant: 'solid',
    size: 'md',
    loading: false,
    disabled: false,
    round: true,
    gap: false,
    circle: false
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

const loadingColor = computed(() => {
    if (props.variant === 'solid') return 'white'
    return props.color
})

const loadingSize = computed(() => {
    const sizeMap: Record<string, number> = {
        'xs': 14,
        'sm': 16,
        'default': 18,
        'md': 18,
        'lg': 20,
        'xl': 22,
        '2xl': 24,
    }
    return sizeMap[size.value] || 18
})

const isIconOnly = computed(() => {
    return props.circle || (!props.label && !slots.default)
})

const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
    const styles = b({
        color: color.value,
        variant: variant.value,
        size: (fieldGroupSize.value || size.value) as any,
        fieldGroup: orientation.value,
        gap: props.gap,
        disabled: props.disabled,
        round: props.round,
        circle: props.circle
    })

    return {
        base: (opts?: { class?: any }) => styles.base({
            class: cn(
                opts?.class,
                props.loading ? 'opacity-80' : '',
                uiOverrides.value.base
            )
        }),
        label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
        leadingIcon: (opts?: { class?: any }) => styles.leadingIcon({ class: cn(opts?.class, uiOverrides.value.leadingIcon) }),
        leadingAvatar: (opts?: { class?: any }) => styles.leadingAvatar({ class: cn(opts?.class, uiOverrides.value.leadingAvatar) }),
        leadingAvatarSize: (opts?: { class?: any }) => styles.leadingAvatarSize({ class: cn(opts?.class, uiOverrides.value.leadingAvatarSize) }),
        trailingIcon: (opts?: { class?: any }) => styles.trailingIcon({ class: cn(opts?.class, uiOverrides.value.trailingIcon) }),
    }
})
</script>

<template>
    <button :disabled="isDisabled" :class="ui.base({ class: props.class })" v-bind="$attrs">
        <!-- Leading / Spinner -->
        <template v-if="props.loading">
            <RebornLoading :color="loadingColor" :size="loadingSize" :class="ui.leadingIcon()" />
        </template>
        <slot v-else name="leading" :ui="ui" />

        <!-- Content -->
        <template v-if="!isIconOnly || !props.loading">
            <slot :ui="ui">
                <span v-if="label" :class="ui.label()">
                    {{ label }}
                </span>
                <slot v-else :ui="ui" />
            </slot>
        </template>

        <!-- Trailing -->
        <slot v-if="!props.loading" name="trailing" :ui="ui.trailingIcon()" />
    </button>
</template>
