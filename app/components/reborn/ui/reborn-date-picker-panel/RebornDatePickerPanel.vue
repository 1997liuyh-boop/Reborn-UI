<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { datePickerPanelColors, datePickerPanelSizes, type DatePickerType, type ViewType, type CalDay } from "./reborn-date-picker-panel.config";
import { tv } from "~/lib/tv";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { RebornTimePicker } from "../reborn-time-picker";
import type { TimeRangeRole } from "../reborn-time-picker/reborn-time-panel.config";

dayjs.extend(customParseFormat);

const b = tv(theme);

/**
 * 组件属性定义
 */
export interface DatePickerPanelProps {
    modelValue?: any; // 绑定值
    type?: DatePickerType; // 选择器类型：date, datetime, year, month 等
    start?: string; // 可选范围开始时间
    end?: string; // 可选范围结束时间
    size?: (typeof datePickerPanelSizes)[number]; // 尺寸：sm, md, lg
    overflow?: "hidden" | "visible";
    disabledHours?: (role?: TimeRangeRole, comparingValue?: string | null) => number[]; // 返回需禁用的小时数组；仅含时间的类型（datetime/datetimerange）生效，范围模式可按 role 区分开始/结束面板
    disabledMinutes?: (hour: number, role?: TimeRangeRole, comparingValue?: string | null) => number[]; // 返回需禁用的分钟数组，入参为当前选中的小时；范围模式可按 role 区分开始/结束面板
    disabledSeconds?: (hour: number, minute: number, role?: TimeRangeRole, comparingValue?: string | null) => number[]; // 返回需禁用的秒数组，入参为当前选中的时、分；范围模式可按 role 区分开始/结束面板
    disabledMilliseconds?: (hour: number, minute: number, second: number, role?: TimeRangeRole, comparingValue?: string | null) => number[]; // 返回需禁用的毫秒数组，入参为当前选中的时、分、秒；范围模式可按 role 区分开始/结束面板
    color?: (typeof datePickerPanelColors)[number]; // 颜色主题
    shape?: "square" | "circle"; // 形状：方角或圆角
    class?: any; // 自定义类名
    valueFormat?: string; // 值格式化字符串
    disabled?: boolean; // 是否禁用
    border?: boolean; // 是否显示边框
    shortcuts?: { text: string; value: any }[]; // 快捷选项
    ui?: Partial<{ // 样式覆盖
        wrapper: ClassValue;
        container: ClassValue;
        shortcuts: ClassValue;
        shortcut: ClassValue;
        yearMonthItem: ClassValue;
        header: ClassValue;
        navBtn: ClassValue;
        navBtnHidden: ClassValue;
        title: ClassValue;
        weekdays: ClassValue;
        days: ClassValue;
        day: ClassValue;
        dayActive: ClassValue;
        dayDisabled: ClassValue;
        dayToday: ClassValue;
        dayHidden: ClassValue;
        dayInRange: ClassValue;
        yearMonthInRange: ClassValue;
        yearMonthOutside: ClassValue;
        grid4: ClassValue;
        grid4Year: ClassValue;
        grid4Month: ClassValue;
        dateTimeHeader: ClassValue;
        dateTimeSegment: ClassValue;
        dateTimeSegmentActive: ClassValue;
        dateTimeSegmentDisabled: ClassValue;
        dateTimeSeparator: ClassValue;
        headerActions: ClassValue;
        content: ClassValue;
        panelLeft: ClassValue;
        panelRight: ClassValue;
        icon: ClassValue;
    }>;
}

