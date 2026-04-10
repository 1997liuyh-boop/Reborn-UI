<script setup lang="ts">
import { computed } from 'vue'
import theme, { badgeColors, badgeVariants, badgeSizes } from './reborn-badge.config'
import RebornTransition from '../reborn-transition/RebornTransition.vue'
import { useFormInject } from '~/composables/useFieldGroup'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'

// 定义变体构建器
const b = tv({ extend: tv(theme) })

// 直接从主题对象派生类型，以确保静态分析正常工作
type BadgeColor = (typeof badgeColors)[number]
type BadgeVariant = (typeof badgeVariants)[number]
type BadgeSize = (typeof badgeSizes)[number]

export interface UiProps {
    root?: string
    base?: string
    label?: string
    leadingIcon?: string
    trailingIcon?: string
    closeButton?: string
    closeIcon?: string
}

export interface BadgeProps {
    /**
     * 该组件应渲染为的元素或组件。
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
    /** 渲染徽章时各边具有相等的内边距。 */
    square?: boolean
    /** 徽章是否可关闭。 */
    closable?: boolean
    /** 关闭按钮的图标。 */
    closeIcon?: string
    /** 徽章之间的间距。 */
    gap?: boolean
    /**
     * 关闭前的钩子。返回 false 或返回 rejected 的 promise 将停止关闭。
     */
    beforeClose?: (e: MouseEvent) => boolean | Promise<boolean>
    class?: any
    ui?: UiProps
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
    closeIcon: 'i-lucide-x',
    gap: false
})

const slots = defineSlots<BadgeSlots>()

const emit = defineEmits<{
    close: [payload: MouseEvent]
}>()

const show = defineModel<boolean>('show', { default: true })

const { orientation, size: fieldGroupSize } = useFormInject(props)

const uiOverrides = computed(() => props.ui || {})
const ui = computed(() => {
    const styles = b({
        color: props.color as BadgeColor,
        variant: props.variant as BadgeVariant,
        size: (fieldGroupSize.value || props.size) as BadgeSize,
        square: props.square || (!slots.default && !props.label),
        gap: props.gap,
        fieldGroup: orientation.value
    })
    return {
        root: (opts?: any) => styles.root({ class: cn(opts?.class, uiOverrides.value.root, props.class) }),
        base: (opts?: any) => styles.base({ class: cn(opts?.class, uiOverrides.value.base, props.class) }),
        label: (opts?: any) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
        leadingIcon: (opts?: any) => styles.leadingIcon({ class: cn(opts?.class, uiOverrides.value.leadingIcon) }),
        trailingIcon: (opts?: any) => styles.trailingIcon({ class: cn(opts?.class, uiOverrides.value.trailingIcon) }),
        closeButton: (opts?: any) => styles.closeButton({ class: cn(opts?.class, uiOverrides.value.closeButton) }),
        closeIcon: (opts?: any) => styles.closeIcon({ class: cn(opts?.class, uiOverrides.value.closeIcon) })
    }
})

const handleClose = async (e: MouseEvent) => {
    if (props.beforeClose) {
        try {
            const result = await props.beforeClose(e)
            if (result === false) return
        } catch (error) {
            return
        }
    }
    show.value = false
    emit('close', e)
}
</script>

<template>
    <RebornTransition :show="show" name="badge-custom" :duration="200" :class="ui.root()" custom-class="inline-flex">
        <component :is="props.as" :class="ui.base({ class: props.class })">
            <slot name="leading" :ui="ui" />

            <span :class="ui.label()">
                <slot :ui="ui">
                    <span v-if="label">
                        {{ label }}
                    </span>
                </slot>
            </span>

            <slot name="trailing" :ui="ui" />

            <span v-if="closable" @click.stop="handleClose" :class="ui.closeButton()">
                <slot name="close" :ui="ui" :close="handleClose">
                    <Icon :name="closeIcon" :class="ui.closeIcon()" />
                </slot>
            </span>
        </component>
    </RebornTransition>
</template>
