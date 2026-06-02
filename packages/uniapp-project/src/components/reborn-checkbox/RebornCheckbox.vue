<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { checkboxColors, checkboxSizes } from './reborn-checkbox.config'
import { computed, ref, watch } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-checkbox.config'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<CheckboxProps>(), {
  disabled: false,
  readOnly: false,
  size: 'md',
  color: 'primary',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean | CheckboxValue[]): void
}>()

const b = tv(theme)

export type CheckboxValue = string | number

export interface CheckboxProps {
  modelValue?: boolean | CheckboxValue[]
  defaultValue?: boolean | CheckboxValue[]
  value?: CheckboxValue
  label?: string
  disabled?: boolean
  /** 仅展示状态，不响应点击（由外层接管，避免与父级多次触发；微信小程序等与 v-model 叠加易闪勾） */
  readOnly?: boolean
  size?: typeof checkboxSizes[number]
  color?: typeof checkboxColors[number]
  customClass?: any
  ui?: Partial<{
    wrapper: ClassValue
    input: ClassValue
    control: ClassValue
    icon: ClassValue
    label: ClassValue
  }>
}

const { size: fieldGroupSize, disabled: fieldGroupDisabled, isError, validate } = useFormInject(props)

const localValue = ref<boolean | CheckboxValue[]>(props.defaultValue ?? false)
const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : localValue.value))
const optionValue = computed<CheckboxValue>(() => props.value ?? props.label ?? '')

const isChecked = computed(() => {
  if (Array.isArray(currentValue.value)) {
    return currentValue.value.includes(optionValue.value)
  }

  return Boolean(currentValue.value)
})

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = b({
    size: props.size || fieldGroupSize.value,
    color: props.color,
    error: isError.value,
  })

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(uiOverrides.value.wrapper, opts?.class) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    control: (opts?: { class?: any }) => styles.control({ class: cn(opts?.class, uiOverrides.value.control) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
  }
})

function updateValue(nextValue: boolean | CheckboxValue[]) {
  if (props.modelValue === undefined) {
    localValue.value = nextValue
  }
  emit('update:modelValue', nextValue)
  if (validate) { validate('change') }
}

function toggle() {
  if (props.disabled || props.readOnly) { return }

  if (Array.isArray(currentValue.value)) {
    const next = new Set(currentValue.value)
    if (next.has(optionValue.value)) {
      next.delete(optionValue.value)
    }
    else {
      next.add(optionValue.value)
    }
    updateValue(Array.from(next))
  }
  else {
    updateValue(!isChecked.value)
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined) {
      localValue.value = value
    }
  },
)
</script>

<template>
  <view
    :class="cn(ui.wrapper({ class: customClass }), isChecked && 'is-checked', fieldGroupDisabled && `
      is-disabled
    `)" :data-disabled="fieldGroupDisabled" hover-class="none" style="-webkit-tap-highlight-color: transparent;"
    @tap="toggle"
  >
    <view :class="ui.control()">
      <slot name="icon" :checked="isChecked">
        <view class="i-lucide-check" :class="ui.icon()" />
      </slot>
    </view>

    <view v-if="props.label || $slots.default" :class="ui.label()">
      <slot>{{ props.label }}</slot>
    </view>
  </view>
</template>
