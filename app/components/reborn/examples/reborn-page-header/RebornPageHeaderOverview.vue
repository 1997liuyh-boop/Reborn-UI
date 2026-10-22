<script setup lang="ts">
/**
 * 总览卡片缩略：带面包屑的页头，返回箭头 + 标题 + 竖线分隔的补充说明，下方接内容区
 *
 * 设计稿的 24px 外边距与 20px 标题放不进卡片，这里通过 ui 收小间距与字号，结构保持不变。
 */
import RebornBreadcrumb from '~/components/reborn/ui/reborn-breadcrumb/RebornBreadcrumb.vue'
import RebornPageHeader from '~/components/reborn/ui/reborn-page-header/RebornPageHeader.vue'

/** 面包屑路径 */
const routes = [
  { label: '订单管理', path: '#' },
  { label: '订单详情' },
]
</script>

<template>
  <RebornPageHeader
    title="订单详情"
    content="待发货"
    class="w-[200px] rounded-lg bg-gray-1"
    :ui="{ root: 'gap-3 p-3', left: 'gap-2', back: 'gap-2', icon: 'size-4', title: 'text-base', divider: 'h-3.5', content: 'text-sm' }"
  >
    <template #breadcrumb>
      <RebornBreadcrumb :routes="routes" />
    </template>
    <template #icon>
      <Icon
        name="lucide:arrow-left"
        class="size-4"
      />
    </template>

    <!-- 内容区 -->
    <div class="flex flex-col gap-1.5">
      <div class="h-2 w-full rounded-sm bg-gray-2" />
      <div class="h-2 w-[70%] rounded-sm bg-gray-2" />
    </div>
  </RebornPageHeader>
</template>
