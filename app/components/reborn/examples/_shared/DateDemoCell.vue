<script setup lang="ts">
import type { DatePickerCell } from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import { computed } from "vue";
import { holidayMark } from "./date-demo-utils";

/** 节假日格子：日期选择器的 cell 插槽与日期面板的默认插槽共用，作用域参数原样传入 */
interface Props {
  type: DatePickerCell["type"];
  text: number;
  date: Date;
  selected: boolean;
}
const props = defineProps<Props>();
/** 每个格子只查询一次节假日安排，选中时沿用面板文字色。 */
const mark = computed(() => holidayMark(props.date));
const markClass = computed(() => (props.selected ? "" : mark.value === "休" ? "text-success" : "text-error"));
</script>

<template>
  <div v-if="type === 'date'" class="flex flex-col items-center leading-none">
    <span>{{ text }}</span>
    <span v-if="mark" class="text-[10px]" :class="markClass">{{ mark }}</span>
  </div>
  <template v-else-if="type === 'month'">{{ text }}月</template>
  <template v-else-if="type === 'quarter'">第{{ text }}季度</template>
  <template v-else>{{ text }}</template>
</template>
