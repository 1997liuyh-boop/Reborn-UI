<script setup lang="ts">
/**
 * 总览卡片缩略：选中周四的弹性日历，上方是星期标题和当天的日程卡
 *
 * 不挂真组件：它整块是 motion-v 的 layout 动画，标题 TextMorph 还会在页面上插一个 fixed 定位的 SVG 滤镜，
 * 默认宽度也放不进卡片。这里用静态 DOM 还原同样的结构：粗体星期、日程卡、一排日期胶囊（第三枚为选中态）。
 */

/** 日期胶囊：沿用 Demo 的月份 / 日期 / 星期三段结构 */
interface DayChip {
  month: string;
  date: number;
  day: string;
}

const days: DayChip[] = [
  { month: "4月", date: 22, day: "周二" },
  { month: "4月", date: 23, day: "周三" },
  { month: "4月", date: 24, day: "周四" },
  { month: "4月", date: 25, day: "周五" },
];

/** 选中项下标，对应标题与日程卡 */
const activeIndex = 2;
</script>

<template>
  <div class="bg-muted/50 border-default flex w-50 flex-col gap-1.5 overflow-hidden rounded-2xl border p-2.5">
    <span class="text-highlighted text-base leading-none font-bold">
      {{ days[activeIndex]?.day ?? '' }}
    </span>

    <div class="border-default rounded-lg border px-2 py-1 leading-tight">
      <p class="text-highlighted text-xs font-medium">
        团队例会
      </p>
      <p class="text-muted text-[10px]">
        今天，14:00
      </p>
    </div>

    <div class="flex gap-1.5">
      <div
        v-for="(item, index) in days"
        :key="item.date"
        class="border-default flex flex-1 flex-col items-center rounded-xl border py-0.5 text-center leading-[1.15]"
        :class="index === activeIndex ? 'bg-elevated' : ''"
      >
        <span class="text-muted text-[9px] font-medium">{{ item.month }}</span>
        <span class="text-highlighted text-xs font-semibold">{{ item.date }}</span>
        <span class="text-primary text-[9px] font-medium">{{ item.day }}</span>
      </div>
    </div>
  </div>
</template>
