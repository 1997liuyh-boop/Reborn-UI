<script setup lang="ts">
/**
 * 总览卡片缩略：左侧三门可选科目、右侧两门已选科目，中间一列穿梭按钮
 *
 * 两个面板加操作列需约 312px 才不截断面板标题，整体缩小后放进卡片；
 * 头部只保留全选复选框（header-select="checkbox"），不渲染下拉菜单，避免面板头部挤压标题。
 */
import type { TransferDataRecord } from '~/components/reborn/ui/reborn-transfer/reborn-transfer.config'
import { ref } from 'vue'
import RebornTransfer from '~/components/reborn/ui/reborn-transfer/RebornTransfer.vue'

/** dataSource 的类型是宽松记录（支持 fieldNames 字段别名），不能直接用 TransferItem[] */
const dataSource: TransferDataRecord[] = [
  { key: 'math', label: '数学' },
  { key: 'physics', label: '物理' },
  { key: 'chemistry', label: '化学' },
  { key: 'chinese', label: '语文' },
  { key: 'english', label: '英语' },
]

const targetKeys = ref(['chinese', 'english'])
</script>

<template>
  <div class="w-[312px] shrink-0 scale-[0.64]">
    <RebornTransfer
      v-model="targetKeys"
      :data-source="dataSource"
      :titles="['可选科目', '已选科目']"
      header-select="checkbox"
    />
  </div>
</template>
