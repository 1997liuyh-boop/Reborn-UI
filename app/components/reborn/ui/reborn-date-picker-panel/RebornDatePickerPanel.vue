<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { datePickerPanelColors, datePickerPanelSizes, type DatePickerType, type ViewType, type CalDay } from "./reborn-date-picker-panel.config";
import { tv } from "~/lib/tv";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const b = tv(theme);

export interface DatePickerPanelProps {
    modelValue?: any;
    type?: DatePickerType;
    start?: string;
    end?: string;
    size?: (typeof datePickerPanelSizes)[number];
    color?: (typeof datePickerPanelColors)[number];
    shape?: "square" | "circle";
    class?: any;
    valueFormat?: string;
    disabled?: boolean;
    border?: boolean;
    shortcuts?: { text: string; value: any }[];
    ui?: Partial<{
        wrapper: ClassValue;
        container: ClassValue;
        shortcuts: ClassValue;
        shortcut: ClassValue;
        yearMonthItem: ClassValue;
        header: ClassValue;
        navBtn: ClassValue;
        title: ClassValue;
        weekdays: ClassValue;
        days: ClassValue;
        day: ClassValue;
        dayActive: ClassValue;
        dayDisabled: ClassValue;
        dayToday: ClassValue;
        timeColumn: ClassValue;
        timeColumnItem: ClassValue;
        dayInRange: ClassValue;
        yearMonthInRange: ClassValue;
        grid4: ClassValue;
        timeWrapper: ClassValue;
        headerActions: ClassValue;
        content: ClassValue;
        icon: ClassValue;
    }>;
}

const props = withDefaults(defineProps<DatePickerPanelProps>(), {
    modelValue: "",
    type: "date",
    start: "1970-01-01",
    end: "2099-12-31",
    size: "md",
    color: "primary",
    shape: "square",
    disabled: false,
    border: false,
    shortcuts: () => [],
    valueFormat: "",
});

const emit = defineEmits<{
    (e: "update:modelValue", value: any): void;
    (e: "change", value: any): void;
}>();

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
    const styles = b({
        size: props.size,
        color: props.color,
        shape: props.shape,
        disabled: props.disabled,
        border: props.border,
    });
    return {
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        container: (opts?: { class?: any }) => styles.container({ class: cn(opts?.class, uiOverrides.value.container) }),
        shortcuts: (opts?: { class?: any }) => styles.shortcuts({ class: cn(opts?.class, uiOverrides.value.shortcuts) }),
        shortcut: (opts?: { class?: any }) => styles.shortcut({ class: cn(opts?.class, uiOverrides.value.shortcut) }),
        yearMonthItem: (opts?: { class?: any }) => styles.yearMonthItem({ class: cn(opts?.class, uiOverrides.value.yearMonthItem) }),
        header: (opts?: { class?: any }) => styles.header({ class: cn(opts?.class, uiOverrides.value.header) }),
        navBtn: (opts?: { class?: any }) => styles.navBtn({ class: cn(opts?.class, uiOverrides.value.navBtn) }),
        title: (opts?: { class?: any }) => styles.title({ class: cn(opts?.class, uiOverrides.value.title) }),
        weekdays: (opts?: { class?: any }) => styles.weekdays({ class: cn(opts?.class, uiOverrides.value.weekdays) }),
        days: (opts?: { class?: any }) => styles.days({ class: cn(opts?.class, uiOverrides.value.days) }),
        day: (opts?: { class?: any }) => styles.day({ class: cn(opts?.class, uiOverrides.value.day) }),
        dayActive: (opts?: { class?: any }) => styles.dayActive({ class: cn(opts?.class, uiOverrides.value.dayActive) }),
        dayDisabled: (opts?: { class?: any }) => styles.dayDisabled({ class: cn(opts?.class, uiOverrides.value.dayDisabled) }),
        dayToday: (opts?: { class?: any }) => styles.dayToday({ class: cn(opts?.class, uiOverrides.value.dayToday) }),
        timeColumn: (opts?: { class?: any }) => styles.timeColumn({ class: cn(opts?.class, uiOverrides.value.timeColumn) }),
        timeColumnItem: (opts?: { class?: any }) => styles.timeColumnItem({ class: cn(opts?.class, uiOverrides.value.timeColumnItem) }),
        dayInRange: (opts?: { class?: any }) => styles.dayInRange({ class: cn(opts?.class, uiOverrides.value.dayInRange) }),
        yearMonthInRange: (opts?: { class?: any }) => styles.yearMonthInRange({ class: cn(opts?.class, uiOverrides.value.yearMonthInRange) }),
        grid4: (opts?: { class?: any }) => styles.grid4({ class: cn(opts?.class, uiOverrides.value.grid4) }),
        timeWrapper: (opts?: { class?: any }) => styles.timeWrapper({ class: cn(opts?.class, uiOverrides.value.timeWrapper) }),
        headerActions: (opts?: { class?: any }) => styles.headerActions({ class: cn(opts?.class, uiOverrides.value.headerActions) }),
        content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
        icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    };
});

