<script setup lang="ts">
/**
 * 总览卡片缩略：默认分隔符的三级面包屑
 */
import RebornBreadcrumb from '~/components/reborn/ui/reborn-breadcrumb/RebornBreadcrumb.vue'
import RebornBreadcrumbItem from '~/components/reborn/ui/reborn-breadcrumb/RebornBreadcrumbItem.vue'
</script>

<template>
  <div class="flex w-full max-w-[210px] justify-center text-sm">
    <RebornBreadcrumb>
      <RebornBreadcrumbItem to="/">
        首页
      </RebornBreadcrumbItem>
      <RebornBreadcrumbItem to="/components">
        组件
      </RebornBreadcrumbItem>
      <RebornBreadcrumbItem>面包屑</RebornBreadcrumbItem>
    </RebornBreadcrumb>
  </div>
</template>
