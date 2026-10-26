<script setup lang="ts">
import type { formItemLabelPositions } from './reborn-form-item.config'
import { computed, provide, toRef, useSlots } from 'vue'
import { FORM_ITEM_KEY, useFieldGroupItem } from '~/composables/useFieldGroup'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import theme from './reborn-form-item.config'

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

// 使用 Composable 处理状态。
// 直接传响应式 props，不能拷成普通对象：拷贝只取到初始值，之后修改 label-position / label-width / trigger
// 不会生效；prop 也不会更新，动态增删表单项后下标前移的项仍按旧路径注册，校验落到错误的字段上
const {
    form,
    error,
    labelPosition,
    labelWidth,
    size,
    getBoundingClientRect,
    validate,
} = useFieldGroupItem(props)

// 提供给子组件 (Input 等) 的上下文
provide(FORM_ITEM_KEY, {
    isError: computed(() => !!error.value),
    validate,
})

const labelStyle = computed(() => {
    return {
        width: labelPosition.value === 'top' ? 'auto' : labelWidth.value,
    }
})

// 样式配置
const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})

const slots = useSlots()
/**
 * 是否有标签，决定表单项之间的间距（有标签 24px / 无标签 16px）。
 * 插槽不是响应式数据，放进 computed 会在 label 插槽动态增删后不刷新，所以在渲染期由 ui.root() 调用
 */
function hasLabel() {
    return !!(props.label || slots.label)
}

/** 错误信息排在控件右侧（true）还是浮在控件下方（false），由父级 RebornForm 的 inlineMessage 决定 */
const inlineMessage = computed(() => form?.props?.inlineMessage === true)

/**
 * 是否渲染错误文字，由父级 RebornForm 的 showMessage 决定；只在明确为 false 时隐藏，未放在表单内时照常显示。
 * 只隐藏文字：上面注入的 isError 不受它影响，子控件的错误描边照常出现（与 Element Plus 一致）
 */
const showMessage = computed(() => form?.props?.showMessage !== false)

const ui = computed(() => {
    const styles = b({
        error: !!error.value,
        labelPosition: labelPosition.value as any,
        size: size.value as any,
        inlineMessage: inlineMessage.value,
    })
    return {
        // hasLabel 只影响根节点，作为 slot 级变体在渲染期传入，不进 computed 缓存
        root: (opts?: { class?: any }) => styles.root({ hasLabel: hasLabel(), class: cn(opts?.class, props.class, uiOverrides.value.root) }),
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
        content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
        error: (opts?: { class?: any }) => styles.error({ class: cn(opts?.class, uiOverrides.value.error) }),
    }
})

defineExpose({
    /**
     * 当前表单项绑定的字段名，随 prop 实时更新（暴露对象经 proxyRefs 解包，外部读到的是当前值）。
     * 仅供外部读取；父级 Form 定位字段靠 useFieldGroupItem 的注册，并不读这个值
     */
    prop: toRef(props, 'prop'),
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

            <!-- 错误信息的进场 / 离场动画只由这里的 Transition 负责；showMessage 为 false 时不渲染，控件的错误描边不受影响 -->
            <Transition name="form-error">
                <!-- title：行内模式单行截断时，悬停可看到完整的错误信息 -->
                <div v-if="showMessage && error" :class="ui.error()" :title="error">
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
