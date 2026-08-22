<script setup lang="ts">
import { computed, ref } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";

import RebornDatePickerPanel from "../reborn-date-picker-panel/RebornDatePickerPanel.vue";
import RebornSelectTrigger from "../reborn-select-trigger/RebornSelectTrigger.vue";
import type { SelectTriggerProps } from "../reborn-select-trigger/RebornSelectTrigger.vue";
import RebornBadge from "../reborn-badge/RebornBadge.vue";
import RebornPopover from "../reborn-popover/RebornPopover.vue";

import type { ClassValue } from "clsx";
import theme, { selectDateColors, selectDateSizes } from "./reborn-select-date.config";
import type { DatePickerType } from "../reborn-date-picker-panel/reborn-date-picker-panel.config";

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
    /** 追加到触发器根元素的自定义类名 */
    class?: any;
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
    /** 触发器 (Trigger) 的 UI 微调配置 */
    triggerUi?: SelectTriggerProps["ui"];
    /** 日期选择器内部组件的 UI 微调配置 */
    ui?: Partial<{
        wrapper: ClassValue;
        calDayToday: ClassValue;
        clearBtn: ClassValue;
        dropdown: ClassValue;
        content: ClassValue;
        calHeader: ClassValue;
        calNavBtn: ClassValue;
        calTitle: ClassValue;
        calWeekdays: ClassValue;
        calDays: ClassValue;
        calDay: ClassValue;
        calDayActive: ClassValue;
        calDayDisabled: ClassValue;
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
    bordered: true,
    showArrow: true,
    arrowAnimation: true,
    portal: true,
    labelFormat: "YYYY-MM-DD",
});

const emit = defineEmits<{
    (e: "change", value: any): void;
}>();

const modelValue = defineModel<any>({ default: "" });

/** 下拉是否展开 */
const isOpen = ref(false);

/** 外部传入的 UI 配置 */
const {
    disabled: fieldGroupDisabled,
    size: fieldGroupSize,
    isError,
    validate
} = useFormInject(props);

const isDisabled = computed(() => fieldGroupDisabled.value || props.disabled);

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
    const styles = b({
        size: fieldGroupSize.value || props.size,
        color: props.color,
        open: isOpen.value,
        disabled: isDisabled.value,
        rangeable: props.rangeable,
        error: isError.value,
    });
    return {
        wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        dropdown: (opts?: { class?: any }) => styles.dropdown({ class: cn(opts?.class, uiOverrides.value.dropdown) }),
        content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
        calHeader: (opts?: { class?: any }) => styles.calHeader({ class: cn(opts?.class, uiOverrides.value.calHeader) }),
        calNavBtn: (opts?: { class?: any }) => styles.calNavBtn({ class: cn(opts?.class, uiOverrides.value.calNavBtn) }),
        calTitle: (opts?: { class?: any }) => styles.calTitle({ class: cn(opts?.class, uiOverrides.value.calTitle) }),
        calWeekdays: (opts?: { class?: any }) => styles.calWeekdays({ class: cn(opts?.class, uiOverrides.value.calWeekdays) }),
        calDays: (opts?: { class?: any }) => styles.calDays({ class: cn(opts?.class, uiOverrides.value.calDays) }),
        calDay: (opts?: { class?: any }) => styles.calDay({ class: cn(opts?.class, uiOverrides.value.calDay) }),
        calDayActive: (opts?: { class?: any }) => styles.calDayActive({ class: cn(opts?.class, uiOverrides.value.calDayActive) }),
        calDayDisabled: (opts?: { class?: any }) => styles.calDayDisabled({ class: cn(opts?.class, uiOverrides.value.calDayDisabled) }),
        calDayToday: (opts?: { class?: any }) => styles.calDayToday({ class: cn(opts?.class, uiOverrides.value.calDayToday) }),
    };
});

/** 触发器 (Trigger) 的最终 UI 配置 */
const selectTriggerUi = computed(() => ({
    ...props.triggerUi,
    dropdown: cn(props.triggerUi?.dropdown, ui.value.dropdown()),
}));

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
    if (Array.isArray(modelValue.value)) {
        if (props.rangeable && modelValue.value.length >= 2) {
            const d1 = parseValue(modelValue.value[0]);
            const d2 = parseValue(modelValue.value[1]);
            if (d1 && d2) return `${formatDisplay(d1)} ~ ${formatDisplay(d2)}`;
        } else if (!props.rangeable && modelValue.value.length > 0) {
            const firstDate = parseValue(modelValue.value[0]);
            const firstLabel = firstDate ? formatDisplay(firstDate) : "";
            if (modelValue.value.length === 1) return firstLabel;
            return `${firstLabel}... +${modelValue.value.length - 1}`;
        }
        return "";
    }
    if (modelValue.value) {
        const d = parseValue(modelValue.value);
        if (d) return formatDisplay(d);
    }
    return "";
});

