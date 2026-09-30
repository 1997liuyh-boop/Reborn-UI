<script setup lang="ts">
/**
 * 总览卡片缩略：纵向锚点目录，首项处于选中态
 *
 * 选中态由滚动位置算出，所以放一个看不见的小滚动容器当 container：
 * 首个区块顶在容器顶部、内容又高于容器，组件据此点亮第一项。
 */
import type { AnchorItem } from '~/components/reborn/ui/reborn-anchor/reborn-anchor.config'
import RebornAnchor from '~/components/reborn/ui/reborn-anchor/RebornAnchor.vue'

const items: AnchorItem[] = [
  { key: 'intro', href: '#overview-anchor-intro', title: '简介' },
  { key: 'usage', href: '#overview-anchor-usage', title: '用法' },
  { key: 'api', href: '#overview-anchor-api', title: 'API' },
]
</script>

<template>
  <div class="relative">
    <RebornAnchor
      :items="items"
      container="#overview-anchor-box"
      class="w-28"
    />
    <div
      id="overview-anchor-box"
      class="pointer-events-none absolute top-0 left-0 h-10 w-px overflow-y-auto opacity-0"
      aria-hidden="true"
    >
      <div
        v-for="item in items"
        :id="item.href?.slice(1)"
        :key="item.key"
        class="h-20"
      />
    </div>
  </div>
</template>
