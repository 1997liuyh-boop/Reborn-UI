<script setup lang="ts">
/**
 * 「事件」章节的卡片内容：两个选择器、实例调用按钮与事件日志。
 * 章节标题、描述与说明留在 RebornDatePickerDemo.vue，文档站按那个文件抽取章节。
 */
import { DemoBlock, DemoItem } from "#components";
import { shallowRef, useTemplateRef } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornDatePicker from "~/components/reborn/ui/reborn-date-picker/RebornDatePicker.vue";
import { createHandlers, useEventLog } from "../_shared/date-demo-utils";

/** 范围选择的值 */
const eventRangeValue = shallowRef<string[]>([]);

/** 多选的值 */
const eventMultiValue = shallowRef<string[]>(["2024-04-01", "2024-04-03"]);

/** 用于演示通过实例调用 clear() */
const eventPicker = useTemplateRef<InstanceType<typeof RebornDatePicker>>("eventPicker");

/** 「事件」分组的日志保留最近 8 条 */
const { logs: eventLogs, push: pushLog, clear: clearLogs } = useEventLog(8);

/** 「事件」分组的事件监听 */
const eventHandlers = createHandlers(pushLog);
</script>

<template>
  <DemoBlock layout="grid" :columns="2" align="start">
    <DemoItem label="范围选择">
      <RebornDatePicker
        ref="eventPicker"
        v-model="eventRangeValue"
        type="daterange"
        value-format="YYYY-MM-DD"
        class="w-full"
        @change="eventHandlers.onChange"
        @visible-change="eventHandlers.onVisibleChange"
        @calendar-change="eventHandlers.onCalendarChange"
        @panel-change="eventHandlers.onPanelChange"
        @clear="eventHandlers.onClear"
      />
    </DemoItem>
    <DemoItem label="多选">
      <RebornDatePicker
        v-model="eventMultiValue"
        type="dates"
        value-format="YYYY-MM-DD"
        class="w-full"
        @change="eventHandlers.onChange"
        @visible-change="eventHandlers.onVisibleChange"
        @panel-change="eventHandlers.onPanelChange"
        @clear="eventHandlers.onClear"
        @remove-tag="eventHandlers.onRemoveTag"
      />
    </DemoItem>
  </DemoBlock>
  <div class="flex gap-2">
    <RebornButton size="sm" variant="outlined" @click="eventPicker?.clear()">调用 clear()</RebornButton>
    <RebornButton size="sm" variant="soft" color="neutral" @click="clearLogs">清空日志</RebornButton>
  </div>
  <ul class="flex flex-col gap-1 font-mono text-xs">
    <li v-for="log in eventLogs" :key="log.id" class="text-gray-7 break-all">
      <span class="text-primary">{{ log.name }}</span>
      {{ log.detail }}
    </li>
    <li v-if="!eventLogs.length" class="text-gray-5">操作上面两个选择器，事件会按时间倒序出现在这里</li>
  </ul>
</template>
