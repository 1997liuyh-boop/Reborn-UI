<script setup lang="ts">
/**
 * 日期面板演练场的预览区：只负责渲染面板、回显绑定值与最近一次事件。
 * Playground 外壳、配置状态与控制面板留在 RebornDatePickerPanelDemo.vue，文档站按那个文件抽取演练场标题。
 */
import type {
  datePickerActiveTypes,
  datePickerPanelColors,
  datePickerPanelSizes,
  DatePickerType,
  ViewType,
} from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import { DemoNote } from "#components";
import { shallowRef } from "vue";
import RebornDatePickerPanel from "~/components/reborn/ui/reborn-date-picker-panel/RebornDatePickerPanel.vue";
import { formatPanelDisplay } from "../_shared/date-demo-utils";

/** 演练场的视觉与行为参数：由主演示文件持有，控制面板整体替换后经 config 传入 */
export interface DatePickerPanelPlaygroundConfig {
  type: DatePickerType;
  color: (typeof datePickerPanelColors)[number];
  activeType: (typeof datePickerActiveTypes)[number];
  width: "auto" | "full";
  size: (typeof datePickerPanelSizes)[number];
  disabled: boolean;
  border: boolean;
  /** 是否挂上快捷项 globalShortcuts */
  shortcuts: boolean;
  showWeekNumber: boolean;
  unlinkPanels: boolean;
  singlePanel: boolean;
  showToday: boolean;
}

interface Props {
  /** 演练场当前配置，只读 */
  config: DatePickerPanelPlaygroundConfig;
  /** 按选择类型推导的 value-format */
  valueFormat: string;
}
defineProps<Props>();

/** 绑定值：切换类型与重置由主文件处理，这里只把选择结果写回 */
const value = defineModel<string | string[]>("value", { required: true });

/** 最近一次事件，让预览区的操作「有回应」 */
const lastEvent = shallowRef("");

/** 快捷选项：value 可以是日期，也可以是返回日期的函数 */
const globalShortcuts = [
  { text: "今天", value: () => new Date() },
  {
    text: "一周前",
    value: () => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d;
    },
  },
  {
    text: "下个月",
    value: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d;
    },
  },
];

/** 范围类型点选日期，第一次点选时终点为 null */
function onPlaygroundCalendarChange(range: [Date, Date | null]) {
  lastEvent.value = `calendar-change ${formatPanelDisplay(range[0])} → ${range[1] ? formatPanelDisplay(range[1]) : "null"}`;
}

/** 面板翻页或切换视图 */
function onPlaygroundPanelChange(date: Date | [Date, Date], mode: "month" | "year", view: ViewType) {
  lastEvent.value = `panel-change ${formatPanelDisplay(date)} · mode="${mode}" · view="${view}"`;
}

/** 绑定值提交 */
function onPlaygroundChange(next: unknown) {
  lastEvent.value = `change ${formatPanelDisplay(next)}`;
}
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <RebornDatePickerPanel
      v-model="value"
      :type="config.type"
      :value-format="valueFormat"
      :color="config.color"
      :size="config.size"
      :active-type="config.activeType"
      :width="config.width"
      :border="config.border"
      :disabled="config.disabled"
      :shortcuts="config.shortcuts ? globalShortcuts : []"
      :show-week-number="config.showWeekNumber"
      :unlink-panels="config.unlinkPanels"
      :single-panel="config.singlePanel"
      :show-today="config.showToday"
      @calendar-change="onPlaygroundCalendarChange"
      @panel-change="onPlaygroundPanelChange"
      @change="onPlaygroundChange"
    />

    <DemoNote tone="dimmed">
      当前绑定值：<code class="break-all">{{ formatPanelDisplay(value) }}</code>
    </DemoNote>
    <DemoNote tone="dimmed">
      最近事件：<code class="break-all">{{ lastEvent || "暂无" }}</code>
    </DemoNote>
  </div>
</template>