// Component flags
const isMultiple = computed(() => ["years", "months", "dates"].includes(props.type));
const isRange = computed(() => ["yearrange", "monthrange", "daterange", "datetimerange", "week"].includes(props.type));
const isDual = computed(() => ["yearrange", "monthrange", "daterange", "datetimerange"].includes(props.type));
const hasTime = computed(() => ["datetime", "datetimerange"].includes(props.type));

// Calendar state
const today = new Date();
const viewYear = ref(today.getFullYear());
const viewMonth = ref(today.getMonth()); // 0-indexed

// Second panel state (linked)
const viewYear2 = computed(() => {
    if (props.type === "monthrange") return viewYear.value + 1;
    if (viewMonth.value === 11) return viewYear.value + 1;
    return viewYear.value;
});
const viewMonth2 = computed(() => {
    if (props.type === "monthrange") return viewMonth.value; // Monthrange both show 1-12 usually
    if (viewMonth.value === 11) return 0;
    return viewMonth.value + 1;
});

const currentView = ref<ViewType>("date");

// Map initial view
function getInitialView(): ViewType {
    if (["year", "years", "yearrange"].includes(props.type)) return "year";
    if (["month", "months", "monthrange"].includes(props.type)) return "month";
    return "date";
}
currentView.value = getInitialView();

const selectedDate = ref<Date | null>(null);
const selectedDates = ref<Date[]>([]);
const rangeStart = ref<Date | null>(null);
const rangeEnd = ref<Date | null>(null);

const selectedHour = ref(today.getHours());
const selectedMinute = ref(today.getMinutes());

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

function parseValue(v: any): Date | null {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

    const d = props.valueFormat ? dayjs(v, props.valueFormat) : dayjs(v);
    return d.isValid() ? d.toDate() : null;
}

function isSameDate(v1: any, v2: any): boolean {
    if (!v1 || !v2) return false;
    const d1 = v1 instanceof Date ? v1 : parseValue(v1);
    const d2 = v2 instanceof Date ? v2 : parseValue(v2);
    return d1?.toDateString() === d2?.toDateString();
}

function formatDate(d: Date): any {
    if (!props.valueFormat) return d;

    // Inject selected time into the date representation
    let dateObj = dayjs(d);
    if (["datetime", "datetimerange"].includes(props.type as string)) {
        dateObj = dateObj.hour(selectedHour.value).minute(selectedMinute.value).second(0);
    }

    return dateObj.format(props.valueFormat);
}

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

const hourRef = ref<HTMLElement | null>(null);
const minuteRef = ref<HTMLElement | null>(null);

function scrollToSelectedTime() {
    setTimeout(() => {
        if (hourRef.value) {
            const active = hourRef.value.querySelector(".bg-primary") as HTMLElement;
            if (active) hourRef.value.scrollTop = active.offsetTop - 100;
        }
        if (minuteRef.value) {
            const active = minuteRef.value.querySelector(".bg-primary") as HTMLElement;
            if (active) minuteRef.value.scrollTop = active.offsetTop - 100;
        }
    }, 0);
}

