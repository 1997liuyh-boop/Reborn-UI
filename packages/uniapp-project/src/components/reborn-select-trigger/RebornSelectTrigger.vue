<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { selectTriggerColors, selectTriggerSizes } from './reborn-select-trigger.config'
import { computed } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-select-trigger.config'

defineOptions({
  name: 'RebornSelectTrigger',
})

const props = withDefaults(defineProps<SelectTriggerProps>(), {
  text: '',
  placeholder: '请选择',
  disabled: false,
  focus: false,
  size: 'md',
  color: 'primary',
  clearable: true,
})

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'clear'): void
}>()

export interface SelectTriggerProps {
  /** 显示文本 */
  text?: string
  /** 占位符 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否聚焦 */
  focus?: boolean
  /** 尺寸 */
  size?: (typeof selectTriggerSizes)[number]
  /** 颜色 */
  color?: (typeof selectTriggerColors)[number]
  clearable?: boolean
  /** 样式覆盖 */
  ui?: Partial<{
    wrapper: ClassValue
    content: ClassValue
    text: ClassValue
    placeholder: ClassValue
    iconWrapper: ClassValue
    clearIcon: ClassValue
    arrowIcon: ClassValue
  }>
  /** 自定义 class */
  customClass?: any
}

// reborn-form 上下文
const { disabled, size, isError } = useFormInject(props)

const isDisabled = computed(() => disabled.value || props.disabled)

// ui 样式系统
const uiOverrides = computed(() => props.ui || {})
const b = tv(theme)

const ui = computed(() => {
  const styles = b({
    size: size.value,
    color: props.color,
    disabled: isDisabled.value,
    focus: props.focus,
    error: isError.value,
  })

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    content: (opts?: { class?: any }) =>
      styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
    text: (opts?: { class?: any }) =>
      styles.text({ class: cn(opts?.class, uiOverrides.value.text) }),
    placeholder: (opts?: { class?: any }) =>
      styles.placeholder({ class: cn(opts?.class, uiOverrides.value.placeholder) }),
    iconWrapper: (opts?: { class?: any }) =>
      styles.iconWrapper({ class: cn(opts?.class, uiOverrides.value.iconWrapper) }),
    clearIcon: (opts?: { class?: any }) =>
      styles.clearIcon({ class: cn(opts?.class, uiOverrides.value.clearIcon) }),
    arrowIcon: (opts?: { class?: any }) =>
      styles.arrowIcon({ class: cn(opts?.class, uiOverrides.value.arrowIcon) }),
  }
})

// 是否显示文本
const showText = computed(() => props.text !== '')

// 清空
function clear() {
  emit('clear')
}

const slot = useSlots()
// 打开
function open() {
  if (isDisabled.value) { return }
  emit('open')
}
</script>

<template>
  <view :class="ui.wrapper({ class: props.customClass })" @tap="open">
    <view :class="ui.content()">

      <!-- #ifndef MP-WEIXIN -->
      <slot>
        <text v-if="showText" :class="ui.text()">{{ text }}</text>
        <text v-else :class="ui.placeholder()">{{ placeholder }}</text>
      </slot>
      <!-- #endif -->
      <!-- #ifdef MP-WEIXIN -->
      <slot :showText="showText" :text="text" :placeholder="placeholder" :ui="ui">
        <text v-if="showText" :class="ui.text()">{{ text }}</text>
        <text v-else :class="ui.placeholder()">{{ placeholder }}</text>
      </slot>
      <!-- #endif -->
    </view>

    <!-- 清空按钮 -->
    <view v-if="showText && !isDisabled && clearable" :class="ui.iconWrapper()" @tap.stop="clear">
      <slot name="clear-icon" :ui="ui.clearIcon()">
        <view class="i-lucide-x-circle" :class="ui.clearIcon()" />
      </slot>
    </view>

    <!-- 箭头图标 -->
    <view v-if="!isDisabled && !showText" :class="ui.iconWrapper()">
      <slot name="arrow-icon" :ui="ui.arrowIcon()">
        <view class="i-lucide-chevron-down" :class="ui.arrowIcon()" />
      </slot>
    </view>
  </view>
</template>
