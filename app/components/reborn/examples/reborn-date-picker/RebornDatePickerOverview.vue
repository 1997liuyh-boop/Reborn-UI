<script setup lang="ts">
import { Icon } from "#components";
import { shallowRef } from "vue";
import RebornDatePickerPanel from "~/components/reborn/ui/reborn-date-picker-panel/RebornDatePickerPanel.vue";
import fieldTheme from "~/components/reborn/ui/reborn-field-trigger/reborn-field-trigger.config";
import { tv } from "~/lib/tv";

/**
 * 总览卡片缩略：已选 2026-10-09 的触发框，下方露出日期下拉面板的上半截
 *
 * 真实下拉面板传送到 body 且只能点击展开，缩略图在触发框下方单独挂一个同值的日期面板，
 * 套上下拉浮层的外框模拟「已展开」；整月六行放不下，用 ui 只留前三行并在底部渐隐，示意面板还在延续。
 */

/** 缩略图只复用触发框主题，不创建浮层、Teleport 或全局监听。 */
const styles = tv(fieldTheme)({ size: "sm", variant: "outlined", color: "primary" });

const date = shallowRef("2026-10-09");

/** 收紧留白，并隐藏第 22 格起的日期（只保留前三行） */
const panelUi = {
  header: "px-3 pt-2 pb-1",
  weekdays: "px-3 pt-0 pb-0",
  days: "min-w-0 gap-y-0 px-3 pb-2 [&>*:nth-child(n+22)]:hidden",
};
</script>

<template>
  <div class="flex w-[200px] flex-col gap-1">
    <div :class="styles.trigger()" aria-hidden="true">
      <span :class="styles.triggerText()">2026-10-09</span>
      <span :class="styles.triggerIconWrapper()"><Icon name="lucide:chevron-down" :class="styles.arrow()" /></span>
    </div>
    <div
      class="w-full overflow-hidden rounded-lg border border-gray-3 bg-gray-1 shadow-lg [mask-image:linear-gradient(to_bottom,#000_72%,transparent)]"
    >
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
