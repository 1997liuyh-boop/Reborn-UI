<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, watchEffect, inject } from "vue";
import type { ClassValue } from "clsx";
import type { ComputedRef, Ref } from "vue";
import { cn } from "~/lib/utils";
import theme, {
  checkboxColors,
  checkboxSizes,
  checkboxVariants,
  type CheckboxValue,
} from "./reborn-checkbox.config";
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
 * CheckboxGroup 通过 provide 下发的上下文
 */
export interface CheckboxGroupContext {
  /** 组内当前选中值数组 */
  modelValue: ComputedRef<CheckboxValue[]>;
  /** 组级禁用（含 Form 级禁用） */
  disabled: ComputedRef<boolean>;
  /** 组级尺寸 */
  size: ComputedRef<typeof checkboxSizes[number]>;
  /** 组级配色 */
  color: Ref<typeof checkboxColors[number]>;
  /** 组级样式变体 */
  variant: Ref<typeof checkboxVariants[number]>;
  /** 组级最多可选数量 */
  max: Ref<number | undefined>;
  /** 组内选中数量是否已达 max 上限 */
  limitReached: ComputedRef<boolean>;
  /** 表单校验错误态 */
  isError?: ComputedRef<boolean>;
  /** 组内选中值更新入口；被 max 上限拦截时返回 undefined */
  updateValue: (value: CheckboxValue, ev: Event) => CheckboxValue[] | undefined;
}

/**
 * 多选框属性定义
 */
export interface CheckboxProps {
  /**
   * 默认值，用于非受控模式
   */
  defaultValue?: CheckboxValue | CheckboxValue[];
  /**
   * 默认是否选中，用于非受控模式（等价于 defaultValue 传布尔值）
   */
  defaultChecked?: boolean;
  /**
   * 当前复选框的值 (在组合模式下或绑定值为数组时使用)
   */
  value?: CheckboxValue;
  /**
   * 标签文本
   */
  label?: string;
  /**
   * 是否为半选状态。纯受控属性，组件不会自动清除，需由外层根据子项选中数量推导
   */
  indeterminate?: boolean;
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
   * 样式变体
   * - filled：选中/半选填充配色，图标为白色
   * - outlined：选中只染边框与图标、不填充背景；半选保持灰色边框，中间显示同色实心小方块
   */
  variant?: typeof checkboxVariants[number];
  /**
   * 选中时的值 (非数组模式下生效)
   */
  trueValue?: CheckboxValue;
  /**
   * 未选中时的值 (非数组模式下生效)
   */
  falseValue?: CheckboxValue;
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
    dot: ClassValue;
    label: ClassValue;
  }>;
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  // 下面三项的运行时类型都含 Boolean：未传时会被 Vue 强转为 false，
  // 必须显式给 undefined 默认值（default 键存在即跳过强转），否则「是否传了」永远判断不出来
  defaultValue: undefined,
  trueValue: undefined,
  falseValue: undefined,
  defaultChecked: false,
  indeterminate: false,
  disabled: false,
  size: "md",
  color: "primary",
  variant: "filled",
});

const emit = defineEmits<{
  /** 用户切换选中状态后触发，第一个参数与 update:modelValue 相同，第二个参数为原生事件对象 */
  (e: "change", value: CheckboxValue | CheckboxValue[], ev: Event): void;
}>();

/** 绑定值（v-model）；显式 default: undefined 跳过 Boolean 类型未传时被强转为 false 的规则，保住非受控判断 */
const model = defineModel<CheckboxValue | CheckboxValue[]>({ default: undefined });

const attrs = useAttrs();

/**
 * 注入父级 CheckboxGroup 状态（如果存在）
 */
const checkboxGroup = inject<CheckboxGroupContext | null>("RebornCheckboxGroup", null);

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
 * 非受控状态的内部值，未绑定 v-model 时以 defaultValue（优先）或 defaultChecked 起始
 */
const innerValue = ref<CheckboxValue | CheckboxValue[]>(props.defaultValue ?? props.defaultChecked);

/**
 * 当前实际生效的值
 * 优先级：CheckboxGroup.modelValue > v-model 绑定值 > 非受控内部值
 */
