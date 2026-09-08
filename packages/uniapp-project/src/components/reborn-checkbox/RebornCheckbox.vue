<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { ComputedRef, Ref } from 'vue'
import type { CheckboxValue, checkboxColors, checkboxSizes, checkboxVariants } from './reborn-checkbox.config'
import { computed, inject, ref } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-checkbox.config'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<CheckboxProps>(), {
  // 运行时类型含 Boolean：未传时会被 Vue 强转为 false，
  // 必须显式给 undefined 默认值（default 键存在即跳过强转），否则 defaultChecked 永远轮不到生效
  defaultValue: undefined,
  defaultChecked: false,
  indeterminate: false,
  disabled: false,
  readOnly: false,
  size: 'md',
  color: 'primary',
  variant: 'filled',
})

const emit = defineEmits<{
  /** 用户切换选中状态后触发，第一个参数与 update:modelValue 相同，第二个参数为原生事件对象 */
  (e: 'change', value: boolean | CheckboxValue[], ev: Event): void
}>()

/** 绑定值（v-model）；显式 default: undefined 跳过 Boolean 类型未传时被强转为 false 的规则，保住非受控判断 */
const model = defineModel<boolean | CheckboxValue[]>({ default: undefined })

const b = tv(theme)

/** CheckboxGroup 通过 provide 下发的上下文 */
export interface CheckboxGroupContext {
  /** 组内当前选中值数组 */
  modelValue: ComputedRef<CheckboxValue[]>
  /** 组级禁用（含 Form 级禁用） */
  disabled: ComputedRef<boolean>
  /** 组级尺寸 */
  size: ComputedRef<typeof checkboxSizes[number]>
  /** 组级配色 */
  color: Ref<typeof checkboxColors[number]>
  /** 组级样式变体 */
  variant: Ref<typeof checkboxVariants[number]>
  /** 组级最多可选数量 */
  max: Ref<number | undefined>
  /** 组内选中数量是否已达 max 上限 */
  limitReached: ComputedRef<boolean>
  /** 表单校验错误态 */
  isError?: ComputedRef<boolean>
  /** 组内选中值更新入口；被 max 上限拦截时返回 undefined */
  updateValue: (value: CheckboxValue, ev: Event) => CheckboxValue[] | undefined
}

export interface CheckboxProps {
  /** 默认值，用于非受控模式（优先于 defaultChecked） */
  defaultValue?: boolean | CheckboxValue[]
  /** 默认是否选中，用于非受控模式（等价于 defaultValue 传布尔值） */
  defaultChecked?: boolean
  value?: CheckboxValue
  label?: string
  /** 是否为半选状态。纯受控属性，组件不会自动清除，需由外层根据子项选中数量推导 */
  indeterminate?: boolean
  disabled?: boolean
  /** 仅展示状态，不响应点击（由外层接管，避免与父级多次触发；微信小程序等与 v-model 叠加易闪勾） */
  readOnly?: boolean
  size?: typeof checkboxSizes[number]
  color?: typeof checkboxColors[number]
  /**
   * 样式变体
   * - filled：选中/半选填充配色，图标为白色
   * - outlined：选中只染边框与图标、不填充背景；半选保持灰色边框，中间显示同色实心小方块
   */
  variant?: typeof checkboxVariants[number]
  /** 追加到根节点（wrapper）的自定义类名 */
  customClass?: any
  /** 覆盖内部各区域样式类：wrapper 根容器、control 勾选框、icon 勾选图标、dot 半选方块、label 标签文本 */
  ui?: Partial<{
    wrapper: ClassValue
    input: ClassValue
    control: ClassValue
    icon: ClassValue
    dot: ClassValue
    label: ClassValue
  }>
}

/** 注入父级 CheckboxGroup 状态（如果存在） */
const checkboxGroup = inject<CheckboxGroupContext | null>('RebornCheckboxGroup', null)

const { size: fieldGroupSize, disabled: fieldGroupDisabled, isError, validate } = useFormInject(props)

/** 非受控状态的内部值，未绑定 v-model 时以 defaultValue（优先）或 defaultChecked 起始 */
const innerValue = ref<boolean | CheckboxValue[]>(props.defaultValue ?? props.defaultChecked)

/**
 * 当前实际生效的值
 * 优先级：CheckboxGroup.modelValue > v-model 绑定值 > 非受控内部值
 */
const currentValue = computed<boolean | CheckboxValue[]>(() => {
  if (checkboxGroup) {
    return checkboxGroup.modelValue.value
  }

  return model.value !== undefined ? model.value : innerValue.value
})

const optionValue = computed<CheckboxValue>(() => props.value ?? props.label ?? '')

