<script setup lang="ts">
/**
 * 总览卡片缩略：内置空箱子插画加「暂无数据」标题与一行描述
 *
 * 默认段间距 24px 会把三段撑到卡片外，这里收到 12px，描述改用小一号字。
 */
import RebornEmpty from '~/components/reborn/ui/reborn-empty/RebornEmpty.vue'

const ui = { root: 'gap-3', description: 'text-xs' }
</script>

<template>
  <RebornEmpty
    :image-size="56"
    title="暂无数据"
    description="换个筛选条件试试"
    :ui="ui"
  />
</template>
