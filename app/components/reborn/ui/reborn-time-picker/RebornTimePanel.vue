<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { ComponentPublicInstance } from "vue";
import type {
  timePickerColors,
  timePickerSizes,
  TimeRangeRole,
  TimeUnit,
} from "./reborn-time-panel.config";
import type { TimeState } from "./time-picker.utils";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import RebornButton from "../reborn-button/RebornButton.vue";
import RebornScrollbar from "../scrollbar/RebornScrollbar.vue";
import theme from "./reborn-time-panel.config";

import {
  formatTimeValue,
  getCenteredScrollTop,
  getScrollValue,
  getTimeUnits,
  parseTimeValue,
} from "./time-picker.utils";

const props = withDefaults(defineProps<TimePanelProps>(), {
  modelValue: "",
  variant: "filled",
  disabled: false,
  format: "HH:mm:ss",
  isRange: false,
  arrowControl: false,
  showFooter: true,
  size: "md",
  color: "primary",
  disabledHours: () => [],
  disabledMinutes: () => [],
  disabledSeconds: () => [],
  disabledMilliseconds: () => [],
});

const emit = defineEmits<{
  (e: "change", value: string | string[]): void;
  /** 点击底部「清空」按钮清空值后触发 */
  (e: "clear"): void;
  /** 点击底部「确定」按钮时触发，携带当前选中值（范围模式为 [start, end]） */
  (e: "confirm", value: string | string[]): void;
}>();

dayjs.extend(customParseFormat);

const b = tv(theme);

