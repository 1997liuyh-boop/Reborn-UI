<script setup lang="ts">
/**
 * 总览卡片缩略：展开一级的目录树
 *
 * 只展开第一个节点，保证总高度落在卡片可视区内。
 */
import type { TreeDataNode } from '~/components/reborn/ui/reborn-tree/reborn-tree.config'
import RebornTree from '~/components/reborn/ui/reborn-tree/RebornTree.vue'

const treeData: TreeDataNode[] = [
  {
    key: 'src',
    title: 'src',
    children: [
      { key: 'components', title: 'components' },
      { key: 'pages', title: 'pages' },
    ],
  },
  { key: 'public', title: 'public' },
]

const expandedKeys = ['src']
</script>

<template>
  <div class="w-[180px]">
    <RebornTree
      :tree-data="treeData"
      :default-expanded-keys="expandedKeys"
    />
  </div>
</template>
