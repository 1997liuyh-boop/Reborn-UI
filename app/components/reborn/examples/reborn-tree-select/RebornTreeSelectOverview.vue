<script setup lang="ts">
/**
 * 总览卡片缩略：已选「前端开发」的触发框，下方是展开一级、高亮选中节点的下拉树
 *
 * 真实下拉层传送到 body 且只能点击展开，缩略图在触发框下方单独挂一棵同数据的 RebornTree，
 * 套上下拉浮层的外框模拟「已展开」；关闭虚拟滚动、只放三行节点，保证高度落在卡片内。
 */
import type { TreeSelectValue } from '~/components/reborn/ui/reborn-tree-select/reborn-tree-select.config'
import type { TreeDataNode } from '~/components/reborn/ui/reborn-tree/reborn-tree.config'
import { shallowRef } from "vue";

import RebornTreeSelect from '~/components/reborn/ui/reborn-tree-select/RebornTreeSelect.vue'
import RebornTree from '~/components/reborn/ui/reborn-tree/RebornTree.vue'

const team = shallowRef<TreeSelectValue>('web')

const treeData: TreeDataNode[] = [
  {
    key: 'product',
    title: '产品研发',
    children: [
      { key: 'design', title: '设计系统' },
      { key: 'web', title: '前端开发' },
    ],
  },
]

const expandedKeys = ['product']
const selectedKeys = ['web']
</script>

<template>
  <div class="flex w-[184px] flex-col gap-1">
    <RebornTreeSelect
      v-model="team"
      :tree-data="treeData"
      :default-expanded-keys="expandedKeys"
      size="sm"
    />
    <div class="w-full rounded-lg border border-gray-3 bg-gray-1 px-[4px] py-[6px] shadow-lg">
      <RebornTree
        :tree-data="treeData"
        :default-expanded-keys="expandedKeys"
        :selected-keys="selectedKeys"
        :virtual="false"
        block-node
      />
    </div>
  </div>
</template>
