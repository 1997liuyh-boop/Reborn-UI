<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { FieldTriggerProps } from "../reborn-field-trigger/RebornFieldTrigger.vue";
import type { SelectTriggerProps } from "../reborn-select-trigger/RebornSelectTrigger.vue";
import type { TimeRangeRole } from "./reborn-time-panel.config";
import type { timePickerColors, timePickerSizes } from "./reborn-time-picker.config";
import type { TimePanelProps } from "./RebornTimePanel.vue";
import dayjs from "dayjs";
import { computed, nextTick, onBeforeUnmount, shallowRef, useAttrs, useId, useTemplateRef, watch } from "vue";
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import RebornFieldTrigger from "../reborn-field-trigger/RebornFieldTrigger.vue";
import { splitTriggerUi } from "../reborn-select-trigger/reborn-select-trigger.config";
import RebornSelectTrigger from "../reborn-select-trigger/RebornSelectTrigger.vue";
import theme from "./reborn-time-picker.config";
import RebornTimePanel from "./RebornTimePanel.vue";
import { getTimeUnits, parseTimeValue } from "./time-picker.utils";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TimePickerProps>(), {
  variant: "outlined",
  panelVariant: "filled",
  allowInput: true,
  icon: "lucide:clock-3",
  closeOn: "mousedown",
  placeholder: "请选择时间",
  startPlaceholder: "开始时间",
  endPlaceholder: "结束时间",
  rangeSeparator: "~",
  disabled: false,
  clearable: true,
  isRange: false,
  followSystemTime: false,
  interaction: "scroll",
  arrowControl: false,
  showFooter: true,
  format: "HH:mm:ss",
  size: "md",
  color: "primary",
  bordered: true,
  showArrow: true,
  arrowAnimation: false,
  portal: true,
  autoAdjustOverflow: true,
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
  (e: "clear"): void;
  (e: "confirm", value: string | string[]): void;
  (e: "invalid", value: string): void;
  (e: "visibleChange", visible: boolean): void;
  (e: "focus", event: FocusEvent): void;
  (e: "blur", event: FocusEvent): void;
}>();

// customParseFormat 插件已在 time-picker.utils 模块级注册（本文件导入该模块），组件内不再重复 extend
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

export interface TimePickerProps {
  /** 触发器形态，与选择器一致 */
  variant?: FieldTriggerProps["variant"];
  /** 中心选中区域的形态，独立于触发器 */
  panelVariant?: TimePanelProps["variant"];
  /** 单点模式下允许手动输入时间 */
  allowInput?: boolean;
  /** 尾部图标名称 */
  icon?: string;
  /** 与选择器一致：mousedown（默认）在外部按下、滚轮或页面滚动时关闭，内部滚动不关闭；click 在外部点击完成后关闭。 */
  closeOn?: SelectTriggerProps["closeOn"];
  /** 面板内部样式覆盖 */
  panelUi?: TimePanelProps["ui"];
  placeholder?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  rangeSeparator?: string;
  disabled?: boolean;
  clearable?: boolean;
  isRange?: boolean;
  /** 空值时是否以当前系统时间初始化；已有绑定值优先 */
  followSystemTime?: TimePanelProps["followSystemTime"];
  /** 时间列交互：默认滚动居中，click 仅点击选中并置顶 */
  interaction?: TimePanelProps["interaction"];
  arrowControl?: boolean;
  /** 是否显示底部操作区，包含自定义 footer 插槽 */
  showFooter?: boolean;
  format?: string;
  size?: (typeof timePickerSizes)[number];
  color?: (typeof timePickerColors)[number];
  /** 追加到触发器根元素的自定义类名 */
  class?: any;
  disabledHours?: DisabledHours;
  disabledMinutes?: DisabledMinutes;
  disabledSeconds?: DisabledSeconds;
  /** 返回需禁用的毫秒数组，入参为当前时、分、秒；范围模式下可按 role 区分开始/结束面板 */
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
  /** 下拉框是否自动调整位置：下方空间不足且上方更宽裕时向上展开；关闭后固定向下 */
  autoAdjustOverflow?: SelectTriggerProps["autoAdjustOverflow"];
  /** 触发器 (Trigger) 的 UI 微调配置：触发器盒子与浮层的键混写在一起，组件内部自动拆分下发 */
  triggerUi?: SelectTriggerProps["ui"] & FieldTriggerProps["ui"];
  /** 时间选择器内部组件的 UI 微调配置 */
  ui?: Partial<{
    wrapper: ClassValue;
    input: ClassValue;
    triggerText: ClassValue;
    placeholder: ClassValue;
    dropdown: ClassValue;
    rangeText: ClassValue;
    rangeSegment: ClassValue;
    rangeIndicator: ClassValue;
    separator: ClassValue;
  }>;
}

