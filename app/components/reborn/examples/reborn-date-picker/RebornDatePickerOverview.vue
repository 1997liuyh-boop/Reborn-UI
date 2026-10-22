<script setup lang="ts">
/**
 * 总览卡片缩略：已选 2026-10-09 的触发框，下方露出日期下拉面板的上半截
 *
 * 真实下拉面板传送到 body 且只能点击展开，缩略图在触发框下方单独挂一个同值的日期面板，
 * 套上下拉浮层的外框模拟「已展开」；整月六行放不下，用 ui 只留前三行并在底部渐隐，示意面板还在延续。
 */
import { ref } from 'vue'
import RebornDatePickerPanel from '~/components/reborn/ui/reborn-date-picker-panel/RebornDatePickerPanel.vue'
import RebornDatePicker from '~/components/reborn/ui/reborn-date-picker/RebornDatePicker.vue'

const date = ref('2026-10-09')

/** 收紧留白，并隐藏第 22 格起的日期（只保留前三行） */
const panelUi = {
  header: 'px-3 pt-2 pb-1',
  weekdays: 'px-3 pt-0 pb-0',
  days: 'min-w-0 gap-y-0 px-3 pb-2 [&>*:nth-child(n+22)]:hidden',
}
</script>

<template>
  <div class="flex w-[200px] flex-col gap-1">
    <RebornDatePicker
      v-model="date"
      value-format="YYYY-MM-DD"
      size="sm"
      class="w-full"
    />
    <div class="w-full overflow-hidden rounded-lg border border-gray-3 bg-gray-1 shadow-lg [mask-image:linear-gradient(to_bottom,#000_72%,transparent)]">
      <div class="h-[86px]">
        <RebornDatePickerPanel
          v-model="date"
          value-format="YYYY-MM-DD"
          size="sm"
          class="w-[306px] origin-top-left scale-[0.65]"
          :ui="panelUi"
        />
      </div>
    </div>
  </div>
</template>
