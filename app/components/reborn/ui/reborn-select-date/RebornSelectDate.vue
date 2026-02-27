<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { selectDateColors, selectDateSizes } from "./reborn-select-date.config";
import { tv } from "~/lib/tv";

const b = tv(theme);

defineOptions({ inheritAttrs: false });

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

const isOpen = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);

// Calendar state
const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth()); // 0-indexed

const selectedDate = ref<Date | null>(null);

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
    const styles = b({
        size: props.size,
        color: props.color,
        open: isOpen.value,
        disabled: props.disabled,
    });
    return {
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        trigger: (opts?: { class?: any }) => styles.trigger({ class: cn(opts?.class, uiOverrides.value.trigger) }),
        triggerText: (opts?: { class?: any }) => styles.triggerText({ class: cn(opts?.class, uiOverrides.value.triggerText) }),
        placeholder: (opts?: { class?: any }) => styles.placeholder({ class: cn(opts?.class, uiOverrides.value.placeholder) }),
        arrow: (opts?: { class?: any }) => styles.arrow({ class: cn(opts?.class, uiOverrides.value.arrow) }),
        dropdown: (opts?: { class?: any }) => styles.dropdown({ class: cn(opts?.class, uiOverrides.value.dropdown) }),
        calHeader: (opts?: { class?: any }) => styles.calHeader({ class: cn(opts?.class, uiOverrides.value.calHeader) }),
        calNavBtn: (opts?: { class?: any }) => styles.calNavBtn({ class: cn(opts?.class, uiOverrides.value.calNavBtn) }),
        calTitle: (opts?: { class?: any }) => styles.calTitle({ class: cn(opts?.class, uiOverrides.value.calTitle) }),
        calWeekdays: (opts?: { class?: any }) => styles.calWeekdays({ class: cn(opts?.class, uiOverrides.value.calWeekdays) }),
        calDays: (opts?: { class?: any }) => styles.calDays({ class: cn(opts?.class, uiOverrides.value.calDays) }),
        calDay: (opts?: { class?: any }) => styles.calDay({ class: cn(opts?.class, uiOverrides.value.calDay) }),
        calDayActive: (opts?: { class?: any }) => styles.calDayActive({ class: cn(opts?.class, uiOverrides.value.calDayActive) }),
        calDayDisabled: (opts?: { class?: any }) => styles.calDayDisabled({ class: cn(opts?.class, uiOverrides.value.calDayDisabled) }),
        calDayToday: (opts?: { class?: any }) => styles.calDayToday({ class: cn(opts?.class, uiOverrides.value.calDayToday) }),
        clearBtn: (opts?: { class?: any }) => styles.clearBtn({ class: cn(opts?.class, uiOverrides.value.clearBtn) }),
    };
});

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
const today = new Date();

function parseValue(v: string): Date | null {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
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
    if (props.labelFormat) {
        return props.labelFormat
            .replace("YYYY", String(d.getFullYear()))
            .replace("MM", String(d.getMonth() + 1).padStart(2, "0"))
            .replace("DD", String(d.getDate()).padStart(2, "0"));
    }
    return formatDate(d);
}

const displayText = computed(() => {
    if (selectedDate.value) return formatDisplay(selectedDate.value);
    return "";
});

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
    const days: CalDay[] = [];

    const startLimit = props.start ? new Date(props.start) : null;
    const endLimit = props.end ? new Date(props.end) : null;

    for (let i = 0; i < totalCells; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);

        const isCurrentMonth = d.getMonth() === viewMonth.value && d.getFullYear() === viewYear.value;
        const isToday = d.toDateString() === today.toDateString();
        const isSelected = selectedDate.value ? d.toDateString() === selectedDate.value.toDateString() : false;

        let isDisabled = !isCurrentMonth;
        if (startLimit && d < startLimit) isDisabled = true;
        if (endLimit && d > endLimit) isDisabled = true;

        days.push({ date: d, day: d.getDate(), isCurrentMonth, isToday, isSelected, isDisabled });
    }

    return days;
});

const currentYearDecade = computed(() => {
    return Math.floor(viewYear.value / 10) * 10;
});

const viewYearPageStart = ref(currentYearDecade.value);

const yearList = computed(() => {
    const start = props.start ? new Date(props.start).getFullYear() : 1970;
    const end = props.end ? new Date(props.end).getFullYear() : 2099;
    const years: { year: number, isDisabled: boolean }[] = [];

    for (let i = -1; i <= 10; i++) {
        const y = viewYearPageStart.value + i;
        years.push({
            year: y,
            isDisabled: y < start || y > end
        });
    }
    return years;
});

const monthList = computed(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
});

const currentView = ref<"year" | "month" | "date">(props.type);

watch(() => props.type, (newType) => {
    currentView.value = newType;
});

const headerTitle = computed(() => {
    if (currentView.value === "year") return `${viewYearPageStart.value} - ${viewYearPageStart.value + 9}`;
    if (currentView.value === "month") return `${viewYear.value}年`;
    return `${viewYear.value}年${viewMonth.value + 1}月`;
});

function prevPage() {
    if (currentView.value === "year") {
        viewYearPageStart.value -= 10;
        return;
    }
    if (currentView.value === "month") {
        viewYear.value--;
        return;
    }
    if (viewMonth.value === 0) {
        viewMonth.value = 11;
        viewYear.value--;
    } else {
        viewMonth.value--;
    }
}

