<script setup lang="ts">
import type { radioColors, radioSizes } from './reborn-radio.config'
import { computed, useSlots, inject } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-radio.config'

defineOptions({
  name: 'RebornRadio',
})

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'md',
  color: 'primary',
  activeIcon: 'i-lucide-check',
  inactiveIcon: '',
  showIcon: true,
  isRound: true,
  ui: () => ({}),
})

const emit = defineEmits(['update:modelValue', 'change'])

interface Props {
  modelValue?: any
  value?: any
  label?: string
  disabled?: boolean
  size?: typeof radioSizes[number]
  color?: typeof radioColors[number]
  activeIcon?: string
  inactiveIcon?: string
  showIcon?: boolean
  isRound?: boolean
  ui?: {
    root?: string
    wrapper?: string
    activeIcon?: string
    inactiveIcon?: string
    label?: string
  }
  customClass?: any
}

const slots = useSlots()

const { disabled: formDisabled, size: formSize } = useFormInject(props)
const radioGroup = inject('RebornRadioGroup', null) as any

const isGroup = computed(() => !!radioGroup)

const modelValue = computed({
  get() {
    return isGroup.value ? radioGroup.modelValue.value : props.modelValue
  },
  set(val) {
    if (isGroup.value) {
      radioGroup.updateValue(val)
    } else {
      emit('update:modelValue', val)
    }
  }
})

const isDisabled = computed(() => {
  return isGroup.value ? (radioGroup.disabled.value || props.disabled) : (props.disabled || formDisabled.value)
})

const resolvedSize = computed(() => {
  return isGroup.value ? (radioGroup.size.value || props.size) : (props.size || formSize.value)
})

const resolvedColor = computed(() => {
  return isGroup.value ? (radioGroup.color.value || props.color) : props.color
})

const isChecked = computed(() => modelValue.value === props.value)
const showLabel = computed(() => !!props.label || !!slots.default)

const b = tv(theme)
const ui = computed(() => {
  const styles = b({
    size: resolvedSize.value,
    color: resolvedColor.value,
    disabled: isDisabled.value,
    isRound: props.isRound,
  })

  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.ui?.root) }),
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, props.ui?.wrapper) }),
    activeIcon: (opts?: { class?: any }) => styles.activeIcon({ class: cn(opts?.class, props.ui?.activeIcon) }),
    inactiveIcon: (opts?: { class?: any }) => styles.inactiveIcon({ class: cn(opts?.class, props.ui?.inactiveIcon) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, props.ui?.label) }),
  }
})

function onTap() {
  if (!isDisabled.value && !isChecked.value) {
    if (isGroup.value) {
      radioGroup.updateValue(props.value)
    } else {
      emit('update:modelValue', props.value)
      emit('change', props.value)
    }
  }
}
</script>

<template>
  <view :class="ui.root({ class: props.customClass })" :data-disabled="isDisabled" :data-checked="isChecked"
    @tap="onTap">
    <view :class="ui.wrapper()">
      <template v-if="showIcon">
        <slot v-if="isChecked" name="active-icon">
          <view :class="ui.activeIcon()">
            <view :class="activeIcon" />
          </view>
        </slot>
        <slot v-else name="inactive-icon">
          <view :class="ui.inactiveIcon()">
            <view :class="inactiveIcon" />
          </view>
        </slot>
      </template>

      <view v-if="showLabel" :class="ui.label()" :data-checked="isChecked">
        <slot>{{ label }}</slot>
      </view>
    </view>
  </view>
</template>
