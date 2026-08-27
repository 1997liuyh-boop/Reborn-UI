<script lang="ts" setup>
import type { ClassValue } from 'clsx'
import type { inputNumberColors, inputNumberShapes, inputNumberSizes, inputNumberVariants } from './reborn-input-number.config'
import { computed, nextTick, ref, toRef, watch } from 'vue'

import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import { useLongPress } from './long-press'
import theme from './reborn-input-number.config'

defineOptions({
  name: 'ReInputNumber',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<InputNumberProps>(), {
  modelValue: 0,
  defaultValue: 0,
  min: 0,
  max: 200,
  step: 1,
  disabled: false,
  ui: () => ({}),
  size: 'md',
  color: 'primary',
  shape: 'circle',
  variant: 'outlined',
  placeholder: '',
  inputType: 'number',
  readonly: true,
  keyboard: true,
  changeOnWheel: false,
})

const emit = defineEmits([
  /** 数值经 min/max 修正且与旧值不同时触发，回调为最新数值 */
  'update:modelValue',
  /** 与 update:modelValue 同时触发，回调为修正后的最新数值 */
  'change',
  /** 输入框键入时透传原生 input 事件对象（此时数值尚未经 min/max 修正） */
  'input',
  /** 输入框失焦并完成数值修正后触发，透传原生事件对象 */
  'blur',
  /** 输入框获得焦点时触发，透传原生事件对象 */
  'focus',
])

/** 调用 focus() 时焦点的落位方式 */
export type InputNumberFocusCursor = 'start' | 'end' | 'all'

export interface InputNumberProps {
  modelValue?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  size?: typeof inputNumberSizes[number]
  color?: typeof inputNumberColors[number]
  /** 外形轮廓：circle 为胶囊圆角，square 为方角 */
  shape?: typeof inputNumberShapes[number]
  /**
   * 形态变体：
   * outlined 白底描边（默认）／filled 灰底填充／borderless 无边框／underlined 仅下划线。
   * underlined 会强制压平圆角，此时 shape 不再生效。
   */
  variant?: typeof inputNumberVariants[number]
  /**
   * 数值精度（保留的小数位数）。
   * 当 precision 小于 step 的小数位时，按 step 的小数位生效，否则步进结果会被截断。
   * 不传时沿用旧行为：inputType='digit' 保留两位小数，否则不做定长补零。
   */
  precision?: number
  ui?: Partial<{
    wrapper: ClassValue
    button: ClassValue
    stack: ClassValue
    stackButton: ClassValue
    input: ClassValue
    divider: ClassValue
    prefix: ClassValue
    suffix: ClassValue
    icon: ClassValue
  }>
  /**
   * 控制按钮位置：默认左右分列，'left' / 'right' 为在对应侧上下堆叠，
   * 堆叠按钮与输入区之间以分割线（gray-4）隔开。
   * 端差异：触屏端没有 hover，堆叠按钮为常显；web 端为悬停 / 聚焦时滑入显示。
   */
  controlsPosition?: 'left' | 'right'
  /** 是否允许直接在输入框键入（与原生 readonly 语义相反）：默认 true 可键入，设为 false 后输入框只读、仅能通过按钮增减 */
  readonly?: boolean
  /** 输入框占位文本 */
  placeholder?: string
  /** 键盘类型：number 为整数数字键盘，digit 为带小数点的数字键盘（digit 模式下数值自动保留两位小数） */
  inputType?: 'digit' | 'number'
  /**
   * 是否启用键盘增减（↑ / ↓ 按 step 步进）。
   * 端能力限制：仅 H5 生效。小程序与 App 的原生输入框不派发 keydown 事件，
   * 该端上此属性只影响 Enter 提交之外的行为，实际无可拦截的按键。
   */
  keyboard?: boolean
  /**
   * 是否启用鼠标滚轮增减。
   * 端能力限制：uniapp 侧为空实现。小程序与 App 无鼠标滚轮事件，
   * 保留该属性仅为与 web 端保持同名同签名，便于同一份业务代码跨端复用。
   */
  changeOnWheel?: boolean
  /** 追加到根节点的自定义类名（等价于 web 端的 class） */
  customClass?: any
}

const longPress = useLongPress()
const { orientation, size: fieldGroupSize, disabled: fieldGroupDisabled, isError, validate } = useFormInject(props)

const uiOverrides = computed(() => props.ui || {})
const b = tv(theme)
const size = toRef(props, 'size')
const ui = computed(() => {
  const styles = b({
    size: (fieldGroupSize.value || size.value) as any,
    color: props.color,
    shape: props.shape,
    variant: props.variant,
    controlsPosition: props.controlsPosition,
    fieldGroup: orientation.value,
    error: isError.value,
  })

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    button: (opts?: { class?: any }) => styles.button({ class: cn(opts?.class, uiOverrides.value.button) }),
    stack: (opts?: { class?: any }) => styles.stack({ class: cn(opts?.class, uiOverrides.value.stack) }),
    stackButton: (opts?: { class?: any }) => styles.stackButton({ class: cn(opts?.class, uiOverrides.value.stackButton) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    divider: (opts?: { class?: any }) => styles.divider({ class: cn(opts?.class, uiOverrides.value.divider) }),
    prefix: (opts?: { class?: any }) => styles.prefix({ class: cn(opts?.class, uiOverrides.value.prefix) }),
    suffix: (opts?: { class?: any }) => styles.suffix({ class: cn(opts?.class, uiOverrides.value.suffix) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
  }
})

/** 按钮是否上下堆叠（controls-position="left" / "right"） */
const isControlsStacked = computed(() => props.controlsPosition === 'left' || props.controlsPosition === 'right')

const value = ref(props.modelValue)

/** 输入框是否持有焦点：聚焦期间不做定长补零，避免把光标顶到末尾 */
const isFocused = ref(false)

/** 受控 focus 的三个入参，undefined 表示不指定，交给平台默认行为 */
const focusFlag = ref(false)
const cursorPos = ref<number | undefined>(undefined)
const selectionStart = ref<number | undefined>(undefined)
const selectionEnd = ref<number | undefined>(undefined)

const isPlus = computed(() => !fieldGroupDisabled.value && value.value < props.max)
const isMinus = computed(() => !fieldGroupDisabled.value && value.value > props.min)

// ─── 精度计算 ───────────────────────────────────────────────────

/** 取一个数的小数位数 */
function getDecimalPlaces(val: number | string) {
  const text = String(val)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

/** step 自身的小数位数 */
const stepPlaces = computed(() => getDecimalPlaces(props.step))

/**
 * 实际生效的精度：precision 小于 step 的小数位时取 step 的小数位。
 * 未传 precision 时回落到旧行为（digit 键盘保留两位小数）。
 */
const numPrecision = computed(() => {
  if (props.precision === undefined) {
    return props.inputType === 'digit' ? 2 : undefined
  }
  return Math.max(props.precision, stepPlaces.value)
})

/** 输入框实际渲染的文本 */
const displayValue = computed(() => {
  const val = value.value
  if (val === null || val === undefined) { return '' }
  // 聚焦键入期间原样回显，否则键入 "1" 会立刻被补成 "1.00" 并顶走光标
  if (isFocused.value || numPrecision.value === undefined) { return String(val) }
  return val.toFixed(numPrecision.value)
})

function update() {
  nextTick(() => {
    let val = value.value

    if (val < props.min) { val = props.min }
    if (val > props.max) { val = props.max }
    if (props.min > props.max) { val = props.max }

    if (numPrecision.value !== undefined) {
      val = Number.parseFloat(val.toFixed(numPrecision.value))
    }

    value.value = val

    if (val !== props.modelValue) {
      emit('update:modelValue', val)
      emit('change', val)
      if (validate) { validate('change') }
    }
  })
}

function onInput(e: any) {
  const val = Number.parseFloat(e.detail.value)
  if (!Number.isNaN(val)) {
    value.value = val
  }
  emit('input', e)
}

/**
 * 按 step 增减，供按钮与键盘共用。
 *
 * @param delta 1 为增，-1 为减
 */
function stepBy(delta: 1 | -1) {
  if (delta === 1) {
    if (!isPlus.value) { return }
    const rest = props.max - value.value
    value.value += rest > props.step ? props.step : rest
  }
  else {
    if (!isMinus.value) { return }
    const rest = value.value - props.min
    value.value -= rest > props.step ? props.step : rest
  }
  update()
}

function onPlus() {
  if (fieldGroupDisabled.value || !isPlus.value) { return }

  longPress.start(() => stepBy(1))
}

function onMinus() {
  if (fieldGroupDisabled.value || !isMinus.value) { return }

  longPress.start(() => stepBy(-1))
}

/**
 * ↑ / ↓ 方向键步进。
 * 仅 H5 会真正派发 keydown；小程序与 App 的原生输入框不派发该事件，此处不会被调用。
 */
function onKeydown(e: any) {
  if (!props.keyboard || fieldGroupDisabled.value) { return }

  const key = e?.key
  if (key !== 'ArrowUp' && key !== 'ArrowDown') { return }
  // 阻止方向键把光标弹到文本首尾
  if (typeof e?.preventDefault === 'function') { e.preventDefault() }
  stepBy(key === 'ArrowUp' ? 1 : -1)
}

function onFocus(e: any) {
  isFocused.value = true
  emit('focus', e)
}

function onBlur(e: any) {
  isFocused.value = false
  focusFlag.value = false

  if (e.detail.value === '') {
    value.value = props.min || 0
  }
  else {
    value.value = Number.parseFloat(e.detail.value)
  }
  update()
  emit('blur', e)
  if (validate) { validate('blur') }
}

/**
 * 使输入框获得焦点，并按 cursor 决定焦点落位：
 * 'start' 光标置于文本首，'end' 置于文本尾，'all' 全选文本；不传则沿用平台默认。
 * 兼容两种调用形式：focus('all') 与 focus({ cursor: 'all' })。
 *
 * 端能力限制：uniapp 的 <input> 只能通过 cursor / selection-start / selection-end 属性
 * 声明式地指定落位，无法像 web 那样命令式调用 setSelectionRange，
 * 因此这里先复位再于下一帧置位，保证连续两次同参调用也能重新触发。
 */
function focus(options?: InputNumberFocusCursor | { cursor?: InputNumberFocusCursor }) {
  const cursor = typeof options === 'string' ? options : options?.cursor
  const len = displayValue.value.length

  focusFlag.value = false
  cursorPos.value = undefined
  selectionStart.value = undefined
  selectionEnd.value = undefined

  nextTick(() => {
    if (cursor === 'all') {
      selectionStart.value = 0
      selectionEnd.value = len
    }
    else if (cursor === 'start') {
      cursorPos.value = 0
    }
    else if (cursor === 'end') {
      cursorPos.value = len
    }
    focusFlag.value = true
  })
}

defineExpose({
  focus, // 使输入框获得焦点，可指定 cursor 落位
  blur: () => {
    focusFlag.value = false
  },
})

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined && val !== value.value) {
      value.value = val
    }
  },
  { immediate: true },
)

watch(() => props.max, update)
watch(() => props.min, update)
</script>

<template>
  <view :class="ui.wrapper({ class: props.customClass })" :data-disabled="fieldGroupDisabled">
    <!-- 左右分列布局：减按钮在最左 -->
    <template v-if="!isControlsStacked">
      <view
        :class="ui.button()" :data-disabled="!isMinus" @touchstart="onMinus" @touchend="longPress.stop"
        @touchcancel="longPress.stop"
      >
        <!-- minus 为与 web 端对齐的插槽名，decrease-icon 为旧名，保留以兼容既有用法 -->
        <slot v-if="$slots.minus" name="minus" :icon-class="ui.icon()" />
        <slot v-else-if="$slots['decrease-icon']" name="decrease-icon" :icon-class="ui.icon()" />
        <view v-else :class="ui.icon()" class="i-lucide-minus" />
      </view>

      <view :class="ui.divider()" />
    </template>

    <view v-if="$slots.prefix" :class="ui.prefix()">
      <slot name="prefix" />
    </view>

    <input
      :class="ui.input()" :type="inputType" :value="displayValue" :disabled="fieldGroupDisabled"
      :readonly="!readonly" :placeholder="placeholder" :focus="focusFlag" :cursor="cursorPos"
      :selection-start="selectionStart" :selection-end="selectionEnd" @input="onInput" @focus="onFocus" @blur="onBlur"
      @keydown="onKeydown"
    >

    <view v-if="$slots.suffix" :class="ui.suffix()">
      <slot name="suffix" />
    </view>

    <!-- 左右分列布局：加按钮在最右 -->
    <template v-if="!isControlsStacked">
      <view :class="ui.divider()" />

      <view
        :class="ui.button()" :data-disabled="!isPlus" @touchstart="onPlus" @touchend="longPress.stop"
        @touchcancel="longPress.stop"
      >
        <!-- plus 为与 web 端对齐的插槽名，increase-icon 为旧名，保留以兼容既有用法 -->
        <slot v-if="$slots.plus" name="plus" :icon-class="ui.icon()" />
        <slot v-else-if="$slots['increase-icon']" name="increase-icon" :icon-class="ui.icon()" />
        <view v-else :class="ui.icon()" class="i-lucide-plus" />
      </view>
    </template>

    <!-- controls-position="left" / "right"：加减按钮上下堆叠，left 侧由 order-first 挪到最前 -->
    <view v-else :class="ui.stack()">
      <view
        :class="ui.stackButton()" :data-disabled="!isPlus" @touchstart="onPlus" @touchend="longPress.stop"
        @touchcancel="longPress.stop"
      >
        <slot v-if="$slots.plus" name="plus" :icon-class="ui.icon()" />
        <slot v-else-if="$slots['increase-icon']" name="increase-icon" :icon-class="ui.icon()" />
        <view v-else :class="ui.icon()" class="i-lucide-chevron-up" />
      </view>
      <view
        :class="ui.stackButton()" :data-disabled="!isMinus" @touchstart="onMinus" @touchend="longPress.stop"
        @touchcancel="longPress.stop"
      >
        <slot v-if="$slots.minus" name="minus" :icon-class="ui.icon()" />
        <slot v-else-if="$slots['decrease-icon']" name="decrease-icon" :icon-class="ui.icon()" />
        <view v-else :class="ui.icon()" class="i-lucide-chevron-down" />
      </view>
    </view>
  </view>
</template>