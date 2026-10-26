<script setup lang="ts">
/**
 * 「事件」章节的卡片内容：面板、实例调用按钮与事件日志。
 * 章节标题与说明留在 RebornDatePickerPanelDemo.vue，文档站按那个文件抽取章节。
 */
import type { datePickerPanelColors, datePickerPanelSizes, ViewType } from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import { DemoBlock, DemoNote } from "#components";
import { shallowRef, useTemplateRef } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornDatePickerPanel from "~/components/reborn/ui/reborn-date-picker-panel/RebornDatePickerPanel.vue";
import { formatPanelDisplay, useEventLog } from "../_shared/date-demo-utils";

interface Props {
  /** 跟随演练场的配色 */
  color: (typeof datePickerPanelColors)[number];
  /** 跟随演练场的尺寸 */
  size: (typeof datePickerPanelSizes)[number];
}
const { color, size } = defineProps<Props>();

/** 用于演示通过实例调用 clear() */
const eventPanel = useTemplateRef<InstanceType<typeof RebornDatePickerPanel>>("eventPanel");

/** 范围选择的值 */
const eventValue = shallowRef(["2024-04-08", "2024-04-12"]);

/** 「事件」分组的日志保留最近 8 条 */
const { logs: eventLogs, push: pushLog, clear: clearLogs } = useEventLog(8);

/** 范围类型点选日期，第一次点选时终点为 null */
function onCalendarChange(value: [Date, Date | null]) {
  pushLog("calendar-change", `[${formatPanelDisplay(value[0])}, ${value[1] ? formatPanelDisplay(value[1]) : "null"}]`);
}

/** 面板翻页或切换视图 */
function onPanelChange(date: Date | [Date, Date], mode: "month" | "year", view: ViewType) {
  pushLog("panel-change", `${formatPanelDisplay(date)}, "${mode}", "${view}"`);
}

/** 绑定值提交 */
function onChange(value: unknown) {
  pushLog("change", formatPanelDisplay(value));
}

/** 调用 clear() 后触发 */
function onClear() {
  pushLog("clear", "()");
}
</script>

<template>
  <DemoBlock layout="stack">
    <div class="flex min-w-0 flex-col gap-3">
      <RebornDatePickerPanel
        ref="eventPanel"
        v-model="eventValue"
        type="daterange"
        value-format="YYYY-MM-DD"
        :color="color"
        :size="size"
        border
        @calendar-change="onCalendarChange"
        @panel-change="onPanelChange"
        @change="onChange"
        @clear="onClear"
      />
      <div class="flex flex-wrap items-center gap-2">
        <RebornButton size="sm" variant="outlined" @click="eventPanel?.clear()">调用 clear()</RebornButton>
        <RebornButton size="sm" variant="soft" color="neutral" @click="clearLogs">清空日志</RebornButton>
      </div>
      <DemoNote tone="dimmed">
        绑定值：<code>{{ formatPanelDisplay(eventValue) }}</code>
      </DemoNote>
      <ul class="flex flex-col gap-1 font-mono text-xs">
        <li v-for="log in eventLogs" :key="log.id" class="text-gray-7 break-all">
          <span class="text-primary">{{ log.name }}</span>
          {{ log.detail }}
        </li>
        <li v-if="!eventLogs.length" class="text-gray-5">点选日期、翻页或切换视图后，事件与参数会记录在这里。</li>
      </ul>
    </div>
  </DemoBlock>
</template>