const props = withDefaults(defineProps<DatePickerPanelProps>(), {
    modelValue: "",
    type: "date",
    start: "1970-01-01",
    end: "2099-12-31",
    size: "md",
    overflow: "visible",
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

// --- 组件状态标识 ---
const isMultiple = computed(() => ["years", "months", "dates"].includes(props.type as string)); // 是否为多选模式
const isRange = computed(() => ["yearrange", "monthrange", "daterange", "datetimerange", "week"].includes(props.type as string)); // 是否为范围选择模式
const isDual = computed(() => ["yearrange", "monthrange", "daterange", "datetimerange"].includes(props.type as string)); // 是否显示双面板
const hasTime = computed(() => ["datetime", "datetimerange"].includes(props.type as string)); // 是否包含时间选择

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
    const styles = b({
        size: props.size,
        color: props.color,
        shape: props.shape,
        disabled: props.disabled,
        border: props.border,
        range: isRange.value,
        dual: isDual.value, // 双面板
        overflow: props.overflow,
    });
    return {
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        container: (opts?: { class?: any }) => styles.container({ class: cn(opts?.class, uiOverrides.value.container) }),
        shortcuts: (opts?: { class?: any }) => styles.shortcuts({ class: cn(opts?.class, uiOverrides.value.shortcuts) }),
        shortcut: (opts?: { class?: any }) => styles.shortcut({ class: cn(opts?.class, uiOverrides.value.shortcut) }),
        yearMonthItem: (opts?: { class?: any }) => styles.yearMonthItem({ class: cn(opts?.class, uiOverrides.value.yearMonthItem) }),
        header: (opts?: { class?: any }) => styles.header({ class: cn(opts?.class, uiOverrides.value.header) }),
        navBtn: (opts?: { class?: any }) => styles.navBtn({ class: cn(opts?.class, uiOverrides.value.navBtn) }),
        navBtnHidden: (opts?: { class?: any }) => styles.navBtnHidden({ class: cn(opts?.class, uiOverrides.value.navBtnHidden) }),
        title: (opts?: { class?: any }) => styles.title({ class: cn(opts?.class, uiOverrides.value.title) }),
        weekdays: (opts?: { class?: any }) => styles.weekdays({ class: cn(opts?.class, uiOverrides.value.weekdays) }),
        days: (opts?: { class?: any }) => styles.days({ class: cn(opts?.class, uiOverrides.value.days) }),
        day: (opts?: { class?: any }) => styles.day({ class: cn(opts?.class, uiOverrides.value.day) }),
        dayActive: (opts?: { class?: any }) => styles.dayActive({ class: cn(opts?.class, uiOverrides.value.dayActive) }),
        dayDisabled: (opts?: { class?: any }) => styles.dayDisabled({ class: cn(opts?.class, uiOverrides.value.dayDisabled) }),
        dayToday: (opts?: { class?: any }) => styles.dayToday({ class: cn(opts?.class, uiOverrides.value.dayToday) }),
        dayHidden: (opts?: { class?: any }) => styles.dayHidden({ class: cn(opts?.class, uiOverrides.value.dayHidden) }),
        dayInRange: (opts?: { class?: any }) => styles.dayInRange({ class: cn(opts?.class, uiOverrides.value.dayInRange) }),
        yearMonthInRange: (opts?: { class?: any }) => styles.yearMonthInRange({ class: cn(opts?.class, uiOverrides.value.yearMonthInRange) }),
        yearMonthOutside: (opts?: { class?: any }) => styles.yearMonthOutside({ class: cn(opts?.class, uiOverrides.value.yearMonthOutside) }),
        grid4Year: (opts?: { class?: any }) => styles.grid4Year({ class: cn(opts?.class, uiOverrides.value.grid4Year) }),
        grid4Month: (opts?: { class?: any }) => styles.grid4Month({ class: cn(opts?.class, uiOverrides.value.grid4Month) }),
        dateTimeHeader: (opts?: { class?: any }) => styles.dateTimeHeader({ class: cn(opts?.class, uiOverrides.value.dateTimeHeader) }),
        dateTimeSegment: (opts?: { class?: any }) => styles.dateTimeSegment({ class: cn(opts?.class, uiOverrides.value.dateTimeSegment) }),
        dateTimeSegmentActive: (opts?: { class?: any }) => styles.dateTimeSegmentActive({ class: cn(opts?.class, uiOverrides.value.dateTimeSegmentActive) }),
        dateTimeSegmentDisabled: (opts?: { class?: any }) => styles.dateTimeSegmentDisabled({ class: cn(opts?.class, uiOverrides.value.dateTimeSegmentDisabled) }),
        dateTimeSeparator: (opts?: { class?: any }) => styles.dateTimeSeparator({ class: cn(opts?.class, uiOverrides.value.dateTimeSeparator) }),
        content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
        panelLeft: (opts?: { class?: any }) => styles.panelLeft({ class: cn(opts?.class, uiOverrides.value.panelLeft) }),
        panelRight: (opts?: { class?: any }) => styles.panelRight({ class: cn(opts?.class, uiOverrides.value.panelRight) }),
        icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    };
});

