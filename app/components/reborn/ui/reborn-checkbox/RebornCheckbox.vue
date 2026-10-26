<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { checkboxColors, checkboxSizes, CheckboxValue, checkboxVariants } from "./reborn-checkbox.config";
import { computed, getCurrentInstance, inject, nextTick, normalizeClass, normalizeStyle, onBeforeUpdate, shallowRef, useAttrs } from "vue";
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme, { CHECKBOX_GROUP_KEY } from "./reborn-checkbox.config";

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

defineOptions({
  inheritAttrs: false,
});

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

/**
 * 绑定值（v-model）；显式 default: undefined 跳过 Boolean 类型未传时被强转为 false 的规则，保住非受控判断。
 * defineModel 只负责声明属性与 update 事件，读写都不经它的本地缓存：只传值时 useModel 会改写缓存；非受控时写进去的值
 * 还会成为受控后「同值不派发」的去重基准，吞掉父级要收的事件。读取按严格受控取父级原始值，写入直接派发事件。
 */
defineModel<CheckboxValue | CheckboxValue[]>({ default: undefined });

/**
 * 样式生成函数
 */
const b = tv(theme);

const attrs = useAttrs();
const instance = getCurrentInstance()!;
/** 父级是否在 vnode 上写了 modelValue（含 kebab 写法）：据此区分「未绑定」与「显式绑定 undefined」 */
function isBound() {
  const vnodeProps = instance.vnode.props ?? {};
  return Object.hasOwn(vnodeProps, "modelValue") || Object.hasOwn(vnodeProps, "model-value");
}
/**
 * 受控判定。是否显式绑定也必须响应父级更新（包括未绑定切到 undefined），
 * 但只存布尔结果：shallowRef 写入相同的值不会触发依赖，下游计算只在受控状态真的变化时重算。
 */
const bound = shallowRef(isBound());
onBeforeUpdate(() => {
  bound.value = isBound();
});
function isControlled() {
  return bound.value;
}

/**
 * 注入父级 CheckboxGroup 状态（如果存在）
 */
const checkboxGroup = inject(CHECKBOX_GROUP_KEY, null);

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
const innerValue = shallowRef<CheckboxValue | CheckboxValue[]>(props.defaultValue ?? props.defaultChecked);

/**
 * 当前实际生效的值
 * 优先级：CheckboxGroup.modelValue > v-model 绑定值 > 非受控内部值
 */
const currentValue = computed<CheckboxValue | readonly CheckboxValue[] | undefined>(() => {
  if (checkboxGroup) {
    return checkboxGroup.modelValue.value;
  }
  // 严格受控：只认父级传入的原始值，只传值不接 update 事件时点击不改变显示（与 Badge / Overlay / UniApp 端一致）
  return isControlled() ? instance.props.modelValue as CheckboxValue | CheckboxValue[] : innerValue.value;
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
function inputAttrs() {
  const { class: className, style, ...rest } = attrs;
  void className;
  void style;
  return rest;
}

/**
 * 统一处理值的更新并触发相关事件
 * @param nextValue 下一步要设定的值
 * @param event 触发本次更新的原生事件
 */
function updateValue(nextValue: CheckboxValue | CheckboxValue[], event: Event) {
  // 非受控内部值同步维护：未绑定 v-model 时由它承载状态
  if (!isControlled()) innerValue.value = nextValue;
  instance.emit("update:modelValue", nextValue);
  // 受控绑定下派发后同步回读仍是父级旧值，事件载荷一律用本地新值
  emit("change", nextValue, event);
}

/**
 * 处理 input 的 change 事件
 */
function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  applyChange(target.checked, event);
  // 原生 checkbox 已被浏览器切换，外观又靠 peer-checked 读 DOM 状态；受控时父级可能不回写（只传值或拒收），
  // 组件不会重渲染，DOM 就停在切换后的状态。等父级这一轮更新完成后，把 DOM 对齐回组件认定的选中态。
  // 必须在派发事件之后登记：此时父级的更新已排进队列，nextTick 才会排在那次刷新之后。
  void nextTick(() => {
    if (target.checked !== isChecked.value) target.checked = isChecked.value;
  });
}

/**
 * 按切换后的勾选状态计算新值并写回
 * @param checked 原生 input 切换后的勾选状态
 * @param event 触发本次更新的原生事件
 */
function applyChange(checked: boolean, event: Event) {

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

</script>

<template>
  <label
    :class="ui.wrapper({ class: cn(props.class, normalizeClass(attrs.class)) })"
    :style="normalizeStyle(attrs.style)"
    :data-disabled="isDisabled"
  >
    <input
      v-bind="inputAttrs()"
      :indeterminate="isIndeterminate"
      type="checkbox"
      :value="optionValue"
      :checked="isChecked"
      :disabled="isDisabled"
      :class="ui.input()"
      @change="handleChange"
    >

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
