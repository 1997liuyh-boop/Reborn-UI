<script setup lang="ts">
import { computed } from 'vue'
import theme from './badge'
import { useFieldGroup } from '~/composables/useFieldGroup'
import { tv } from '~/lib/tv'

// Define the variant builder
const b = tv({ extend: tv(theme) })

// Derive types directly from the theme object to ensure static analysis works
type Theme = typeof theme
type BadgeColor = keyof Theme['variants']['color']
type BadgeVariant = keyof Theme['variants']['variant']
type BadgeSize = keyof Theme['variants']['size']

export interface BadgeProps {
    /**
     * The element or component this component should render as.
     * @defaultValue 'span'
     */
    as?: any
    label?: string | number
    /**
     * @defaultValue 'primary'
     */
    color?: BadgeColor | (string & {})
    /**
     * @defaultValue 'solid'
     */
    variant?: BadgeVariant | (string & {})
    /**
     * @defaultValue 'md'
     */
    size?: BadgeSize | (string & {})
    /** Render the badge with equal padding on all sides. */
    square?: boolean
    /** Whether the badge is closable. */
    closable?: boolean
    /** The icon for the close button. */
    closeIcon?: string
    class?: any
    ui?: any
}

export interface BadgeSlots {
    leading(props: { ui: any }): any
    default(props: { ui: any }): any
    trailing(props: { ui: any }): any
    close(props: { ui: any; close: (e: MouseEvent) => void }): any
}

const props = withDefaults(defineProps<BadgeProps>(), {
    as: 'span',
    color: 'primary',
    variant: 'solid',
    size: 'md',
    closeIcon: 'i-lucide-x'
})

const slots = defineSlots<BadgeSlots>()

const emit = defineEmits<{
    close: [payload: MouseEvent]
}>()

const show = defineModel<boolean>('show', { default: true })

const { orientation, size: fieldGroupSize } = useFieldGroup(props)

const ui = computed(() => b({
    color: props.color as BadgeColor,
    variant: props.variant as BadgeVariant,
    size: (fieldGroupSize.value || props.size) as BadgeSize,
    square: props.square || (!slots.default && !props.label),
    fieldGroup: orientation.value
}))

const handleClose = (e: MouseEvent) => {
    show.value = false
    emit('close', e)
}
</script>

<template>
    <component :is="props.as" v-if="show" :class="ui.base({ class: props.class })">
        <slot name="leading" :ui="ui" />

        <slot :ui="ui">
            <span v-if="label" :class="ui.label()">
                {{ label }}
            </span>
        </slot>

        <slot name="trailing" :ui="ui" />

        <span v-if="closable" @click.stop="handleClose" :class="ui.closeButton()">
            <slot name="close" :ui="ui" :close="handleClose">
                <Icon :name="closeIcon" class="size-3" />
            </slot>
        </span>
    </component>
</template>