// --- 日历核心状态 ---
const today = new Date();
const viewYear = ref(today.getFullYear()); // 当前视觉年份
const viewMonth = ref(today.getMonth()); // 当前视觉月份 (0-11)

// 第二面板状态 (联动)
const viewYear2 = computed(() => {
    if (props.type === "monthrange") return viewYear.value + 1;
    if (viewMonth.value === 11) return viewYear.value + 1;
    return viewYear.value;
});
const viewMonth2 = computed(() => {
    if (props.type === "monthrange") return viewMonth.value;
    if (viewMonth.value === 11) return 0;
    return viewMonth.value + 1;
});

const currentView = ref<ViewType>("date"); // 当前视图：year, month, date, time

// 获取初始视图类型
function getInitialView(): ViewType {
    if (["year", "years", "yearrange"].includes(props.type)) return "year";
    if (["month", "months", "monthrange"].includes(props.type)) return "month";
    return "date";
}
currentView.value = getInitialView();

// 选中的数据状态
const selectedDate = ref<Date | null>(null); // 单个选中日期
const selectedDates = ref<Date[]>([]); // 多个选中日期
const rangeStart = ref<Date | null>(null); // 范围开始
const rangeEnd = ref<Date | null>(null); // 范围结束

const selectedHour = ref(today.getHours()); // 选中的小时
const selectedMinute = ref(today.getMinutes()); // 选中的分钟
const selectedSecond = ref(0); // 选中的秒

const timeFormat = computed(() => {
    if (props.valueFormat.includes("SSS")) return "HH:mm:ss.SSS";
    return "HH:mm:ss";
});

const displayDate1 = computed(() => {
    const d = isRange.value ? rangeStart.value : selectedDate.value;
    return d ? dayjs(d).format("YYYY-MM-DD") : "选择日期";
});

const displayTime1 = computed(() => {
    const d = isRange.value ? rangeStart.value : selectedDate.value;
    if (!d) return "选择时间";
    return dayjs(d).hour(selectedHour.value).minute(selectedMinute.value).second(selectedSecond.value).format(timeFormat.value);
});

const displayDate2 = computed(() => {
    if (!isRange.value) return "";
    return rangeEnd.value ? dayjs(rangeEnd.value).format("YYYY-MM-DD") : "选择日期";
});

const displayTime2 = computed(() => {
    if (!isRange.value) return "";
    if (!rangeEnd.value) return "选择时间";
    return dayjs(rangeEnd.value).hour(selectedHour2.value).minute(selectedMinute2.value).second(selectedSecond2.value).format(timeFormat.value);
});

const selectedHour2 = ref(today.getHours());
const selectedMinute2 = ref(today.getMinutes());
const selectedSecond2 = ref(0);

const timeModel1 = computed({
    get: () => displayTime1.value,
    set: (val) => {
        const d = dayjs(val, timeFormat.value);
        if (d.isValid()) {
            selectedHour.value = d.hour();
            selectedMinute.value = d.minute();
            selectedSecond.value = d.second();

            if (isRange.value) {
                if (!rangeStart.value) {
                    const today = new Date();
                    rangeStart.value = today;
                    rangeEnd.value = today;
                    selectedHour2.value = d.hour();
                    selectedMinute2.value = d.minute();
                    selectedSecond2.value = d.second();
                }
                const newVal = [formatDate(rangeStart.value), formatDate(rangeEnd.value, 'end')];
                emit("update:modelValue", newVal);
            } else {
                if (!selectedDate.value) {
                    selectedDate.value = new Date();
                }
                emit("update:modelValue", formatDate(selectedDate.value));
            }
        }
    }
});

