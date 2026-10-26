<script setup lang="ts">
import { shallowRef } from "vue";
import RebornDatePickerPanel from "~/components/reborn/ui/reborn-date-picker-panel/RebornDatePickerPanel.vue";

/**
 * 总览卡片缩略：选中 10 月 16 日的单月日期面板
 *
 * 面板本身就是内嵌组件，直接挂载。sm 档完整一个月约 306×326px，放进卡片要缩到 0.4 倍以下、数字无法辨认；
 * 这里压缩行距与上下留白、把面板定宽 230px 后整体缩放，保留完整的六行日期网格；
 * 外层须 shrink-0，否则作为卡片 flex 容器的子项会先被压窄再缩放。
 */

const date = shallowRef("2026-10-16");

/** 收紧头部、星期行与日期行之间的留白，网格宽度不再保底 */
const ui = {
  header: "px-3 pt-2 pb-1",
  weekdays: "px-3 pt-0 pb-0",
  days: "min-w-0 gap-y-0 px-3 pb-2",
};
</script>

<template>
  <div class="w-[230px] shrink-0 scale-[0.57]">
    <RebornDatePickerPanel v-model="date" value-format="YYYY-MM-DD" size="sm" border :ui="ui" />
  </div>
</template>
