<script setup lang="ts">
import { Motion, MotionConfig } from "motion-v";
import { computed } from "vue";

interface CalendarEvent {
  title: string;
  day: string;
  time: string;
}

interface CalendarDay {
  month: string;
  date: number;
  day: string;
  events?: CalendarEvent[];
}

interface Props {
  calendarData: CalendarDay[];
  initialIndex?: number;
}

const props = defineProps<Props>();

/** 当前选中的日期下标，支持 v-model:active-index；不绑定时以 initialIndex 为初值 */
const activeModel = defineModel<number>("activeIndex", { default: undefined });

/** 实际生效的下标：夹在 calendarData 范围内，数据变短后不会越界 */
const activeIndex = computed(() =>
  Math.min(
    Math.max(activeModel.value ?? props.initialIndex ?? 0, 0),
    Math.max(props.calendarData.length - 1, 0),
  ),
);
const activeDay = computed<CalendarDay | undefined>(() => props.calendarData[activeIndex.value]);

function setActive(index: number) {
  activeModel.value = index;
}
</script>

<template>
  <MotionConfig :transition="{ duration: 0.7, type: 'spring', bounce: 0.5 }">
    <Motion
      layout
      as="div"
      class="bg-muted/50 flex w-full max-w-lg flex-col gap-6 overflow-hidden rounded-3xl border p-8"
      :animate="{
        height: activeDay?.events ? 'auto' : 'fit',
      }"
    >
      <TextMorph
        :text="activeDay?.day ?? ''"
        class="w-fit font-bold"
        :morph-time="0.5"
        :cool-down-time="0.1"
      />

      <!-- 以选中下标为 key：只有切换日期时才重挂事件区并播放入场，父组件重渲染不会触发 -->
      <Motion
        v-if="activeDay?.events"
        :key="activeIndex"
        layout
        as="div"
        class="flex flex-col gap-4"
        :initial="{ x: 10, opacity: 0 }"
        :animate="{ x: 0, opacity: 1 }"
      >
        <Motion
          as="div"
          class="flex items-center gap-2"
          layout
          :initial="{ x: 10, opacity: 0 }"
          :animate="{ x: 0, opacity: 1 }"
        >
          <Icon name="lucide:calendar" />
          <span class="font-medium">Upcoming Events</span>
        </Motion>

        <div class="flex flex-wrap gap-4">
          <Motion
            v-for="(event, eventIndex) in activeDay.events"
            :key="`${event.title}-${event.time}-${eventIndex}`"
            as="div"
            layout
            class="w-full max-w-44 rounded-lg border p-3"
            :initial="{ x: 10, opacity: 0 }"
            :animate="{ x: 0, opacity: 1 }"
          >
            <p class="text-sm font-medium">{{ event.title }}</p>
            <p class="text-muted-foreground text-sm">{{ event.day }}, {{ event.time }}</p>
          </Motion>
        </div>
      </Motion>

      <div class="flex flex-wrap gap-3">
        <Motion
          v-for="(day, index) in calendarData"
          :key="`${day.date}-${index}`"
          as="button"
          layout
          class="border-border hover:bg-muted-foreground/10 flex flex-col rounded-2xl border p-3 text-center opacity-100 duration-200"
          :class="activeIndex === index ? 'bg-muted-foreground/5' : ''"
          :while-hover="{ scale: 1.1 }"
          :while-press="{ scale: 0.8 }"
          :transition="{ duration: 0.01 }"
          @click="setActive(index)"
        >
          <span class="text-sm font-medium uppercase">{{ day.month }}</span>
          <span class="font-semibold">{{ day.date }}</span>
          <span class="text-primary text-sm font-medium uppercase duration-200">
            {{ day.day }}
          </span>
        </Motion>
      </div>
    </Motion>
  </MotionConfig>
</template>