/** 绑定值 */
const modelValue = defineModel<string | string[]>({ default: "" });

/**
 * 接入表单：尺寸、禁用跟随所在表单（控件显式传入的 size 优先），
 * 字段校验失败时触发器标红，值变化与失焦时按表单的 trigger 配置触发字段校验
 */
const { size: formSize, disabled: formDisabled, isError, validate } = useFormInject(props);
const isDisabled = computed(() => !!formDisabled.value || props.disabled);
const mergedSize = computed(() => formSize.value || props.size);

/** 下拉是否展开 */
const isOpen = shallowRef(false);
const panelId = useId();
const attrs = useAttrs();
const inputLabel = computed(() =>
  typeof attrs["aria-label"] === "string" ? attrs["aria-label"] : props.placeholder,
);
const panelRef = useTemplateRef<InstanceType<typeof RebornTimePanel>>("panelRef");
const inputRef = useTemplateRef<HTMLInputElement>("inputRef");
const inputValue = shallowRef("");
const inputInvalid = shallowRef(false);
const activeRangeRole = shallowRef<TimeRangeRole>("start");
const rangeRef = useTemplateRef<HTMLElement>("rangeRef");
const rangeStartRef = useTemplateRef<HTMLButtonElement>("rangeStartRef");
const rangeEndRef = useTemplateRef<HTMLButtonElement>("rangeEndRef");
const rangeIndicatorStyle = shallowRef({ width: "0px", transform: "translateX(0px)" });
let rangeObserver: ResizeObserver | undefined;
let rangeSwitchTimer: ReturnType<typeof setTimeout> | undefined;

/** 滑块按真实文本区宽度定位，支持自定义分隔图标和尺寸。 */
function syncRangeIndicator() {
  nextTick(() => {
    const segment = activeRangeRole.value === "start" ? rangeStartRef.value : rangeEndRef.value;
    if (segment) rangeIndicatorStyle.value = { width: `${segment.offsetWidth}px`, transform: `translateX(${segment.offsetLeft}px)` };
  });
}
watch(rangeRef, element => {
  rangeObserver?.disconnect();
  if (element && typeof ResizeObserver !== "undefined") {
    rangeObserver = new ResizeObserver(syncRangeIndicator);
    rangeObserver.observe(element);
  }
  syncRangeIndicator();
});
watch([activeRangeRole, isOpen, mergedSize], syncRangeIndicator);
onBeforeUnmount(() => {
  rangeObserver?.disconnect();
  clearTimeout(rangeSwitchTimer);
});

/**
 * 生成及管理样式映射表
 */
const styles = computed(() =>
  b({
    size: mergedSize.value,
    color: props.color,
    open: isOpen.value,
    disabled: isDisabled.value,
    isRange: props.isRange,
  }),
);

/** 传给 Trigger 的 UI 配置，合并了 config 中的宽度逻辑；浮层与触发器盒子分别下发 */
const splitUi = computed(() => splitTriggerUi(props.triggerUi));

const overlayUi = computed(() => ({
  ...splitUi.value.overlay,
  // 浮层宽度来自 config 的 size/isRange 复合变体，triggerUi.dropdown 与 ui.dropdown 都可继续叠加
  dropdown: cn(styles.value.dropdown(), splitUi.value.overlay.dropdown, props.ui?.dropdown),
}));

const fieldUi = computed(() => ({
  ...splitUi.value.field,
  trigger: cn(styles.value.trigger(), splitUi.value.field.trigger),
}));

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
    rangeSegment: (opts?: { class?: any }) =>
      s.rangeSegment({ class: cn(opts?.class, uiOverrides.value.rangeSegment) }),
    rangeIndicator: (opts?: { class?: any }) =>
      s.rangeIndicator({ class: cn(opts?.class, uiOverrides.value.rangeIndicator) }),
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

