<script setup lang="ts">
import type { textareaColors, textareaSizes } from './reborn-textarea.config'
import { computed, nextTick, onBeforeUnmount, readonly, shallowRef } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'

import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-textarea.config'

defineOptions({
  name: 'RebornTextarea',
})

const props = withDefaults(defineProps<RebornTextareaProps>(), {
  color: 'primary',
  customClass: '',
  ui: () => ({}),
  size: 'md',
  border: true,
  disabled: false,
  readonly: false,
  showWordLimit: true,
  name: '',
  placeholder: () => '请输入',
  placeholderClass: '',
  placeholderStyle: '',
  maxlength: 100,
  autofocus: false,
  confirmType: 'done',
  cursor: 0,
  confirmHold: false,
  height: 140,
  autoHeight: false,
  fixed: false,
  cursorSpacing: 5,
  cursorColor: '',
  showConfirmBar: true,
  selectionStart: -1,
  selectionEnd: -1,
  adjustPosition: true,
  inputmode: 'text',
  holdKeyboard: false,
  disableDefaultPadding: true,
  adjustKeyboardTo: 'cursor',
})
// 事件定义
const emit = defineEmits<{
  input: [event: TextareaEvent<{ value: string; cursor?: number }>]
  change: [value: string]
  focus: [event: TextareaEvent<{ value: string; height?: number }>]
  blur: [event: TextareaEvent<{ value: string; cursor?: number }>]
  confirm: [event: TextareaEvent<{ value: string }>]
  linechange: [event: TextareaEvent<{ height: number; heightRpx?: number; lineCount: number }>]
  keyboardheightchange: [event: TextareaEvent<{ height: number; duration: number }>]
}>()

/** 原生文本域事件按 detail 描述，兼容各端事件对象，不依赖 DOM 事件方法。 */
export interface TextareaEvent<Detail> {
  detail: Detail
}

export interface RebornTextareaProps {
  // 颜色
  color?: typeof textareaColors[number]
  // 自定义样式类
  customClass?: string
  // UI 覆盖
  ui?: Record<string, any>
  // 尺寸
  size?: typeof textareaSizes[number]
  // 是否显示边框
  border?: boolean
  // 是否禁用
  disabled?: boolean
  // 是否只读
  readonly?: boolean
  // 是否显示字数统计
  showWordLimit?: boolean
  // 名称
  name?: string
  // 占位符
  placeholder?: string
  // 占位符样式类
  placeholderClass?: string
  // 占位符样式
  placeholderStyle?: string
  // 最大输入长度
  maxlength?: number
  // 是否自动聚焦
  autofocus?: boolean
  // 设置键盘右下角按钮的文字
  confirmType?: string
  // 指定focus时的光标位置
  cursor?: number
  // 点击键盘确认按钮时是否保持键盘不收起
  confirmHold?: boolean
  // 高度
  height?: number | string
  // 是否自动增高
  autoHeight?: boolean
  // 如果 textarea 是在一个 position:fixed 的区域，需要显示指定属性 fixed 为 true
  fixed?: boolean
  // 光标与键盘的距离
  cursorSpacing?: number
  // 指定光标颜色
  cursorColor?: string
  // 是否显示键盘上方带有”完成“按钮那一栏
  showConfirmBar?: boolean
  // 光标起始位置
  selectionStart?: number
  // 光标结束位置
  selectionEnd?: number
  // 盘弹起时，是否自动上推页面
  adjustPosition?: boolean
  // 它提供了用户在编辑元素或其内容时可能输入的数据类型的提示。
  inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  // focus时，点击页面的时候不收起键盘
  holdKeyboard?: boolean
  // 是否禁用默认内边距
  disableDefaultPadding?: boolean
  // 键盘对齐位置
  adjustKeyboardTo?: string
}
const { disabled: isDisabled, isError, validate } = useFormInject(props)

// 绑定值
const model = defineModel<string | null>({ default: '' })
const value = computed(() => model.value ?? '')

// 是否聚焦（样式作用）
const isFocus = shallowRef<boolean>(props.autofocus)

// 是否聚焦（输入框作用）
const isFocusing = shallowRef<boolean>(props.autofocus)
let blurTimer: ReturnType<typeof setTimeout> | undefined
let focusTimer: ReturnType<typeof setTimeout> | undefined
let disposed = false
let focusVersion = 0

