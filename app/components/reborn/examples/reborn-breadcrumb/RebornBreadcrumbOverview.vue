<script setup lang="ts">
/**
 * 总览卡片缩略：默认分隔符与图标分隔符两种形态
 */
import RebornBreadcrumb from '~/components/reborn/ui/reborn-breadcrumb/RebornBreadcrumb.vue'
import RebornBreadcrumbItem from '~/components/reborn/ui/reborn-breadcrumb/RebornBreadcrumbItem.vue'
</script>

<template>
  <div class="flex w-full max-w-[210px] flex-col items-center gap-4 text-sm">
    <RebornBreadcrumb>
      <RebornBreadcrumbItem to="/">
        首页
      </RebornBreadcrumbItem>
      <RebornBreadcrumbItem to="/components">
        组件
      </RebornBreadcrumbItem>
      <RebornBreadcrumbItem>面包屑</RebornBreadcrumbItem>
    </RebornBreadcrumb>

    <RebornBreadcrumb separator-icon="lucide:chevron-right">
      <RebornBreadcrumbItem to="/">
        首页
      </RebornBreadcrumbItem>
      <RebornBreadcrumbItem to="/components">
        导航
      </RebornBreadcrumbItem>
      <RebornBreadcrumbItem>当前页</RebornBreadcrumbItem>
    </RebornBreadcrumb>
  </div>
</template>