type DisabledHours = (role?: TimeRangeRole, comparingValue?: string | null) => number[];
type DisabledMinutes = (
  hour: number,
  role?: TimeRangeRole,
  comparingValue?: string | null,
) => number[];
type DisabledSeconds = (
  hour: number,
  minute: number,
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

export interface TimePanelProps {
  modelValue?: string | string[];
  /** 中心选中区域的填充或上下描边 */
  variant?: "filled" | "outlined";
  /** 禁用面板全部交互 */
  disabled?: boolean;
  format?: string;
  isRange?: boolean;
  arrowControl?: boolean;
  /** 是否显示底部操作区，包含自定义 footer 插槽 */
  showFooter?: boolean;
  size?: (typeof timePickerSizes)[number];
  color?: (typeof timePickerColors)[number];
  /** 追加到面板根元素的自定义类名 */
  class?: any;
  disabledHours?: DisabledHours;
  disabledMinutes?: DisabledMinutes;
  disabledSeconds?: DisabledSeconds;
  /** 返回需禁用的毫秒数组，入参为当前时、分、秒；范围模式下可按 role 区分开始/结束面板 */
  disabledMilliseconds?: DisabledMilliseconds;
  ui?: Partial<{
    wrapper: ClassValue;
    body: ClassValue;
    rangeWrapper: ClassValue;
    rangeSeparator: ClassValue;
    section: ClassValue;
    columns: ClassValue;
    column: ClassValue;
    arrowButton: ClassValue;
    list: ClassValue;
    item: ClassValue;
    itemActive: ClassValue;
    itemDisabled: ClassValue;
    itemIdle: ClassValue;
    indicator: ClassValue;
    mask: ClassValue;
    footer: ClassValue;
  }>;
}

const modelValue = defineModel<string | string[]>({ default: "" });

const unitLabels: Record<TimeUnit, string> = {
  hour: "时",
  minute: "分",
  second: "秒",
  millisecond: "毫秒",
};

const unitMax: Record<TimeUnit, number> = {
  hour: 23,
  minute: 59,
  second: 59,
  millisecond: 999,
};

const startState = ref<TimeState>({ hour: 0, minute: 0, second: 0, millisecond: 0 });
const endState = ref<TimeState>({ hour: 0, minute: 0, second: 0, millisecond: 0 });

type ScrollbarInstance = InstanceType<typeof RebornScrollbar>;
const panelId = useId();
const columnRefs = new Map<string, ScrollbarInstance>();
const scrollTimers = new Map<string, ReturnType<typeof setTimeout>>();
const scrollTargets = new Map<string, number>();
const uiOverrides = computed(() => props.ui || {});
const activeUnits = computed(() => getTimeUnits(props.format));
const roles = computed<TimeRangeRole[]>(() => (props.isRange ? ["start", "end"] : ["start"]));
const options = computed(
  () =>
    Object.fromEntries(
      activeUnits.value.map((unit) => [
        unit,
        Array.from({ length: (unitMax[unit] + 1) * 3 }, (_, index) => ({
          index,
          value: index % (unitMax[unit] + 1),
        })),
      ]),
    ) as Record<TimeUnit, { index: number; value: number }[]>,
);
// 每次状态变更只计算一次可选集合，避免毫秒列重复构建千项数组。
const availableValues = computed(
  () =>
    Object.fromEntries(
      roles.value.map((role) => [
        role,
        Object.fromEntries(
          activeUnits.value.map((unit) => [
            unit,
            new Set(getAvailableValues(role, unit, getState(role))),
          ]),
        ),
      ]),
    ) as Record<TimeRangeRole, Partial<Record<TimeUnit, Set<number>>>>,
);
const canConfirm = computed(
  () =>
    !props.disabled &&
    activeUnits.value.length > 0 &&
    roles.value.every((role) =>
      activeUnits.value.every((unit) => !isDisabledValue(role, unit, getState(role)[unit])),
    ),
);

const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
    arrowControl: props.arrowControl,
    variant: props.variant,
    disabled: props.disabled,
  });

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    body: (opts?: { class?: any }) =>
      styles.body({ class: cn(opts?.class, uiOverrides.value.body) }),
    rangeWrapper: (opts?: { class?: any }) =>
      styles.rangeWrapper({ class: cn(opts?.class, uiOverrides.value.rangeWrapper) }),
    rangeSeparator: (opts?: { class?: any }) =>
      styles.rangeSeparator({ class: cn(opts?.class, uiOverrides.value.rangeSeparator) }),
    section: (opts?: { class?: any }) =>
      styles.section({ class: cn(opts?.class, uiOverrides.value.section) }),
    columns: (opts?: { class?: any }) =>
      styles.columns({ class: cn(opts?.class, uiOverrides.value.columns) }),
    column: (opts?: { class?: any }) =>
      styles.column({ class: cn(opts?.class, uiOverrides.value.column) }),
    arrowButton: (opts?: { class?: any }) =>
      styles.arrowButton({ class: cn(opts?.class, uiOverrides.value.arrowButton) }),
    list: (opts?: { class?: any }) =>
      styles.list({ class: cn(opts?.class, uiOverrides.value.list) }),
    item: (opts?: { class?: any }) =>
      styles.item({ class: cn(opts?.class, uiOverrides.value.item) }),
    itemActive: (opts?: { class?: any }) =>
      styles.itemActive({ class: cn(opts?.class, uiOverrides.value.itemActive) }),
    itemDisabled: (opts?: { class?: any }) =>
      styles.itemDisabled({ class: cn(opts?.class, uiOverrides.value.itemDisabled) }),
    itemIdle: (opts?: { class?: any }) =>
      styles.itemIdle({ class: cn(opts?.class, uiOverrides.value.itemIdle) }),
    indicator: (opts?: { class?: any }) =>
      styles.indicator({ class: cn(opts?.class, uiOverrides.value.indicator) }),
    mask: (opts?: { class?: any }) =>
      styles.mask({ class: cn(opts?.class, uiOverrides.value.mask) }),
    footer: (opts?: { class?: any }) =>
      styles.footer({ class: cn(opts?.class, uiOverrides.value.footer) }),
  };
});

function columnKey(role: TimeRangeRole, unit: TimeUnit) {
  return `${role}-${unit}`;
}

function setColumnRef(
  role: TimeRangeRole,
  unit: TimeUnit,
  el: Element | ComponentPublicInstance | null,
) {
  const key = columnKey(role, unit);
  if (el && "wrapRef" in el) columnRefs.set(key, el as ScrollbarInstance);
  else columnRefs.delete(key);
}

function pad(value: number, length = 2) {
  return String(value).padStart(length, "0");
}

function toMilliseconds(state: TimeState) {
  return state.hour * 3600000 + state.minute * 60000 + state.second * 1000 + state.millisecond;
}

function cloneState(state: TimeState): TimeState {
  return {
    hour: state.hour,
    minute: state.minute,
    second: state.second,
    millisecond: state.millisecond,
  };
}

function parseTime(value?: string | null): TimeState | null {
  return value ? parseTimeValue(value, props.format) : null;
}

function formatTime(state: TimeState) {
  return formatTimeValue(state, props.format);
}

function getState(role: TimeRangeRole) {
  return role === "start" ? startState.value : endState.value;
}

