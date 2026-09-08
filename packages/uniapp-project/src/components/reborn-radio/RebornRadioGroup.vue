<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { ButtonProps } from '../reborn-button/RebornButton.vue'
import type { RadioColor, RadioDirection, RadioOption, RadioSize, RadioType, RadioValue, RadioVariant } from './reborn-radio.config'
import { computed, provide, ref, toRef } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import theme from './reborn-radio.config'
import RebornRadio from './RebornRadio.vue'

defineOptions({
  name: 'RebornRadioGroup',
})

const props = withDefaults(defineProps<RadioGroupProps>(), {
  defaultValue: '',
  type: 'radio',
  color: 'primary',
  variant: 'outlined',
  direction: 'horizontal',
  disabled: false,
})

const emit = defineEmits<{
  /** 值改变时触发 */
  (e: 'change', value: RadioValue): void
}>()

const b = tv(theme)

export interface RadioGroupProps {
  /** 默认值（非受控状态，未绑定 v-model 时生效） */
  defaultValue?: RadioValue
  /** 单选框组的类型：radio 圆点 / button 分段按钮 / pure-button 实体按钮拼接 */
  type?: RadioType
  /** 语义色，作用于选中态 */
  color?: RadioColor
  /** 样式变体：filled 实底（语义色背景 + 白色前景）/ outlined 描边（默认，各类型的当前外观） */
  variant?: RadioVariant
  /** 单选框组的尺寸（受 Form / FormItem 尺寸继承） */
  size?: RadioSize
  /** 选项列表；传入后组件内部渲染选项，可省略默认插槽 */
  options?: Array<string | number | RadioOption>
  /** 单选框组的方向 */
  direction?: RadioDirection
  /** 是否禁用 */
  disabled?: boolean
  /** pure-button 类型下统一透传给每个 RebornButton 的参数（variant 只作用于未选中态） */
  buttonProps?: ButtonProps
  /** 追加到根节点的自定义类名（对应 Web 端 class） */
  customClass?: ClassValue
}

/** 绑定值（v-model）；显式 default: undefined 跳过 Boolean 类型未传时被强转为 false 的规则，保住非受控判断 */
const model = defineModel<RadioValue>({ default: undefined })

const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate,
} = useFormInject(props)

/** 非受控状态的内部值，未绑定 v-model 时以 defaultValue 起始 */
const innerValue = ref<RadioValue>(props.defaultValue)

/** 当前选中值：受控时取 v-model，非受控时取内部值 */
const currentValue = computed(() => (model.value !== undefined ? model.value : innerValue.value))

/** 尺寸回退链：FormItem/Form > 自身 props > md */
const computedSize = computed<RadioSize>(() => fieldGroupSize.value || props.size || 'md')

const computedDisabled = computed(() => fieldGroupDisabled.value || props.disabled)

/** 将 string | number 简写选项归一化为 RadioOption 对象 */
const normalizedOptions = computed<RadioOption[]>(() =>
  (props.options ?? []).map(opt =>
    typeof opt === 'object' && opt !== null ? opt : { label: String(opt), value: opt },
  ),
)

function updateValue(value: RadioValue, _ev: Event) {
  innerValue.value = value
  model.value = value
  // 受控绑定下 model 赋值后同步回读仍是旧值，事件载荷一律用本地新值
  emit('change', value)
  validate('change')
}

provide('RebornRadioGroup', {
  modelValue: currentValue,
  disabled: computedDisabled,
  size: computedSize,
  type: toRef(props, 'type'),
  color: toRef(props, 'color'),
  variant: toRef(props, 'variant'),
  buttonProps: toRef(props, 'buttonProps'),
  isError,
  updateValue,
})

const groupClass = computed(() =>
  b({
    type: props.type,
    direction: props.direction,
    size: computedSize.value,
  }).group({ class: props.customClass }),
)
</script>

<template>
  <view :class="groupClass">
    <!-- options 优先：传入数据时由组自行渲染，默认插槽不再渲染 -->
    <template v-if="normalizedOptions.length">
      <RebornRadio
        v-for="opt in normalizedOptions" :key="String(opt.value)" :value="opt.value" :disabled="opt.disabled"
      >
        <!-- radio 插槽透传：自定义每个单选框的整体渲染。
             作用域逐项展开而非 v-bind="scope"，uniapp 小程序编译器不支持插槽上的对象展开 v-bind -->
        <template v-if="$slots.radio" #radio="{ checked, disabled: itemDisabled }">
          <slot name="radio" :checked="checked" :disabled="itemDisabled" />
        </template>
        <!-- label 插槽：自定义选项文案，作用域参数为选项对象 -->
        <template #default>
          <slot name="label" :data="opt">
            {{ opt.label }}
          </slot>
        </template>
      </RebornRadio>
    </template>
    <slot v-else />
  </view>
</template>