const isChecked = computed(() => {
  if (Array.isArray(currentValue.value)) {
    return currentValue.value.includes(optionValue.value)
  }

  return Boolean(currentValue.value)
})

/** 是否为半选状态。选中态与半选态可同时成立，此时视觉上以半选为准 */
const isIndeterminate = computed(() => props.indeterminate)

/**
 * 是否禁用
 * 组内选中数量达到 max 上限时，未选中的选项一并禁用（已选中的仍可取消）
 */
const isDisabled = computed(() => {
  if (checkboxGroup) {
    if (checkboxGroup.limitReached?.value && !isChecked.value) {
      return true
    }

    return checkboxGroup.disabled.value || props.disabled
  }

  return fieldGroupDisabled.value || props.disabled
})

/** 最终生效的尺寸：组内由组统一下发 */
const computedSize = computed(() => {
  if (checkboxGroup?.size?.value) {
    return checkboxGroup.size.value
  }

  return props.size || fieldGroupSize.value
})

/** 最终生效的配色：组内由组统一下发 */
const computedColor = computed(() => {
  if (checkboxGroup?.color?.value) {
    return checkboxGroup.color.value
  }

  return props.color
})

/** 最终生效的样式变体：组内由组统一下发 */
const computedVariant = computed(() => {
  if (checkboxGroup?.variant?.value) {
    return checkboxGroup.variant.value
  }

  return props.variant
})

/** 是否渲染 outlined 变体的半选方块（此时不再渲染横线图标） */
const showIndeterminateDot = computed(() => computedVariant.value === 'outlined' && isIndeterminate.value)

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = b({
    size: computedSize.value,
    color: computedColor.value,
    variant: computedVariant.value,
    error: isError.value || !!checkboxGroup?.isError?.value,
  })

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(uiOverrides.value.wrapper, opts?.class) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    control: (opts?: { class?: any }) => styles.control({ class: cn(opts?.class, uiOverrides.value.control) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    dot: (opts?: { class?: any }) => styles.dot({ class: cn(opts?.class, uiOverrides.value.dot) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
  }
})

/**
 * 统一处理值的更新并触发相关事件
 * @param nextValue 下一步要设定的值
 * @param event 触发本次更新的原生事件
 */
function updateValue(nextValue: boolean | CheckboxValue[], event: Event) {
  // 非受控内部值同步维护：未绑定 v-model 时由它承载状态
  innerValue.value = nextValue
  model.value = nextValue
  // 受控绑定下 model 赋值后同步回读仍是旧值，事件载荷一律用本地新值
  emit('change', nextValue, event)
  if (validate) { validate('change') }
}

function toggle(event: Event) {
  if (isDisabled.value || props.readOnly) { return }

  // 情况 A: 处于 CheckboxGroup 中，值由父级统一维护（校验也由父级触发）
  if (checkboxGroup) {
    const next = checkboxGroup.updateValue(optionValue.value, event)
    // 被 max 上限拦截时返回 undefined，此时不抛事件
    if (next) {
      emit('change', next, event)
    }
    return
  }

  // 情况 B: v-model 绑定的是数组
  if (Array.isArray(currentValue.value)) {
    const next = new Set(currentValue.value)
    if (next.has(optionValue.value)) {
      next.delete(optionValue.value)
    }
    else {
      next.add(optionValue.value)
    }
    updateValue(Array.from(next), event)
  }
  // 情况 C: 单选（布尔）模式
  else {
    updateValue(!isChecked.value, event)
  }
}
</script>

<template>
  <view
    :class="cn(ui.wrapper({ class: customClass }), isChecked && 'is-checked', isIndeterminate && `
      is-indeterminate
    `, isDisabled && `
      is-disabled
    `)" :data-disabled="isDisabled" hover-class="none" style="-webkit-tap-highlight-color: transparent;"
    @tap="toggle"
  >
    <!-- checkbox 插槽整体替换勾选框；一旦填充，ui.control / ui.icon 将不再生效 -->
    <slot name="checkbox" :checked="isChecked" :disabled="isDisabled" :indeterminate="isIndeterminate">
      <view :class="ui.control()">
        <slot name="icon" :checked="isChecked" :disabled="isDisabled" :indeterminate="isIndeterminate">
          <view v-if="showIndeterminateDot" :class="ui.dot()" />
          <view v-else :class="[isIndeterminate ? 'i-lucide-minus' : 'i-lucide-check', ui.icon()]" />
        </slot>
      </view>
    </slot>

    <view v-if="props.label || $slots.default" :class="ui.label()">
      <slot>{{ props.label }}</slot>
    </view>
  </view>
</template>