function confirmTime() {
    if (props.type === "datetime") {
        if (selectedDate.value) {
            const val = formatDate(selectedDate.value);
            emit("update:modelValue", val);
            emit("change", val);
        }
    } else if (props.type === "datetimerange") {
        if (rangeStart.value && rangeEnd.value) {
            const val = [formatDate(rangeStart.value), formatDate(rangeEnd.value)];
            emit("update:modelValue", val);
            emit("change", val);
        } else if (rangeStart.value) {
            emit("update:modelValue", [formatDate(rangeStart.value)]);
        }
    }
    currentView.value = "date";
}

function getCalendarDays(y: number, m: number): CalDay[] {
    const firstDayOfMonth = new Date(y, m, 1);
    const startWeekday = firstDayOfMonth.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startWeekday);

    const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
    const days: CalDay[] = [];

    const startLimit = props.start ? new Date(props.start) : null;
    const endLimit = props.end ? new Date(props.end) : null;

    for (let i = 0; i < totalCells; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);

        const isCurrentMonth = d.getMonth() === m && d.getFullYear() === y;
        const isToday = d.toDateString() === today.toDateString();
        const isSelected = selectedDate.value ? d.toDateString() === selectedDate.value.toDateString() : false;

        let isDisabled = !isCurrentMonth;
        if (startLimit && d < startLimit) isDisabled = true;
        if (endLimit && d > endLimit) isDisabled = true;

        const isRangeStart = rangeStart.value ? d.toDateString() === rangeStart.value.toDateString() : false;
        const isRangeEnd = rangeEnd.value ? d.toDateString() === rangeEnd.value.toDateString() : false;
        const isInRange = !!(rangeStart.value && rangeEnd.value && d >= rangeStart.value && d <= rangeEnd.value);

        days.push({ date: d, day: d.getDate(), isCurrentMonth, isToday, isSelected, isDisabled, isInRange, isRangeStart, isRangeEnd });
    }
    return days;
}

const calendarDays = computed(() => getCalendarDays(viewYear.value, viewMonth.value));
const calendarDays2 = computed(() => getCalendarDays(viewYear2.value, viewMonth2.value));

const currentYearDecade = computed(() => Math.floor(viewYear.value / 10) * 10);
const viewYearPageStart = ref(currentYearDecade.value);

// Second year panel
const viewYearPageStart2 = computed(() => viewYearPageStart.value + 10); // Linked decade

function getYearList(pageStart: number) {
    const start = props.start ? new Date(props.start).getFullYear() : 1970;
    const end = props.end ? new Date(props.end).getFullYear() : 2099;
    const years: { year: number, isDisabled: boolean }[] = [];

    for (let i = -1; i <= 10; i++) {
        const y = pageStart + i;
        years.push({
            year: y,
            isDisabled: y < start || y > end
        });
    }
    return years;
}

const yearList = computed(() => getYearList(viewYearPageStart.value));
const yearList2 = computed(() => getYearList(viewYearPageStart2.value));

const monthList = computed(() => Array.from({ length: 12 }, (_, i) => i + 1));

const headerTitle = computed(() => {
    if (props.type === "yearrange") return `${viewYearPageStart.value} - ${viewYearPageStart.value + 9}`;
    return `${viewYearPageStart.value} - ${viewYearPageStart.value + 9}`; // Single panel or base
});
const headerTitle2 = computed(() => {
    return `${viewYearPageStart2.value} - ${viewYearPageStart2.value + 9}`;
});

function prevPage() {
    if (currentView.value === "year") {
        viewYearPageStart.value -= isDual.value ? 20 : 10;
        return;
    }
    if (currentView.value === "month") {
        viewYear.value -= isDual.value ? 2 : 1;
        return;
    }
    if (isDual.value) {
        // Dual mode linkage: jump 2 months
        if (viewMonth.value <= 1) {
            viewMonth.value = 10 + viewMonth.value;
            viewYear.value--;
        } else {
            viewMonth.value -= 2;
        }
    } else {
        if (viewMonth.value === 0) {
            viewMonth.value = 11;
            viewYear.value--;
        } else {
            viewMonth.value--;
        }
    }
}