/** 外部更新与面板选择都同步到输入框，初始化不会反写空值。 */
watch(
  singleDisplay,
  (value) => {
    inputValue.value = value ?? "";
    inputInvalid.value = false;
  },
  { immediate: true },
);
watch(isOpen, (value) => {
  clearTimeout(rangeSwitchTimer);
  if (value && props.isRange) syncRangeIndicator();
  emit("visibleChange", value);
});
watch([() => props.isRange, () => props.format], () => {
  clearTimeout(rangeSwitchTimer);
  activeRangeRole.value = "start";
});
watch(
  () => isDisabled.value,
  (value) => {
    if (value) isOpen.value = false;
  },
);

function openPanel() {
  if (isDisabled.value) return;
  if (!isOpen.value) activeRangeRole.value = "start";
  isOpen.value = true;
}

function toggle() {
  if (isDisabled.value) return;
  if (isOpen.value) isOpen.value = false;
  else openPanel();
}

/** 区间一次只编辑一个端点，开始时间为空时先补全开始时间。 */
function activateRangeRole(role: TimeRangeRole) {
  if (isDisabled.value) return;
  clearTimeout(rangeSwitchTimer);
  activeRangeRole.value = role === "end" && !rangeDisplay.value?.start ? "start" : role;
  isOpen.value = true;
}

function handleSelectionComplete() {
  if (!props.isRange || activeRangeRole.value !== "start") return;
  clearTimeout(rangeSwitchTimer);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // 让最后一列先完成向上滑动，再切换到结束时间。
  rangeSwitchTimer = setTimeout(() => {
    if (isOpen.value && !isDisabled.value) activateRangeRole("end");
  }, props.interaction === "click" && !reduced ? 220 : 0);
}

const panelValue = computed(() => {
  if (!props.isRange) return typeof modelValue.value === "string" ? modelValue.value : "";
  return Array.isArray(modelValue.value) ? modelValue.value[activeRangeRole.value === "start" ? 0 : 1] || "" : "";
});
const comparingValue = computed(() => props.isRange && Array.isArray(modelValue.value)
  ? modelValue.value[activeRangeRole.value === "start" ? 1 : 0] || null : null);
const panelRole = computed<TimeRangeRole>(() => props.isRange ? activeRangeRole.value : "start");
const panelDisabledHours = computed(() => {
  const callback = props.disabledHours; const role = panelRole.value; const comparing = comparingValue.value;
  return () => callback(role, comparing);
});
const panelDisabledMinutes = computed(() => {
  const callback = props.disabledMinutes; const role = panelRole.value; const comparing = comparingValue.value;
  return (hour: number) => callback(hour, role, comparing);
});
const panelDisabledSeconds = computed(() => {
  const callback = props.disabledSeconds; const role = panelRole.value; const comparing = comparingValue.value;
  return (hour: number, minute: number) => callback(hour, minute, role, comparing);
});
const panelDisabledMilliseconds = computed(() => {
  const callback = props.disabledMilliseconds; const role = panelRole.value; const comparing = comparingValue.value;
  return (hour: number, minute: number, second: number) => callback(hour, minute, second, role, comparing);
});

function clear() {
  if (isDisabled.value) return;
  modelValue.value = props.isRange ? [] : "";
  inputValue.value = "";
  inputInvalid.value = false;
  clearTimeout(rangeSwitchTimer);
  activeRangeRole.value = "start";
  emit("change", modelValue.value);
  validate("change");
  emit("clear");
}

/**
 * 面板与手动输入写回绑定值的唯一入口。
 * 面板只用 :model-value 单向接收，不再同时用 v-model 回写，否则受控绑定下父级会连续收到两次 update:modelValue
 */
function handlePanelChange(value: string | string[]) {
  if (isDisabled.value) return;
  const range = Array.isArray(modelValue.value) ? [modelValue.value[0] || "", modelValue.value[1] || ""] : ["", ""];
  if (props.isRange && typeof value === "string") range[activeRangeRole.value === "start" ? 0 : 1] = value;
  const nextValue = props.isRange ? value === "" ? [] : range : value;
  if (props.isRange && value === "") {
    clearTimeout(rangeSwitchTimer);
    activeRangeRole.value = "start";
  }
  modelValue.value = nextValue;
  emit("change", nextValue);
  validate("change");
}