const currentValue = computed<CheckboxValue | CheckboxValue[]>(() => {
  if (checkboxGroup) {
    return checkboxGroup.modelValue.value;
  }
  return model.value !== undefined ? model.value : innerValue.value;
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
 * 是否为半选状态。选中态与半选态可同时成立，此时视觉上以半选为准
 */
const isIndeterminate = computed(() => props.indeterminate);

/**
 * 是否禁用
 * 组内选中数量达到 max 上限时，未选中的选项一并禁用（已选中的仍可取消）
 */
const isDisabled = computed(() => {
  if (checkboxGroup) {
    if (checkboxGroup.limitReached?.value && !isChecked.value) {
      return true;
    }
    return checkboxGroup.disabled.value || props.disabled;
  }
  return fieldGroupDisabled.value || props.disabled
});

/**
 * 最终计算出的组件尺寸
 */
const computedSize = computed(() => {
  if (checkboxGroup?.size?.value) {
    return checkboxGroup.size.value;
  }
  return fieldGroupSize.value || props.size;
});

/**
 * 最终计算出的组件颜色主题
 */
const computedColor = computed(() => {
  if (checkboxGroup?.color?.value) {
    return checkboxGroup.color.value;
  }
  return props.color;
});

/**
 * 最终计算出的样式变体
 */
const computedVariant = computed(() => {
  if (checkboxGroup?.variant?.value) {
    return checkboxGroup.variant.value;
  }
  return props.variant;
});

/**
 * 是否渲染 outlined 变体的半选方块（此时不再渲染横线图标）
 */
const showIndeterminateDot = computed(
  () => computedVariant.value === "outlined" && isIndeterminate.value,
);

const uiOverrides = computed(() => props.ui || {});

/**
 * 组合后的 UI 样式类
 */
const ui = computed(() => {
  const styles = b({
    size: computedSize.value,
    color: computedColor.value,
    variant: computedVariant.value,
    error: isError.value || !!checkboxGroup?.isError?.value,
    // 禁用态是独立的变体维度，必须显式传入且为真布尔值：
    // 配色复合变体以 disabled: false 作为门控条件，传 undefined 会导致匹配失败、配色全丢
    disabled: !!isDisabled.value,
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    control: (opts?: { class?: any }) => styles.control({ class: cn(opts?.class, uiOverrides.value.control) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    dot: (opts?: { class?: any }) => styles.dot({ class: cn(opts?.class, uiOverrides.value.dot) }),
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
 * @param event 触发本次更新的原生事件
 */
function updateValue(nextValue: CheckboxValue | CheckboxValue[], event: Event) {
  // 非受控内部值同步维护：未绑定 v-model 时由它承载状态
  innerValue.value = nextValue;
  model.value = nextValue;
  // 受控绑定下 model 赋值后同步回读仍是旧值，事件载荷一律用本地新值
  emit("change", nextValue, event);
}

/**
 * 处理 input 的 change 事件
 */
function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const checked = target.checked;

  // 情况 A: 处于 CheckboxGroup 中，值由父级统一维护（校验也由父级触发）
  if (checkboxGroup) {
    const next = checkboxGroup.updateValue(optionValue.value, event);
    // 被 max 上限拦截时返回 undefined，此时不抛事件
    if (next) {
      emit("change", next, event);
    }
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
    updateValue(Array.from(next), event);
    validate("change");
    return;
  }

  // 情况 C: 单选模式，支持 true-value / false-value
  const nextValue = checked
    ? (props.trueValue !== undefined ? props.trueValue : true)
    : (props.falseValue !== undefined ? props.falseValue : false);

  updateValue(nextValue, event);
  validate("change");
}

/** 原生 input 引用，用于同步半选状态 */
const inputRef = ref<HTMLInputElement | null>(null);

/**
 * 视觉上的半选由 control 节点的 data-indeterminate 驱动，
 * 这里额外把状态写回原生 input 的 indeterminate 属性，
 * 让读屏软件拿到 mixed 语义（该属性只能用 JS 赋值，无法写在模板上）
 */
onMounted(() => {
  watchEffect(() => {
    if (inputRef.value) {
      inputRef.value.indeterminate = isIndeterminate.value;
    }
  });
});
</script>

<template>
  <label :class="ui.wrapper({ class: props.class })" :data-disabled="isDisabled">
    <input ref="inputRef" v-bind="inputAttrs" type="checkbox" :value="optionValue" :checked="isChecked"
      :disabled="isDisabled" :class="ui.input()" @change="handleChange" />

    <!-- checkbox 插槽整体替换勾选框；一旦填充，ui.control / ui.icon 将不再生效 -->
    <slot name="checkbox" :checked="isChecked" :disabled="isDisabled" :indeterminate="isIndeterminate">
      <span :class="ui.control()" :data-indeterminate="isIndeterminate || undefined">
        <slot name="icon" :checked="isChecked" :disabled="isDisabled" :indeterminate="isIndeterminate">
          <!-- data-dot 是给 control 显形规则用的排除标记，不能删：见 reborn-checkbox.config.ts 注释 -->
          <span v-if="showIndeterminateDot" data-dot :class="ui.dot()" />
          <Icon v-else :name="isIndeterminate ? 'lucide:minus' : 'lucide:check'" :class="ui.icon()" />
        </slot>
      </span>
    </slot>

    <span v-if="props.label || $slots.default" :class="ui.label()">
      <slot>{{ props.label }}</slot>
    </span>
  </label>
</template>