function nextPage() {
    if (currentView.value === "year") {
        viewYearPageStart.value += isDual.value ? 20 : 10;
        return;
    }
    if (currentView.value === "month") {
        viewYear.value += isDual.value ? 2 : 1;
        return;
    }
    if (isDual.value) {
        // Dual mode linkage: jump 2 months
        if (viewMonth.value >= 10) {
            viewMonth.value = (viewMonth.value + 2) % 12;
            viewYear.value++;
        } else {
            viewMonth.value += 2;
        }
    } else {
        if (viewMonth.value === 11) {
            viewMonth.value = 0;
            viewYear.value++;
        } else {
            viewMonth.value++;
        }
    }
}

function selectDay(day: CalDay) {
    if (day.isDisabled) return;

    if (props.type === "week") {
        const d = new Date(day.date);
        const dayOfWeek = d.getDay();
        const start = new Date(d);
        start.setDate(d.getDate() - dayOfWeek);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        rangeStart.value = start;
        rangeEnd.value = end;
        const val = [formatDate(start), formatDate(end)];
        emit("update:modelValue", val);
        emit("change", val);
    } else if (props.type === "dates") {
        const current = (props.modelValue as any[] || []);
        const idx = current.findIndex(v => isSameDate(v, day.date));
        const newVal = [...current];
        if (idx > -1) newVal.splice(idx, 1);
        else newVal.push(formatDate(day.date));
        emit("update:modelValue", newVal);
    } else if (isRange.value) {
        if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
            rangeStart.value = day.date;
            rangeEnd.value = null;
            emit("update:modelValue", [formatDate(rangeStart.value)]);
        } else {
            if (day.date < rangeStart.value) {
                rangeEnd.value = rangeStart.value;
                rangeStart.value = day.date;
            } else {
                rangeEnd.value = day.date;
            }
            const val = [formatDate(rangeStart.value), formatDate(rangeEnd.value)];
            emit("update:modelValue", val);
            emit("change", val);
        }
    } else {
        selectedDate.value = day.date;
        const val = formatDate(day.date);
        emit("update:modelValue", val);
        emit("change", val);
    }
}

function selectYear(year: number) {
    if (props.type === "year" || props.type === "years" || props.type === "yearrange") {
        // Selection logic stays same, year is absolute
    } else {
        viewYear.value = year;
        viewYearPageStart.value = Math.floor(year / 10) * 10;
        currentView.value = "month";
        return;
    }

    if (props.type === "years") {
        const current = (props.modelValue as any[] || []);
        const idx = current.findIndex(v => {
            const date = v instanceof Date ? v : parseValue(v);
            return date?.getFullYear() === year;
        });
        const newVal = [...current];
        if (idx > -1) newVal.splice(idx, 1);
        else newVal.push(formatDate(new Date(year, 0, 1)));
        emit("update:modelValue", newVal);
    } else if (props.type === "yearrange") {
        const d = new Date(year, 0, 1);
        if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
            rangeStart.value = d;
            rangeEnd.value = null;
            emit("update:modelValue", [formatDate(rangeStart.value)]);
        } else {
            if (d < rangeStart.value) {
                rangeEnd.value = rangeStart.value;
                rangeStart.value = d;
            } else {
                rangeEnd.value = d;
            }
            const val = [formatDate(rangeStart.value), formatDate(rangeEnd.value)];
            emit("update:modelValue", val);
            emit("change", val);
        }
    } else if (props.type === "year") {
        selectedDate.value = new Date(year, 0, 1);
        const val = String(year);
        emit("update:modelValue", val);
        emit("change", val);
    } else {
        currentView.value = "month";
    }
}

