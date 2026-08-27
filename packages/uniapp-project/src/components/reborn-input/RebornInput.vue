<script lang="ts">
import type { inputColors, inputShapes, inputSizes, inputVariants } from './reborn-input.config'
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
  | 'textarea'

export interface InputUI {
  root?: string
  group?: string
  prepend?: string
  append?: string
  wrapper?: string
  input?: string
  inputItem?: string
  leading?: string
  trailing?: string
  iconBox?: string
  clear?: string
  password?: string
  separator?: string
  count?: string
}

/** autosize 的对象形式：仅为与 web 端同签名，uniapp 端映射为原生 auto-height */
export interface InputAutosize {
  minRows?: number
  maxRows?: number
}

export interface InputProps {
  /** 输入框绑定值（v-model） */
  modelValue?: string | number
  /** 非受控模式下的初始值，未绑定 modelValue 时生效 */
  defaultValue?: string | number
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  /** 输入类型；传 'textarea' 渲染为多行文本域，其余为 uniapp 原生键盘类型 */
  type?: InputType
  /** 尺寸：sm/md/lg，影响高度与字号 */
  size?: typeof inputSizes[number]
  /** 聚焦时描边 / 下划线 / 分割线的高亮颜色 */
  color?: typeof inputColors[number]
  /**
   * 形态变体：
   * outlined 底色描边／filled 灰底填充（默认，聚焦转白底 + 描边）／
   * borderless 无边框／underlined 仅下划线（圆角强制为 0，此时 shape 不再生效）。
   */
  variant?: typeof inputVariants[number]
  /** 外形轮廓：circle 为胶囊圆角，square 按尺寸取圆角令牌（4/6/8rpx） */
  shape?: typeof inputShapes[number]
  /** 追加到根节点上的自定义类名 */
  customClass?: any
  /** 是否显示明文/密文切换按钮（web 端同名；内容掩码显示） */
  showPassword?: boolean
  /** 旧属性名，等价于 showPassword，保留以兼容既有用法 */
  password?: boolean
  /** 是否显示清除按钮：有内容且非禁用/只读时出现，点击清空 */
  clearable?: boolean
  /** 自定义清除图标类名（iconify class） */
  clearIcon?: string
  /** 自定义前缀图标类名（#prefix 插槽优先） */
  prefixIcon?: string
  /** 自定义后缀图标类名（#suffix 插槽优先） */
  suffixIcon?: string
  /** 是否显示字数统计，仅 type 为 'text' 或 'textarea' 时生效，需配合 maxlength */
  showWordLimit?: boolean
  /** 字数统计位置：inside 在输入框内（默认），outside 在输入框下方 */
  wordLimitPosition?: 'inside' | 'outside'
  /** 展示值格式化，仅 type="text" 时生效；需与 parser 配对使用 */
  formatter?: (value: string | number) => string
  /** 从格式化文本中提取值，仅 type="text" 时生效；与 formatter 配对使用 */
  parser?: (text: string) => string
  /** textarea 模式的参考行数，用于估算固定高度（uniapp 无原生 rows） */
  rows?: number
  /**
   * textarea 高度是否自适应。
   * 端差异：uniapp 映射为原生 auto-height，minRows/maxRows 不生效，仅为与 web 端同签名。
   */
  autosize?: boolean | InputAutosize
  /** 预留的聚焦开关，当前未接入内部逻辑；聚焦请用 autofocus 或实例 focus() 方法 */
  focus?: boolean
  /** 最大输入字符数，默认 140，设为 -1 不限制 */
  maxlength?: number
  /** 聚焦时输入框距键盘的距离，单位 px */
  cursorSpacing?: number
  /** 点击键盘确认按钮时是否保持键盘不收起 */
  confirmHold?: boolean
  /** 键盘右下角确认按钮文案：done/send/search/next/go */
  confirmType?: string
  /** 键盘弹起时是否自动上推页面 */
  adjustPosition?: boolean
  /** 聚焦时点击页面其他区域是否保持键盘不收起 */
  holdKeyboard?: boolean
  /** 占位文本的样式类，追加在内置 text-gray-5 之后 */
  placeholderClass?: string
  /** 挂载后自动聚焦并唤起键盘 */
  autofocus?: boolean
  /** 是否在清除按钮、密码开关与后缀之间显示竖分割线 */
  separator?: boolean
  /** 按 wrapper/input/inputItem/leading/trailing 等键覆盖内部节点类名 */
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
  color: 'primary',
  variant: 'filled',
  shape: 'square',
  focus: false,
  showPassword: false,
  password: false,
  clearIcon: 'i-lucide-x-circle',
  showWordLimit: false,
  wordLimitPosition: 'inside',
  rows: 2,
  autosize: false,
  maxlength: 140,
  cursorSpacing: 5,
  confirmHold: false,
  confirmType: 'done',
  adjustPosition: true,
  holdKeyboard: false,
  placeholderClass: '',
  autofocus: false,
  clearable: false,
  separator: true,
})
const emit = defineEmits([
  'update:modelValue', // 输入值变化时触发（v-model 同步）
  'input', // 输入时触发，参数为当前输入值
  'change', // 输入值变化时触发，与 input 同步；清空时也触发，参数为空字符串
  'focus', // 输入框获得焦点时触发
  'blur', // 输入框失去焦点时触发
  'confirm', // 点击键盘确认/完成按钮时触发
  'clear', // 点击清除按钮清空内容后触发
  'keyboardheightchange', // 键盘高度变化时触发，e.detail 含 height（px）与 duration
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

/** 是否启用密码掩码（新旧属性任一开启即生效） */
const isPasswordMode = computed(() => props.showPassword || props.password)

/** 密码是否以明文展示（与 web 端 expose 同名同语义） */
const passwordVisible = ref(false)

/** 是否渲染为多行 textarea */
const isMultiline = computed(() => props.type === 'textarea')

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

/** formatter / parser 仅在单行 type="text" 下生效 */
const useFormatter = computed(() => !!props.formatter && props.type === 'text')

/** 输入框实际渲染的文本 */
const displayValue = computed(() => {
  const value = inputValue.value ?? ''
  return useFormatter.value ? props.formatter!(value) : value
})

// 是否显示清除按钮
const showClear = computed(() => {
  return props.clearable && !isMultiline.value && !fieldGroupDisabled.value && !props.readonly && `${inputValue.value}` !== ''
})

const isFilled = computed(() => `${inputValue.value ?? ''}`.length > 0)

// ─── 字数统计 ───────────────────────────────────────────────────

/** 当前字数 */
const currentCount = computed(() => `${inputValue.value ?? ''}`.length)

/** 是否展示字数统计：需开启 showWordLimit、maxlength 有效，且 type 为 text/textarea */
const showLimit = computed(
  () => props.showWordLimit && props.maxlength > 0 && (props.type === 'text' || isMultiline.value),
)

const { orientation, size: fieldGroupSize, disabled: fieldGroupDisabled, isError, validate } = useFormInject(props)

const size = toRef(props, 'size')

/** textarea 非自适应时按参考行数估算固定高度 */
const textareaStyle = computed(() =>
  props.autosize ? undefined : { height: `${props.rows * 60}rpx` },
)

const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})
const ui = computed(() => {
  const styles = b({
    size: (fieldGroupSize.value || size.value) as any,
    color: props.color,
    variant: props.variant,
    shape: props.shape,
    fieldGroup: orientation.value,
    multiline: isMultiline.value,
    hasLeading: !isMultiline.value && (!!slots.prefix || !!slots.leading || !!props.prefixIcon),
    hasTrailing: !!slots.suffix || !!slots.trailing || showClear.value,
    hasPrepend: !isMultiline.value && !!slots.prepend,
    hasAppend: !isMultiline.value && !!slots.append,
    error: isError.value,
    focus: isFocus.value,
  })
  return {
    root: (opts?: { class?: any }) =>
      styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
    group: (opts?: { class?: any }) =>
      styles.group({ class: cn(opts?.class, uiOverrides.value.group) }),
    prepend: (opts?: { class?: any }) =>
      styles.prepend({ class: cn(opts?.class, uiOverrides.value.prepend) }),
    append: (opts?: { class?: any }) =>
      styles.append({ class: cn(opts?.class, uiOverrides.value.append) }),
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
    count: (opts?: { class?: any }) =>
      styles.count({ class: cn(opts?.class, uiOverrides.value.count) }),
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
  let value = e.detail.value as string
  if (useFormatter.value && props.parser) {
    value = props.parser(value)
  }
  localValue.value = value // Update local value for uncontrolled usage
  emit('update:modelValue', value)
  emit('input', value)
  emit('change', value)
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
  passwordVisible.value = !passwordVisible.value
  setTimeout(() => { isPasswordToggling.value = false }, 300)
}

// 切换密码显示状态
function showPasswordToggle() {
  if (fieldGroupDisabled.value || props.readonly) { return }
  passwordVisible.value = !passwordVisible.value
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
  isFocus, // 当前是否处于聚焦态（Ref<boolean>）
  focus, // 使输入框聚焦（H5 端将光标移至内容末尾）
  clear, // 清空输入内容并触发 clear 事件
  passwordVisible, // 密码是否以明文展示（Ref<boolean>）
})
</script>

<template>
  <view :class="ui.root({ class: props.customClass })">
    <view :class="ui.group()">
      <!-- 前置块：仅单行模式渲染，与输入框连体 -->
      <view v-if="$slots.prepend && !isMultiline" :class="ui.prepend()">
        <slot name="prepend" />
      </view>

      <view :class="ui.wrapper()" :data-disabled="fieldGroupDisabled" :data-filled="isFilled">
        <!-- 前缀：#prefix（新名）优先，#leading（旧名）兼容，其次 prefix-icon -->
        <view v-if="($slots.prefix || $slots.leading || prefixIcon) && !isMultiline" :class="ui.leading()">
          <slot name="prefix" :ui="ui">
            <slot name="leading" :ui="ui">
              <view v-if="prefixIcon" :class="prefixIcon" />
            </slot>
          </slot>
        </view>

        <!-- 多行文本域：autosize 映射 uniapp 原生 auto-height，否则按 rows 估算固定高度 -->
        <view v-if="isMultiline" :class="ui.input({ class: 'h-auto pr-3 py-1' })">
          <textarea
            ref="inputRef" :value="`${inputValue}`" :disabled="fieldGroupDisabled || props.readonly"
            :placeholder="props.placeholder" :placeholder-class="`text-gray-5 ${props.placeholderClass}`"
            :maxlength="props.maxlength" :auto-height="!!props.autosize" :style="textareaStyle"
            :cursor-spacing="props.cursorSpacing" :adjust-position="props.adjustPosition"
            :hold-keyboard="props.holdKeyboard" :focus="isFocusing && !fieldGroupDisabled && !props.readonly"
            class="w-full" @input="onInput" @focus="onFocus" @blur="onBlur" @confirm="onConfirm"
            @keyboardheightchange="onKeyboardheightchange"
          />
        </view>

        <!-- #ifdef H5 || APP-PLUS -->
        <view v-if="!isMultiline" :class="ui.input({ class: 'h-full' })" @touchstart="handleFocus">
          <input
            ref="inputRef" :type="props.type" :disabled="fieldGroupDisabled || props.readonly"
            :readonly="props.readonly" :placeholder="props.placeholder" :value="displayValue" :class="ui.inputItem()"
            :password="isPasswordMode && !passwordVisible" :focus="isFocusing && !fieldGroupDisabled && !props.readonly"
            :placeholder-class="`text-gray-5 ${props.placeholderClass}`" :maxlength="props.maxlength"
            :cursor-spacing="props.cursorSpacing" :confirm-type="props.confirmType" :confirm-hold="props.confirmHold"
            :adjust-position="props.adjustPosition" :hold-keyboard="props.holdKeyboard" @input="onInput" @focus="onFocus"
            @blur="onBlur" @confirm="onConfirm" @keyboardheightchange="onKeyboardheightchange"
          >
        </view>
        <!-- #endif -->

        <!-- #ifdef MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO -->
        <view v-if="!isMultiline" :class="ui.input({ class: 'h-full' })">
          <input
            ref="inputRef" :type="props.type" :disabled="fieldGroupDisabled || props.readonly"
            :readonly="props.readonly" :placeholder="props.placeholder" :value="displayValue" :class="ui.inputItem()"
            :password="isPasswordMode && !passwordVisible" :focus="isFocusing && !fieldGroupDisabled && !props.readonly"
            :placeholder-class="`text-gray-5 ${props.placeholderClass}`" :maxlength="props.maxlength"
            :cursor-spacing="props.cursorSpacing" :confirm-type="props.confirmType" :confirm-hold="props.confirmHold"
            :adjust-position="props.adjustPosition" :hold-keyboard="props.holdKeyboard" @input="onInput" @blur="onBlur"
            @confirm="onConfirm" @keyboardheightchange="onKeyboardheightchange" @focus="onFocus"
          >
        </view>
        <!-- #endif -->

        <!-- textarea 的字数统计悬浮在右下角 -->
        <view v-if="isMultiline && showLimit && wordLimitPosition === 'inside'" :class="ui.count()">
          {{ currentCount }} / {{ props.maxlength }}
        </view>

        <!-- Icons Section -->
        <view v-if="!isMultiline" :class="ui.iconBox()" @tap.stop.prevent>
          <view v-if="showClear" :class="ui.clear({ class: 'right-0' })" @tap.stop="clear">
            <view :class="props.clearIcon" style="width: var(--icon-size); height: var(--icon-size);" />
          </view>

          <view v-if="separator && showClear && (isPasswordMode || $slots.suffix || $slots.trailing || suffixIcon)" :class="ui.separator()" />

          <!-- #ifdef H5 || APP-PLUS -->
          <view v-if="isPasswordMode" :class="ui.password({ class: 'h-full' })" @touchstart.prevent="handleInteraction">
            <slot name="password-icon" :visible="passwordVisible">
              <view :class="[passwordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye']" />
            </slot>
          </view>
          <!-- #endif -->

          <!-- #ifdef MP-WEIXIN || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO -->
          <view v-if="isPasswordMode" :class="ui.password({ class: 'h-full' })" @tap.stop="showPasswordToggle">
            <slot name="password-icon" :visible="passwordVisible">
              <view :class="[passwordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye']" />
            </slot>
          </view>
          <!-- #endif -->

          <!-- 单行的字数统计 -->
          <view v-if="showLimit && wordLimitPosition === 'inside'" :class="ui.count()">
            {{ currentCount }} / {{ props.maxlength }}
          </view>

          <view v-if="separator && isPasswordMode && ($slots.suffix || $slots.trailing || suffixIcon)" :class="ui.separator()" />

          <!-- 后缀：#suffix（新名）优先，#trailing（旧名）兼容，其次 suffix-icon -->
          <view v-if="$slots.suffix || $slots.trailing || suffixIcon" :class="ui.trailing()">
            <slot name="suffix" :ui="ui">
              <slot name="trailing" :ui="ui">
                <view v-if="suffixIcon" :class="suffixIcon" />
              </slot>
            </slot>
          </view>
        </view>
      </view>

      <!-- 后置块：仅单行模式渲染，与输入框连体 -->
      <view v-if="$slots.append && !isMultiline" :class="ui.append()">
        <slot name="append" />
      </view>
    </view>

    <!-- 外置字数统计：输入框下方右对齐 -->
    <view v-if="showLimit && wordLimitPosition === 'outside'" :class="ui.count({ class: 'self-end' })">
      {{ currentCount }} / {{ props.maxlength }}
    </view>
  </view>
</template>
