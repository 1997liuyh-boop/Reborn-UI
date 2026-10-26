<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { checkboxColors, checkboxDirections, CheckboxFieldNames, CheckboxOption, checkboxSizes, CheckboxValue, checkboxVariants } from './reborn-checkbox.config'
import { computed, getCurrentInstance, onBeforeUpdate, provide, readonly, shallowRef, toRef } from 'vue'
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import { CHECKBOX_GROUP_KEY, checkboxGroupTheme } from './reborn-checkbox.config'
import RebornCheckbox from './RebornCheckbox.vue'

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
    direction?: (typeof checkboxDirections)[number]
    /** 是否整组禁用 */
    disabled?: boolean
    /** 统一下发给子项的尺寸 */
    size?: (typeof checkboxSizes)[number]
    /** 统一下发给子项的配色 */
    color?: (typeof checkboxColors)[number]
    /** 统一下发给子项的样式变体 */
    variant?: (typeof checkboxVariants)[number]
    /** 自定义 class */
    class?: any
    /** UI 组件样式覆盖 */
    ui?: Partial<{
        root: ClassValue
    }>
}

const props = withDefaults(defineProps<CheckboxGroupProps>(), {
    direction: "horizontal",
    disabled: false,
    size: "md",
    color: "primary",
    variant: "filled",
})

const emit = defineEmits<{
    /** 选中项变化时触发，第二个参数为触发本次变化的原生事件 */
    (e: 'change', value: CheckboxValue[], ev: Event): void
}>()

/**
 * 绑定值（v-model），为选中项的值数组；显式 default: undefined 保住非受控判断。
 * defineModel 只负责声明属性与 update 事件，读写都不经它的本地缓存：只传值时 useModel 会改写缓存；非受控时写进去的值
 * 还会成为受控后「同值不派发」的去重基准，吞掉父级要收的事件。读取按严格受控取父级原始值，写入直接派发事件。
 */
defineModel<CheckboxValue[]>({ default: undefined })

/**
 * 样式生成函数
 */
const b = tv(checkboxGroupTheme)

const {
    disabled: fieldGroupDisabled,
    size: fieldGroupSize,
    isError,
    validate
} = useFormInject(props);

/**
 * 非受控状态的内部值，未绑定 v-model 时以 defaultValue 起始
 */
const innerValue = shallowRef<CheckboxValue[]>(props.defaultValue ?? [])

const instance = getCurrentInstance()!
/** 父级是否在 vnode 上写了 modelValue（含 kebab 写法）：据此区分「未绑定」与「显式绑定 undefined」 */
function isBound() {
    const vnodeProps = instance.vnode.props ?? {}
    return Object.hasOwn(vnodeProps, 'modelValue') || Object.hasOwn(vnodeProps, 'model-value')
}
/**
 * 受控判定。是否显式绑定也必须响应父级更新（包括未绑定切到 undefined），
 * 但只存布尔结果：shallowRef 写入相同的值不会触发依赖，下游计算只在受控状态真的变化时重算。
 */
const bound = shallowRef(isBound())
onBeforeUpdate(() => {
    bound.value = isBound()
})
function isControlled() {
    return bound.value
}

/**
 * 当前实际生效的选中值数组：受控时只认父级传入的原始值（严格受控，父级不回写就保持父值），非受控时取内部值
 */
const currentValue = computed<CheckboxValue[]>(() => isControlled() ? (instance.props.modelValue as CheckboxValue[] | undefined) ?? [] : innerValue.value)

/**
 * 选中数量是否已达 max 上限
 */
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

/**
 * 组合后的 UI 样式类
 */
const ui = computed(() => {
    const styles = b({ direction: props.direction })

    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
    }
})

/**
 * 切换某个选项的选中状态。
 * @returns 更新后的数组；被 max 上限拦截时返回 undefined
 */
const updateValue = (value: CheckboxValue, ev: Event) => {
    const nextValue = [...currentValue.value]
    const index = nextValue.indexOf(value)
    if (index > -1) {
        nextValue.splice(index, 1)
    } else {
        // 达到上限时不再接受新增选中
        if (limitReached.value) {
            return undefined
        }
        nextValue.push(value)
    }

    // 非受控内部值同步维护：未绑定 v-model 时由它承载状态
    if (!isControlled()) innerValue.value = nextValue
    instance.emit('update:modelValue', nextValue)
    // 受控绑定下派发后同步回读仍是父级旧值，事件载荷一律用本地新值
    emit('change', nextValue, ev)
    validate('change')
    return nextValue
}

provide(CHECKBOX_GROUP_KEY, {
    modelValue: readonly(currentValue),
    disabled: computed(() => fieldGroupDisabled.value || props.disabled),
    size: computed(() => fieldGroupSize.value || props.size),
    color: readonly(toRef(props, 'color')),
    variant: readonly(toRef(props, 'variant')),
    max: readonly(toRef(props, 'max')),
    limitReached,
    isError,
    updateValue
})
</script>

<template>
  <div :class="ui.root({ class: props.class })" role="group">
    <!-- options 优先：传入数据时由组自行渲染，默认插槽不再渲染 -->
    <template v-if="normalizedOptions.length">
      <RebornCheckbox
        v-for="option in normalizedOptions"
        :key="String(option.value)"
        :value="option.value"
        :disabled="option.disabled"
        :indeterminate="option.indeterminate"
      >
        <template v-if="$slots.checkbox" #checkbox="scope">
          <slot name="checkbox" v-bind="scope" />
        </template>
        <template #default>
          <slot name="label" :data="option">{{ option.label }}</slot>
        </template>
      </RebornCheckbox>
    </template>
    <slot v-else />
  </div>
</template>