function selectMonth(month: number, yearContext?: number) {
    const targetYear = yearContext ?? viewYear.value;
    viewMonth.value = month - 1;
    viewYear.value = targetYear;

    if (props.type === "months") {
        const current = (props.modelValue as any[] || []);
        const idx = current.findIndex(v => {
            const date = v instanceof Date ? v : parseValue(v);
            return date?.getFullYear() === targetYear && date?.getMonth() === month - 1;
        });
        const newVal = [...current];
        if (idx > -1) newVal.splice(idx, 1);
        else newVal.push(formatDate(new Date(targetYear, month - 1, 1)));
        emit("update:modelValue", newVal);
    } else if (props.type === "monthrange") {
        const d = new Date(targetYear, month - 1, 1);
        if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
            rangeStart.value = d;
            rangeEnd.value = null;
            emit("update:modelValue", [formatDate(rangeStart.value)]);
        } else {
            if (d < rangeStart.value) {
                rangeEnd.value = rangeStart.value;
                rangeStart.value = d;
            } else {
                rangeEnd.value = d;
            }
            const val = [formatDate(rangeStart.value), formatDate(rangeEnd.value)];
            emit("update:modelValue", val);
            emit("change", val);
        }
    } else if (props.type === "month") {
        selectedDate.value = new Date(targetYear, month - 1, 1);
        const val = `${targetYear}-${String(month).padStart(2, "0")}`;
        emit("update:modelValue", val);
        emit("change", val);
    } else {
        currentView.value = "date";
    }
}

function initFromValue() {
    if (props.modelValue) {
        if (isRange.value && Array.isArray(props.modelValue)) {
            const [start, end] = props.modelValue;
            if (start) {
                const d1 = parseValue(start);
                if (d1) {
                    rangeStart.value = d1;
                    viewYear.value = d1.getFullYear();
                    viewMonth.value = d1.getMonth();
                }
            }
            if (end) {
                const d2 = parseValue(end);
                if (d2) rangeEnd.value = d2;
            }
        } else if (isMultiple.value && Array.isArray(props.modelValue)) {
            const first = parseValue(props.modelValue[0]);
            if (first) {
                viewYear.value = first.getFullYear();
                viewMonth.value = first.getMonth();
            }
        } else if (props.modelValue) {
            const d = parseValue(props.modelValue);
            if (d) {
                selectedDate.value = d;
                viewYear.value = d.getFullYear();
                viewMonth.value = d.getMonth();
            }
        }
    } else {
        selectedDate.value = null;
        selectedDates.value = [];
        rangeStart.value = null;
        rangeEnd.value = null;
    }
    viewYearPageStart.value = Math.floor(viewYear.value / 10) * 10;
}

function isYearActive(y: number) {
    if (props.type === "year") return selectedDate.value?.getFullYear() === y;
    if (props.type === "years") {
        return (props.modelValue as any[] || []).some(v => {
            const date = v instanceof Date ? v : parseValue(v);
            return date?.getFullYear() === y;
        });
    }
    if (props.type === "yearrange") return rangeStart.value?.getFullYear() === y || rangeEnd.value?.getFullYear() === y;
    return false;
}

function isYearInRange(y: number) {
    if (props.type === "yearrange" && rangeStart.value && rangeEnd.value) {
        const start = rangeStart.value.getFullYear();
        const end = rangeEnd.value.getFullYear();
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        return y >= min && y <= max;
    }
    return false;
}

function isMonthActive(m: number, yearContext?: number) {
    const targetYear = yearContext ?? viewYear.value;
    if (props.type === "month") {
        return selectedDate.value?.getFullYear() === targetYear && selectedDate.value?.getMonth() === m - 1;
    }
    if (props.type === "months") {
        return (props.modelValue as any[] || []).some(v => {
            const date = v instanceof Date ? v : parseValue(v);
            return date?.getFullYear() === targetYear && date?.getMonth() === m - 1;
        });
    }
    if (props.type === "monthrange") {
        return isSameDate(rangeStart.value, new Date(targetYear, m - 1, 1)) ||
            isSameDate(rangeEnd.value, new Date(targetYear, m - 1, 1));
    }
    return false;
}

