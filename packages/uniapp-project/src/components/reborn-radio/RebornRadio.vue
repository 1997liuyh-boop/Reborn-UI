<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { ComputedRef, Ref } from 'vue'
import type { ButtonProps } from '../reborn-button/RebornButton.vue'
import type { RadioColor, RadioSize, RadioType, RadioValue, RadioVariant } from './reborn-radio.config'
import { computed, inject } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import RebornButton from '../reborn-button/RebornButton.vue'
import theme from './reborn-radio.config'

defineOptions({
  name: 'RebornRadio',
})

const props = withDefaults(defineProps<RadioProps>(), {
  value: true,
  disabled: false,
})

const emit = defineEmits<{
  /** 值改变时触发，第二个参数为触发本次变化的点击事件 */
  (e: 'change', value: RadioValue, ev: Event): void
}>()

const b = tv(theme)

/** RadioGroup 通过 provide 下发的上下文 */
export interface RadioGroupContext {
  /** 组内当前选中值 */
  modelValue: ComputedRef<RadioValue | undefined>
  /** 组级禁用（含 Form 级禁用） */
  disabled: ComputedRef<boolean>
  /** 组级尺寸 */
  size: ComputedRef<RadioSize>
  /** 组级类型 */
  type: Ref<RadioType>
  /** 组级语义色 */
  color: Ref<RadioColor>
  /** 组级样式变体 */
  variant: Ref<RadioVariant>
  /** 组级下发给 pure-button 类型的 RebornButton 透传参数 */
  buttonProps: Ref<ButtonProps | undefined>
  /** 表单校验错误态 */
  isError?: Ref<boolean>
  /** 组内选中值更新入口 */
  updateValue: (value: RadioValue, ev: Event) => void
}

export interface RadioProps {
  /** 选项的 value，与绑定值严格相等时呈选中态 */
  value?: RadioValue
  /** 单选的类型：radio 圆点 / button 分段按钮 / pure-button 实体按钮拼接；组内使用时以 Group 下发为准 */
  type?: RadioType
  /** 语义色；不传时取 Group 下发值，默认 primary */
  color?: RadioColor
  /** 样式变体：filled 实底（语义色背景 + 白色前景）/ outlined 描边（默认）；不传时取 Group 下发值 */
  variant?: RadioVariant
  /** 是否禁用 */
  disabled?: boolean
  /** pure-button 类型下透传给 RebornButton 的参数（variant 只作用于未选中态，选中态固定跟随 variant） */
  buttonProps?: ButtonProps
  /** 追加到根节点的自定义类名（对应 Web 端 class） */
  customClass?: ClassValue
  /** 覆盖内部各区域样式类：root 根节点、icon 圆形图标外圈、dot 实心圆点、label 标签 */
  ui?: Partial<{
    root: ClassValue
    icon: ClassValue
    dot: ClassValue
    label: ClassValue
  }>
}

/** 绑定值（v-model）；显式 default: undefined 跳过 Boolean 类型未传时被强转为 false 的规则 */
const model = defineModel<RadioValue>({ default: undefined })

const radioGroup = inject<RadioGroupContext | null>('RebornRadioGroup', null)

/** 选中态：组内取 Group 绑定值，独立使用取自身 v-model */
const isChecked = computed(() => {
  if (radioGroup) {
    return radioGroup.modelValue.value === props.value
  }
  return model.value === props.value
})

const computedDisabled = computed(() => (radioGroup ? radioGroup.disabled.value || props.disabled : props.disabled))
const computedType = computed<RadioType>(() => radioGroup?.type?.value ?? props.type ?? 'radio')
const computedSize = computed<RadioSize>(() => radioGroup?.size?.value ?? 'md')
/** 语义色：自身 props 优先，便于组内做单项覆盖 */
const computedColor = computed<RadioColor>(() => props.color ?? radioGroup?.color?.value ?? 'primary')
/** 样式变体：自身 props 优先，默认 outlined（各类型的当前默认外观） */
const computedVariant = computed<RadioVariant>(() => props.variant ?? radioGroup?.variant?.value ?? 'outlined')
const isError = computed(() => (radioGroup ? !!radioGroup.isError?.value : false))

/** pure-button 类型下合并 Group 下发与自身的按钮透传参数（自身优先） */
const mergedButtonProps = computed<ButtonProps>(() => ({
  ...(radioGroup?.buttonProps?.value ?? {}),
  ...(props.buttonProps ?? {}),
}))

/**
 * pure-button 未选中态的外观覆盖：gray-4 边框 + gray-8 文字（uniapp 灰阶止于 gray-8，
 * 对应 Web 端的 gray-9）。选中态交给 variant × color，不加干预。
 * 禁用态直接交给 RebornButton 自带的禁用灰阶（!bg-gray-2 / !border-gray-4 / !text-gray-6），
 * 无需 Web 端那套压制 dark:bg-gray-8 的 ! 提权 hack。
 */
const pureButtonClass = computed(() => {
  if (isChecked.value || computedDisabled.value) {
    return ''
  }
  return 'border-gray-4 text-gray-8'
})

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = b({
    type: computedType.value,
    size: computedSize.value,
    color: computedColor.value,
    variant: computedVariant.value,
    checked: isChecked.value,
    disabled: computedDisabled.value,
    error: isError.value,
  })

  return {
    root: (opts?: { class?: ClassValue }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
    icon: (opts?: { class?: ClassValue }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    dot: (opts?: { class?: ClassValue }) => styles.dot({ class: cn(opts?.class, uiOverrides.value.dot) }),
    label: (opts?: { class?: ClassValue }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
  }
})

/** 点击已选中项不再触发（单选框不能取消选中） */
function onTap(ev: Event) {
  if (computedDisabled.value || isChecked.value) {
    return
  }
  if (radioGroup) {
    radioGroup.updateValue(props.value, ev)
  }
  else {
    model.value = props.value
  }
  // 受控绑定下 model 赋值后同步回读仍是旧值，事件载荷一律用本地新值
  emit('change', props.value, ev)
}
</script>

<template>
  <view
    :class="ui.root({ class: props.customClass })" :data-checked="isChecked" :data-disabled="computedDisabled"
    @tap="onTap"
  >
    <!-- radio 插槽：完全接管单选框的渲染 -->
    <slot name="radio" :checked="isChecked" :disabled="computedDisabled">
      <!-- 实体按钮拼接风格：复用 RebornButton。选中态外观随 variant（filled 实底白字 / outlined 语义色描边+文字），
           未选中态 gray-4 边框 + gray-8 文字，禁用态由 RebornButton 自身的禁用灰阶呈现 -->
      <RebornButton
        v-if="computedType === 'pure-button'" v-bind="mergedButtonProps" :size="computedSize"
        :color="isChecked ? (mergedButtonProps.color ?? computedColor) : (mergedButtonProps.color ?? 'neutral')"
        :variant="isChecked ? (mergedButtonProps.variant ?? computedVariant) : (mergedButtonProps.variant ?? 'outlined')"
        :disabled="computedDisabled || mergedButtonProps.disabled" :custom-class="pureButtonClass"
      >
        <slot />
      </RebornButton>
      <template v-else>
        <view :class="ui.icon()">
          <view :class="ui.dot()" />
        </view>
        <view v-if="$slots.default" :class="ui.label()">
          <slot />
        </view>
      </template>
    </slot>
  </view>
</template>
