<script setup lang="ts">
import type { VNodeChild } from 'vue';
import type { TableCellScope, TableColumn } from './table.types';

defineOptions({ name: 'RebornTableColumn' });
defineProps<TableColumn>();
defineSlots<{
  /** 单元格内容，分组列在这里嵌套子列。 */
  default?: (scope: TableCellScope) => VNodeChild;
  /** 自定义列标题。 */
  header?: (scope: { column: TableColumn; $index: number }) => VNodeChild;
}>();
</script>

<template>
  <!-- 列由父表格在渲染上下文解析，本组件不单独产出表格节点。 -->
  <span v-if="false" />
</template>