function getComparingValue(role: TimeRangeRole) {
  if (!props.isRange) return null;
  return role === "start" ? formatTime(endState.value) : formatTime(startState.value);
}

function getAvailableValues(role: TimeRangeRole, unit: TimeUnit, state: TimeState) {
  const comparingValue = getComparingValue(role);
  const max = unitMax[unit];
  const values = Array.from({ length: max + 1 }, (_, index) => index);

  if (unit === "hour") {
    const disabled = new Set(props.disabledHours(role, comparingValue));
    return values.filter((value) => !disabled.has(value));
  }

  if (unit === "minute") {
    const disabled = new Set(props.disabledMinutes(state.hour, role, comparingValue));
    return values.filter((value) => !disabled.has(value));
  }

  if (unit === "second") {
    const disabled = new Set(props.disabledSeconds(state.hour, state.minute, role, comparingValue));
    return values.filter((value) => !disabled.has(value));
  }

  const disabled = new Set(
    props.disabledMilliseconds(state.hour, state.minute, state.second, role, comparingValue),
  );
  return values.filter((value) => !disabled.has(value));
}

function isDisabledValue(role: TimeRangeRole, unit: TimeUnit, value: number) {
  return !availableValues.value[role]?.[unit]?.has(value);
}

function pickNearest(candidates: number[], current: number, direction: 1 | -1 = 1): number {
  if (!candidates.length) return current;
  if (candidates.includes(current)) return current;

  if (direction === 1) {
    return (candidates.find((candidate) => candidate >= current) ?? candidates[0]) as number;
  }

  for (let index = candidates.length - 1; index >= 0; index--) {
    if ((candidates[index] as number) <= current) return candidates[index] as number;
  }

  return candidates[candidates.length - 1] as number;
}

function sanitizeState(role: TimeRangeRole, incomingState: TimeState, direction: 1 | -1 = 1) {
  const nextState = cloneState(incomingState);
  for (const unit of ["hour", "minute", "second", "millisecond"] as const) {
    nextState[unit] = activeUnits.value.includes(unit)
      ? pickNearest(getAvailableValues(role, unit, nextState), nextState[unit], direction)
      : 0;
  }

  return nextState;
}

function syncState(role: TimeRangeRole, state: TimeState) {
  if (role === "start") {
    startState.value = state;
    return;
  }
  endState.value = state;
}

function normalizeRangeOrder() {
  if (!props.isRange) return;
  if (toMilliseconds(startState.value) <= toMilliseconds(endState.value)) return;

  const cachedStart = cloneState(startState.value);
  startState.value = cloneState(endState.value);
  endState.value = cachedStart;
}

function emitValue() {
  normalizeRangeOrder();
  if (!canConfirm.value) return false;
  if (props.isRange) {
    const value = [formatTime(startState.value), formatTime(endState.value)];
    const isSame =
      Array.isArray(modelValue.value) &&
      modelValue.value.length === 2 &&
      modelValue.value[0] === value[0] &&
      modelValue.value[1] === value[1];

    if (!isSame) {
      modelValue.value = value;
      emit("change", value);
    }
    return true;
  }

  const value = formatTime(startState.value);
  if (modelValue.value !== value) {
    modelValue.value = value;
    emit("change", value);
  }
  return true;
}

function updateState(role: TimeRangeRole, incomingState: TimeState, direction: 1 | -1 = 1) {
  if (props.disabled) return;
  const nextState = sanitizeState(role, incomingState, direction);
  syncState(role, nextState);
  emitValue();
}

function cycleValue(role: TimeRangeRole, unit: TimeUnit, step: 1 | -1) {
  const state = cloneState(getState(role));
  const candidates = getAvailableValues(role, unit, state);
  if (!candidates.length) return;

  const current = state[unit];
  const currentIndex = candidates.indexOf(current);
  const fallbackIndex = step === 1 ? 0 : candidates.length - 1;
  const nextIndex =
    currentIndex === -1
      ? fallbackIndex
      : (currentIndex + step + candidates.length) % candidates.length;

  state[unit] = candidates[nextIndex] as number;
  updateState(role, state, step);
}

function setValue(role: TimeRangeRole, unit: TimeUnit, value: number) {
  if (props.disabled || isDisabledValue(role, unit, value)) return;
  const state = cloneState(getState(role));
  state[unit] = value;
  updateState(role, state, 1);
}

