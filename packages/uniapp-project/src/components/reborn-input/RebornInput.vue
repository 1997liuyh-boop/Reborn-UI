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
  inputItem?: string
  leading?: string
  trailing?: string
  iconBox?: string
  clear?: string
  password?: string
  separator?: string
}

export interface InputProps {
  modelValue?: string | number
  defaultValue?: string | number
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  type?: InputType
  size?: typeof inputSizes[number]
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
  border?: boolean
  color?: typeof inputColors[number]
  separator?: boolean
  ui?: InputUI
}

defineOptions({
  inheritAttrs: false,
})
const props = withDefaults(defineProps<InputProps>(), {
  disabled: false,
  readonly: false,
  type: 'text',
  size: 'sm',
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
  border: false,
  color: 'neutral',
  separator: true,
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

const inputRef = ref<any>(null)

const localValue = ref(props.defaultValue ?? '')

// 是否聚焦（样式作用）
const isFocus = ref<boolean>(props.autofocus)

// 是否聚焦（输入框作用）
const isFocusing = ref<boolean>(props.autofocus)

// 标记是否正在执行程序主动触焦（屏蔽中间 blur 副作用）
const isProgrammaticFocus = ref(false)

// 是否显示密码
const isPassword = ref(props.password)

function getNativeInputElement() {
  const input = inputRef.value

  if (!input) { return null }
  if (input instanceof HTMLInputElement) { return input }
  if (input.$el instanceof HTMLInputElement) { return input.$el }
  if (input.$el?.querySelector) { return input.$el.querySelector('input') as HTMLInputElement | null }

  return null
}

function focusNativeInputToEnd() {
  // #ifdef H5
  const input = getNativeInputElement()
  if (!input) { return false }

  input.focus({ preventScroll: true })
  isFocus.value = true

  const valueLength = `${input.value ?? ''}`.length
  const setCursorToEnd = () => {
    if (document.activeElement !== input) { return }

    try {
      input.setSelectionRange(valueLength, valueLength)
    }
    catch {
      // 部分 input type 不支持 selection range，保持聚焦即可。
    }
  }

  setCursorToEnd()
  requestAnimationFrame(setCursorToEnd)

  return true
  // #endif

  return false
}

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
    hasTrailing: !!slots.trailing || showClear.value,
    rounded: props.rounded,
    border: props.border,
    color: props.color,
    error: isError.value,
    focus: isFocus.value,
    password: props.password,
  })
  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) =>
      styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    leading: (opts?: { class?: any }) =>
      styles.leading({ class: cn(opts?.class, uiOverrides.value.leading) }),
    iconBox: (opts?: { class?: any }) =>
      styles.iconBox({ class: cn(opts?.class, uiOverrides.value.iconBox) }),
    trailing: (opts?: { class?: any }) =>
      styles.iconSection({ class: cn(opts?.class, uiOverrides.value.trailing) }),
    clear: (opts?: { class?: any }) =>
      styles.icon({ class: cn(opts?.class, uiOverrides.value.clear) }),
    password: (opts?: { class?: any }) =>
      styles.iconSection({ class: cn(opts?.class, uiOverrides.value.password) }),
    separator: (opts?: { class?: any }) =>
      styles.separator({ class: cn(opts?.class, uiOverrides.value.separator) }),
    inputItem: (opts?: { class?: any }) =>
      styles.inputItem({ class: cn(opts?.class, uiOverrides.value.inputItem) }),
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

