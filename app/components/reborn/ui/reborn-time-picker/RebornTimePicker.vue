<script setup lang="ts">
import { computed, ref } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import { tv } from "~/lib/tv";
import RebornTimePanel from "./RebornTimePanel.vue";
import RebornSelectTrigger from "../reborn-select-trigger/RebornSelectTrigger.vue";
import type { SelectTriggerProps } from "../reborn-select-trigger/RebornSelectTrigger.vue";
import theme, { timePickerColors, timePickerSizes } from "./reborn-time-picker.config";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { TimeRangeRole } from "./reborn-time-panel.config";

dayjs.extend(customParseFormat);

const b = tv(theme);

type DisabledHours = (role?: TimeRangeRole, comparingValue?: string | null) => number[];
type DisabledMinutes = (
  hour: number,
  role?: TimeRangeRole,
  comparingValue?: string | null,
) => number[];
type DisabledMilliseconds = (
  hour: number,
  minute: number,
  second: number,
  role?: TimeRangeRole,
  comparingValue?: string | null,
) => number[];
type DisabledSeconds = (
  hour: number,
  minute: number,
  role?: TimeRangeRole,
  comparingValue?: string | null,
) => number[];

defineOptions({ inheritAttrs: false });

export interface TimePickerProps {
  placeholder?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  rangeSeparator?: string;
  disabled?: boolean;
  clearable?: boolean;
  isRange?: boolean;
  arrowControl?: boolean;
  format?: string;
  size?: (typeof timePickerSizes)[number];
  color?: (typeof timePickerColors)[number];
  class?: any;
  disabledHours?: DisabledHours;
  disabledMinutes?: DisabledMinutes;
  disabledSeconds?: DisabledSeconds;
  disabledMilliseconds?: DisabledMilliseconds;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示箭头 */
  showArrow?: boolean;
  /** 展开时箭头是否旋转 */
  arrowAnimation?: boolean;
  /**
   * 浮层是否传送到 body（默认 true）。
   * 关掉后浮层留在触发器内，会随父容器一起滚动、也一起被 overflow 裁剪。
   */
  portal?: SelectTriggerProps["portal"];
  /** 触发器 (Trigger) 的 UI 微调配置 */
  triggerUi?: SelectTriggerProps["ui"];
  /** 时间选择器内部组件的 UI 微调配置 */
  ui?: Partial<{
    wrapper: ClassValue;
    triggerText: ClassValue;
    placeholder: ClassValue;
    dropdown: ClassValue;
    rangeText: ClassValue;
    separator: ClassValue;
  }>;
}

const props = withDefaults(defineProps<TimePickerProps>(), {
  placeholder: "请选择时间",
  startPlaceholder: "开始时间",
  endPlaceholder: "结束时间",
  rangeSeparator: "~",
  disabled: false,
  clearable: true,
  isRange: false,
  arrowControl: false,
  format: "HH:mm:ss",
  size: "md",
  color: "primary",
  bordered: true,
  showArrow: true,
  arrowAnimation: true,
  portal: true,
  disabledHours: () => [],
  disabledMinutes: () => [],
  disabledSeconds: () => [],
  disabledMilliseconds: () => [],
});

/**
 * 时间变动事件
 */
const emit = defineEmits<{
  (e: "change", value: string | string[]): void;
}>();

/** 绑定值 */
const modelValue = defineModel<string | string[]>({ default: "" });

/** 下拉是否展开 */
const isOpen = ref(false);

/**
 * 生成及管理样式映射表
 */
const styles = computed(() => b({
  size: props.size,
  color: props.color,
  open: isOpen.value,
  disabled: props.disabled,
  isRange: props.isRange,
}));

/** 传给 Trigger 的 UI 配置，合并了 config 中的宽度逻辑 */
const triggerUi = computed(() => {
  const ui = { ...(props.triggerUi || {}) };
  ui.dropdown = cn(styles.value.dropdown(), ui.dropdown);
  ui.trigger = cn(styles.value.trigger(), ui.trigger);
  return ui;
});

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const s = styles.value;

  return {
    wrapper: (opts?: { class?: any }) =>
      s.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    triggerText: (opts?: { class?: any }) =>
      s.triggerText({ class: cn(opts?.class, uiOverrides.value.triggerText) }),
    placeholder: (opts?: { class?: any }) =>
      s.placeholder({ class: cn(opts?.class, uiOverrides.value.placeholder) }),
    rangeText: (opts?: { class?: any }) =>
      s.rangeText({ class: cn(opts?.class, uiOverrides.value.rangeText) }),
    separator: (opts?: { class?: any }) =>
      s.separator({ class: cn(opts?.class, uiOverrides.value.separator) }),
  };
});

