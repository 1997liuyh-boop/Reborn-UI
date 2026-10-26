<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { CheckboxFieldNames, CheckboxOption, CheckboxValue, checkboxColors, checkboxDirections, checkboxSizes, checkboxVariants } from './reborn-checkbox.config'
import { computed, provide, readonly, ref } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import RebornCheckbox from './RebornCheckbox.vue'
import { CHECKBOX_GROUP_KEY, checkboxGroupTheme } from './reborn-checkbox.config'

const props = withDefaults(defineProps<CheckboxGroupProps>(), {
  direction: 'horizontal',
  disabled: false,
  size: 'md',
  color: 'primary',
  variant: 'filled',
})

const emit = defineEmits<{
  /** 选中项变化时触发，第二个参数为触发本次变化的原生事件 */
  (e: 'change', value: CheckboxValue[], ev: Event): void
}>()

/** 绑定值（v-model），为选中项的值数组；显式 default: undefined 保住非受控判断 */
const model = defineModel<CheckboxValue[]>({ default: undefined })

const b = tv(checkboxGroupTheme)

export interface CheckboxGroupProps {
  /** 默认值，用于非受控模式 */
  defaultValue?: CheckboxValue[]
  /** 支持最多选中的数量，达到上限后未选中项自动禁用 */
  max?: number
  /** 选项数据。传入后由组自行渲染子项，默认插槽不再生效 */
  options?: (string | number | CheckboxOption | Record<string, any>)[]
  /** options 的字段别名配置：按这里给出的字段名去数据里取 label / value / disabled / indeterminate */
  fieldNames?: CheckboxFieldNames
  /** 复选框的排列方向 */
  direction?: typeof checkboxDirections[number]
  /** 是否整组禁用 */
  disabled?: boolean
  /** 统一下发给子项的尺寸 */
  size?: typeof checkboxSizes[number]
  /** 统一下发给子项的配色 */
  color?: typeof checkboxColors[number]
  /** 统一下发给子项的样式变体 */
  variant?: typeof checkboxVariants[number]
  /** 追加到根节点（root）的自定义类名 */
  customClass?: any
  /** 覆盖内部各区域样式类：root 根容器 */
  ui?: Partial<{
    root: ClassValue
  }>
}

const { disabled: fieldGroupDisabled, size: fieldGroupSize, isError, validate } = useFormInject(props)

/** 非受控状态的内部值，未绑定 v-model 时以 defaultValue 起始 */
const innerValue = ref<CheckboxValue[]>(props.defaultValue ?? [])

/** 当前实际生效的选中值数组：受控时取 v-model，非受控时取内部值 */
const currentValue = computed<CheckboxValue[]>(() => model.value ?? innerValue.value)

/** 选中数量是否已达 max 上限 */
const limitReached = computed(() => props.max !== undefined && currentValue.value.length >= props.max)

/** options 字段别名，未配置的键回落到默认字段名 */
const resolvedFieldNames = computed(() => ({
  label: props.fieldNames?.label ?? 'label',
  value: props.fieldNames?.value ?? 'value',
  disabled: props.fieldNames?.disabled ?? 'disabled',
  indeterminate: props.fieldNames?.indeterminate ?? 'indeterminate',
}))

/**
 * options 归一化：字符串/数字写法统一补全为对象；
 * 对象写法按 fieldNames 别名取字段，原始字段随展开保留，label 插槽仍能从 data 参数里拿到
 */
const normalizedOptions = computed<CheckboxOption[]>(() =>
  (props.options ?? []).map((item) => {
    if (typeof item !== 'object' || item === null) {
      return { label: String(item), value: item }
    }
    const f = resolvedFieldNames.value
    return {
      ...item,
      label: item[f.label],
      value: item[f.value],
      disabled: item[f.disabled],
      indeterminate: item[f.indeterminate],
    }
  }),
)

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = b({ direction: props.direction })

  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
  }
})

/**
 * 切换某个选项的选中状态
 * @returns 更新后的数组；被 max 上限拦截时返回 undefined
 */
function updateValue(value: CheckboxValue, ev: Event) {
  const nextValue = [...currentValue.value]
  const index = nextValue.indexOf(value)
  if (index > -1) {
    nextValue.splice(index, 1)
  }
  else {
    // 达到上限时不再接受新增选中
    if (limitReached.value) {
      return undefined
    }
    nextValue.push(value)
  }

  // 非受控内部值同步维护：未绑定 v-model 时由它承载状态
  innerValue.value = nextValue
  model.value = nextValue
  // 受控绑定下 model 赋值后同步回读仍是旧值，事件载荷一律用本地新值
  emit('change', nextValue, ev)
  if (validate) { validate('change') }
  return nextValue
}

provide(CHECKBOX_GROUP_KEY, {
  modelValue: readonly(currentValue),
  disabled: computed(() => fieldGroupDisabled.value || props.disabled),
  size: computed(() => fieldGroupSize.value || props.size),
  color: computed(() => props.color),
  variant: computed(() => props.variant),
  max: computed(() => props.max),
  limitReached,
  isError,
  updateValue,
})
</script>

<template>
  <view :class="ui.root({ class: customClass })">
    <!-- options 优先：传入数据时由组自行渲染，默认插槽不再渲染 -->
    <template v-if="normalizedOptions.length">
      <!-- 按组自身的 $slots（来自使用方，两端都准确）分两支渲染，不在插槽模板上写 v-if：
           小程序编译器无视插槽上的 v-if，转发的 #checkbox 一律记为已传入，子项的 $slots.checkbox 恒为真，
           使用方没写 #checkbox 时子项也不再渲染自带的勾选框 -->
      <template v-if="$slots.checkbox">
        <RebornCheckbox
          v-for="option in normalizedOptions" :key="String(option.value)" :value="option.value"
          :disabled="option.disabled" :indeterminate="option.indeterminate"
        >
          <!-- checkbox 插槽透传：作用域逐项展开而非 v-bind="scope"，
               uniapp 小程序编译器不支持插槽上的对象展开 v-bind -->
          <template #checkbox="{ checked, disabled: itemDisabled, indeterminate }">
            <slot name="checkbox" :checked="checked" :disabled="itemDisabled" :indeterminate="indeterminate" />
          </template>
          <template #default>
            <slot name="label" :data="option">{{ option.label }}</slot>
          </template>
        </RebornCheckbox>
      </template>
      <template v-else>
        <RebornCheckbox
          v-for="option in normalizedOptions" :key="String(option.value)" :value="option.value"
          :disabled="option.disabled" :indeterminate="option.indeterminate"
        >
          <template #default>
            <slot name="label" :data="option">{{ option.label }}</slot>
          </template>
        </RebornCheckbox>
      </template>
    </template>
    <slot v-else />
  </view>
</template>
