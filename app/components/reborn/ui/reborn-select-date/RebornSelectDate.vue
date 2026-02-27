<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { selectDateColors, selectDateSizes } from "./reborn-select-date.config";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-select-date.config";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SelectDateProps>(), {
  modelValue: "",
  type: "date",
  placeholder: "请选择日期",
  disabled: false,
  clearable: true,
  start: "1970-01-01",
  end: "2099-12-31",
  size: "md",
  color: "primary",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();

const b = tv(theme);

type DatePanel = "date" | "month" | "year";

export interface SelectDateProps {
  modelValue?: string;
  type?: "year" | "month" | "date";
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  start?: string;
  end?: string;
  labelFormat?: string;
  valueFormat?: string;
  size?: (typeof selectDateSizes)[number];
  color?: (typeof selectDateColors)[number];
  class?: any;
  ui?: Partial<{
    wrapper: ClassValue;
    trigger: ClassValue;
    triggerText: ClassValue;
    placeholder: ClassValue;
    arrow: ClassValue;
    dropdown: ClassValue;
    calHeader: ClassValue;
    calNavBtn: ClassValue;
    calTitle: ClassValue;
    calWeekdays: ClassValue;
    calDays: ClassValue;
    calDay: ClassValue;
    calDayActive: ClassValue;
    calDayDisabled: ClassValue;
    calDayToday: ClassValue;
    clearBtn: ClassValue;
  }>;
}

const isOpen = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth());
const selectedDate = ref<Date | null>(null);
const panelMode = ref<DatePanel>("date");

const colorFocusClassMap: Record<(typeof selectDateColors)[number], string> = {
  primary: "border-primary ring-2 ring-primary/20",
  secondary: "border-secondary ring-2 ring-secondary/20",
  success: "border-success ring-2 ring-success/20",
  info: "border-info ring-2 ring-info/20",
  warning: "border-warning ring-2 ring-warning/20",
  error: "border-error ring-2 ring-error/20",
  neutral: "border-neutral ring-2 ring-neutral/20",
};

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
    open: isOpen.value,
    disabled: props.disabled,
  });
  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    trigger: (opts?: { class?: any }) =>
      styles.trigger({ class: cn(opts?.class, uiOverrides.value.trigger) }),
    triggerText: (opts?: { class?: any }) =>
      styles.triggerText({ class: cn(opts?.class, uiOverrides.value.triggerText) }),
    placeholder: (opts?: { class?: any }) =>
      styles.placeholder({ class: cn(opts?.class, uiOverrides.value.placeholder) }),
    arrow: (opts?: { class?: any }) =>
      styles.arrow({ class: cn(opts?.class, uiOverrides.value.arrow) }),
    dropdown: (opts?: { class?: any }) =>
      styles.dropdown({ class: cn(opts?.class, uiOverrides.value.dropdown) }),
    calHeader: (opts?: { class?: any }) =>
      styles.calHeader({ class: cn(opts?.class, uiOverrides.value.calHeader) }),
    calNavBtn: (opts?: { class?: any }) =>
      styles.calNavBtn({ class: cn(opts?.class, uiOverrides.value.calNavBtn) }),
    calTitle: (opts?: { class?: any }) =>
      styles.calTitle({ class: cn(opts?.class, uiOverrides.value.calTitle) }),
    calWeekdays: (opts?: { class?: any }) =>
      styles.calWeekdays({ class: cn(opts?.class, uiOverrides.value.calWeekdays) }),
    calDays: (opts?: { class?: any }) =>
      styles.calDays({ class: cn(opts?.class, uiOverrides.value.calDays) }),
    calDay: (opts?: { class?: any }) =>
      styles.calDay({ class: cn(opts?.class, uiOverrides.value.calDay) }),
    calDayActive: (opts?: { class?: any }) =>
      styles.calDayActive({ class: cn(opts?.class, uiOverrides.value.calDayActive) }),
    calDayDisabled: (opts?: { class?: any }) =>
      styles.calDayDisabled({ class: cn(opts?.class, uiOverrides.value.calDayDisabled) }),
    calDayToday: (opts?: { class?: any }) =>
      styles.calDayToday({ class: cn(opts?.class, uiOverrides.value.calDayToday) }),
    clearBtn: (opts?: { class?: any }) =>
      styles.clearBtn({ class: cn(opts?.class, uiOverrides.value.clearBtn) }),
  };
});

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
const today = new Date();

