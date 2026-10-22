<script setup lang="ts">
import type { CalendarEvent, CalendarMode } from "~/components/reborn/ui/reborn-calendar";
import type { RebornContextMenuItem } from "~/components/reborn/ui/reborn-context-menu/RebornContextMenu.vue";
import { computed, ref, useId } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { formatDay } from "~/components/reborn/ui/reborn-calendar/reborn-calendar.utils";
import RebornCalendar from "~/components/reborn/ui/reborn-calendar/RebornCalendar.vue";
import RebornContextMenu from "~/components/reborn/ui/reborn-context-menu/RebornContextMenu.vue";
import RebornDialog from "~/components/reborn/ui/reborn-dialog/RebornDialog.vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";

interface DemoEvent extends CalendarEvent {
  /** 稳定标识用于删除单条事项，同名事项也能分别保留。 */
  id: number;
  date: string;
}

/** 事项由示例维护；日期使用字符串，避免序列化时因时区偏移一天。 */
const today = formatDay(new Date());
const selectedDay = ref(today);
const mode = ref<CalendarMode>("month");
const events = ref<DemoEvent[]>([
  { id: 1, date: today, title: "团队例会" },
  { id: 2, date: today, title: "整理本周计划", color: "success" },
]);
let nextId = 3;
const activeDay = ref(today);
const action = ref<"add" | "delete">("add");
const dialogOpen = ref(false);
const draft = ref("");
const lastAction = ref("右键日期可添加或删除事项；切换到年视图可按月查看。");
const inputId = useId();
const activeEvents = computed(() => events.value.filter(event => event.date === activeDay.value));
const dateLabel = computed(() => {
  const [year, month, day] = activeDay.value.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
});
const dialogTitle = computed(() => `${dateLabel.value}事项${action.value === "add" ? "添加" : "删除"}`);

/** 右键操作只管理目标日期，不因补位格的选择行为切换月份。 */
function openDialog(day: string, operation: "add" | "delete") {
  activeDay.value = day;
  action.value = operation;
  draft.value = "";
  dialogOpen.value = true;
}

/** 每格使用自己的日期及事项数量，删除菜单在当天无事项时禁用。 */
function dateMenu(day: string, count: number): RebornContextMenuItem[] {
  return [
    { label: "添加事项", icon: "lucide:plus", onSelect: () => openDialog(day, "add") },
    { label: "删除事项", icon: "lucide:trash-2", color: "error", disabled: count === 0, onSelect: () => openDialog(day, "delete") },
  ];
}

/** 添加后保留弹窗并清空输入，便于为同一天连续添加多条。 */
function addEvent() {
  const title = draft.value.trim();
  if (!title)
    return;
  events.value.push({ id: nextId++, date: activeDay.value, title });
  draft.value = "";
  lastAction.value = `已为 ${activeDay.value} 添加：${title}`;
}

/** 输入法确认候选词时不提交，普通回车与添加按钮行为一致。 */
function onInputKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && !event.isComposing) {
    event.preventDefault();
    addEvent();
  }
}

/** 按稳定标识删除单条，不影响当天或其他日期的其余事项。 */
function deleteEvent(event: DemoEvent) {
  events.value = events.value.filter(item => item.id !== event.id);
  lastAction.value = `已删除 ${event.date} 的事项：${event.title}`;
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <RebornCalendar v-model="selectedDay" v-model:mode="mode" :events="events" value-format="YYYY-MM-DD" title-align="left" border>
      <template #date-cell="{ data, events: dayEvents }">
        <RebornContextMenu :items="dateMenu(data.day, dayEvents.length)" :ui="{ wrapper: 'h-full w-full', trigger: 'h-full w-full' }">
          <div :data-event-day="data.day" class="flex min-h-24 flex-col gap-1">
            <button type="button" :aria-label="data.day" class="flex size-6 items-center justify-center rounded-full text-base tabular-nums" :class="data.isSelected ? 'bg-primary text-gray-1' : data.type === 'current-month' ? 'text-gray-9' : 'text-gray-5'">
              {{ data.date.getDate() }}
            </button>
            <ul class="flex h-16 flex-col overflow-y-auto overscroll-contain [scrollbar-width:thin]">
              <li v-for="event in dayEvents" :key="event.id" :title="event.title" class="shrink-0 truncate text-base text-gray-8">
                {{ event.title }}
              </li>
            </ul>
          </div>
        </RebornContextMenu>
      </template>
    </RebornCalendar>
    <p role="status" class="text-sm text-gray-7">{{ lastAction }}</p>

    <RebornDialog v-model="dialogOpen" :title="dialogTitle" :width="420" align-center :confirm-btn="false" :cancel-btn="false" destroy-on-close>
      <div class="flex flex-col gap-4">
        <div v-if="action === 'add'" class="flex flex-col gap-2 py-4">
          <label :for="inputId" class="text-base text-gray-8">事项内容</label>
          <RebornInput :id="inputId" v-model="draft" placeholder="请输入事项内容" autofocus @keydown="onInputKeydown" />
        </div>
        <ul v-if="activeEvents.length" class="flex max-h-64 flex-col gap-2 overflow-y-auto">
          <li v-for="event in activeEvents" :key="event.id" class="flex min-w-0 items-center gap-2">
            <span class="min-w-0 flex-1 break-words text-base text-gray-8">{{ event.title }}</span>
            <RebornButton v-if="action === 'delete'" size="sm" color="error" variant="text" :aria-label="`删除${event.title}`" @click="deleteEvent(event)">删除</RebornButton>
          </li>
        </ul>
        <p v-else class="text-sm text-gray-6">当天暂无事项</p>
      </div>
      <template #footer>
        <RebornButton size="sm" color="neutral" variant="outlined" @click="dialogOpen = false">关闭</RebornButton>
        <RebornButton v-if="action === 'add'" size="sm" color="primary" variant="filled" :disabled="!draft.trim()" @click="addEvent">添加</RebornButton>
      </template>
    </RebornDialog>
  </div>
</template>
