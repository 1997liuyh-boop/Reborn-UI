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
  activeIcon?: string // 选中态图标类名（iconify class，如 i-lucide-check），默认 i-lucide-check
  inactiveIcon?: string // 未选中态图标类名，默认为空（只显示空心框/圆）
  showIcon?: boolean // 是否渲染图标区域，设为 false 时仅显示标签内容（配合插槽做纯文字/卡片式单选）
  isRound?: boolean // 图标容器是否为圆形（rounded-full），设为 false 后可配合 ui 自定义方形圆角
  /** 覆盖内部各区域样式类：root 根节点、wrapper 内容行、activeIcon/inactiveIcon 图标容器、label 标签 */
  ui?: {
    root?: string
    wrapper?: string
    activeIcon?: string
    inactiveIcon?: string
    label?: string
  }
  customClass?: any // 追加到根节点的自定义类名
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
        <slot :isChecked="isChecked">{{ label }}</slot>
      </view>
    </view>
  </view>
</template>
