<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { FieldTriggerProps } from "../reborn-field-trigger/RebornFieldTrigger.vue";
import type { SelectTriggerProps } from "../reborn-select-trigger/RebornSelectTrigger.vue";
import type { TimeRangeRole } from "./reborn-time-panel.config";
import type { timePickerColors, timePickerSizes } from "./reborn-time-picker.config";
import type { TimePanelProps } from "./RebornTimePanel.vue";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { computed, nextTick, ref, useAttrs, useId, watch } from "vue";
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
  closeOn: "click",
  placeholder: "请选择时间",
  startPlaceholder: "开始时间",
  endPlaceholder: "结束时间",
  rangeSeparator: "~",
  disabled: false,
  clearable: true,
  isRange: false,
  arrowControl: false,
  showFooter: true,
  format: "HH:mm:ss",
  size: "md",
  color: "primary",
  bordered: true,
  showArrow: true,
  arrowAnimation: true,
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

export interface TimePickerProps {
  /** 触发器形态，与选择器一致 */
  variant?: FieldTriggerProps["variant"];
  /** 中心选中区域的形态，独立于触发器 */
  panelVariant?: TimePanelProps["variant"];
  /** 单点模式下允许手动输入时间 */
  allowInput?: boolean;
  /** 尾部图标名称 */
  icon?: string;
  /** 与选择器一致：click 在外部点击完成后关闭；mousedown 在外部按下或页面滚动时关闭，内部滚动不关闭。 */
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
    separator: ClassValue;
  }>;
}

/** 绑定值 */
const modelValue = defineModel<string | string[]>({ default: "" });

/** 下拉是否展开 */
const isOpen = ref(false);
const panelId = useId();
const attrs = useAttrs();
const inputLabel = computed(() =>
  typeof attrs["aria-label"] === "string" ? attrs["aria-label"] : props.placeholder,
);
const panelRef = ref<InstanceType<typeof RebornTimePanel> | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const inputValue = ref("");
const inputInvalid = ref(false);

/**
 * 生成及管理样式映射表
 */
const styles = computed(() =>
  b({
    size: props.size,
    color: props.color,
    open: isOpen.value,
    disabled: props.disabled,
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
watch(isOpen, (value) => emit("visibleChange", value));
watch(
  () => props.disabled,
  (value) => {
    if (value) isOpen.value = false;
  },
);

function openPanel() {
  if (!props.disabled) isOpen.value = true;
}

function toggle() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function clear() {
  if (props.disabled) return;
  modelValue.value = props.isRange ? [] : "";
  inputValue.value = "";
  inputInvalid.value = false;
  emit("change", modelValue.value);
  emit("clear");
}

function handlePanelChange(value: string | string[]) {
  if (props.disabled) return;
  modelValue.value = value;
  emit("change", value);
}

function handleConfirm(value: string | string[]) {
  if (props.disabled) return;
  isOpen.value = false;
  emit("confirm", value);
  nextTick(() => inputRef.value?.focus());
}

/** 手动输入与面板共用格式和禁用规则，不把非法值写入表单。 */
function commitInput() {
  if (props.disabled || props.isRange || !props.allowInput) return true;
  const value = inputValue.value.trim();
  if (!value) {
    if (hasValue.value) clear();
    inputInvalid.value = false;
    return true;
  }
  const state = parseTimeValue(value, props.format);
  const units = getTimeUnits(props.format);
  const blocked =
    state &&
    ((units.includes("hour") && props.disabledHours("start", null).includes(state.hour)) ||
      (units.includes("minute") &&
        props.disabledMinutes(state.hour, "start", null).includes(state.minute)) ||
      (units.includes("second") &&
        props.disabledSeconds(state.hour, state.minute, "start", null).includes(state.second)) ||
      (units.includes("millisecond") &&
        props
          .disabledMilliseconds(state.hour, state.minute, state.second, "start", null)
          .includes(state.millisecond)));
  if (!state || blocked) {
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
}

function cancelInput() {
  inputValue.value = singleDisplay.value ?? "";
  inputInvalid.value = false;
  isOpen.value = false;
}

function onInputKeydown(event: KeyboardEvent) {
  if (props.disabled) return;
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
    :disabled="disabled"
    :size="size"
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
        :disabled="disabled"
        :clearable="clearable && hasValue && !disabled"
        :size="size"
        :color="color"
        :variant="variant"
        :icon="icon"
        :ui="fieldUi"
        :error="inputInvalid"
        :bordered="bordered"
        :show-arrow="showArrow"
        :arrow-animation="arrowAnimation"
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
              :class="ui.rangeText()"
            >
              <span :class="rangeDisplay.start ? ui.triggerText() : ui.placeholder()">{{
                rangeDisplay.start || startPlaceholder
              }}</span>
              <span :class="ui.separator()">{{ rangeSeparator }}</span>
              <span :class="rangeDisplay.end ? ui.triggerText() : ui.placeholder()">{{
                rangeDisplay.end || endPlaceholder
              }}</span>
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
              :disabled="disabled"
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
        ref="panelRef"
        v-model="modelValue"
        role="dialog"
        aria-label="时间选择"
        :format="format"
        :is-range="isRange"
        :arrow-control="arrowControl"
        :show-footer="showFooter"
        :variant="panelVariant"
        :ui="panelUi"
        :disabled="disabled"
        :size="size"
        :color="color"
        :disabled-hours="disabledHours"
        :disabled-minutes="disabledMinutes"
        :disabled-seconds="disabledSeconds"
        :disabled-milliseconds="disabledMilliseconds"
        @change="handlePanelChange"
        @confirm="handleConfirm"
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
