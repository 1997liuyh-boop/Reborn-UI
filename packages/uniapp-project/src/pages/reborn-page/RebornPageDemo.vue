<script setup lang="ts">
// RebornPage 演示页：页面根容器，提供标题、描述与内容区布局
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
</script>

<template>
  <!-- 页面最外层根容器：title/description 渲染默认头部，页面内容放默认插槽 -->
  <RebornPage title="Page 页面容器" description="统一的页面根容器：标题 + 描述 + 内容区，并内置 Toast 挂载点。">
    <RebornCard title="页面结构">
      <view
        class="
          text-[26rpx] text-slate-600
          dark:text-slate-300
        "
      >
        header 区域渲染 title 与 description，body 区域承载页面内容，子元素间距由容器统一管理。
      </view>
    </RebornCard>

    <RebornCard title="样式定制">
      <view
        class="
          text-[26rpx] text-slate-600
          dark:text-slate-300
        "
      >
        通过 ui 属性可按 root / header / title / description / body 分区覆盖样式；customClass 用于给根容器追加类名；需要完全自定义头部时使用 header 插槽。
      </view>
    </RebornCard>
  </RebornPage>
</template>
