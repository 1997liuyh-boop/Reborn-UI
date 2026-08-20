<script setup lang="ts">
import { computed, provide } from 'vue'
import { useFieldGroupItem } from '~/composables/useFieldGroup'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import theme, { formItemLabelPositions } from './reborn-form-item.config'

/**
 * RebornFormItem Props 定义 (与 UniApp 版一致)
 */
export interface FormItemProps {
    prop?: string
    label?: string
    required?: boolean
    requireAsteriskPosition?: 'left' | 'right'
    labelWidth?: string | number
    labelPosition?: typeof formItemLabelPositions[number]
    trigger?: 'blur' | 'change' | 'none' | Array<'blur' | 'change'>
    class?: any // 追加到表单项根节点的自定义类名（uniapp 端对应 customClass）
    ui?: Partial<{
        root: string
        label: string
        wrapper: string
        content: string
        error: string
    }>
}

const props = withDefaults(defineProps<FormItemProps>(), {
    prop: '',
    label: '',
    required: false,
    requireAsteriskPosition: 'right',
})

// 使用 Composable 处理状态
const {
    error,
    labelPosition,
    labelWidth,
    size,
    getBoundingClientRect,
    validate,
} = useFieldGroupItem({
    prop: props.prop,
    labelPosition: props.labelPosition,
    labelWidth: props.labelWidth,
    trigger: props.trigger,
})

// 提供给子组件 (Input 等) 的上下文
provide('rebornFormItem', {
    isError: computed(() => !!error.value),
    validate,
    size,
})

const labelStyle = computed(() => {
    return {
        width: labelPosition.value === 'top' ? 'auto' : labelWidth.value,
    }
})

// 样式配置
const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
    const styles = b({
        error: !!error.value,
        labelPosition: labelPosition.value as any,
        size: size.value as any,
    })
    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.class, uiOverrides.value.root) }),
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
        content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
        error: (opts?: { class?: any }) => styles.error({ class: cn(opts?.class, uiOverrides.value.error) }),
    }
})

defineExpose({
    /** 当前表单项绑定的字段名，供父级 Form 定位字段实例（validateField/scrollToField 等依赖它） */
    prop: props.prop,
    /** `(callback: (rect: DOMRect) => void) => void` 以回调返回表单项根节点的位置与尺寸，校验失败滚动定位时使用 */
    getBoundingClientRect,
})
</script>

<template>
    <div :class="ui.root()">
        <!-- Label 区域 -->
        <div v-if="label || $slots.label" :class="ui.label()" :style="labelStyle">
            <slot name="label">
                <span v-if="required && requireAsteriskPosition === 'left'" class="mr-1 text-red-5 font-bold">
                    *
                </span>
                {{ label }}
                <span v-if="required && requireAsteriskPosition === 'right'" class="ml-1 text-red-5 font-bold">
                    *
                </span>
            </slot>
        </div>

        <!-- 内容与错误提示区域 -->
        <div :class="ui.wrapper()">
            <div :class="ui.content()">
                <slot />
            </div>

            <!-- 错误信息 (自带动画) -->
            <Transition name="form-error">
                <div v-if="error" :class="ui.error()">
                    <Icon name="lucide:circle-alert" class="size-3 shrink-0" />
                    {{ error }}
                </div>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
.form-error-enter-active,
.form-error-leave-active {
    transition: all 0.3s ease;
}

.form-error-enter-from,
.form-error-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
