<script setup lang="ts">
import type { ClassValue } from 'clsx';
import type theme from './reborn-date-picker-panel.config';
import type { CalDay, DatePickerCell } from './reborn-date-picker-panel.config';

interface GridDay extends CalDay { active?: boolean; rangeBand?: boolean }

interface Props { rows: GridDay[][]; showWeek: boolean; highlightToday?: boolean; ui: Record<keyof typeof theme.slots, (options?: { class?: ClassValue }) => string> }

defineProps<Props>();

const emit = defineEmits<{ select: [day: GridDay]; hover: [date: Date | null] }>();

defineSlots<{ default?: (cell: DatePickerCell) => any }>();
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
function isoWeek(row: CalDay[]): number {
  const monday = (row[1] ?? row[0])?.date;
  if (!monday) return 0;
  const d = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function cellDay(day: GridDay): DatePickerCell {
  return { type: 'date', text: day.day, date: new Date(day.date), disabled: day.isDisabled,
    selected: !!day.active, inRange: !!day.rangeBand, isToday: day.isToday, outside: !day.isCurrentMonth };
}
</script>
<template>
  <div :class="ui.weekdays()">
    <!-- 周数列表头：与下方每行开头的周数对齐 -->
    <span v-if="showWeek" :class="ui.weekNumberHeader()">周</span>
    <span v-for="w in weekdays" :key="w" :class="ui.weekday()">{{ w }}</span>
  </div>

  <div :class="ui.days()" @mouseleave="emit('hover', null)">
    <div v-for="(row, ri) in rows" :key="ri" :class="ui.weekRow({ class: row.every(day => day.isDisabled) ? ui.dayDisabled() : undefined })" @mouseleave="emit('hover', null)">
      <!-- 周数：按 ISO 8601 计算，以该行的周一为准 -->
      <span v-if="showWeek" :class="ui.weekNumber()">{{ isoWeek(row) }}</span>
      <div
        v-for="(day, di) in row"
        :key="di"
        :class="
          ui.dayCell({
            class: [
              // 带子的取舍见 showRangeBand：起止同一天与双面板补位格都不画
              !day.isDisabled && day.rangeBand ? ui.dayInRange() : '',
              !day.isDisabled && day.rangeBand && day.isRangeStart ? ui.dayRangeStart() : '',
              !day.isDisabled && day.rangeBand && day.isRangeEnd ? ui.dayRangeEnd() : '',
              // 禁用带默认透明，保留样式键供用户显式覆盖。
              day.isDisabledBand && !day.rangeBand ? ui.dayDisabledBand() : '',
            ],
          })
        "
      >
        <div
          :class="
            ui.day({
              class: [
                // 补位格不上选中态：真实日期在另一侧面板渲染
                // 不可选日期仅保留禁用文字色，不显示选中或范围底色。
                day.isDisabled ? ui.dayDisabled() : '',
                !day.isDisabled && day.active ? ui.dayActive() : '',
                // 补位格淡色文字：未禁用、且没有以选中态显示时才上（双面板补位格不显示选中态）
                !day.isCurrentMonth && !day.isDisabled && !day.active ? ui.dayOutside() : '',
                highlightToday && day.isToday && !day.isDisabled && !day.isSelected ? ui.dayToday() : '',
                !day.isDisabled && day.rangeBand && !day.isSelected ? ui.dayInRange() : '',
              ],
            })
          "
          @click.stop="emit('select', day)"
          @mouseenter="emit('hover', day.isDisabled ? null : day.date)"
        >
          <slot v-bind="cellDay(day)">
            {{ day.day }}
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>