const b = tv(theme)

const ui = computed(() => {
  const styles = b({
    size: props.size,
    border: props.border,
    focused: isFocus.value,
    disabled: isDisabled.value,
    error: isError.value,
    hasCount: props.showWordLimit,
    color: props.color,
  })
  return {
    root: (opts?: { class?: any }) =>
      styles.root({ class: cn(opts?.class, props.ui?.root) }),
    inner: (opts?: { class?: any }) =>
      styles.inner({ class: cn(opts?.class, props.ui?.inner) }),
    text: (opts?: { class?: any }) =>
      styles.text({ class: cn(opts?.class, props.ui?.text) }),
  }
})

// 文本框样式
const textareaStyle = computed(() => {
  const style: any = {}

  if (!props.autoHeight) {
    style.height = typeof props.height === 'number' ? `${props.height}rpx` : props.height
  }
  else {
    style.minHeight = '48rpx'
  }

  return style
})

const placeholderStyle = computed(() => {
  return `${props.placeholderStyle}`
})

// 点击事件
function onTap() {
  if (!isFocus.value) {
    focus()
  }
}

// 获取焦点事件
function onFocus(e: any) {
  clearTimeout(blurTimer)
  isFocus.value = true
  emit('focus', e)
}

// 失去焦点事件
function onBlur(e: any) {
  emit('blur', e)
  if (validate) { validate('blur') }

  clearTimeout(blurTimer)
  blurTimer = setTimeout(() => {
    isFocus.value = false
  }, 0)
}

// 输入事件
function onInput(e: any) {
  const v1 = e.detail.value
  const v2 = value.value

  model.value = v1
  emit('input', e)

  if (v1 != v2) {
    emit('change', v1)
    if (validate) { validate('change') }
  }
}

// 点击确认按钮事件
function onConfirm(e: any) {
  emit('confirm', e)
}

// 键盘高度变化事件
function onKeyboardheightchange(e: any) {
  emit('keyboardheightchange', e)
}

// 行数变化事件
function onLineChange(e: any) {
  emit('linechange', e)
}

// 聚焦方法
function focus() {
  const version = ++focusVersion
  clearTimeout(focusTimer)
  focusTimer = setTimeout(() => {
    isFocusing.value = false

    nextTick(() => {
      if (!disposed && version === focusVersion) isFocusing.value = true
    })
  }, 0)
}

onBeforeUnmount(() => {
  disposed = true
  focusVersion++
  clearTimeout(blurTimer)
  clearTimeout(focusTimer)
})

defineExpose({
  /** 当前样式聚焦态，只允许读取。 */
  isFocus: readonly(isFocus),
  /** 让输入框重新聚焦并唤起键盘 */
  focus,
})
</script>

<template>
  <view :class="ui.root({ class: cn(props.customClass) })" @tap="onTap">
    <textarea :class="ui.inner()" :style="textareaStyle" :value="value" :name="name" :disabled="props.readonly || isDisabled"
      :placeholder="placeholder" :placeholder-class="`text-gray-4 ${placeholderClass}`"
      :placeholder-style="placeholderStyle" :maxlength="maxlength" :focus="isFocusing" :cursor="cursor"
      :cursor-spacing="cursorSpacing" :cursor-color="cursorColor" :show-confirm-bar="showConfirmBar"
      :confirm-hold="confirmHold" :auto-height="autoHeight" :fixed="fixed" :adjust-position="adjustPosition"
      :hold-keyboard="holdKeyboard" :inputmode="inputmode" :disable-default-padding="disableDefaultPadding"
      :adjust-keyboard-to="adjustKeyboardTo" @confirm="onConfirm" @input="onInput" @linechange="onLineChange"
      @blur="onBlur" @focus="onFocus" @keyboardheightchange="onKeyboardheightchange" />

    <slot v-if="showWordLimit" name="limit" :length="value.length" :max="maxlength">
      <text :size="12" :class="ui.text()">
        {{
          value.length }} / {{ maxlength }}
      </text>
    </slot>
  </view>
</template>

<style scoped>
:deep(.uni-textarea-compute) {
  opacity: 0;
}
</style>
