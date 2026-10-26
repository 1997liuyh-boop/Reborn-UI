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

import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useId, watch } from "vue";
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
import TimePanelOptions from "./TimePanelOptions.vue";

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

// customParseFormat 插件已在 time-picker.utils 模块级注册，组件内不再重复 extend
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

/** 起止状态只整体替换（修改前先 cloneState），用 shallowRef */
const startState = shallowRef<TimeState>({ hour: 0, minute: 0, second: 0, millisecond: 0 });
const endState = shallowRef<TimeState>({ hour: 0, minute: 0, second: 0, millisecond: 0 });

type ScrollbarInstance = InstanceType<typeof RebornScrollbar>;
const panelId = useId();
const columnRefs = new Map<string, ScrollbarInstance>();
const scrollTimers = new Map<string, ReturnType<typeof setTimeout>>();
const scrollTargets = new Map<string, number>();
const uiOverrides = computed(() => props.ui || {});
const activeUnits = computed(() => getTimeUnits(props.format));
const roles = computed<TimeRangeRole[]>(() => (props.isRange ? ["start", "end"] : ["start"]));
const availableCache = new Map<string, Set<number>>();
// 每次状态变更只计算一次可选集合，避免毫秒列重复构建千项数组。
const availableValues = computed(
  () =>
    Object.fromEntries(
      roles.value.map((role) => [
        role,
        Object.fromEntries(
          activeUnits.value.map((unit) => [
            unit,
            stableAvailableValues(role, unit),
          ]),
        ),
      ]),
    ) as Record<TimeRangeRole, Partial<Record<TimeUnit, Set<number>>>>,
);
/** 未变化的禁用集合复用身份，使其他列不因一次选择重绘。 */
function stableAvailableValues(role: TimeRangeRole, unit: TimeUnit) {
  const key = `${role}-${unit}`;
  const values = new Set(getAvailableValues(role, unit, getState(role)));
  const previous = availableCache.get(key);
  if (previous && values.size === previous.size && [...values].every(value => previous.has(value))) return previous;
  availableCache.set(key, values);
  return values;
}
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

/**
 * 选项三种状态的完整类名：渲染时按状态直接取字符串，不再逐项调用 tv 槽位与 cn。
 * 毫秒格式单列就有 3000 个选项，逐项合并类名是面板重渲染的主要开销
 */
const itemClasses = computed(() => ({
  disabled: ui.value.item({ class: ui.value.itemDisabled() }),
  active: ui.value.item({ class: ui.value.itemActive() }),
  idle: ui.value.item({ class: ui.value.itemIdle() }),
}));

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
  // 定位选中项属于程序滚动，静默落位：打开面板时滚动条不闪现，只在悬停或用户滚动时显示
  scrollbar?.setScrollTop(target, { animated: false, silent: true });
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

/**
 * 空值时的初始选择：挂载前（含 SSR 与水合首帧）用确定的 00:00:00.000，
 * 两端渲染出的选中项一致；挂载后再切到「此刻」。禁用规则由 sanitizeState 统一校正
 */
let isMounted = false;
function getEmptyDefaultState(): TimeState {
  return isMounted ? getCurrentTimeState() : { hour: 0, minute: 0, second: 0, millisecond: 0 };
}

function isEmptyModel() {
  const value = props.modelValue;
  return Array.isArray(value) ? !value[0] : !value;
}

function initFromModel() {
  const defaultState = getEmptyDefaultState();

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

// 绑定值、格式或模式变化时按绑定值重新初始化
watch(
  [() => props.modelValue, () => props.format, () => props.isRange],
  initFromModel,
  { immediate: true, deep: true },
);

/**
 * 禁用回调与禁用态变化时只按新规则校正当前选择，不回退到绑定值或「此刻」。
 * 父级写内联箭头函数时每次渲染都是新函数，这里会频繁触发，但校正结果不变，选中项不会跳动
 */
watch(
  [
    () => props.disabled,
    () => props.disabledHours,
    () => props.disabledMinutes,
    () => props.disabledSeconds,
    () => props.disabledMilliseconds,
  ],
  () => {
    for (const role of roles.value) syncState(role, sanitizeState(role, getState(role)));
    normalizeRangeOrder();
    syncColumns();
  },
);

watch([startState, endState, () => props.arrowControl], syncColumns);

onMounted(() => {
  isMounted = true;
  // 空值时首帧是 00:00:00，挂载后切到「此刻」（只改局部选择，不写绑定值）
  if (isEmptyModel()) initFromModel();
});
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
                  <TimePanelOptions
                    :panel-id="panelId" :role="role" :unit="unit" :max="unitMax[unit]"
                    :value="getState(role)[unit]" :available="availableValues[role][unit] ?? new Set()"
                    :disabled="disabled" :classes="itemClasses"
                    @select="value => setValue(role, unit, value)"
                  />
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
