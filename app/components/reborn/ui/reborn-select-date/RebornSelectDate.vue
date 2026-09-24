<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { DatePickerType } from "../reborn-date-picker-panel/reborn-date-picker-panel.config";
import type { FieldTriggerProps } from "../reborn-field-trigger/RebornFieldTrigger.vue";

import type { SelectTriggerProps } from "../reborn-select-trigger/RebornSelectTrigger.vue";
import type { selectDateColors, selectDateSizes } from "./reborn-select-date.config";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { computed, ref } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";

import RebornBadge from "../reborn-badge/RebornBadge.vue";
import RebornDatePickerPanel from "../reborn-date-picker-panel/RebornDatePickerPanel.vue";
import RebornFieldTrigger from "../reborn-field-trigger/RebornFieldTrigger.vue";

import RebornPopover from "../reborn-popover/RebornPopover.vue";
import { splitTriggerUi } from "../reborn-select-trigger/reborn-select-trigger.config";
import RebornSelectTrigger from "../reborn-select-trigger/RebornSelectTrigger.vue";
import theme from "./reborn-select-date.config";

defineOptions({ inheritAttrs: false });
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
  autoAdjustOverflow: true,
  labelFormat: "YYYY-MM-DD",
});
const emit = defineEmits<{
  (e: "change", value: any): void;
}>();
dayjs.extend(customParseFormat);
// 季度类型的显示文案用 Q 令牌（YYYY-[Q]Q），Q 由 advancedFormat 提供
dayjs.extend(advancedFormat);

const b = tv(theme);

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
  /** 下拉框是否自动调整位置：下方空间不足且上方更宽裕时向上展开；关闭后固定向下 */
  autoAdjustOverflow?: SelectTriggerProps["autoAdjustOverflow"];
  /** 触发器 (Trigger) 的 UI 微调配置：触发器盒子与浮层的键混写在一起，组件内部自动拆分下发 */
  triggerUi?: SelectTriggerProps["ui"] & FieldTriggerProps["ui"];
  /** 日期选择器内部组件的 UI 微调配置 */
  ui?: Partial<{
    wrapper: ClassValue;
    calDayToday: ClassValue;
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

const modelValue = defineModel<any>({ default: "" });

/** 下拉是否展开 */
const isOpen = ref(false);

/** 外部传入的 UI 配置 */
const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate,
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
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    dropdown: (opts?: { class?: any }) =>
      styles.dropdown({ class: cn(opts?.class, uiOverrides.value.dropdown) }),
    content: (opts?: { class?: any }) =>
      styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
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
  };
});

/** 拆分后的最终 UI 配置：浮层给 RebornSelectTrigger，触发器盒子给 RebornFieldTrigger */
const splitUi = computed(() => splitTriggerUi(props.triggerUi));

const overlayUi = computed(() => ({
  ...splitUi.value.overlay,
  dropdown: cn(splitUi.value.overlay.dropdown, ui.value.dropdown()),
}));

const fieldUi = computed(() => splitUi.value.field);

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

  const formatStr = ["year", "yearrange", "years"].includes(props.type as string)
    ? "YYYY"
    : ["month", "monthrange", "months"].includes(props.type as string)
      ? "YYYY-MM"
      : ["quarter", "quarterrange", "quarters"].includes(props.type as string)
        ? "YYYY-[Q]Q"
        : ["datetime", "datetimerange"].includes(props.type as string)
          ? "YYYY-MM-DD HH:mm:ss"
          : "YYYY-MM-DD";

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
      count: modelValue.value.length - 1,
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
        index: i,
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
  } else if (!["dates", "months", "quarters", "years"].includes(props.type as string)) {
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
  const isArrayType =
    props.rangeable || ["years", "months", "quarters", "dates"].includes(props.type as string);
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
  <RebornSelectTrigger
    :class="ui.wrapper({ class: props.class })"
    :is-open="isOpen"
    :disabled="isDisabled"
    :size="fieldGroupSize || size"
    :ui="overlayUi"
    :portal="portal"
    :auto-adjust-overflow="autoAdjustOverflow"
    @close="onOutsideClose"
  >
    <template #trigger>
      <RebornFieldTrigger
        :display-text="displayText"
        :placeholder="placeholder"
        :is-open="isOpen"
        :disabled="isDisabled"
        :size="fieldGroupSize || size"
        :color="color"
        :clearable="clearable && (Array.isArray(modelValue) ? modelValue.length > 0 : !!modelValue)"
        :ui="fieldUi"
        :bordered="bordered"
        :show-arrow="showArrow"
        :arrow-animation="arrowAnimation"
        icon="lucide:calendar"
        :error="isError"
        @click="toggle"
        @clear="clear"
      >
        <template
          v-if="$slots.cover"
          #cover="{ displayText, placeholder, isOpen, ui: triggerUi }"
        >
          <slot
            name="cover"
            :display-text="displayText"
            :placeholder="placeholder"
            :is-open="isOpen"
            :ui="triggerUi"
          />
        </template>
        <template #default="{ displayText, placeholder, isOpen, ui: triggerUi }">
          <slot
            :display-text="displayText"
            :placeholder="placeholder"
            :is-open="isOpen"
            :ui="triggerUi"
          >
            <div
              v-if="multiSelectionInfo"
              class="flex max-w-full items-center gap-1.5"
              @click.stop
            >
              <RebornPopover
                :content="{ side: 'bottom', align: 'center', sideOffset: 12 }"
                arrow
              >
                <div class="flex items-center gap-1">
                  <RebornBadge
                    :color="color"
                    :size="size"
                    :label="`${multiSelectionInfo.first}`"
                    class="shrink-0 cursor-pointer"
                  />
                  <RebornBadge
                    :color="color"
                    :size="size"
                    :label="`+${multiSelectionInfo.count}`"
                    class="shrink-0 cursor-pointer"
                  />
                </div>
                <template #content>
                  <div
                    class="dark:bg-gray-8 border-gray-1 dark:border-gray-7 flex max-w-[280px] flex-col overflow-hidden rounded-xl border bg-white shadow-xl"
                  >
                    <div
                      class="border-gray-1 dark:border-gray-7 flex items-center justify-between border-b bg-gray-50 px-3 py-2 dark:bg-gray-800/50"
                    >
                      <span class="text-sm font-bold tracking-wider text-gray-400">已选清单 ({{ selectionList.length }})</span>
                      <div
                        class="text-primary cursor-pointer text-sm hover:underline"
                        @click="clear"
                      >
                        全部清空
                      </div>
                    </div>
                    <div class="flex max-h-[200px] flex-wrap gap-2 overflow-y-auto p-3">
                      <RebornBadge
                        v-for="item in selectionList"
                        :key="item.index"
                        :label="item.label"
                        :color="color"
                        :size="size"
                        closable
                        @close="removeSelection(item.index, $event)"
                      />
                    </div>
                  </div>
                </template>
              </RebornPopover>
            </div>
            <span
              v-else
              :class="triggerUi.triggerText()"
            >{{ displayText }}</span>
          </slot>
        </template>
      </RebornFieldTrigger>
    </template>

    <template #content>
      <div :class="ui.content()">
        <RebornDatePickerPanel
          v-model="modelValue"
          :type="type"
          :rangeable="rangeable"
          :start="start"
          :end="end"
          :size="size"
          :color="color"
          :ui="panelUi"
          width="full"
          :value-format="valueFormat"
          @change="onPanelChange"
        />
      </div>
    </template>
  </RebornSelectTrigger>
</template>