async function handleConfirm(value: string | string[]) {
  if (isDisabled.value) return;
  if (props.isRange) {
    // 子面板会先发 change 再发 confirm，等待受控绑定回流后读取起止值。
    await nextTick();
    if (isDisabled.value || !props.isRange) return;
    if (activeRangeRole.value === "start") {
      activateRangeRole("end");
      return;
    }
    const range = Array.isArray(modelValue.value) ? [...modelValue.value] : [];
    if (!range[0] || !range[1]) return;
    const numberOf = (text: string) => {
      const time = parseTimeValue(text, props.format);
      return time ? ((time.hour * 60 + time.minute) * 60 + time.second) * 1000 + time.millisecond : 0;
    };
    range.sort((start, end) => numberOf(start) - numberOf(end));
    if (range.some((item, index) => isTimeBlocked(item, index === 0 ? "start" : "end", range[1 - index] || null))) return;
    if (range.some((item, index) => item !== modelValue.value[index])) {
      modelValue.value = range;
      emit("change", range);
      validate("change");
    }
    value = range;
  }
  isOpen.value = false;
  emit("confirm", value);
  nextTick(() => inputRef.value?.focus());
}

/** 手动输入和区间最终确认都按真实端点校验禁用规则。 */
function isTimeBlocked(value: string, role: TimeRangeRole = "start", comparing: string | null = null) {
  const state = parseTimeValue(value, props.format);
  if (!state) return true;
  const units = getTimeUnits(props.format);
  return (units.includes("hour") && props.disabledHours(role, comparing).includes(state.hour)) ||
    (units.includes("minute") && props.disabledMinutes(state.hour, role, comparing).includes(state.minute)) ||
    (units.includes("second") && props.disabledSeconds(state.hour, state.minute, role, comparing).includes(state.second)) ||
    (units.includes("millisecond") && props.disabledMilliseconds(state.hour, state.minute, state.second, role, comparing).includes(state.millisecond));
}

/** 手动输入与面板共用格式和禁用规则，不把非法值写入表单。 */
function commitInput() {
  if (isDisabled.value || props.isRange || !props.allowInput) return true;
  const value = inputValue.value.trim();
  if (!value) {
    if (hasValue.value) clear();
    inputInvalid.value = false;
    return true;
  }
  if (isTimeBlocked(value)) {
    inputInvalid.value = true;
    emit("invalid", value);
    return false;
  }
  inputInvalid.value = false;
  inputValue.value = value;
  if (modelValue.value !== value) handlePanelChange(value);
  return true;
}

function onBlur(event: FocusEvent) {
  commitInput();
  emit("blur", event);
  validate("blur");
}

function cancelInput() {
  inputValue.value = singleDisplay.value ?? "";
  inputInvalid.value = false;
  isOpen.value = false;
}

function onInputKeydown(event: KeyboardEvent) {
  if (isDisabled.value) return;
  if (event.key === "Enter") {
    event.preventDefault();
    if (commitInput()) {
      isOpen.value = false;
      emit("confirm", modelValue.value);
    }
  } else if (event.key === "Escape") {
    event.preventDefault();
    cancelInput();
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    openPanel();
    nextTick(() => panelRef.value?.$el.querySelector('[role="listbox"]')?.focus());
  }
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.target !== event.currentTarget) return;
  if (event.key === "Escape") cancelInput();
  else if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
    event.preventDefault();
    openPanel();
  }
}

function syncPanel() {
  panelRef.value?.syncColumns();
}

function onOutsideClose() {
  if (!isOpen.value) return;
  if (!commitInput()) cancelInput();
  isOpen.value = false;
}
</script>