const timeModel2 = computed({
    get: () => displayTime2.value,
    set: (val) => {
        const d = dayjs(val, timeFormat.value);
        if (d.isValid()) {
            selectedHour2.value = d.hour();
            selectedMinute2.value = d.minute();
            selectedSecond2.value = d.second();

            if (isRange.value) {
                if (!rangeStart.value) {
                    rangeStart.value = new Date();
                }
                if (!rangeEnd.value) {
                    rangeEnd.value = new Date();
                }
                const newVal = [formatDate(rangeStart.value), formatDate(rangeEnd.value, 'end')];
                emit("update:modelValue", newVal);
            }
        }
    }
});

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

/**
 * 解析输入值为 Date 对象
 */
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

/**
 * 格式化日期为输出字符串
 */
function formatDate(d: Date | null, role: 'start' | 'end' = 'start'): any {
    if (!d) return "";
    if (!props.valueFormat) return d;

    // 如果包含时间选择，注入选中的时分
    let dateObj = dayjs(d);
    if (["datetime", "datetimerange"].includes(props.type as string)) {
        const h = role === 'start' ? selectedHour.value : selectedHour2.value;
        const m = role === 'start' ? selectedMinute.value : selectedMinute2.value;
        const s = role === 'start' ? selectedSecond.value : selectedSecond2.value;
        dateObj = dateObj.hour(h).minute(m).second(s);
    }

    return dateObj.format(props.valueFormat);
}

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

const hourRef = ref<HTMLElement | null>(null);
const minuteRef = ref<HTMLElement | null>(null);

/**
 * 滚动时间列表到选中值
 */
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

/**
 * 确认选中的时间
 */
function confirmTime() {
    currentView.value = "date";
}

/**
 * 生成日历日期列表
 */
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

/**
 * 切换到上一页 (年/月)
 */
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
        // 双面板联动：跳转2个月
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

/**
 * 切换到下一页 (年/月)
 */
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
        // 双面板联动：跳转2个月
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

/**
 * 选中某个日期
 */
function selectDay(day: CalDay, panel: 'left' | 'right' = 'left') {
    if (day.isDisabled) return;

    if (props.type === "week") {
        // 周选择模式：选中整周
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
        // 多选模式
        const current = (props.modelValue as any[] || []);
        const idx = current.findIndex(v => isSameDate(v, day.date));
        const newVal = [...current];
        if (idx > -1) newVal.splice(idx, 1);
        else newVal.push(formatDate(day.date));
        emit("update:modelValue", newVal);
    } else if (isRange.value) {
        // 范围选择模式
        if (panel === 'right') {
            if (!rangeStart.value) {
                rangeStart.value = new Date();
            }
            rangeEnd.value = day.date;
            if (rangeEnd.value < rangeStart.value) {
                const temp = rangeStart.value;
                rangeStart.value = rangeEnd.value;
                rangeEnd.value = temp;
            }
        } else {
            if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
                rangeStart.value = day.date;
                rangeEnd.value = null;
            } else {
                if (day.date < rangeStart.value) {
                    rangeEnd.value = rangeStart.value;
                    rangeStart.value = day.date;
                } else {
                    rangeEnd.value = day.date;
                }
            }
        }

        const val = [formatDate(rangeStart.value), rangeEnd.value ? formatDate(rangeEnd.value, 'end') : ''];
        emit("update:modelValue", val);
        if (rangeStart.value && rangeEnd.value) emit("change", val);
    } else {
        // 单选模式
        selectedDate.value = day.date;
        const val = formatDate(day.date);
        emit("update:modelValue", val);
        emit("change", val);
    }
}

/**
 * 选中某个年份
 */
