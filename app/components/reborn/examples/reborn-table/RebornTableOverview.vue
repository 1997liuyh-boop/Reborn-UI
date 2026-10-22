<script setup lang="ts">
/**
 * 总览卡片缩略：带边框与表头底色的 3 列 × 3 行报销明细表
 *
 * 默认 md 档行高 48px、单元格左右 16px 内边距、未设宽度的列按 120px 计，放进卡片会横向溢出；
 * 这里给三列定宽合计 200px，用 sm 档并通过 ui 再压低行高、内边距与字号，金额列保持右对齐。
 */
import type { TableColumn, TableRow } from '~/components/reborn/ui/reborn-table/table.types'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'

const rows: TableRow[] = [
  { id: 101, name: '林晓', department: '研发', amount: 1280 },
  { id: 102, name: '陈晨', department: '设计', amount: 960 },
  { id: 103, name: '周宁', department: '运营', amount: 1680 },
]

const columns: TableColumn[] = [
  { prop: 'name', label: '姓名', width: 64 },
  { prop: 'department', label: '部门', width: 64 },
  { prop: 'amount', label: '金额', width: 72, align: 'right' },
]

/** 行高 28px、左右 8px 内边距、12px 字号 */
const ui = {
  table: 'text-xs',
  headerCell: 'h-7 px-2 text-xs',
  cell: 'h-7 px-2 text-xs',
  cellContent: 'py-0.5',
}
</script>

<template>
  <div class="w-[200px]">
    <RebornTable
      :data="rows"
      :columns="columns"
      row-key="id"
      size="sm"
      border
      header-background
      :hover="false"
      :ui="ui"
      aria-label="报销明细"
    />
  </div>
</template>
