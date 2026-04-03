<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { selectDateColors, selectDateSizes } from "./reborn-select-date.config";
import { tv } from "~/lib/tv";
import type { DatePickerType } from "../reborn-date-picker-panel/reborn-date-picker-panel.config";
import RebornDatePickerPanel from "../reborn-date-picker-panel/RebornDatePickerPanel.vue";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

const b = tv(theme);

defineOptions({ inheritAttrs: false });

export interface SelectDateProps {
    type?: DatePickerType;
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    rangeable?: boolean;
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
    type: "date",
    placeholder: "请选择日期",
    disabled: false,
    clearable: true,
    rangeable: false,
    start: "1970-01-01",
    end: "2099-12-31",
    size: "md",
    color: "primary",
    labelFormat: "YYYY-MM-DD",
});

const emit = defineEmits<{
    (e: "change", value: any): void;
}>();

const modelValue = defineModel<any>({ default: "" });

const isOpen = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);

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

const panelUi = computed(() => ({
    wrapper: "p-0", // No padding inside dropdown as dropdown has its own
    header: ui.value.calHeader(),
    navBtn: ui.value.calNavBtn(),
    title: ui.value.calTitle(),
    weekdays: ui.value.calWeekdays(),
    days: ui.value.calDays(),
    day: ui.value.calDay(),
    dayActive: ui.value.calDayActive(),
    dayDisabled: ui.value.calDayDisabled(),
    dayToday: ui.value.calDayToday(),
}));

function parseValue(v: any): Date | null {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    const d = props.valueFormat ? dayjs(v, props.valueFormat) : dayjs(v);
    return d.isValid() ? d.toDate() : null;
}

function formatDisplay(d: Date): string {
    if (props.labelFormat && props.labelFormat !== "YYYY-MM-DD") {
        return dayjs(d).format(props.labelFormat);
    }

    const formatStr =
        ["year", "yearrange", "years"].includes(props.type as string) ? "YYYY" :
            ["month", "monthrange", "months"].includes(props.type as string) ? "YYYY-MM" :
                ["datetime", "datetimerange"].includes(props.type as string) ? "YYYY-MM-DD HH:mm:ss" :
                    "YYYY-MM-DD";

    return dayjs(d).format(formatStr);
}

const displayText = computed(() => {
    if (props.rangeable) {
        if (Array.isArray(modelValue.value) && modelValue.value.length >= 2) {
            const d1 = parseValue(modelValue.value[0]);
            const d2 = parseValue(modelValue.value[1]);
            if (d1 && d2) return `${formatDisplay(d1)} ~ ${formatDisplay(d2)}`;
        }
        return "";
    }
    if (modelValue.value) {
        const d = parseValue(modelValue.value);
        if (d) return formatDisplay(d);
    }
    return "";
});

function toggle() {
    if (props.disabled) return;
    isOpen.value = !isOpen.value;
}

function onPanelChange(val: string | string[]) {
    if (props.rangeable) {
        if (Array.isArray(val) && val.length === 2) {
            isOpen.value = false;
        }
    } else {
        isOpen.value = false;
    }
    emit("change", val);
}

function clear(e: Event) {
    e.stopPropagation();
    const val = props.rangeable ? [] : "";
    modelValue.value = val;
    emit("change", val);
}

function onClickOutside(e: MouseEvent) {
    if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
        isOpen.value = false;
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
                <span v-if="clearable && (rangeable ? (modelValue?.length ?? 0) > 0 : modelValue)"
                    :class="ui.clearBtn()" @click.stop="clear">
                    <Icon name="lucide:x" class="size-full" />
                </span>
                <Icon name="lucide:calendar" :class="ui.arrow()" />
            </div>
        </div>

        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
            <div v-if="isOpen" :class="ui.dropdown()" style="top: 100%; min-width: 280px">
                <RebornDatePickerPanel v-model="modelValue" @change="onPanelChange" :type="type" :rangeable="rangeable"
                    :start="start" :end="end" :size="size" :color="color" :ui="panelUi" :value-format="valueFormat" />
            </div>
        </Transition>
    </div>
</template>