const multiSelectionInfo = computed(() => {
    if (Array.isArray(modelValue.value) && !props.rangeable && modelValue.value.length > 1) {
        const firstDate = parseValue(modelValue.value[0]);
        return {
            first: firstDate ? formatDisplay(firstDate) : "",
            count: modelValue.value.length - 1
        };
    }
    return null;
});

const selectionList = computed(() => {
    if (Array.isArray(modelValue.value) && !props.rangeable) {
        return modelValue.value.map((v, i) => {
            const d = parseValue(v);
            return {
                label: d ? formatDisplay(d) : String(v),
                index: i
            };
        });
    }
    return [];
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
    } else if (props.type !== "dates" && props.type !== "months" && props.type !== "years") {
        isOpen.value = false;
    }
    emit("change", val);
    validate("change");
}

function removeSelection(index: number, e?: Event) {
    if (e) e.stopPropagation();
    if (Array.isArray(modelValue.value)) {
        const next = [...modelValue.value];
        next.splice(index, 1);
        modelValue.value = next;
        emit("change", next);
        validate("change");
    }
}

function clear(e: Event) {
    e.stopPropagation();
    const isArrayType = props.rangeable || ["years", "months", "dates"].includes(props.type as string);
    const val = isArrayType ? [] : "";
    modelValue.value = val;
    emit("change", val);
    validate("change");
}

/**
 * 收起面板。判定「是否点在触发器或面板外」的职责归 RebornSelectTrigger：
 * 浮层已传送到 body，本组件根节点不再包含它，自己用 $el.contains 判定会把
 * 「点击面板内的日期」误判成外部点击。
 */
function onOutsideClose() {
    if (!isOpen.value) return;
    isOpen.value = false;
    validate("blur");
}
</script>

<template>
    <RebornSelectTrigger :class="props.class" :display-text="displayText" :placeholder="placeholder"
        :is-open="isOpen" :disabled="isDisabled" :size="fieldGroupSize || size" :color="color"
        :clearable="clearable && (Array.isArray(modelValue) ? modelValue.length > 0 : !!modelValue)"
        :ui="selectTriggerUi" :bordered="bordered" :show-arrow="showArrow" :arrow-animation="arrowAnimation"
        icon="lucide:calendar" :error="isError" :portal="portal" @toggle="toggle" @clear="clear" @close="onOutsideClose">
        <template #cover="{ displayText, placeholder, isOpen, ui: triggerUi }" v-if="$slots.cover">
            <slot name="cover" :displayText="displayText" :placeholder="placeholder" :isOpen="isOpen" :ui="triggerUi" />
        </template>
        <template #default="{ displayText, placeholder, isOpen, ui: triggerUi }">
            <slot :displayText="displayText" :placeholder="placeholder" :isOpen="isOpen" :ui="triggerUi">
                <div v-if="multiSelectionInfo" class="flex max-w-full items-center gap-1.5" @click.stop>
                    <RebornPopover :content="{ side: 'bottom', align: 'center', sideOffset: 12 }" arrow>
                        <div class="flex items-center gap-1">
                            <RebornBadge :color="color" :size="size" :label="`${multiSelectionInfo.first}`"
                                class="shrink-0 cursor-pointer" />
                            <RebornBadge :color="color" :size="size" :label="`+${multiSelectionInfo.count}`"
                                class="shrink-0 cursor-pointer" />
                        </div>
                        <template #content>
                            <div
                                class="flex max-w-[280px] flex-col overflow-hidden bg-white dark:bg-gray-8 shadow-xl rounded-xl border border-gray-1 dark:border-gray-7">
                                <div
                                    class="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-1 dark:border-gray-7 flex justify-between items-center">
                                    <span class="text-sm font-bold text-gray-400 tracking-wider">已选清单 ({{
                                        selectionList.length }})</span>
                                    <div class="text-sm text-primary cursor-pointer hover:underline"
                                        @click="clear">全部清空</div>
                                </div>
                                <div class="flex flex-wrap gap-2 p-3 overflow-y-auto max-h-[200px]">
                                    <RebornBadge v-for="item in selectionList" :key="item.index" :label="item.label"
                                        :color="color" :size="size" closable
                                        @close="removeSelection(item.index, $event)" />
                                </div>
                            </div>
                        </template>
                    </RebornPopover>
                </div>
                <span v-else :class="triggerUi.triggerText()">{{ displayText }}</span>
            </slot>
        </template>

        <template #content>
            <div :class="ui.content()">
                <RebornDatePickerPanel v-model="modelValue" @change="onPanelChange" :type="type" :rangeable="rangeable"
                    :start="start" :end="end" :size="size" :color="color" :ui="panelUi" :value-format="valueFormat" />
            </div>
        </template>
    </RebornSelectTrigger>
</template>
