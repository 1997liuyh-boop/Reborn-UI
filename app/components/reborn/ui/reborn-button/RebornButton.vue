<script setup lang="ts">
import { computed, toRef } from 'vue'
import RebornLoading from '../reborn-loading/RebornLoading.vue'
import theme, { buttonColors, buttonVariants, buttonSizes, buttonBorderStyles } from './reborn-button.config'
import { useFormInject } from '~/composables/useFieldGroup'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'


export interface ButtonProps {
    /** 按钮文本内容；提供 default 插槽时被插槽内容覆盖 */
    label?: string
    /** 语义色，7 种取值：primary/secondary/success/info/warning/error/neutral，默认 primary */
    color?: typeof buttonColors[number]
    /** 视觉变体：filled 实心 / outlined 描边 / soft 浅底 / subtle 浅底加描边 / text 文字按钮 / round 胶囊 / circle 圆形纯图标按钮，默认 filled；颜色由 color 控制 */
    variant?: typeof buttonVariants[number]
    /** 尺寸，sm/md/lg 共 3 档，高度依次 24/32/40px，水平内边距统一 12px，默认 md；处于表单组内时被组尺寸覆盖 */
    size?: typeof buttonSizes[number]
    /** 边框线型：solid 实线 / dashed 虚线，默认 solid；边框宽度固定 1px，对有边框的变体（outlined / subtle）生效 */
    borderStyle?: typeof buttonBorderStyles[number]
    /** 是否加载中；显示加载动画、降低透明度并禁用点击 */
    loading?: boolean
    /** 是否禁用按钮 */
    disabled?: boolean
    /** 追加到根元素的自定义类名 */
    class?: any
    /** 细粒度样式覆盖对象，键为 base/label/leadingIcon/leadingAvatar/leadingAvatarSize/trailingIcon */
    ui?: any
    gap?: boolean // 是否间隔按钮：为相邻的同级按钮自动添加左边距
}

const props = withDefaults(defineProps<ButtonProps>(), {
    color: 'primary',
    variant: 'filled',
    size: 'md',
    borderStyle: 'solid',
    loading: false,
    disabled: false,
    gap: false
})

const slots = defineSlots<{
    /** 前置内容（常放图标）；loading 时被加载动画替代 */
    leading(props: { ui: any }): any
    /** 按钮主体内容，优先于 label prop 渲染 */
    default(props: { ui: any }): any
    /** 后置内容（常放图标）；loading 时不渲染 */
    trailing(props: { ui: any }): any
}>()

const { orientation, size: fieldGroupSize } = useFormInject(props)

const isDisabled = computed(() => props.disabled || props.loading)

const color = toRef(props, 'color')
const variant = toRef(props, 'variant')
const size = toRef(props, 'size')

const loadingColor = computed(() => {
    // filled / round / circle 为实底着色，加载动画用白色；其余变体跟随语义色
    if (props.variant === 'filled' || props.variant === 'round' || props.variant === 'circle') return 'white'
    return props.color
})

const loadingSize = computed(() => {
    // 使用相对单位，使其跟随当前文字大小
    return '1.25em'
})

const isIconOnly = computed(() => {
    return props.variant === 'circle' || (!props.label && !slots.default)
})

const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
    const styles = b({
        color: color.value,
        variant: variant.value,
        size: (fieldGroupSize.value || size.value) as any,
        borderStyle: props.borderStyle,
        fieldGroup: orientation.value,
        gap: props.gap,
        disabled: props.disabled
    })

    return {
        base: (opts?: { class?: any }) => styles.base({
            class: cn(
                opts?.class,
                props.loading ? 'opacity-80' : '',
                uiOverrides.value.base
            )
        }),
        label: (opts?: { class?: any }) => styles.label({ class: cn(uiOverrides.value.label, opts?.class, 'leading-none') }),
        leadingIcon: (opts?: { class?: any }) => styles.leadingIcon({ class: cn(uiOverrides.value.leadingIcon, opts?.class) }),
        leadingAvatar: (opts?: { class?: any }) => styles.leadingAvatar({ class: cn(uiOverrides.value.leadingAvatar, opts?.class) }),
        leadingAvatarSize: (opts?: { class?: any }) => styles.leadingAvatarSize({ class: cn(uiOverrides.value.leadingAvatarSize, opts?.class) }),
        trailingIcon: (opts?: { class?: any }) => styles.trailingIcon({ class: cn(uiOverrides.value.trailingIcon, opts?.class) }),
    }
})
</script>

<template>
    <button :disabled="isDisabled" :class="ui.base({ class: props.class })" v-bind="$attrs">
        <div class="flex items-center justify-center gap-2 h-full w-full">
            <!-- Leading / Spinner -->
            <template v-if="props.loading">
                <RebornLoading :color="loadingColor" :size="loadingSize" :ui="{
                    root: ui.leadingIcon(),
                }" />
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
        </div>
    </button>
</template>
