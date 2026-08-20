<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import RebornButton from "../reborn-button/RebornButton.vue";

import dayjs from "dayjs";
import { cn } from "~/lib/utils";
import { tv } from "~/lib/tv";
import theme, {
  timePickerColors,
  timePickerSizes,
  type TimeRangeRole,
  type TimeUnit,
} from "./reborn-time-panel.config";
import type { ClassValue } from "clsx";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const b = tv(theme);

type TimeState = {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

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
  format?: string;
  isRange?: boolean;
  arrowControl?: boolean;
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

const props = withDefaults(defineProps<TimePanelProps>(), {
  modelValue: "",
  format: "HH:mm:ss",
  isRange: false,
  arrowControl: false,
  size: "md",
  color: "primary",
  disabledHours: () => [],
  disabledMinutes: () => [],
  disabledSeconds: () => [],
  disabledMilliseconds: () => [],
});

const modelValue = defineModel<string | string[]>({ default: "" });

const emit = defineEmits<{
  (e: "change", value: string | string[]): void;
  /** 点击底部「清空」按钮清空值后触发 */
  (e: "clear"): void;
  /** 点击底部「确定」按钮时触发，携带当前选中值（范围模式为 [start, end]） */
  (e: "confirm", value: string | string[]): void;
}>();

const unitLabels: Record<TimeUnit, string> = {
  hour: "Hour",
  minute: "Minute",
  second: "Second",
  millisecond: "Millisecond",
};

const unitMax: Record<TimeUnit, number> = {
  hour: 23,
  minute: 59,
  second: 59,
  millisecond: 999,
};

const startState = ref<TimeState>({ hour: 0, minute: 0, second: 0, millisecond: 0 });
const endState = ref<TimeState>({ hour: 0, minute: 0, second: 0, millisecond: 0 });

const columnRefs = new Map<string, HTMLElement>();

const uiOverrides = computed(() => props.ui || {});
const activeUnits = computed(() => {
  const units: TimeUnit[] = [];
  const f = props.format.toLowerCase();

  if (f.includes('h')) units.push('hour');
  if (f.includes('m')) units.push('minute');
  if (f.includes('s')) {
    units.push('second');
    // If format contains 's' and also millisecond indicators like 'S'
    if (props.format.includes('S')) {
      units.push('millisecond');
    }
  } else if (props.format.includes('S')) {
    // Some formats might only have milliseconds without seconds (rare but possible)
    units.push('millisecond');
  }

  return units;
});

const gridColsClass = computed(() => {
  const count = activeUnits.value.length;
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-3";
  return "grid-cols-4";
});

const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
    arrowControl: props.arrowControl,
  });

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    rangeWrapper: (opts?: { class?: any }) =>
      styles.rangeWrapper({ class: cn(opts?.class, uiOverrides.value.rangeWrapper) }),
    rangeSeparator: (opts?: { class?: any }) =>
      styles.rangeSeparator({ class: cn(opts?.class, uiOverrides.value.rangeSeparator) }),
    section: (opts?: { class?: any }) =>
      styles.section({ class: cn(opts?.class, uiOverrides.value.section) }),
    columns: (opts?: { class?: any }) =>
      styles.columns({ class: cn(opts?.class, gridColsClass.value, uiOverrides.value.columns) }),
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

function setColumnRef(role: TimeRangeRole, unit: TimeUnit, el: Element | null) {
  const key = columnKey(role, unit);
  if (el instanceof HTMLElement) {
    columnRefs.set(key, el);
    return;
  }
  columnRefs.delete(key);
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
  if (!value) return null;

  const parsed = dayjs(value, [props.format, "HH:mm:ss.SSS", "HH:mm:ss", "HH:mm"], true);
  if (!parsed.isValid()) return null;

  return {
    hour: parsed.hour(),
    minute: parsed.minute(),
    second: parsed.second(),
    millisecond: parsed.millisecond(),
  };
}