function clear() {
  if (props.disabled) return;
  cancelScrollTimers();
  const empty = props.isRange ? ["", ""] : "";
  modelValue.value = empty;
  emit("change", empty);
  emit("clear");
}

function confirm() {
  flushScroll();
  if (!emitValue()) return;
  emit(
    "confirm",
    props.isRange
      ? [formatTime(startState.value), formatTime(endState.value)]
      : formatTime(startState.value),
  );
}

/** 此刻也经过禁用规则校正；没有可选项时不会写入无效值。 */
function selectNow() {
  if (props.disabled) return;
  cancelScrollTimers();
  for (const role of roles.value) syncState(role, sanitizeState(role, getCurrentTimeState()));
  confirm();
}

function scrollColumnToActive(role: TimeRangeRole, unit: TimeUnit) {
  const key = columnKey(role, unit);
  const scrollbar = columnRefs.get(key);
  const column = scrollbar?.wrapRef;
  const item = column?.querySelector<HTMLElement>("[data-value]");
  if (!column || !item || !column.clientHeight) return;
  const target = getCenteredScrollTop(
    getState(role)[unit],
    unitMax[unit] + 1,
    item.offsetHeight,
    column.clientHeight,
  );
  if (scrollTimers.has(key)) return;
  scrollTargets.set(key, target);
  scrollbar?.setScrollTop(target, { animated: false });
}

/** 原生滚动、触摸与拖动滚动条统一在停止后提交，再对齐中间组。 */
function settleScroll(role: TimeRangeRole, unit: TimeUnit) {
  const key = columnKey(role, unit);
  const timer = scrollTimers.get(key);
  if (timer) clearTimeout(timer);
  scrollTimers.delete(key);
  const column = columnRefs.get(key)?.wrapRef;
  const item = column?.querySelector<HTMLElement>("[data-value]");
  if (!column || !item || !item.offsetHeight) return;
  const state = cloneState(getState(role));
  state[unit] = getScrollValue(
    column.scrollTop,
    unitMax[unit] + 1,
    item.offsetHeight,
    column.clientHeight,
  );
  updateState(role, state);
  scrollColumnToActive(role, unit);
}

function handleScroll(role: TimeRangeRole, unit: TimeUnit) {
  const key = columnKey(role, unit);
  const column = columnRefs.get(key)?.wrapRef;
  if (!column || props.disabled) return;
  const target = scrollTargets.get(key);
  if (target !== undefined && Math.abs(column.scrollTop - target) < 1) return;
  const timer = scrollTimers.get(key);
  if (timer) clearTimeout(timer);
  scrollTimers.set(
    key,
    setTimeout(() => settleScroll(role, unit), 120),
  );
}

function flushScroll() {
  for (const role of roles.value) {
    for (const unit of activeUnits.value) {
      if (scrollTimers.has(columnKey(role, unit))) settleScroll(role, unit);
    }
  }
}

function cancelScrollTimers() {
  for (const timer of scrollTimers.values()) clearTimeout(timer);
  scrollTimers.clear();
}

function syncColumns() {
  nextTick(() => {
    for (const role of roles.value) {
      for (const unit of activeUnits.value) scrollColumnToActive(role, unit);
    }
  });
}

function onColumnKeydown(role: TimeRangeRole, unit: TimeUnit, event: KeyboardEvent) {
  if (props.disabled) return;
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    cycleValue(role, unit, event.key === "ArrowUp" ? -1 : 1);
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    const candidates = getAvailableValues(role, unit, getState(role));
    const value = event.key === "Home" ? candidates[0] : candidates.at(-1);
    if (value !== undefined) setValue(role, unit, value);
  } else if (event.key === "Enter") {
    event.preventDefault();
    confirm();
  }
}

function getCurrentTimeState(): TimeState {
  const now = dayjs();
  return {
    hour: now.hour(),
    minute: now.minute(),
    second: now.second(),
    millisecond: now.millisecond(),
  };
}

function initFromModel() {
  const defaultState = getCurrentTimeState();

  if (props.isRange && Array.isArray(props.modelValue)) {
    const start = sanitizeState("start", parseTime(props.modelValue[0]) ?? defaultState);
    const end = sanitizeState("end", parseTime(props.modelValue[1]) ?? cloneState(start));
    startState.value = start;
    endState.value = end;
    normalizeRangeOrder();
    syncColumns();
    return;
  }

  const parsed = typeof props.modelValue === "string" ? parseTime(props.modelValue) : null;
  startState.value = sanitizeState("start", parsed ?? defaultState);
  endState.value = cloneState(startState.value);
  syncColumns();
}

