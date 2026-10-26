<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { formItemLabelPositions } from './reborn-form-item.config'
import { computed, provide, toRef } from 'vue'
import { FORM_ITEM_KEY, useFieldGroupItem } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-form-item.config'

defineOptions({
  name: 'ReFormItem',
})

const props = withDefaults(defineProps<FormItemProps>(), {
  prop: '',
  label: '',
  customClass: '',
  required: false,
  requireAsteriskPosition: 'right',
})

export interface FormItemProps {
  prop?: string
  label?: string
  required?: boolean
  requireAsteriskPosition?: 'left' | 'right' // 标签位置
  labelWidth?: string | number // 标签宽度
  labelPosition?: typeof formItemLabelPositions[number] // 标签位置
  trigger?: 'blur' | 'change' | 'none' | Array<'blur' | 'change'> // 触发验证
  customClass?: ClassValue
  ui?: Partial<{
    root: ClassValue
    label: ClassValue
    wrapper: ClassValue
    content: ClassValue
    error: ClassValue
  }>
}

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

provide(FORM_ITEM_KEY, {
  isError: computed(() => !!error.value),
  validate,
})

const labelStyle = computed(() => {
  return {
    width: labelWidth.value,
  }
})

// Configure Component Styles
const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})

/** 错误信息排在控件右侧（true）还是浮在控件下方（false），由父级 RebornForm 的 inlineMessage 决定 */
const inlineMessage = computed(() => form?.props?.inlineMessage === true)

/**
 * 是否渲染错误文字，由父级 RebornForm 的 showMessage 决定；只在明确为 false 时隐藏，未放在表单内时照常显示。
 * 只隐藏文字：上面注入的 isError 不受它影响，子控件的错误描边照常出现（与 Web 端、Element Plus 一致）
 */
const showMessage = computed(() => form?.props?.showMessage !== false)

const ui = computed(() => {
  const styles = b({
    error: !!error.value,
    labelPosition: labelPosition.value as any, // Cast to match config variants
    size: size.value as any,
    inlineMessage: inlineMessage.value,
  })
  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
    content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
    error: (opts?: { class?: any }) => styles.error({ class: cn(opts?.class, uiOverrides.value.error) }),
  }
})

defineExpose({
  /** 当前表单项绑定的字段名，供父级 Form 定位字段实例（validateField/scrollToField 等依赖它） */
  prop: toRef(props, 'prop'),
  /** `(callback: (rect) => void) => void` 以回调返回表单项根节点的位置与尺寸（基于 uni.createSelectorQuery），校验失败滚动定位时使用 */
  getBoundingClientRect,
})
</script>

<template>
  <view class="re-form-item" :class="ui.root({ class: customClass })">
    <view v-if="label || $slots.label" :class="ui.label()" :style="labelStyle">
      <slot name="label">
        <text
          v-if="required && requireAsteriskPosition === 'left'" class="
            mr-1 text-red-500
          "
        >
          *
        </text>
        {{ label }}
        <text
          v-if="required && requireAsteriskPosition === 'right'" class="
            ml-1 text-red-500
          "
        >
          *
        </text>
      </slot>
    </view>

    <view :class="ui.wrapper()">
      <view :class="ui.content()">
        <slot />
      </view>

      <!-- showMessage 为 false 时不渲染错误文字，控件的错误描边不受影响 -->
      <view v-if="showMessage && error" :class="ui.error()">
        {{ error }}
      </view>
    </view>
  </view>
</template>