const hasValue = computed(() => {
  if (props.isRange) {
    return Array.isArray(modelValue.value) && modelValue.value.some(Boolean);
  }
  return typeof modelValue.value === "string" && !!modelValue.value;
});

const rangeDisplay = computed(() => {
  if (!props.isRange) return null;
  const value = Array.isArray(modelValue.value) ? modelValue.value : [];

  const formatVal = (val: string) => {
    if (!val) return "";
    const parsed = dayjs(val, [props.format, "HH:mm:ss", "HH:mm"], true);
    return parsed.isValid() ? parsed.format(props.format) : val;
  };

  return {
    start: formatVal(value[0] || ""),
    end: formatVal(value[1] || ""),
  };
});

const singleDisplay = computed(() => {
  if (props.isRange) return null;
  const val = typeof modelValue.value === "string" ? modelValue.value : "";
  if (!val) return "";
  const parsed = dayjs(val, [props.format, "HH:mm:ss", "HH:mm"], true);
  return parsed.isValid() ? parsed.format(props.format) : val;
});

/**
 * 切换下拉展开状态
 */
function toggle() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

/**
 * 清除选中内容
 */
function clear() {
  modelValue.value = props.isRange ? [] : "";
  emit("change", modelValue.value);
}

/**
 * 处理面板内部变动
 */
function handlePanelChange(value: string | string[]) {
  modelValue.value = value;
  emit("change", value);
}

/**
 * 收起面板。外部点击的判定归 RebornSelectTrigger：
 * 浮层传送到 body 后不再是本组件根节点的后代，自己判 $el.contains 会把
 * 「点击面板里的时/分/秒」误判成外部点击。
 */
function onOutsideClose() {
  if (!isOpen.value) return;
  isOpen.value = false;
}
</script>

<template>
  <RebornSelectTrigger :class="ui.wrapper({ class: props.class })" :is-open="isOpen"
    :disabled="disabled" :clearable="clearable && hasValue" :size="size" :color="color"
    :icon="arrowControl ? 'lucide:chevrons-up-down' : 'lucide:clock-3'" :ui="triggerUi" :bordered="bordered"
    :show-arrow="showArrow" :arrow-animation="arrowAnimation" :portal="portal" @toggle="toggle" @clear="clear"
    @close="onOutsideClose">
    <template #cover v-if="$slots.cover">
      <slot name="cover" :isOpen="isOpen" :toggle="toggle" :clear="clear" :hasValue="hasValue"
        :rangeDisplay="rangeDisplay" :singleDisplay="singleDisplay" />
    </template>
    <template #default>
      <slot :isOpen="isOpen" :toggle="toggle" :clear="clear" :hasValue="hasValue" :rangeDisplay="rangeDisplay"
        :singleDisplay="singleDisplay">
        <template v-if="isRange && rangeDisplay">
          <div :class="ui.rangeText()">
            <span v-if="rangeDisplay.start" :class="ui.triggerText()">{{ rangeDisplay.start }}</span>
            <span v-else :class="ui.placeholder()">{{ startPlaceholder }}</span>
            <span :class="ui.separator()">{{ rangeSeparator }}</span>
            <span v-if="rangeDisplay.end" :class="ui.triggerText()">{{ rangeDisplay.end }}</span>
            <span v-else :class="ui.placeholder()">{{ endPlaceholder }}</span>
          </div>
        </template>
        <template v-else>
          <span v-if="singleDisplay" :class="ui.triggerText()">{{ singleDisplay }}</span>
          <span v-else :class="ui.placeholder()">{{ placeholder }}</span>
        </template>
      </slot>
    </template>

    <template #content>
      <RebornTimePanel v-model="modelValue" :format="format" :is-range="isRange" :arrow-control="arrowControl"
        :size="size" :color="color" :disabled-hours="disabledHours" :disabled-minutes="disabledMinutes"
        :disabled-seconds="disabledSeconds" :disabled-milliseconds="disabledMilliseconds" @change="handlePanelChange"
        @confirm="isOpen = false" @clear="clear" />
    </template>
  </RebornSelectTrigger>
</template>
