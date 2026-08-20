<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { formItemLabelPositions } from './reborn-form-item.config'
import { computed, provide } from 'vue'
import { useFieldGroupItem } from '@/composables/useFieldGroup'
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

provide('rebornFormItem', {
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

const ui = computed(() => {
  const styles = b({
    error: !!error.value,
    labelPosition: labelPosition.value as any, // Cast to match config variants
    size: size.value as any,
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
  prop: props.prop,
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

      <view v-if="error" :class="ui.error()">
        {{ error }}
      </view>
    </view>
  </view>
</template>
