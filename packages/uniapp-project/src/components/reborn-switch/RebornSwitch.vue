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

export interface SwitchProps {
  modelValue?: any
  defaultValue?: any
  activeValue?: any // 打开状态对应的绑定值，默认 true；配合 inactiveValue 可绑定字符串/数字等任意值
  inactiveValue?: any // 关闭状态对应的绑定值，默认 false
  activeLabel?: string
  inactiveLabel?: string
  disabled?: boolean
  loading?: boolean // 是否加载中：轨道内显示加载图标且开关不可点击（与 disabled 相互独立）
  size?: typeof switchSizes[number]
  color?: typeof switchColors[number]
  beforeChange?: () => boolean | Promise<boolean> // 切换前拦截钩子：返回 false、Promise 解析为 false 或 Promise reject 时取消本次切换，常用于二次确认/异步校验
  customClass?: any // 追加到根节点（wrapper）的自定义类名
  /** 覆盖内部各区域样式类：wrapper 根容器、track 轨道、thumb 滑块、loading 加载图标、activeLabel/inactiveLabel 两侧文案 */
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

const props = withDefaults(defineProps<SwitchProps>(), {
  activeValue: true,
  inactiveValue: false,
  disabled: false,
  loading: false,
  size: 'md',
  color: 'primary',
})

const emit = defineEmits<{
  /** 切换完成后更新绑定值，参数为 activeValue 或 inactiveValue */
  (e: 'update:modelValue', value: any): void
  /** 状态切换后触发（beforeChange 拦截通过后才会触发），参数与 update:modelValue 相同 */
  (e: 'change', value: any): void
}>()

const b = tv(theme as any)

const { disabled: formDisabled, size: formSize, isError, validate } = useFormInject(props)

const isDisabled = computed(() => formDisabled.value || props.disabled || props.loading)

const localValue = ref(props.defaultValue ?? props.inactiveValue)
const isChecked = computed(() => {
  const val = props.modelValue !== undefined ? props.modelValue : localValue.value
  return val === props.activeValue
})

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = (b as any)({
    size: formSize.value || props.size,
    color: props.color,
    active: isChecked.value,
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

function updateValue(checked: boolean) {
  const nextValue = checked ? props.activeValue : props.inactiveValue
  if (!props.disabled && !props.loading) {
    if (props.modelValue === undefined) {
      localValue.value = nextValue
    }
    emit('update:modelValue', nextValue)
    emit('change', nextValue)
    if (validate) { validate('change') }
  }
}

async function onTap() {
  if (props.disabled || props.loading) return

  const originalChecked = isChecked.value
  const newChecked = !originalChecked

  if (props.beforeChange) {
    try {
      const result = await props.beforeChange()
      if (result === false) return
    } catch (e) {
      return
    }
  }

  updateValue(newChecked)
}

watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined) {
      localValue.value = value
    }
  },
)

const isFocused = ref(false)
defineExpose({
  /** `() => void` 标记聚焦态（为根节点追加 is-focused 类名）；uniapp 端无原生焦点行为 */
  focus: () => {
    isFocused.value = true
  },
})
</script>

<template>
  <view>
    <view class="group" :class="[ui.wrapper({ class: props.customClass }), isChecked && `
      is-checked
    `, isFocused && 'is-focused']" :data-disabled="isDisabled" style="-webkit-tap-highlight-color: transparent;"
      @tap="onTap">
      <view v-if="props.inactiveLabel || $slots.inactiveLabel" :class="ui.inactiveLabel()">
        <slot name="inactiveLabel">
          {{ props.inactiveLabel }}
        </slot>
      </view>

      <view :class="ui.track()" :data-loading="props.loading">
        <view :class="ui.thumb()">
          <slot name="thumb" :checked="isChecked" :loading="props.loading">
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
  </view>
</template>

<style scoped></style>
