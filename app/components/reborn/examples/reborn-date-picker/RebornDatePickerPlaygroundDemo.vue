<script setup lang="ts">
/**
 * 日期选择器演练场的预览区：只负责渲染选择器、回显绑定值和记录事件日志。
 * Playground 外壳、配置状态与控制面板留在 RebornDatePickerDemo.vue，文档站按那个文件抽取演练场标题。
 */
import type { DatePickerType } from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import type { datePickerColors, datePickerSizes, datePickerVariants } from "~/components/reborn/ui/reborn-date-picker/reborn-date-picker.config";
import type { DatePickerProps } from "~/components/reborn/ui/reborn-date-picker/RebornDatePicker.vue";
import { DemoNote } from "#components";
import RebornDatePicker from "~/components/reborn/ui/reborn-date-picker/RebornDatePicker.vue";
import { createHandlers, formatDisplay, useEventLog } from "../_shared/date-demo-utils";

/** 演练场的外观与行为参数：由主演示文件持有，控制面板整体替换后经 config 传入 */
export interface DatePickerPlaygroundConfig {
  type: DatePickerType;
  size: (typeof datePickerSizes)[number];
  color: (typeof datePickerColors)[number];
  variant: (typeof datePickerVariants)[number];
  activeType: "fill" | "fillRound" | "outline" | "text";
  placeholder: string;
  showArrow: boolean;
  arrowAnimation: boolean;
  clearable: boolean;
  loading: boolean;
  disabled: boolean;
  collapseTags: boolean;
  collapseTagsTooltip: boolean;
  maxCollapseTags: number;
  closeOn: "mousedown" | "click";
  portal: boolean;
  /** 是否显示快捷项；实际传给组件的列表见 shortcuts 属性 */
  shortcuts: boolean;
  shortcutPosition: "left" | "right";
  showWeekNumber: boolean;
  unlinkPanels: boolean;
  singlePanel: boolean;
  showToday: boolean;
  highlightToday: boolean;
}

interface Props {
  /** 演练场当前配置，只读 */
  config: DatePickerPlaygroundConfig;
  /** 按选择类型推导的 value-format */
  valueFormat: string;
  /** 当前类型适用的快捷项；未开启或类型不支持时为空数组 */
  shortcuts: NonNullable<DatePickerProps["shortcuts"]>;
}
defineProps<Props>();

/** 绑定值：切换类型与重置由主文件处理，这里只把选择结果写回 */
const value = defineModel<string | string[] | null>("value", { required: true });

/** 演练场事件日志：展开、收起与提交会连着抛好几个事件，保留最近 5 条，足够看清一次展开到收起的完整顺序 */
const { logs: playgroundLogs, push: logPlayground } = useEventLog(5);

/** 演练场的事件监听 */
const playgroundHandlers = createHandlers(logPlayground);
</script>

<template>
  <div class="flex w-full max-w-md flex-col gap-4 pb-40">
    <RebornDatePicker
      v-model="value"
      :type="config.type"
      :value-format="valueFormat"
      :size="config.size"
      :color="config.color"
      :variant="config.variant"
      :active-type="config.activeType"
      :placeholder="config.placeholder || undefined"
      :show-arrow="config.showArrow"
      :arrow-animation="config.arrowAnimation"
      :clearable="config.clearable"
      :loading="config.loading"
      :disabled="config.disabled"
      :collapse-tags="config.collapseTags"
      :collapse-tags-tooltip="config.collapseTagsTooltip"
      :max-collapse-tags="config.maxCollapseTags"
      :close-on="config.closeOn"
      :portal="config.portal"
      :shortcuts="shortcuts"
      :shortcut-position="config.shortcutPosition"
      :show-week-number="config.showWeekNumber"
      :unlink-panels="config.unlinkPanels"
      :single-panel="config.singlePanel"
      :show-today="config.showToday"
      :highlight-today="config.highlightToday"
      @change="playgroundHandlers.onChange"
      @visible-change="playgroundHandlers.onVisibleChange"
      @calendar-change="playgroundHandlers.onCalendarChange"
      @panel-change="playgroundHandlers.onPanelChange"
      @clear="playgroundHandlers.onClear"
      @remove-tag="playgroundHandlers.onRemoveTag"
    />
    <DemoNote tone="dimmed">
      当前绑定值：<code class="break-all">{{ formatDisplay(value) }}</code>
    </DemoNote>
    <ul class="flex flex-col gap-1 font-mono text-xs">
      <li v-for="log in playgroundLogs" :key="log.id" class="text-gray-7 break-all">
        <span class="text-primary">{{ log.name }}</span>
        {{ log.detail }}
      </li>
      <li v-if="!playgroundLogs.length" class="text-gray-5">
        展开下拉、选择日期或清空，这里会按时间倒序列出触发的事件
      </li>
    </ul>
  </div>
</template>