function parseValue(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (props.type === "year") return `${y}`;
  if (props.type === "month") return `${y}-${m}`;
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date): string {
  if (!props.labelFormat) return formatDate(d);
  return props.labelFormat
    .replace("YYYY", String(d.getFullYear()))
    .replace("MM", String(d.getMonth() + 1).padStart(2, "0"))
    .replace("DD", String(d.getDate()).padStart(2, "0"));
}

const displayText = computed(() => (selectedDate.value ? formatDisplay(selectedDate.value) : ""));
const triggerFocusClass = computed(() => (isOpen.value ? colorFocusClassMap[props.color] : ""));

interface CalDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

const calendarDays = computed<CalDay[]>(() => {
  const firstDayOfMonth = new Date(viewYear.value, viewMonth.value, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate();
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startWeekday);
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const startLimit = props.start ? new Date(props.start) : null;
  const endLimit = props.end ? new Date(props.end) : null;

  return Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const isCurrentMonth = d.getMonth() === viewMonth.value && d.getFullYear() === viewYear.value;
    let isDisabled = false;
    if (startLimit && d < startLimit) isDisabled = true;
    if (endLimit && d > endLimit) isDisabled = true;
    return {
      date: d,
      day: d.getDate(),
      isCurrentMonth,
      isToday: d.toDateString() === today.toDateString(),
      isSelected: selectedDate.value
        ? d.toDateString() === selectedDate.value.toDateString()
        : false,
      isDisabled,
    };
  });
});

const yearRangeStart = computed(() => {
  const y = viewYear.value;
  return Math.floor(y / 10) * 10;
});

const yearList = computed(() => {
  const start = props.start ? new Date(props.start).getFullYear() : 1970;
  const end = props.end ? new Date(props.end).getFullYear() : 2099;
  const from = yearRangeStart.value;
  return Array.from({ length: 10 }, (_, i) => from + i).filter((y) => y >= start && y <= end);
});

const monthList = computed(() => Array.from({ length: 12 }, (_, i) => i + 1));
const headerTitle = computed(() => {
  if (panelMode.value === "year") return `${yearRangeStart.value}-${yearRangeStart.value + 9}`;
  if (panelMode.value === "month") return `${viewYear.value}年`;
  return `${viewYear.value}年${viewMonth.value + 1}月`;
});

const panelStack = computed(() => {
  if (props.type === "year") return ["year"];
  if (props.type === "month") return ["year", "month"];
  return ["year", "month", "date"];
});

function prev() {
  if (panelMode.value === "year") {
    viewYear.value -= 10;
    return;
  }
  if (panelMode.value === "month") {
    viewYear.value -= 1;
    return;
  }
  if (viewMonth.value === 0) {
    viewMonth.value = 11;
    viewYear.value -= 1;
  } else {
    viewMonth.value -= 1;
  }
}

function next() {
  if (panelMode.value === "year") {
    viewYear.value += 10;
    return;
  }
  if (panelMode.value === "month") {
    viewYear.value += 1;
    return;
  }
  if (viewMonth.value === 11) {
    viewMonth.value = 0;
    viewYear.value += 1;
  } else {
    viewMonth.value += 1;
  }
}

function selectPanel(panel: DatePanel) {
  if (!panelStack.value.includes(panel)) return;
  panelMode.value = panel;
}

function selectDay(day: CalDay) {
  if (day.isDisabled) return;
  selectedDate.value = day.date;
  const val = formatDate(day.date);
  emit("update:modelValue", val);
  emit("change", val);
  isOpen.value = false;
}

function selectYear(year: number) {
  viewYear.value = year;
  if (props.type === "year") {
    const val = String(year);
    selectedDate.value = new Date(year, 0, 1);
    emit("update:modelValue", val);
    emit("change", val);
    isOpen.value = false;
    return;
  }
  panelMode.value = "month";
}

function selectMonth(month: number) {
  viewMonth.value = month - 1;
  if (props.type === "month") {
    selectedDate.value = new Date(viewYear.value, month - 1, 1);
    const val = `${viewYear.value}-${String(month).padStart(2, "0")}`;
    emit("update:modelValue", val);
    emit("change", val);
    isOpen.value = false;
    return;
  }
  panelMode.value = "date";
}

function toggle() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (!isOpen.value) return;
  panelMode.value = props.type;
  if (selectedDate.value) {
    viewYear.value = selectedDate.value.getFullYear();
    viewMonth.value = selectedDate.value.getMonth();
  }
}

