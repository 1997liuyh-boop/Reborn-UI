<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { switchColors, switchSizes } from './reborn-switch.config'
import { computed, ref, watch } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-switch.config'

defineOptions({
  name: 'RebornSwitch',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SwitchProps>(), {
  disabled: false,
  loading: false,
  size: 'md',
  color: 'primary',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const b = tv(theme as any)

export interface SwitchProps {
  modelValue?: boolean
  defaultValue?: boolean
  activeLabel?: string
  inactiveLabel?: string
  disabled?: boolean
  loading?: boolean
  size?: typeof switchSizes[number]
  color?: typeof switchColors[number]
  customClass?: any
  ui?: Partial<{
    wrapper: ClassValue
    input: ClassValue
    track: ClassValue
    thumb: ClassValue
    loading: ClassValue
    activeLabel: ClassValue
    inactiveLabel: ClassValue
  }>
}

const { disabled: formDisabled, size: formSize, isError, validate } = useFormInject(props)

const isDisabled = computed(() => formDisabled.value || props.disabled || props.loading)

const localValue = ref(props.defaultValue ?? false)
const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : localValue.value))

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = (b as any)({
    size: formSize.value || props.size,
    color: props.color,
    checked: currentValue.value,
    error: isError.value,
    loading: props.loading,
  })

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    track: (opts?: { class?: any }) => styles.track({ class: cn(opts?.class, uiOverrides.value.track) }),
    thumb: (opts?: { class?: any }) => styles.thumb({ class: cn(opts?.class, uiOverrides.value.thumb) }),
    loading: (opts?: { class?: any }) => styles.loading({ class: cn(opts?.class, uiOverrides.value.loading) }),
    activeLabel: (opts?: { class?: any }) => styles.activeLabel({ class: cn(opts?.class, uiOverrides.value.activeLabel) }),
    inactiveLabel: (opts?: { class?: any }) => styles.inactiveLabel({ class: cn(opts?.class, uiOverrides.value.inactiveLabel) }),
  }
})

function updateValue(nextValue: boolean) {
  if (!props.disabled && !props.loading) {
    if (props.modelValue === undefined) {
      localValue.value = nextValue
    }
    emit('update:modelValue', nextValue)
    emit('change', nextValue)
    if (validate) { validate('change') }
  }
}

function onTap() {
  updateValue(!currentValue.value)
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
    class="group" :class="[ui.wrapper({ class: props.customClass }), currentValue && `
      is-checked
    `]" :data-disabled="isDisabled"
    style="-webkit-tap-highlight-color: transparent;" @tap="onTap"
  >
    <view v-if="props.inactiveLabel || $slots.inactiveLabel" :class="ui.inactiveLabel()">
      <slot name="inactiveLabel">
        {{ props.inactiveLabel }}
      </slot>
    </view>

    <view :class="ui.track()" :data-loading="props.loading">
      <view :class="ui.thumb()">
        <slot name="thumb" :checked="currentValue" :loading="props.loading">
          <view v-if="props.loading" :class="ui.loading()" />
        </slot>
      </view>
    </view>

    <view v-if="props.activeLabel || $slots.activeLabel" :class="ui.activeLabel()">
      <slot name="activeLabel">
        {{ props.activeLabel }}
      </slot>
    </view>
  </view>
</template>

<style scoped></style>