watch(
  [() => props.disabled, fieldGroupDisabled],
  ([disabled, fgDisabled]) => {
    if (disabled || fgDisabled) {
      isFocus.value = false
      isFocusing.value = false
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

  if (focusNativeInputToEnd()) { return }

  // 标记为程序主动触焦，防止 isFocusing 切换时产生的 blur 事件破坏样式状态
  isProgrammaticFocus.value = true
  setTimeout(() => {
    isFocusing.value = false

    nextTick(() => {
      isFocusing.value = true
      isProgrammaticFocus.value = false
    })
  }, 0)
}

// 获取焦点事件
function onFocus(e: any) {
  if (fieldGroupDisabled.value || props.readonly) { return }
  isFocus.value = true
  emit('focus', e)
}

// 失去焦点事件
function onBlur(e: any) {
  // 程序主动触焦过程中产生的 blur 为副作用，忽略以保持样式连贯
  if (isProgrammaticFocus.value) return
  isFocus.value = false
  emit('blur', e)
  if (validate) { validate('blur') }
}
// 处理密码显示/隐藏图标的交互事件
// 使用 touchstart.prevent 阻止移动端默认失焦行为，同时处理切换逻辑
// 不再单独绑定 tap 事件，避免 touchstart + tap 在移动端重复触发导致状态抵消
const isPasswordToggling = ref(false)
function handleInteraction() {
  if (fieldGroupDisabled.value || props.readonly) { return }
  if (isPasswordToggling.value) { return }
  isPasswordToggling.value = true
  isPassword.value = !isPassword.value
  setTimeout(() => { isPasswordToggling.value = false }, 300)
}

// 切换密码显示状态
function showPassword() {
  if (fieldGroupDisabled.value || props.readonly) { return }
  isPassword.value = !isPassword.value
  nextTick(() => focus())
}

function handleFocus(e: any) {
  if (fieldGroupDisabled.value || props.readonly) { return }
  const input = getNativeInputElement()

  // #ifdef H5
  if (e.target === input) { return }
  // #endif

  if (isFocus.value) { e.preventDefault() }
  else { focus() }
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
  <view :class="ui.wrapper({ class: props.customClass })" :data-disabled="fieldGroupDisabled" :data-filled="isFilled">
    <view v-if="$slots.leading" :class="ui.leading()">
      <slot name="leading" :ui="ui" />
    </view>


    <!-- #ifdef H5 || APP-PLUS -->
    <view :class="ui.input({ class: 'h-full' })" @touchstart="handleFocus">
      <input ref="inputRef" :type="props.type" :disabled="fieldGroupDisabled || props.readonly"
        :readonly="props.readonly" :placeholder="props.placeholder" :value="inputValue" :class="ui.inputItem()"
        :password="isPassword" :focus="isFocusing && !fieldGroupDisabled && !props.readonly"
        :placeholder-class="`text-gray-4 ${props.placeholderClass}`" :maxlength="props.maxlength"
        :cursor-spacing="props.cursorSpacing" :confirm-type="props.confirmType" :confirm-hold="props.confirmHold"
        :adjust-position="props.adjustPosition" :hold-keyboard="props.holdKeyboard" @input="onInput" @focus="onFocus"
        @blur="onBlur" @confirm="onConfirm" @keyboardheightchange="onKeyboardheightchange">
    </view>
    <!-- #endif -->

    <!-- #ifdef MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO -->
    <view :class="ui.input({ class: 'h-full' })">
      <input ref="inputRef" :type="props.type" :disabled="fieldGroupDisabled || props.readonly"
        :readonly="props.readonly" :placeholder="props.placeholder" :value="inputValue" :class="ui.inputItem()"
        :password="isPassword" :focus="isFocusing && !fieldGroupDisabled && !props.readonly"
        :placeholder-class="`text-gray-4 ${props.placeholderClass}`" :maxlength="props.maxlength"
        :cursor-spacing="props.cursorSpacing" :confirm-type="props.confirmType" :confirm-hold="props.confirmHold"
        :adjust-position="props.adjustPosition" :hold-keyboard="props.holdKeyboard" @input="onInput" @blur="onBlur"
        @confirm="onConfirm" @keyboardheightchange="onKeyboardheightchange" @focus="onFocus">
    </view>
    <!-- #endif -->


    <!-- Icons Section -->
    <view :class="ui.iconBox()" @tap.stop.prevent>
      <view v-if="showClear" :class="ui.clear({ class: 'right-0' })" @tap.stop="clear">
        <view class="i-lucide-x-circle" style="width: var(--icon-size); height: var(--icon-size);" />
      </view>

      <view v-if="separator && showClear && (password || $slots.trailing)" :class="ui.separator()" />


      <!-- #ifdef H5 || APP-PLUS -->
      <view v-if="password" :class="ui.password({ class: 'h-full' })" @touchstart.prevent="handleInteraction">
        <view :class="[isPassword ? 'i-lucide-eye-off' : 'i-lucide-eye']" />
      </view>
      <!-- #endif -->

      <!-- #ifdef MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO -->
      <view v-if="password" :class="ui.password({ class: 'h-full' })" @tap.stop="showPassword">
        <view :class="[isPassword ? 'i-lucide-eye-off' : 'i-lucide-eye']" />
      </view>
      <!-- #endif -->

      <view v-if="separator && password && $slots.trailing" :class="ui.separator()" />

      <view v-if="$slots.trailing" :class="ui.trailing()">
        <slot name="trailing" :ui="ui" />
      </view>
    </view>
  </view>
</template>