function isMonthInRange(m: number, yearContext?: number) {
    const targetYear = yearContext ?? viewYear.value;
    if (props.type === "monthrange" && rangeStart.value && rangeEnd.value) {
        const d = new Date(targetYear, m - 1, 1);
        const start = rangeStart.value.getTime();
        const end = rangeEnd.value.getTime();
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        return d.getTime() >= min && d.getTime() <= max;
    }
    return false;
}

function isDateActive(d: Date) {
    if (props.type === "date" || props.type === "datetime") {
        return isSameDate(selectedDate.value, d);
    }
    if (props.type === "dates") {
        const check = (props.modelValue as any[] || []).some(v => isSameDate(v, d));
        return check;
    }
    if (props.type === "week" || isRange.value) {
        return d.toDateString() === rangeStart.value?.toDateString() || d.toDateString() === rangeEnd.value?.toDateString();
    }
    return false;
}

function handleShortcut(s: any) {
    let value = typeof s.value === 'function' ? s.value() : s.value;

    if (Array.isArray(value)) {
        rangeStart.value = value[0];
        rangeEnd.value = value[1];
        const val = [formatDate(value[0]), formatDate(value[1])];
        emit("update:modelValue", val);
        emit("change", val);
    } else {
        selectedDate.value = value;
        viewYear.value = value.getFullYear();
        viewMonth.value = value.getMonth();
        const val = formatDate(value);
        emit("update:modelValue", val);
        emit("change", val);
    }
}

watch(() => props.modelValue, initFromValue, { immediate: true });
watch(() => props.type, () => {
    currentView.value = getInitialView();
});
</script>

