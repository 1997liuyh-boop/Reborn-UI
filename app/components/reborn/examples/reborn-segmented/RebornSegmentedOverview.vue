<script setup lang="ts">
/**
 * 总览卡片缩略：「列表 / 看板 / 日历」三段带图标的分段控制器，选中「看板」
 *
 * 选中中间一段，左右两侧都有未选项，滑块与底板的对比最清楚。
 * md 档带图标的三段宽约 216px，比 1280 宽屏下的卡片内容区略宽；不能用 transform 缩放
 * （滑块按 getBoundingClientRect 定位，缩放后会错位），改为用 ui 把选项左右内边距从 12px 收到 8px。
 */
import type { SegmentedOption, SegmentedValue } from '~/components/reborn/ui/reborn-segmented'
import { ref } from 'vue'
import RebornSegmented from '~/components/reborn/ui/reborn-segmented/RebornSegmented.vue'

const view = ref<SegmentedValue>('board')

const options: SegmentedOption[] = [
  { label: '列表', value: 'list', icon: 'lucide:list' },
  { label: '看板', value: 'board', icon: 'lucide:kanban' },
  { label: '日历', value: 'calendar', icon: 'lucide:calendar' },
]

const ui = { item: 'px-2' }
</script>

<template>
  <RebornSegmented
    v-model="view"
    :options="options"
    :ui="ui"
    aria-label="视图"
  />
</template>