<template>
  <RebornSelectTrigger
    :class="ui.wrapper({ class: props.class })"
    :is-open="isOpen"
    :disabled="isDisabled"
    :size="mergedSize"
    :ui="overlayUi"
    :portal="portal"
    :close-on="closeOn"
    :auto-adjust-overflow="autoAdjustOverflow"
    @close="onOutsideClose"
    @keydown="onTriggerKeydown"
    @after-enter="syncPanel"
  >
    <template #trigger>
      <RebornFieldTrigger
        :is-open="isOpen"
        :disabled="isDisabled"
        :clearable="clearable && hasValue && !isDisabled"
        :size="mergedSize"
        :color="color"
        :variant="variant"
        :icon="icon"
        :ui="fieldUi"
        :error="inputInvalid || isError"
        :bordered="bordered"
        :show-arrow="showArrow"
        :arrow-animation="interaction === 'click' ? false : arrowAnimation"
        @click="toggle"
        @clear="clear"
      >
        <template
          v-if="$slots.cover"
          #cover
        >
          <slot
            name="cover"
            :is-open="isOpen"
            :toggle="toggle"
            :clear="clear"
            :has-value="hasValue"
            :range-display="rangeDisplay"
            :single-display="singleDisplay"
          />
        </template>
        <template #default>
          <slot
            :is-open="isOpen"
            :toggle="toggle"
            :clear="clear"
            :has-value="hasValue"
            :range-display="rangeDisplay"
            :single-display="singleDisplay"
          >
            <div
              v-if="isRange && rangeDisplay"
              ref="rangeRef"
              :class="ui.rangeText()"
            >
              <button ref="rangeStartRef" type="button" :class="ui.rangeSegment()" :disabled="isDisabled" :aria-pressed="isOpen && activeRangeRole === 'start'" :aria-label="startPlaceholder" data-range-role="start" @click.stop="activateRangeRole('start')">
                <span :class="rangeDisplay.start ? ui.triggerText() : ui.placeholder()">{{ rangeDisplay.start || startPlaceholder }}</span>
              </button>
              <span :class="ui.separator()"><slot name="range-separator">{{ rangeSeparator }}</slot></span>
              <button ref="rangeEndRef" type="button" :class="ui.rangeSegment()" :disabled="isDisabled" :aria-pressed="isOpen && activeRangeRole === 'end'" :aria-label="endPlaceholder" data-range-role="end" @click.stop="activateRangeRole('end')">
                <span :class="rangeDisplay.end ? ui.triggerText() : ui.placeholder()">{{ rangeDisplay.end || endPlaceholder }}</span>
              </button>
              <span v-if="isOpen" :class="ui.rangeIndicator()" :style="rangeIndicatorStyle" aria-hidden="true" />
            </div>
            <input
              v-else
              ref="inputRef"
              v-model="inputValue"
              v-bind="$attrs"
              type="text"
              role="combobox"
              :class="cn(styles.input(), props.ui?.input)"
              :placeholder="placeholder"
              :disabled="isDisabled"
              :readonly="!allowInput"
              :aria-label="inputLabel"
              :aria-expanded="isOpen"
              :aria-controls="isOpen ? panelId : undefined"
              :aria-invalid="inputInvalid"
              aria-haspopup="dialog"
              :title="inputInvalid ? `请输入可选的时间，格式为 ${format}` : undefined"
              autocomplete="off"
              :spellcheck="false"
              @click.stop="openPanel"
              @input="inputInvalid = false"
              @keydown.stop="onInputKeydown"
              @focus="emit('focus', $event)"
              @blur="onBlur"
            >
          </slot>
        </template>
      </RebornFieldTrigger>
    </template>
    <template #content>
      <RebornTimePanel
        :id="panelId"
        :key="isRange ? activeRangeRole : 'single'"
        ref="panelRef"
        :model-value="panelValue"
        role="dialog"
        aria-label="时间选择"
        :format="format"
        :is-range="false"
        :follow-system-time="followSystemTime"
        :interaction="interaction"
        :arrow-control="arrowControl"
        :show-footer="showFooter"
        :variant="panelVariant"
        :ui="panelUi"
        :disabled="isDisabled"
        :size="mergedSize"
        :color="color"
        :disabled-hours="panelDisabledHours"
        :disabled-minutes="panelDisabledMinutes"
        :disabled-seconds="panelDisabledSeconds"
        :disabled-milliseconds="panelDisabledMilliseconds"
        @change="handlePanelChange"
        @confirm="handleConfirm"
        @select-complete="handleSelectionComplete"
        @clear="emit('clear')"
        @keydown.esc.stop="cancelInput"
      >
        <template
          v-if="$slots.footer"
          #footer="scope"
        >
          <slot
            name="footer"
            :confirm="scope.confirm"
            :clear="scope.clear"
            :now="scope.now"
          />
        </template>
      </RebornTimePanel>
    </template>
  </RebornSelectTrigger>
</template>
