<script lang="ts">
import type { inputColors, inputSizes } from './reborn-input.config'
</script>

<script setup lang="ts">
import { computed, nextTick, ref, toRef, useSlots, watch } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-input.config'

export type InputType
  = | 'text'
  | 'number'
  | 'idcard'
  | 'digit'
  | 'tel'
  | 'safe-password'
  | 'nickname'
  | 'none'
  | 'decimal'
  | 'numeric'
  | 'search'
  | 'email'
  | 'url'

export type InputUI = {
  wrapper?: string
  input?: string
  leading?: string
  trailing?: string
  iconBox?: string
  clear?: string
  password?: string
}

export interface InputProps {
  modelValue?: string | number
  defaultValue?: string | number
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  type?: InputType
  size?: typeof inputSizes[number]
  rows?: number
  customClass?: any
  password?: boolean
  clearable?: boolean
  focus?: boolean
  maxlength?: number
  cursorSpacing?: number
  confirmHold?: boolean
  confirmType?: string
  adjustPosition?: boolean
  holdKeyboard?: boolean
  placeholderClass?: string
  autofocus?: boolean
  rounded?: boolean
  color?: typeof inputColors[number]
  ui?: InputUI
}

defineOptions({
  inheritAttrs: false,
})
const props = withDefaults(defineProps<InputProps>(), {
  disabled: false,
  readonly: false,
  type: 'text',
  size: 'md',
  rows: 4,
  focus: false,
  password: false,
  maxlength: 140,
  cursorSpacing: 5,
  confirmHold: false,
  confirmType: 'done',
  adjustPosition: true,
  holdKeyboard: false,
  placeholderClass: '',
  autofocus: false,
  clearable: false,
  rounded: true,
  color: 'primary',
})
const emit = defineEmits([
  'update:modelValue',
  'input',
  'change',
  'focus',
  'blur',
  'confirm',
  'clear',
  'keyboardheightchange',
])
const slots = useSlots()

const inputRef = ref<HTMLInputElement | null>(null)
const localValue = ref(props.defaultValue ?? '')

// 是否聚焦（样式作用）
const isFocus = ref<boolean>(props.autofocus)

// 是否聚焦（输入框作用）
const isFocusing = ref<boolean>(props.autofocus)

// 是否显示密码
const isPassword = ref(props.password)

const inputValue = computed(() =>
  props.modelValue !== undefined ? props.modelValue : localValue.value,
)

// 是否显示清除按钮
const showClear = computed(() => {
  return props.clearable && !fieldGroupDisabled.value && !props.readonly && `${inputValue.value}` !== ''
})

const isFilled = computed(() => `${inputValue.value ?? ''}`.length > 0)

const { orientation, size: fieldGroupSize, disabled: fieldGroupDisabled, isError, validate } = useFormInject(props)

const size = toRef(props, 'size')

const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})
const ui = computed(() => {
  const styles = b({
    size: (fieldGroupSize.value || size.value) as any,
    fieldGroup: orientation.value,
    hasLeading: !!slots.leading,
    hasTrailing: !!slots.trailing || showClear.value || props.password,
    rounded: props.rounded,
    color: props.color,
    error: isError.value,
  })
  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) =>
      styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    leading: (opts?: { class?: any }) =>
      styles.leading({ class: cn(opts?.class, uiOverrides.value.leading) }),
    trailing: (opts?: { class?: any }) =>
      styles.trailing({ class: cn(opts?.class, uiOverrides.value.trailing) }),
    iconBox: (opts?: { class?: any }) =>
      styles.iconBox({ class: cn(opts?.class, uiOverrides.value.iconBox) }),
    clear: (opts?: { class?: any }) =>
      styles.iconSection({ class: cn(opts?.class, uiOverrides.value.clear) }),
    password: (opts?: { class?: any }) =>
      styles.iconSection({ class: cn(opts?.class, uiOverrides.value.password) }),
  }
}
)

watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined) {
      localValue.value = value
    }
  },
)

// 输入事件
function onInput(e: any) {
  const v1 = e.detail.value
  localValue.value = v1 // Update local value for uncontrolled usage
  emit('update:modelValue', v1)
  emit('input', v1)
  emit('change', v1)
  if (validate) { validate('change') }
}

// 点击确认按钮事件
function onConfirm(e: any) {
  emit('confirm', e)
}

// 键盘高度变化事件
function onKeyboardheightchange(e: any) {
  emit('keyboardheightchange', e)
}

// 聚焦方法
function focus() {
  if (fieldGroupDisabled.value || props.readonly) {
    isFocusing.value = false
    return
  };

  setTimeout(() => {
    isFocusing.value = false

    nextTick(() => {
      isFocusing.value = true
    })
  }, 0)
}

// 获取焦点事件
function onFocus(e: any) {
  if (fieldGroupDisabled.value || props.readonly) { return }
  isFocus.value = true
  emit('focus', e)
}

function onBlur(e: any) {
  isFocus.value = false
  emit('blur', e)
  if (validate) { validate('blur') }
}
// 切换密码显示状态
function showPassword() {
  if (fieldGroupDisabled.value || props.readonly) { return }
  isPassword.value = !isPassword.value
  nextTick(() => focus())
}
// 清除方法
function clear() {
  localValue.value = ''
  emit('update:modelValue', '')
  emit('change', '')
  emit('clear')

  // #ifdef H5
  focus()
  // #endif
}

defineExpose({
  isFocus,
  focus,
  clear,
})
</script>

<template>
  <view :class="ui.wrapper({ class: props.customClass })" :data-disabled="fieldGroupDisabled" :data-filled="isFilled"
    @click="focus">
    <view v-if="$slots.leading" :class="ui.leading()">
      <slot name="leading" :ui="ui" />
    </view>

    <input ref="inputRef" :type="props.type" :disabled="fieldGroupDisabled || props.readonly" :readonly="props.readonly"
      :placeholder="props.placeholder" :value="inputValue" :class="ui.input()" :password="isPassword"
      :focus="isFocusing && !fieldGroupDisabled && !props.readonly"
      :placeholder-class="`text-gart-4 ${props.placeholderClass}`" :maxlength="props.maxlength"
      :cursor-spacing="props.cursorSpacing" :confirm-type="props.confirmType" :confirm-hold="props.confirmHold"
      :adjust-position="props.adjustPosition" :hold-keyboard="props.holdKeyboard" @input="onInput" @focus="onFocus"
      @blur="onBlur" @confirm="onConfirm" @keyboardheightchange="onKeyboardheightchange">

    <view v-if="$slots.trailing" :class="ui.trailing()">
      <slot name="trailing" :ui="ui" />
    </view>

    <!-- Icons Section -->
    <view :class="ui.iconBox()" @tap.stop>
      <view v-if="showClear" :class="ui.clear()" @tap.stop="clear">
        <view class="i-lucide-x-circle size-4" />
      </view>

      <view v-if="password" :class="ui.password()" @tap.stop="showPassword">
        <view class="size-4" :class="[isPassword ? 'i-lucide-eye' : `
            i-lucide-eye-off
          `]" />
      </view>
    </view>
  </view>
</template>