<template>
    <div :class="ui.wrapper({ class: props.class })">
        <div :class="ui.container()">
            <!-- Shortcuts Sidebar -->
            <div v-if="shortcuts.length" :class="ui.shortcuts()">
                <div v-for="(s, i) in shortcuts" :key="i" :class="ui.shortcut()" @click.stop="handleShortcut(s)">
                    {{ s.text }}
                </div>
            </div>

            <!-- Main Content Area -->
            <div
                :class="[ui.content(), isDual ? 'flex flex-row gap-0 divide-x divide-gray-1 dark:divide-gray-7 p-0!' : '']">
                <!-- Left/Single Panel -->
                <div :class="[isDual ? 'flex-1 p-4' : 'w-full']">
                    <template v-if="currentView === 'year'">
                        <div :class="ui.header()">
                            <span :class="ui.navBtn()" @click.stop="prevPage">
                                <Icon name="lucide:chevron-left" :class="ui.icon()" />
                            </span>
                            <span :class="[ui.title(), isDual ? 'pointer-events-none' : '']">{{ headerTitle }}</span>
                            <span v-if="!isDual" :class="ui.navBtn()" @click.stop="nextPage">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                            <span v-else class="p-1 opacity-0 pointer-events-none">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                        </div>
                        <div :class="ui.grid4({ class: 'overflow-auto' })">
                            <div v-for="item in yearList" :key="item.year" :class="[
                                ui.yearMonthItem(),
                                isYearActive(item.year) ? ui.dayActive() : (isYearInRange(item.year) ? ui.yearMonthInRange() : ''),
                                item.year === today.getFullYear() && !isYearActive(item.year) ? ui.dayToday() : '',
                                item.isDisabled ? ui.dayDisabled() : '',
                                item.year < viewYearPageStart || item.year >= viewYearPageStart + 10 ? 'opacity-40' : ''
                            ]" @click.stop="selectYear(item.year)">
                                {{ item.year }}
                            </div>
                        </div>
                    </template>

                    <template v-else-if="currentView === 'month'">
                        <div :class="ui.header()">
                            <span :class="ui.navBtn()" @click.stop="prevPage">
                                <Icon name="lucide:chevron-left" :class="ui.icon()" />
                            </span>
                            <span :class="[ui.title(), isDual ? 'pointer-events-none' : '']"
                                @click.stop="currentView = 'year'">{{ viewYear }}年</span>
                            <span v-if="!isDual" :class="ui.navBtn()" @click.stop="nextPage">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                            <span v-else class="p-1 opacity-0 pointer-events-none">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                        </div>
                        <div :class="ui.grid4()">
                            <div v-for="m in monthList" :key="m" :class="[
                                ui.yearMonthItem(),
                                isMonthActive(m) ? ui.dayActive() : (isMonthInRange(m) ? ui.yearMonthInRange() : ''),
                                viewYear === today.getFullYear() && m === today.getMonth() + 1 && !isMonthActive(m) ? ui.dayToday() : '',
                            ]" @click.stop="selectMonth(m)">
                                {{ m }}月
                            </div>
                        </div>
                    </template>

                    <template v-else-if="currentView === 'time'">
                        <div :class="ui.header()">
                            <span :class="ui.navBtn()" @click.stop="currentView = 'date'">
                                <Icon name="lucide:arrow-left" :class="ui.icon()" />
                            </span>
                            <span :class="ui.title()">选择时间</span>
                            <span :class="ui.navBtn()" @click.stop="confirmTime">
                                <Icon name="lucide:check" :class="ui.icon()" />
                            </span>
                        </div>
                        <div :class="ui.timeWrapper()">
                            <!-- Hours -->
                            <div ref="hourRef" :class="ui.timeColumn()">
                                <div v-for="h in hours" :key="h" @click.stop="selectedHour = h" :class="[
                                    ui.timeColumnItem(),
                                    selectedHour === h ? ui.dayActive() : ''
                                ]">
                                    {{ String(h).padStart(2, '0') }}
                                </div>
                            </div>
                            <!-- Minutes -->
                            <div ref="minuteRef" :class="ui.timeColumn()">
                                <div v-for="m in minutes" :key="m" @click.stop="selectedMinute = m" :class="[
                                    ui.timeColumnItem(),
                                    selectedMinute === m ? ui.dayActive() : ''
                                ]">
                                    {{ String(m).padStart(2, '0') }}
                                </div>
                            </div>
                        </div>
                    </template>

                    <template v-else>
                        <div :class="ui.header()">
                            <div :class="ui.headerActions()">
                                <span :class="ui.navBtn()" @click.stop="prevPage">
                                    <Icon name="lucide:chevron-left" :class="ui.icon()" />
                                </span>
                                <span v-if="hasTime" :class="ui.navBtn()"
                                    @click.stop="currentView = 'time'; scrollToSelectedTime()">
                                    <Icon name="lucide:clock" :class="ui.icon()" />
                                </span>
                            </div>
                            <div :class="ui.headerActions()">
                                <span :class="[ui.title(), isDual ? 'pointer-events-none' : '']"
                                    @click.stop="currentView = 'year'">{{ viewYear }}年</span>
                                <span :class="[ui.title(), isDual ? 'pointer-events-none' : '']"
                                    @click.stop="currentView = 'month'">{{ viewMonth + 1 }}月</span>
                            </div>
                            <span v-if="!isDual" :class="ui.navBtn()" @click.stop="nextPage">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                            <span v-else class="p-1 opacity-0 pointer-events-none">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                        </div>

                        <div :class="ui.weekdays()">
                            <span v-for="w in weekdays" :key="w">{{ w }}</span>
                        </div>

                        <div :class="ui.days()">
                            <div v-for="(day, idx) in calendarDays" :key="idx" :class="[
                                ui.day(),
                                isDateActive(day.date) ? ui.dayActive() : '',
                                day.isDisabled && !['week', 'daterange', 'datetimerange'].includes(props.type) ? ui.dayDisabled() : '',
                                props.type === 'week' && !day.isCurrentMonth && !isDateActive(day.date) ? ui.dayDisabled() : '',
                                day.isToday && !isDateActive(day.date) ? ui.dayToday() : '',
                                day.isInRange && !isDateActive(day.date) ? ui.dayInRange() : '',
                                ['daterange', 'datetimerange'].includes(props.type) && !day.isCurrentMonth ? 'invisible' : ''
                            ]" @click.stop="selectDay(day)">
                                {{ day.day }}
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Right Panel (Only for Dual Mode) -->
                <div v-if="isDual" class="flex-1 p-4">
                    <template v-if="currentView === 'year'">
                        <div :class="ui.header()">
                            <span class="p-1 opacity-0 pointer-events-none">
                                <Icon name="lucide:chevron-left" :class="ui.icon()" />
                            </span>
                            <span :class="[ui.title(), isDual ? 'pointer-events-none' : '']">{{ headerTitle2 }}</span>
                            <span :class="ui.navBtn()" @click.stop="nextPage">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                        </div>
                        <div :class="ui.grid4({ class: 'overflow-auto' })">
                            <div v-for="item in yearList2" :key="item.year" :class="[
                                ui.yearMonthItem(),
                                isYearActive(item.year) ? ui.dayActive() : (isYearInRange(item.year) ? ui.yearMonthInRange() : ''),
                                item.year === today.getFullYear() && !isYearActive(item.year) ? ui.dayToday() : '',
                                item.isDisabled ? ui.dayDisabled() : '',
                                item.year < viewYearPageStart2 || item.year >= viewYearPageStart2 + 10 ? 'opacity-40' : ''
                            ]" @click.stop="selectYear(item.year)">
                                {{ item.year }}
                            </div>
                        </div>
                    </template>

                    <template v-else-if="currentView === 'month'">
                        <div :class="ui.header()">
                            <span class="p-1 opacity-0 pointer-events-none">
                                <Icon name="lucide:chevron-left" :class="ui.icon()" />
                            </span>
                            <span :class="[ui.title(), isDual ? 'pointer-events-none' : '']"
                                @click.stop="currentView = 'year'">{{ viewYear2 }}年</span>
                            <span :class="ui.navBtn()" @click.stop="nextPage">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                        </div>
                        <div :class="ui.grid4()">
                            <div v-for="m in monthList" :key="m" :class="[
                                ui.yearMonthItem(),
                                isMonthActive(m, viewYear2) ? ui.dayActive() : (isMonthInRange(m, viewYear2) ? ui.yearMonthInRange() : ''),
                                viewYear2 === today.getFullYear() && m === today.getMonth() + 1 && !isMonthActive(m, viewYear2) ? ui.dayToday() : '',
                            ]" @click.stop="selectMonth(m, viewYear2)">
                                {{ m }}月
                            </div>
                        </div>
                    </template>

                    <template v-else-if="currentView === 'time'">
                        <!-- Time Usually doesn't have dual panel, but we handle base structure -->
                    </template>

                    <template v-else>
                        <div :class="ui.header()">
                            <span class="p-1 opacity-0 pointer-events-none">
                                <Icon name="lucide:chevron-left" :class="ui.icon()" />
                            </span>
                            <div :class="ui.headerActions()">
                                <span :class="[ui.title(), isDual ? 'pointer-events-none' : '']"
                                    @click.stop="currentView = 'year'">{{ viewYear2 }}年</span>
                                <span :class="[ui.title(), isDual ? 'pointer-events-none' : '']"
                                    @click.stop="currentView = 'month'">{{ viewMonth2 + 1 }}月</span>
                            </div>
                            <span :class="ui.navBtn()" @click.stop="nextPage">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                        </div>

                        <div :class="ui.weekdays()">
                            <span v-for="w in weekdays" :key="w">{{ w }}</span>
                        </div>

                        <div :class="ui.days()">
                            <div v-for="(day, idx) in calendarDays2" :key="idx" :class="[
                                ui.day(),
                                isDateActive(day.date) ? ui.dayActive() : '',
                                day.isDisabled && !['week', 'daterange', 'datetimerange'].includes(props.type) ? ui.dayDisabled() : '',
                                props.type === 'week' && !day.isCurrentMonth && !isDateActive(day.date) ? ui.dayDisabled() : '',
                                day.isToday && !isDateActive(day.date) ? ui.dayToday() : '',
                                day.isInRange && !isDateActive(day.date) ? ui.dayInRange() : '',
                                ['daterange', 'datetimerange'].includes(props.type) && !day.isCurrentMonth ? 'invisible' : ''
                            ]" @click.stop="selectDay(day)">
                                {{ day.day }}
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>