function nextPage() {
    if (currentView.value === "year") {
        viewYearPageStart.value += 10;
        return;
    }
    if (currentView.value === "month") {
        viewYear.value++;
        return;
    }
    if (viewMonth.value === 11) {
        viewMonth.value = 0;
        viewYear.value++;
    } else {
        viewMonth.value++;
    }
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
    viewYearPageStart.value = Math.floor(year / 10) * 10;
    if (props.type === "year") {
        selectedDate.value = new Date(year, 0, 1);
        const val = String(year);
        emit("update:modelValue", val);
        emit("change", val);
        isOpen.value = false;
    } else {
        currentView.value = "month";
    }
}

function selectMonth(month: number) {
    viewMonth.value = month - 1;
    if (props.type === "month") {
        selectedDate.value = new Date(viewYear.value, month - 1, 1);
        const val = `${viewYear.value}-${String(month).padStart(2, "0")}`;
        emit("update:modelValue", val);
        emit("change", val);
        isOpen.value = false;
    } else {
        currentView.value = "date";
    }
}

function toggle() {
    if (props.disabled) return;
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
        currentView.value = props.type;
        if (selectedDate.value) {
            viewYear.value = selectedDate.value.getFullYear();
            viewMonth.value = selectedDate.value.getMonth();
            viewYearPageStart.value = Math.floor(viewYear.value / 10) * 10;
        }
    }
}

function clear(e: Event) {
    e.stopPropagation();
    selectedDate.value = null;
    emit("update:modelValue", "");
    emit("change", "");
}

function onClickOutside(e: MouseEvent) {
    if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
        isOpen.value = false;
    }
}

if (props.modelValue) {
    const d = parseValue(props.modelValue);
    if (d) {
        selectedDate.value = d;
        viewYear.value = d.getFullYear();
        viewMonth.value = d.getMonth();
    }
}

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside));
</script>

<template>
    <div ref="wrapperRef" :class="ui.wrapper({ class: props.class })">
        <div :class="ui.trigger()" @click.stop="toggle" :data-state="isOpen ? 'open' : 'closed'">
            <span v-if="displayText" :class="ui.triggerText()">{{ displayText }}</span>
            <span v-else :class="ui.placeholder()">{{ placeholder }}</span>

            <div class="flex items-center gap-1">
                <span v-if="clearable && modelValue" :class="ui.clearBtn()" @click.stop="clear">
                    <Icon name="lucide:x" class="size-full" />
                </span>
                <Icon name="lucide:calendar" :class="ui.arrow()" />
            </div>
        </div>

        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
            <div v-if="isOpen" :class="ui.dropdown()" style="top: 100%; min-width: 280px">
                <template v-if="currentView === 'year'">
                    <div :class="ui.calHeader()">
                        <span :class="ui.calNavBtn()" @click.stop="prevPage">
                            <Icon name="lucide:chevron-left" class="size-4" />
                        </span>
                        <span :class="ui.calTitle()">{{ headerTitle }}</span>
                        <span :class="ui.calNavBtn()" @click.stop="nextPage">
                            <Icon name="lucide:chevron-right" class="size-4" />
                        </span>
                    </div>
                    <div class="grid grid-cols-4 gap-1 max-h-[240px] overflow-auto">
                        <div v-for="item in yearList" :key="item.year" :class="[
                            ui.calDay(),
                            selectedDate && selectedDate.getFullYear() === item.year ? ui.calDayActive() : '',
                            item.year === today.getFullYear() && (!selectedDate || selectedDate.getFullYear() !== item.year) ? ui.calDayToday() : '',
                            item.isDisabled ? ui.calDayDisabled() : '',
                            item.year < viewYearPageStart || item.year >= viewYearPageStart + 10 ? 'text-gray-4 dark:text-gray-5' : ''
                        ]" class="h-9" @click.stop="selectYear(item.year)">
                            {{ item.year }}
                        </div>
                    </div>
                </template>

                <template v-else-if="currentView === 'month'">
                    <div :class="ui.calHeader()">
                        <span :class="ui.calNavBtn()" @click.stop="prevPage">
                            <Icon name="lucide:chevron-left" class="size-4" />
                        </span>
                        <span :class="ui.calTitle()" @click.stop="currentView = 'year'">{{ headerTitle }}</span>
                        <span :class="ui.calNavBtn()" @click.stop="nextPage">
                            <Icon name="lucide:chevron-right" class="size-4" />
                        </span>
                    </div>
                    <div class="grid grid-cols-4 gap-1">
                        <div v-for="m in monthList" :key="m" :class="[
                            ui.calDay(),
                            selectedDate && selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === m - 1
                                ? ui.calDayActive()
                                : '',
                        ]" class="h-9" @click.stop="selectMonth(m)">
                            {{ m }}月
                        </div>
                    </div>
                </template>

                <template v-else>
                    <div :class="ui.calHeader()">
                        <span :class="ui.calNavBtn()" @click.stop="prevPage">
                            <Icon name="lucide:chevron-left" class="size-4" />
                        </span>
                        <span :class="ui.calTitle()" @click.stop="currentView = 'month'">{{ headerTitle }}</span>
                        <span :class="ui.calNavBtn()" @click.stop="nextPage">
                            <Icon name="lucide:chevron-right" class="size-4" />
                        </span>
                    </div>

                    <div :class="ui.calWeekdays()">
                        <span v-for="w in weekdays" :key="w">{{ w }}</span>
                    </div>

                    <div :class="ui.calDays()">
                        <div v-for="(day, idx) in calendarDays" :key="idx" :class="[
                            ui.calDay(),
                            day.isSelected ? ui.calDayActive() : '',
                            day.isDisabled ? ui.calDayDisabled() : '',
                            day.isToday && !day.isSelected ? ui.calDayToday() : '',
                        ]" @click.stop="selectDay(day)">
                            {{ day.day }}
                        </div>
                    </div>
                </template>
            </div>
        </Transition>
    </div>
</template>