function clear(e: Event) {
  e.stopPropagation();
  selectedDate.value = null;
  emit("update:modelValue", "");
  emit("change", "");
}

function onClickOutside(e: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) isOpen.value = false;
}

watch(
  () => props.modelValue,
  (val) => {
    const d = parseValue(val);
    selectedDate.value = d;
    if (d) {
      viewYear.value = d.getFullYear();
      viewMonth.value = d.getMonth();
    }
  },
  { immediate: true },
);

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside));
</script>

<template>
  <div
    ref="wrapperRef"
    :class="ui.wrapper({ class: props.class })"
  >
    <slot
      name="trigger"
      :toggle="toggle"
      :is-open="isOpen"
      :display-text="displayText"
    >
      <div
        :class="ui.trigger({ class: triggerFocusClass })"
        @click="toggle"
      >
        <span
          v-if="displayText"
          :class="ui.triggerText()"
        >{{ displayText }}</span>
        <span
          v-else
          :class="ui.placeholder()"
        >{{ placeholder }}</span>
        <div class="flex items-center gap-1">
          <span
            v-if="clearable && modelValue"
            :class="ui.clearBtn()"
            @click="clear"
          >
            <Icon
              name="lucide:x"
              class="size-full"
            />
          </span>
          <Icon
            name="lucide:calendar"
            :class="ui.arrow()"
          />
        </div>
      </div>
    </slot>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <slot
        name="dropdown"
        :is-open="isOpen"
        :panel-mode="panelMode"
        :year-list="yearList"
        :month-list="monthList"
        :calendar-days="calendarDays"
        :select-day="selectDay"
        :select-month="selectMonth"
        :select-year="selectYear"
      >
        <div
          v-if="isOpen"
          :class="ui.dropdown()"
          style="top: 100%; min-width: 280px"
        >
          <div :class="ui.calHeader()">
            <span
              :class="ui.calNavBtn()"
              @click="prev"
            ><Icon
              name="lucide:chevron-left"
              class="size-4"
            /></span>
            <div class="flex items-center gap-2">
              <button
                v-for="panel in panelStack"
                :key="panel"
                type="button"
                class="rounded px-2 py-0.5 text-xs transition-colors" :class="[
                  panelMode === panel
                    ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500',
                ]"
                @click="selectPanel(panel as DatePanel)"
              >
                {{ panel === "year" ? "年" : panel === "month" ? "月" : "日" }}
              </button>
              <span :class="ui.calTitle()">{{ headerTitle }}</span>
            </div>
            <span
              :class="ui.calNavBtn()"
              @click="next"
            ><Icon
              name="lucide:chevron-right"
              class="size-4"
            /></span>
          </div>

          <template v-if="panelMode === 'year'">
            <div class="grid max-h-[240px] grid-cols-4 gap-1 overflow-auto">
              <div
                v-for="year in yearList"
                :key="year"
                :class="[
                  ui.calDay(),
                  selectedDate && selectedDate.getFullYear() === year ? ui.calDayActive() : '',
                  year === today.getFullYear() ? ui.calDayToday() : '',
                ]"
                class="h-9"
                @click="selectYear(year)"
              >
                {{ year }}
              </div>
            </div>
          </template>

          <template v-else-if="panelMode === 'month'">
            <div class="grid grid-cols-4 gap-1">
              <div
                v-for="m in monthList"
                :key="m"
                :class="[
                  ui.calDay(),
                  selectedDate &&
                    selectedDate.getFullYear() === viewYear &&
                    selectedDate.getMonth() === m - 1
                    ? ui.calDayActive()
                    : '',
                ]"
                class="h-9"
                @click="selectMonth(m)"
              >
                {{ m }}月
              </div>
            </div>
          </template>

          <template v-else>
            <div :class="ui.calWeekdays()">
              <span
                v-for="w in weekdays"
                :key="w"
              >{{ w }}</span>
            </div>
            <div :class="ui.calDays()">
              <div
                v-for="(day, idx) in calendarDays"
                :key="idx"
                :class="[
                  ui.calDay(),
                  day.isSelected ? ui.calDayActive() : '',
                  day.isDisabled ? ui.calDayDisabled() : '',
                  day.isToday && !day.isSelected ? ui.calDayToday() : '',
                  !day.isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : '',
                ]"
                @click="selectDay(day)"
              >
                {{ day.day }}
              </div>
            </div>
          </template>
        </div>
      </slot>
    </Transition>
  </div>
</template>
