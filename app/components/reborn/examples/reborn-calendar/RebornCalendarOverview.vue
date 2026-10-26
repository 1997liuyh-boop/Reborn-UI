<script setup lang="ts">
/**
 * 总览卡片缩略：默认外观（无外框）的月视图后三周，今天描边，四天带事项
 *
 * 真实日历每格有 65px 高的事项区，整月高约 600px，缩放到卡片里文字就看不清了；
 * 因此不挂载完整组件，改用它的主题样式静态拼出 10 月后三周。
 * 外观对齐组件默认态：行与行之间只有顶边分隔线、日期靠右、有事项的格子带浅底与色顶边；
 * 每条事项保留组件的彩色圆点，标题文字在这个尺寸下读不出来，换成一截灰条示意。
 */
import type { CalendarColor } from "~/components/reborn/ui/reborn-calendar/reborn-calendar.config";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { calendarDotTheme, calendarTheme } from "~/components/reborn/ui/reborn-calendar/reborn-calendar.config";
import { CALENDAR_WEEK_DAYS } from "~/components/reborn/ui/reborn-calendar/reborn-calendar.utils";
import { cn } from "~/lib/utils";

interface OverviewCell {
  /** 日期数字 */
  day: number
  /** 当天事项的圆点颜色，空数组表示无事项 */
  events: CalendarColor[]
}

const theme = calendarTheme({ color: 'primary', view: 'month', titleAlign: 'right', border: false })

/** 有事项的日期与各条事项的颜色；每格最多两条，再多格子里放不下 */
const EVENTS: Record<number, CalendarColor[]> = {
  13: ['primary'],
  16: ['success', 'warning'],
  22: ['info'],
  27: ['error'],
}
const TODAY = 21

/** 2026 年 10 月的后三周，与组件一样从周日排起 */
const weeks: OverviewCell[][] = [11, 18, 25].map(start =>
  Array.from({ length: 7 }, (_, i) => ({ day: start + i, events: EVENTS[start + i] ?? [] })),
)
</script>

<template>
  <!-- 宽 208px：缩略预览右上角有 32px 的 New 图标（距边 12px），再宽「今天」按钮就会压到图标上 -->
  <div :class="cn(theme.root(), 'w-[208px]')">
    <div :class="cn(theme.header(), 'flex-nowrap')">
      <span :class="cn(theme.title(), 'px-0 text-sm')">2026 年 10 月</span>
      <RebornButton
        size="sm"
        color="neutral"
        variant="outlined"
        class="h-6 px-2 text-xs"
      >
        今天
      </RebornButton>
    </div>

    <div :class="cn(theme.body(), 'mt-2')">
      <div :class="cn(theme.row(), 'gap-x-1')">
        <div
          v-for="weekday in CALENDAR_WEEK_DAYS"
          :key="weekday"
          :class="cn(theme.weekday(), 'h-4 px-0.5 text-[11px]')"
        >
          {{ weekday }}
        </div>
      </div>
      <div
        v-for="(week, weekIndex) in weeks"
        :key="week[0]?.day ?? weekIndex"
        :class="cn(theme.row(), 'gap-x-1')"
      >
        <div
          v-for="cell in week"
          :key="cell.day"
          :class="theme.cell({ hasEvents: cell.events.length > 0, class: 'h-8 cursor-default p-0.5' })"
        >
          <div :class="cn(theme.cellHeader(), 'h-4')">
            <span
              :class="theme.date({
                hasEvents: cell.events.length > 0,
                inMonth: true,
                today: cell.day === TODAY,
                selected: false,
                class: 'h-4 min-w-4 px-0.5 text-[11px]',
              })"
            >{{ cell.day }}</span>
          </div>
          <!-- 事项：圆点取组件同款，标题换成灰条 -->
          <div
            v-for="(color, i) in cell.events"
            :key="i"
            :class="cn(theme.event(), 'mt-px gap-0.5')"
          >
            <span :class="theme.eventDot({ class: calendarDotTheme({ color }) })" />
            <span class="h-1 flex-1 rounded-full bg-gray-3" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
