<script setup lang="ts">
/**
 * 总览卡片缩略：带标题的单列边框描述列表，标签格有底色
 *
 * 选边框形态而非无边框：标签格的灰底让「字段名 / 字段值」两栏一眼可辨；
 * 默认 24px 标题与 16px 单元格内边距放不进卡片，这里通过 ui 缩小字号与内边距。
 */
import type { DescriptionsItem } from '~/components/reborn/ui/reborn-descriptions/RebornDescriptions.vue'
import RebornDescriptions from '~/components/reborn/ui/reborn-descriptions/RebornDescriptions.vue'

const items: DescriptionsItem[] = [
  { label: '姓名', value: '张三' },
  { label: '手机号', value: '138 0000 1234' },
  { label: '所在城市', value: '浙江杭州' },
]

const ui = {
  header: 'mb-2',
  title: 'text-base',
  cell: 'h-7 px-2 py-1',
  label: 'text-sm',
  content: 'text-sm',
}
</script>

<template>
  <div class="w-[200px]">
    <RebornDescriptions
      title="用户信息"
      bordered
      size="sm"
      :column="1"
      :items="items"
      :ui="ui"
    />
  </div>
</template>