watch(
  [
    () => props.modelValue,
    () => props.format,
    () => props.isRange,
    () => props.disabled,
    () => props.disabledHours,
    () => props.disabledMinutes,
    () => props.disabledSeconds,
    () => props.disabledMilliseconds,
  ],
  initFromModel,
  { immediate: true, deep: true },
);
watch([startState, endState, () => props.arrowControl], syncColumns, { deep: true });
onBeforeUnmount(cancelScrollTimers);
defineExpose({ syncColumns, clear, confirm });
</script>

<template>
  <div
    :class="ui.wrapper({ class: props.class })"
    :aria-disabled="disabled"
  >
    <div :class="[ui.body(), isRange ? ui.rangeWrapper() : undefined]">
      <template
        v-for="role in roles"
        :key="role"
      >
        <div
          v-if="role === 'end'"
          :class="ui.rangeSeparator()"
        >
          至
        </div>
        <div :class="ui.section()">
          <div :class="ui.columns()">
            <div
              v-for="unit in activeUnits"
              :key="unit"
              :class="ui.column()"
              role="listbox"
              :aria-label="(isRange ? (role === 'start' ? '开始' : '结束') : '') + unitLabels[unit]"
              :aria-disabled="disabled"
              :tabindex="disabled ? -1 : 0"
              :aria-activedescendant="`${panelId}-${role}-${unit}-${unitMax[unit] + 1 + getState(role)[unit]}`"
              @keydown="onColumnKeydown(role, unit, $event)"
            >
              <button
                v-if="arrowControl"
                type="button"
                :class="ui.arrowButton()"
                :disabled="disabled"
                :aria-label="`上一${unitLabels[unit]}`"
                @click="cycleValue(role, unit, -1)"
              >
                ⌃
              </button>
              <div class="relative">
                <div :class="ui.indicator()" />
                <RebornScrollbar
                  :ref="(el) => setColumnRef(role, unit, el)"
                  :class="ui.list()"
                  :horizontal="false"
                  :size="4"
                  :inset="0"
                  :scroll-duration="0"
                  @scroll="handleScroll(role, unit)"
                >
                  <div
                    v-for="option in options[unit]"
                    :id="`${panelId}-${role}-${unit}-${option.index}`"
                    :key="option.index"
                    role="option"
                    :data-value="option.value"
                    :aria-hidden="option.index < unitMax[unit] + 1 || option.index >= (unitMax[unit] + 1) * 2"
                    :aria-selected="getState(role)[unit] === option.value"
                    :aria-disabled="disabled || isDisabledValue(role, unit, option.value)"
                    :class="[
                      ui.item(),
                      isDisabledValue(role, unit, option.value)
                        ? ui.itemDisabled()
                        : getState(role)[unit] === option.value
                          ? ui.itemActive()
                          : ui.itemIdle(),
                    ]"
                    @click="setValue(role, unit, option.value)"
                  >
                    {{ pad(option.value, unit === "millisecond" ? 3 : 2) }}
                  </div>
                </RebornScrollbar>
                <div :class="ui.mask()" />
              </div>
              <button
                v-if="arrowControl"
                type="button"
                :class="ui.arrowButton()"
                :disabled="disabled"
                :aria-label="`下一${unitLabels[unit]}`"
                @click="cycleValue(role, unit, 1)"
              >
                ⌄
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div v-if="showFooter" :class="ui.footer()">
      <slot
        name="footer"
        :confirm="confirm"
        :clear="clear"
        :now="selectNow"
      >
        <!-- 网格平分外框宽度，避免文本按钮与实体按钮的内边距差异影响等宽。 -->
        <div class="grid w-full grid-cols-2 gap-2">
          <RebornButton
            class="w-full min-w-0 justify-center"
            color="primary"
            variant="text"
            size="sm"
            border-style="solid"
            :disabled="disabled"
            :loading="false"
            :round="false"
            :circle="false"
            @click="selectNow"
          >
            此刻
          </RebornButton>
          <RebornButton
            class="w-full min-w-0 justify-center"
            color="primary"
            variant="filled"
            size="sm"
            border-style="solid"
            :disabled="!canConfirm"
            :loading="false"
            :round="false"
            :circle="false"
            @click="confirm"
          >
            确定
          </RebornButton>
        </div>
      </slot>
    </div>
  </div>
</template>