function selectYear(year: number, panel: 'left' | 'right' = 'left') {
    const d = new Date(year, 0, 1);

    if (props.type === "year") {
        selectedDate.value = d;
        const val = formatDate(d);
        emit("update:modelValue", val);
        emit("change", val);
        return;
    }

    if (props.type === "years") {
        const current = (props.modelValue as any[] || []);
        const valStr = formatDate(d);
        const idx = current.findIndex(v => {
            const dv = dayjs(v);
            return dv.isValid() && dv.year() === year;
        });
        const newVal = [...current];
        if (idx > -1) newVal.splice(idx, 1);
        else newVal.push(valStr);
        emit("update:modelValue", newVal);
        return;
    }

    if (props.type === "yearrange") {
        if (panel === 'right') {
            if (!rangeStart.value) rangeStart.value = new Date();
            rangeEnd.value = d;
            if (rangeEnd.value < rangeStart.value) {
                const temp = rangeStart.value;
                rangeStart.value = rangeEnd.value;
                rangeEnd.value = temp;
            }
        } else {
            if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
                rangeStart.value = d;
                rangeEnd.value = null;
            } else {
                if (d < rangeStart.value) {
                    rangeEnd.value = rangeStart.value;
                    rangeStart.value = d;
                } else {
                    rangeEnd.value = d;
                }
            }
        }
        const val = [formatDate(rangeStart.value), rangeEnd.value ? formatDate(rangeEnd.value, 'end') : ''];
        emit("update:modelValue", val);
        if (rangeStart.value && rangeEnd.value) emit("change", val);
        return;
    }

    viewYear.value = year;
    viewYearPageStart.value = Math.floor(year / 10) * 10;
    currentView.value = "month";
}

/**
 * 选中某个月份
 */
function selectMonth(month: number, yearContext?: number, panel: 'left' | 'right' = 'left') {
    const targetYear = yearContext ?? viewYear.value;
    const d = new Date(targetYear, month - 1, 1);

    if (props.type === "month") {
        selectedDate.value = d;
        const val = formatDate(d);
        emit("update:modelValue", val);
        emit("change", val);
        return;
    }

    if (props.type === "months") {
        const current = (props.modelValue as any[] || []);
        const valStr = formatDate(d);
        const idx = current.findIndex(v => {
            const dv = dayjs(v);
            return dv.isValid() && dv.year() === targetYear && dv.month() === month - 1;
        });
        const newVal = [...current];
        if (idx > -1) newVal.splice(idx, 1);
        else newVal.push(valStr);
        emit("update:modelValue", newVal);
        return;
    }

    if (props.type === "monthrange") {
        if (panel === 'right') {
            if (!rangeStart.value) rangeStart.value = new Date();
            rangeEnd.value = d;
            if (rangeEnd.value < rangeStart.value) {
                const temp = rangeStart.value;
                rangeStart.value = rangeEnd.value;
                rangeEnd.value = temp;
            }
        } else {
            if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
                rangeStart.value = d;
                rangeEnd.value = null;
            } else {
                if (d < rangeStart.value) {
                    rangeEnd.value = rangeStart.value;
                    rangeStart.value = d;
                } else {
                    rangeEnd.value = d;
                }
            }
        }
        const val = [formatDate(rangeStart.value), rangeEnd.value ? formatDate(rangeEnd.value, 'end') : ''];
        emit("update:modelValue", val);
        if (rangeStart.value && rangeEnd.value) emit("change", val);
        return;
    }

    viewMonth.value = month - 1;
    viewYear.value = targetYear;
    currentView.value = "date";
}

