<script setup lang="ts">
import type { badgeColors, badgeSizes, badgeVariants } from './reborn-badge.config';
import { computed } from 'vue'
import { useFormInject } from '~/composables/useFieldGroup'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import RebornTransition from '../reborn-transition/RebornTransition.vue'
import theme from './reborn-badge.config'

const props = withDefaults(defineProps<BadgeProps>(), {
    as: 'span',
    color: 'primary',
    variant: 'filled',
    size: 'md',
    closeIcon: 'i-lucide-x',
    circle: false,
    gap: false
})

const emit = defineEmits<{
    close: [payload: MouseEvent]
    click: [payload: MouseEvent]
    change: [checked: boolean]
}>()

const slots = defineSlots<BadgeSlots>()

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
     * @defaultValue 'filled'
     */
    variant?: BadgeVariant | (string & {})
    /**
     * @defaultValue 'md'
     */
    size?: BadgeSize | (string & {})
    /** 使用无内边距的正方形比例。 */
    square?: boolean
    /** 圆角标签：与按钮一致变为全圆角胶囊。 */
    round?: boolean
    /** 固定等宽高的圆形，优先于 round 与 square；适合短数字或单个图标。 */
    circle?: boolean
    /** 可选中模式：作为类复选框的 Check Tag 使用，配合 v-model:checked。 */
    check?: boolean
    /** 是否禁用（可选中模式下屏蔽选中与关闭交互）。 */
    disabled?: boolean
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
    leading: (props: { ui: any }) => any
    default: (props: { ui: any }) => any
    trailing: (props: { ui: any }) => any
    close: (props: { ui: any; close: (e: MouseEvent) => void }) => any
}

const show = defineModel<boolean>('show', { default: true })
/** 可选中模式的选中态：默认 false，未传 v-model:checked 时走内部非受控状态 */
const checked = defineModel<boolean>('checked', { default: false })

const { orientation, size: fieldGroupSize } = useFormInject(props)

/** 数字零是有效内容；纯图标时不渲染空标签，避免额外间距。 */
const hasLabel = computed(() => props.label !== undefined && props.label !== null && props.label !== '')
const hasContent = computed(() => !!slots.default || hasLabel.value)

const uiOverrides = computed(() => props.ui || {})
const ui = computed(() => {
    const styles = b({
        color: props.color as BadgeColor,
        variant: props.variant as BadgeVariant,
        size: (fieldGroupSize.value || props.size) as BadgeSize,
        square: props.square || !hasContent.value,
        round: props.round,
        circle: props.circle,
        unchecked: props.check && !checked.value,
        disabled: props.disabled,
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

const handleClick = (e: MouseEvent) => {
    if (props.disabled) return
    emit('click', e)
    // 可选中模式：点击即切换选中态并抛出 change。
    // 受控绑定下 defineModel 的赋值要等父组件回流才可见，change 必须带本地算好的新值
    if (props.check) {
        const next = !checked.value
        checked.value = next
        emit('change', next)
    }
}

const handleClose = async (e: MouseEvent) => {
    if (props.disabled) return
    if (props.beforeClose) {
        try {
            const result = await props.beforeClose(e)
            if (result === false) return
        } catch {
            return
        }
    }
    show.value = false
    emit('close', e)
}
</script>

<template>
  <RebornTransition :show="show" name="badge-custom" :duration="200" :class="ui.root()" custom-class="inline-flex">
    <component :is="props.as" :class="ui.base({ class: props.class })" @click="handleClick">
      <slot name="leading" :ui="ui" />

      <span v-if="hasContent" :class="ui.label()">
        <slot :ui="ui">
          <span v-if="hasLabel">
            {{ label }}
          </span>
        </slot>
      </span>

      <slot name="trailing" :ui="ui" />

      <span v-if="closable" :class="ui.closeButton()" @click.stop="handleClose">
        <slot name="close" :ui="ui" :close="handleClose">
          <Icon :name="closeIcon" :class="ui.closeIcon()" />
        </slot>
      </span>
    </component>
  </RebornTransition>
</template>
