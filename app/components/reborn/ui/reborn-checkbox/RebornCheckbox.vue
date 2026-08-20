<script setup lang="ts">
import { computed, ref, useAttrs, watch, inject } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { checkboxColors, checkboxSizes } from "./reborn-checkbox.config";
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";

/**
 * 样式生成函数
 */
const b = tv(theme);

defineOptions({
  inheritAttrs: false,
});

/**
 * 多选框值类型
 */
export type CheckboxValue = string | number;

/**
 * 多选框属性定义
 */
export interface CheckboxProps {
  /**
   * 绑定值 (v-model)
   */
  modelValue?: any;
  /**
   * 默认值，用于非受控模式
   */
  defaultValue?: any;
  /**
   * 当前复选框的值 (在组合模式下或绑定值为数组时使用)
   */
  value?: CheckboxValue;
  /**
   * 标签文本
   */
  label?: string;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 尺寸
   */
  size?: typeof checkboxSizes[number];
  /**
   * 颜色主题
   */
  color?: typeof checkboxColors[number];
  /**
   * 选中时的值 (非数组模式下生效)
   */
  trueValue?: any;
  /**
   * 未选中时的值 (非数组模式下生效)
   */
  falseValue?: any;
  /**
   * 自定义 class
   */
  class?: any;
  /**
   * UI 组件样式覆盖
   */
  ui?: Partial<{
    wrapper: ClassValue;
    input: ClassValue;
    control: ClassValue;
    icon: ClassValue;
    label: ClassValue;
  }>;
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  disabled: false,
  size: "md",
  color: "primary",
});

const emit = defineEmits<{
  /** 绑定值更新时触发，参数为最新值：布尔、选中值数组或 trueValue/falseValue 指定的自定义值 */
  (e: "update:modelValue", value: any): void;
  /** 用户切换选中状态后触发，参数与 update:modelValue 相同 */
  (e: "change", value: any): void;
}>();

const attrs = useAttrs();

/**
 * 注入父级 CheckboxGroup 状态（如果存在）
 */
const checkboxGroup = inject<any>("RebornCheckboxGroup", null);
const isGroup = computed(() => !!checkboxGroup);

/**
 * 表单全局状态注入 (如来自 RebornForm)
 */
const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate
} = useFormInject(props);

/**
 * 内部维护的值，用于 props.modelValue 未定义时的非受控状态
 */
const localValue = ref<any>(props.defaultValue ?? false);

/**
 * 当前实际生效的值
 * 优先级：CheckboxGroup.modelValue > props.modelValue > localValue
 */
const currentValue = computed(() => {
  if (isGroup.value && checkboxGroup?.modelValue) {
    return checkboxGroup.modelValue.value;
  }
  return props.modelValue !== undefined ? props.modelValue : localValue.value;
});

/**
 * 当前选项对应的值（优先使用 value，次选 label）
 */
const optionValue = computed<CheckboxValue>(() => props.value ?? props.label ?? "");

/**
 * 是否处于选中状态
 */
const isChecked = computed(() => {
  const value = currentValue.value;

  // 1. 数组模式：判断当前值是否被包含在数组中
  if (Array.isArray(value)) {
    return value.includes(optionValue.value);
  }

  // 2. 自定义 true-value 模式
  if (props.trueValue !== undefined) {
    return value === props.trueValue;
  }

  // 3. 默认布尔模式
  return !!value;
});

/**
 * 是否禁用
 */
const isDisabled = computed(() => {
  if (isGroup.value) {
    return checkboxGroup.disabled.value || props.disabled;
  }
  return fieldGroupDisabled.value || props.disabled
});

/**
 * 最终计算出的组件尺寸
 */
const computedSize = computed(() => {
  if (isGroup.value && checkboxGroup.size?.value) {
    return checkboxGroup.size.value;
  }
  return fieldGroupSize.value || props.size;
});

/**
 * 最终计算出的组件颜色主题
 */
const computedColor = computed(() => {
  if (isGroup.value && checkboxGroup.color?.value) {
    return checkboxGroup.color.value;
  }
  return props.color;
});

const uiOverrides = computed(() => props.ui || {});

/**
 * 组合后的 UI 样式类
 */
const ui = computed(() => {
  const styles = b({
    size: computedSize.value,
    color: computedColor.value,
    error: isError.value || (isGroup.value && checkboxGroup.isError?.value),
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    control: (opts?: { class?: any }) => styles.control({ class: cn(opts?.class, uiOverrides.value.control) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
  };
});

/**
 * 过滤后的 input 原生属性
 */
const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

/**
 * 统一处理值的更新并触发相关事件
 * @param nextValue 下一步要设定的值
 */
function updateValue(nextValue: any) {
  if (props.modelValue === undefined) {
    localValue.value = nextValue;
  }
  emit("update:modelValue", nextValue);
  emit("change", nextValue);
}

/**
 * 处理 input 的 change 事件
 */
function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const checked = target.checked;

  // 情况 A: 处于 CheckboxGroup 中
  if (isGroup.value) {
    checkboxGroup.updateValue(optionValue.value);
    return;
  }

  // 情况 B: v-model 绑定的是数组
  if (Array.isArray(currentValue.value)) {
    const next = new Set(currentValue.value);
    if (checked) {
      next.add(optionValue.value);
    } else {
      next.delete(optionValue.value);
    }
    updateValue(Array.from(next));
    validate("change");
    return;
  }

  // 情况 C: 单选模式，支持 true-value / false-value 
  const nextValue = checked
    ? (props.trueValue !== undefined ? props.trueValue : true)
    : (props.falseValue !== undefined ? props.falseValue : false);

  updateValue(nextValue);
  validate("change");
}

/**
 * 监听外部 modelValue 变化，实时同步到内部状态
 */
watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined) {
      localValue.value = value;
    }
  },
);
</script>

<template>
  <label :class="ui.wrapper({ class: props.class })" :data-disabled="isDisabled">
    <input v-bind="inputAttrs" type="checkbox" :value="optionValue" :checked="isChecked" :disabled="isDisabled"
      :class="ui.input()" @change="handleChange" />

    <span :class="ui.control()">
      <slot name="icon" :checked="isChecked">
        <Icon name="lucide:check" :class="ui.icon()" />
      </slot>
    </span>

    <span v-if="props.label || $slots.default" :class="ui.label()">
      <slot>{{ props.label }}</slot>
    </span>
  </label>
</template>