function formatTime(state: TimeState) {
  return dayjs()
    .hour(state.hour)
    .minute(state.minute)
    .second(state.second)
    .millisecond(state.millisecond)
    .format(props.format);
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

function isDisabledValue(
  role: TimeRangeRole,
  unit: TimeUnit,
  value: number,
  state = getState(role),
) {
  return !getAvailableValues(role, unit, state).includes(value);
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
  const hours = getAvailableValues(role, "hour", nextState);
  nextState.hour = pickNearest(hours, nextState.hour, direction);

  const minutes = getAvailableValues(role, "minute", nextState);
  nextState.minute = pickNearest(minutes, nextState.minute, direction);

  const seconds = getAvailableValues(role, "second", nextState);
  nextState.second = pickNearest(seconds, nextState.second, direction);

  const milliseconds = getAvailableValues(role, "millisecond", nextState);
  nextState.millisecond = pickNearest(milliseconds, nextState.millisecond, direction);

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

function emitValue(triggerChange = true) {
  if (props.isRange) {
    normalizeRangeOrder();
    const value = [formatTime(startState.value), formatTime(endState.value)];
    const isSame =
      Array.isArray(modelValue.value) &&
      modelValue.value.length === 2 &&
      modelValue.value[0] === value[0] &&
      modelValue.value[1] === value[1];

    if (!isSame) {
      modelValue.value = value;
      if (triggerChange) emit("change", value);
    }
    return;
  }

  const value = formatTime(startState.value);
  if (modelValue.value !== value) {
    modelValue.value = value;
    if (triggerChange) emit("change", value);
  }
}

function updateState(role: TimeRangeRole, incomingState: TimeState, direction: 1 | -1 = 1) {
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
  const state = cloneState(getState(role));
  state[unit] = value;
  updateState(role, state, 1);
}

function onWheel(role: TimeRangeRole, unit: TimeUnit, event: WheelEvent) {
  if (event.deltaY === 0) return;
  cycleValue(role, unit, event.deltaY > 0 ? 1 : -1);
}

function displayValue(role: TimeRangeRole) {
  return formatTime(getState(role));
}

function clear() {
  const empty = props.isRange ? ["", ""] : "";
  modelValue.value = empty;
  emit("change", empty);
  emit("clear");
}

function confirm() {
  emit("confirm", modelValue.value);
}

function scrollColumnToActive(role: TimeRangeRole, unit: TimeUnit, instant = false) {
  const column = columnRefs.get(columnKey(role, unit));
  if (!column || column.clientHeight === 0) return false;

  const value = getState(role)[unit];
  const items = column.querySelectorAll<HTMLElement>("[data-value]");
  // 目标索引位于中间那一组
  const targetIndex = unitMax[unit] + 1 + value;
  const active = items[targetIndex];

  if (!active) return false;

  // 使用 getBoundingClientRect 计算相对于滚动容器的真实偏移
  const columnRect = column.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();
  const actualOffset = activeRect.top - columnRect.top + column.scrollTop;
  const targetScroll = actualOffset - column.clientHeight / 2 + active.clientHeight / 2;

  column.scrollTo({
    top: Math.max(0, targetScroll),
    behavior: instant ? "auto" : "smooth",
  });
  return true;
}

function handleScroll(role: TimeRangeRole, unit: TimeUnit, event: Event) {
  const column = event.target as HTMLElement;
  if (!column) return;

  const paddingTop = parseFloat(getComputedStyle(column).paddingTop) || 0;
  const paddingBottom = parseFloat(getComputedStyle(column).paddingBottom) || 0;
  const contentHeight = column.scrollHeight - paddingTop - paddingBottom;
  const sectionHeight = contentHeight / 3;

  const adjustedScroll = column.scrollTop - paddingTop;

  // 如果滚动到第一组或第三组，则瞬间重置回中间那一组
  if (adjustedScroll < sectionHeight * 0.3) {
    column.scrollTop += sectionHeight;
  } else if (adjustedScroll > sectionHeight * 1.7) {
    column.scrollTop -= sectionHeight;
  }
}

function syncColumns(instant = false) {
  const trySync = (retryCount = 0) => {
    const roles: TimeRangeRole[] = props.isRange ? ["start", "end"] : ["start"];
    let allSynced = true;

    for (const role of roles) {
      for (const unit of activeUnits.value) {
        if (!scrollColumnToActive(role, unit, instant)) {
          allSynced = false;
        }
      }
    }

    if (!allSynced && retryCount < 10) {
      requestAnimationFrame(() => trySync(retryCount + 1));
    }
  };

  nextTick(() => {
    requestAnimationFrame(() => trySync());
  });
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
    const start = sanitizeState(
      "start",
      parseTime(props.modelValue[0]) ?? defaultState,
    );
    const end = sanitizeState("end", parseTime(props.modelValue[1]) ?? cloneState(start));
    startState.value = start;
    endState.value = end;
    normalizeRangeOrder();
    emitValue(false);
    syncColumns(true);
    return;
  }

  const parsed = typeof props.modelValue === "string" ? parseTime(props.modelValue) : null;
  startState.value = sanitizeState("start", parsed ?? defaultState);
  endState.value = cloneState(startState.value);
  emitValue(false);
  syncColumns(true);
}

watch(() => props.modelValue, initFromModel, { immediate: true });

watch(
  [startState, endState, () => props.arrowControl],
  () => {
    syncColumns(props.arrowControl); // 如果是箭头控制且在大规模移动，可能需要平滑
  },
  { deep: true },
);
</script>

<template>
  <div :class="ui.wrapper({ class: props.class })">
    <!-- 范围选择模式 -->
    <div v-if="isRange" :class="ui.rangeWrapper()">
      <!-- 开始时间部分 -->
      <div :class="ui.section()">
        <div :class="ui.columns()">
          <!-- 选中指示器与遮罩 -->
          <div :class="ui.indicator()" />
          <div :class="ui.mask()" />
          <!-- 时间列 -->
          <div v-for="unit in activeUnits" :key="`start-${unit}`" :class="ui.column()">
            <Icon name="lucide:chevron-up" :class="ui.arrowButton()"
              @click="cycleValue('start', unit as TimeUnit, -1)" />
            <div :ref="(el: any) => setColumnRef('start', unit as TimeUnit, el)" :class="ui.list()"
              @wheel.prevent="onWheel('start', unit as TimeUnit, $event)"
              @scroll="handleScroll('start', unit as TimeUnit, $event)">
              <!-- 三组数据实现无限滚动 -->
              <div v-for="i in 3" :key="i" class="flex flex-col">
                <div v-for="value in Array.from({ length: unitMax[unit] + 1 }, (_, index) => index)"
                  :key="`start-${unit}-${i}-${value}`" :class="[
                    ui.item(),
                    isDisabledValue('start', unit, value)
                      ? ui.itemDisabled()
                      : getState('start')[unit] === value
                        ? ui.itemActive()
                        : ui.itemIdle(),
                  ]" :data-active="getState('start')[unit] === value" :data-value="value"
                  @click="setValue('start', unit, value)">
                  {{ pad(value, unit === 'millisecond' ? 3 : 2) }}
                </div>
              </div>
            </div>
            <Icon name="lucide:chevron-down" :class="ui.arrowButton()"
              @click="cycleValue('start', unit as TimeUnit, 1)" />
          </div>
        </div>
      </div>

      <!-- 范围分隔符 -->
      <div :class="ui.rangeSeparator()">
        <Icon name="lucide:minus" class="size-4" />
      </div>

      <!-- 结束时间部分 -->
      <div :class="ui.section()">
        <div :class="ui.columns()">
          <div :class="ui.indicator()" />
          <div :class="ui.mask()" />
          <div v-for="unit in activeUnits" :key="`end-${unit}`" :class="ui.column()">
            <Icon name="lucide:chevron-up" :class="ui.arrowButton()" @click="cycleValue('end', unit as TimeUnit, -1)" />
            <div :ref="(el: any) => setColumnRef('end', unit as TimeUnit, el)" :class="ui.list()"
              @wheel.prevent="onWheel('end', unit as TimeUnit, $event)"
              @scroll="handleScroll('end', unit as TimeUnit, $event)">
              <div v-for="i in 3" :key="i" class="flex flex-col">
                <div v-for="value in Array.from({ length: unitMax[unit] + 1 }, (_, index) => index)"
                  :key="`end-${unit}-${i}-${value}`" :class="[
                    ui.item(),
                    isDisabledValue('end', unit, value)
                      ? ui.itemDisabled()
                      : getState('end')[unit] === value
                        ? ui.itemActive()
                        : ui.itemIdle(),
                  ]" :data-active="getState('end')[unit] === value" :data-value="value"
                  @click="setValue('end', unit, value)">
                  {{ pad(value, unit === 'millisecond' ? 3 : 2) }}
                </div>
              </div>
            </div>
            <Icon name="lucide:chevron-down" :class="ui.arrowButton()"
              @click="cycleValue('end', unit as TimeUnit, 1)" />
          </div>
        </div>
      </div>
    </div>

    <!-- 单个时间选择模式 -->
    <div v-else :class="ui.section()">
      <div :class="ui.columns()">
        <div :class="ui.indicator()" />
        <div :class="ui.mask()" />
        <div v-for="unit in activeUnits" :key="unit" :class="ui.column()">
          <Icon name="lucide:chevron-up" :class="ui.arrowButton()" @click="cycleValue('start', unit as TimeUnit, -1)" />
          <div :ref="(el: any) => setColumnRef('start', unit as TimeUnit, el)" :class="ui.list()"
            @wheel.prevent="onWheel('start', unit as TimeUnit, $event)"
            @scroll="handleScroll('start', unit as TimeUnit, $event)">
            <div v-for="i in 3" :key="i" class="flex flex-col">
              <div v-for="value in Array.from({ length: unitMax[unit] + 1 }, (_, index) => index)"
                :key="`${unit}-${i}-${value}`" :class="[
                  ui.item(),
                  isDisabledValue('start', unit, value)
                    ? ui.itemDisabled()
                    : getState('start')[unit] === value
                      ? ui.itemActive()
                      : ui.itemIdle(),
                ]" :data-active="getState('start')[unit] === value" :data-value="value"
                @click="setValue('start', unit, value)">
                {{ pad(value, unit === 'millisecond' ? 3 : 2) }}
              </div>
            </div>
          </div>
          <Icon name="lucide:chevron-down" :class="ui.arrowButton()"
            @click="cycleValue('start', unit as TimeUnit, 1)" />
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div :class="ui.footer()">
      <slot name="footer">
        <RebornButton variant="outline" size="xs" @click="clear">清空</RebornButton>
        <RebornButton size="xs" @click="confirm">确定</RebornButton>
      </slot>
    </div>
  </div>
</template>