/**
 * 根据 modelValue 初始化状态
 */
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
                if (d2) {
                    rangeEnd.value = d2;
                    selectedHour2.value = d2.getHours();
                    selectedMinute2.value = d2.getMinutes();
                    selectedSecond2.value = d2.getSeconds();
                }
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
                selectedHour.value = d.getHours();
                selectedMinute.value = d.getMinutes();
                selectedSecond.value = d.getSeconds();
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

            <!-- 主内容区 -->
            <div :class="ui.content()">
                <!-- 左侧/单面板 -->
                <div :class="ui.panelLeft()">
                    <RebornTimePicker v-if="hasTime" v-model="timeModel1" :format="timeFormat" :size="size"
                        :color="color" :disabled-hours="disabledHours" :bordered="false" :clearable="false"
                        :disabled-minutes="disabledMinutes" :disabled-seconds="disabledSeconds"
                        :disabled-milliseconds="disabledMilliseconds" :show-arrow="false">
                        <template #default="{ toggle }">
                            <div :class="ui.dateTimeHeader()" @click.stop>
                                <div :class="[ui.dateTimeSegment(), ui.dateTimeSegmentDisabled()]"
                                    @click="currentView = 'date'">
                                    {{ displayDate1 }}
                                </div>
                                <div :class="ui.dateTimeSeparator()">/</div>
                                <div :class="[ui.dateTimeSegment(), ui.dateTimeSegmentActive()]" @click="toggle">
                                    {{ displayTime1 }}
                                </div>
                            </div>
                        </template>
                    </RebornTimePicker>

                    <template v-if="currentView === 'year'">
                        <div :class="ui.header()">
                            <span :class="ui.navBtn()" @click.stop="prevPage">
                                <Icon name="lucide:chevron-left" :class="ui.icon()" />
                            </span>
                            <div :class="ui.dateTimeHeader()">
                                <span :class="ui.title()" @click.stop="currentView = 'year'">
                                    {{ headerTitle }}
                                </span>
                            </div>
                            <span v-if="!isDual" :class="ui.navBtn()" @click.stop="nextPage">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                        </div>
                        <div :class="ui.grid4Year()">
                            <div v-for="item in yearList" :key="item.year" :class="[
                                ui.yearMonthItem(),
                                isYearActive(item.year) ? ui.dayActive() : (isYearInRange(item.year) ? ui.yearMonthInRange() : ''),
                                item.year === today.getFullYear() && !isYearActive(item.year) ? ui.dayToday() : '',
                                item.isDisabled ? ui.dayDisabled() : '',
                                item.year < viewYearPageStart || item.year >= viewYearPageStart + 10 ? ui.yearMonthOutside() : ''
                            ]" @click.stop="selectYear(item.year, 'left')">
                                {{ item.year }}
                            </div>
                        </div>
                    </template>

                    <!-- 月视图 -->
                    <template v-else-if="currentView === 'month'">
                        <div :class="ui.header()">
                            <span :class="ui.navBtn()" @click.stop="prevPage">
                                <Icon name="lucide:chevron-left" :class="ui.icon()" />
                            </span>
                            <div :class="ui.dateTimeHeader()">
                                <span :class="ui.title()" @click.stop="currentView = 'year'">
                                    {{ viewYear }}年
                                </span>
                            </div>
                            <span v-if="!isDual" :class="ui.navBtn()" @click.stop="nextPage">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                            <span v-else :class="ui.navBtnHidden()">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                        </div>
                        <div :class="ui.grid4Month()">
                            <div v-for="m in monthList" :key="m" :class="[
                                ui.yearMonthItem(),
                                isMonthActive(m) ? ui.dayActive() : (isMonthInRange(m) ? ui.yearMonthInRange() : ''),
                                viewYear === today.getFullYear() && m === today.getMonth() + 1 && !isMonthActive(m) ? ui.dayToday() : '',
                            ]" @click.stop="selectMonth(m, undefined, 'left')">
                                {{ m }}月
                            </div>
                        </div>
                    </template>
                    <!-- 日期选择视图 -->
                    <template v-else>
                        <div :class="ui.header()">
                            <span :class="ui.navBtn()" @click.stop="prevPage">
                                <Icon name="lucide:chevron-left" :class="ui.icon()" />
                            </span>
                            <div :class="ui.dateTimeHeader()">
                                <span :class="ui.title()" @click.stop="currentView = 'year'">{{ viewYear }}年</span>
                                <div :class="ui.dateTimeSeparator()">/</div>
                                <span :class="ui.title()" @click.stop="currentView = 'month'">{{ viewMonth + 1
                                    }}月</span>
                            </div>
                            <span v-if="!isDual" :class="ui.navBtn()" @click.stop="nextPage">
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
                                ['daterange', 'datetimerange'].includes(props.type) && !day.isCurrentMonth ? ui.dayHidden() : ''
                            ]" @click.stop="selectDay(day, 'left')">
                                {{ day.day }}
                            </div>
                        </div>
                    </template>
                </div>

                <div v-if="isDual" :class="ui.panelRight()">
                    <RebornTimePicker v-if="hasTime" v-model="timeModel2" :format="timeFormat" :size="size"
                        :color="color" :disabled-hours="disabledHours" :bordered="false" :clearable="false"
                        :disabled-minutes="disabledMinutes" :disabled-seconds="disabledSeconds"
                        :disabled-milliseconds="disabledMilliseconds" :show-arrow="false">
                        <template #default="{ toggle }">
                            <div :class="ui.dateTimeHeader()" @click.stop>
                                <div :class="[ui.dateTimeSegment(), ui.dateTimeSegmentDisabled()]"
                                    @click="currentView = 'date'">
                                    {{ displayDate2 }}
                                </div>
                                <div :class="ui.dateTimeSeparator()">/</div>
                                <div :class="[ui.dateTimeSegment(), ui.dateTimeSegmentActive()]" @click="toggle">
                                    {{ displayTime2 }}
                                </div>
                            </div>
                        </template>
                    </RebornTimePicker>

                    <template v-if="currentView === 'year'">
                        <div :class="ui.header()">
                            <span :class="ui.navBtnHidden()">
                                <Icon name="lucide:chevron-left" :class="ui.icon()" />
                            </span>
                            <div :class="ui.dateTimeHeader()">
                                <span :class="ui.title()">
                                    {{ headerTitle2 }}
                                </span>
                            </div>
                            <span :class="ui.navBtn()" @click.stop="nextPage">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                        </div>
                        <div :class="ui.grid4Year()">
                            <div v-for="item in yearList2" :key="item.year" :class="[
                                ui.yearMonthItem(),
                                isYearActive(item.year) ? ui.dayActive() : (isYearInRange(item.year) ? ui.yearMonthInRange() : ''),
                                item.year === today.getFullYear() && !isYearActive(item.year) ? ui.dayToday() : '',
                                item.isDisabled ? ui.dayDisabled() : '',
                                item.year < viewYearPageStart2 || item.year >= viewYearPageStart2 + 10 ? ui.yearMonthOutside() : ''
                            ]" @click.stop="selectYear(item.year, 'right')">
                                {{ item.year }}
                            </div>
                        </div>
                    </template>

                    <template v-else-if="currentView === 'month'">
                        <div :class="ui.header()">
                            <span :class="ui.navBtnHidden()">
                                <Icon name="lucide:chevron-left" :class="ui.icon()" />
                            </span>
                            <div :class="ui.dateTimeHeader()">
                                <span :class="ui.title()" @click.stop="currentView = 'year'">
                                    {{ viewYear2 }}年
                                </span>
                            </div>
                            <span :class="ui.navBtn()" @click.stop="nextPage">
                                <Icon name="lucide:chevron-right" :class="ui.icon()" />
                            </span>
                        </div>
                        <div :class="ui.grid4Month()">
                            <div v-for="m in monthList" :key="m" :class="[
                                ui.yearMonthItem(),
                                isMonthActive(m, viewYear2) ? ui.dayActive() : (isMonthInRange(m, viewYear2) ? ui.yearMonthInRange() : ''),
                                viewYear2 === today.getFullYear() && m === today.getMonth() + 1 && !isMonthActive(m, viewYear2) ? ui.dayToday() : '',
                            ]" @click.stop="selectMonth(m, viewYear2, 'right')">
                                {{ m }}月
                            </div>
                        </div>
                    </template>

                    <template v-else>
                        <div :class="ui.header()">
                            <span :class="ui.navBtnHidden()">
                                <Icon name="lucide:chevron-left" :class="ui.icon()" />
                            </span>
                            <div :class="ui.dateTimeHeader()">
                                <span @click.stop="currentView = 'year'" :class="ui.title()">{{ viewYear2 }}年</span>
                                <div :class="ui.dateTimeSeparator()">/</div>
                                <span @click.stop="currentView = 'month'" :class="ui.title()">{{ viewMonth2 + 1
                                    }}月</span>
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
                                ['daterange', 'datetimerange'].includes(props.type) && !day.isCurrentMonth ? ui.dayHidden() : ''
                            ]" @click.stop="selectDay(day, 'right')">
                                {{ day.day }}
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>