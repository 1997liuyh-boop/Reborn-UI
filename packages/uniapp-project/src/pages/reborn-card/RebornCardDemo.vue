<script setup lang="ts">
// RebornCard 演示页：标题、标题插槽与内边距控制
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
</script>

<template>
  <RebornPage title="Card 卡片" description="用于分组展示内容区块的基础卡片容器，常与 Page 搭配组织页面。">
    <!-- 基础用法：通过 title 属性渲染标题，内容放默认插槽 -->
    <RebornCard title="基础用法">
      <view
        class="
          text-[26rpx] text-slate-600
          dark:text-slate-300
        "
      >
        卡片由标题与内容体两部分组成，内容体默认带圆角边框、白色背景与内边距。
      </view>
      <view class="rounded-lg bg-blue-1 p-3 text-[24rpx] text-slate-500">
        任意内容都可以放进默认插槽，多个子元素之间自动保持间距。
      </view>
    </RebornCard>

    <!-- 标题插槽：使用 title 插槽完全接管标题区域 -->
    <RebornCard>
      <template #title>
        <view class="flex items-center gap-2">
          <view class="i-lucide-sparkles size-[32rpx] text-amber-500" />
          <text
            class="
              font-medium text-[26rpx] text-slate-500
              dark:text-slate-200
            "
          >
            标题插槽
          </text>
        </view>
      </template>
      <view
        class="
          text-[26rpx] text-slate-600
          dark:text-slate-300
        "
      >
        需要图标、角标等富文本标题时，用 title 插槽替换默认标题渲染。
      </view>
    </RebornCard>

    <!-- 无内边距：padding=false 时内容可通铺整个卡片 -->
    <RebornCard title="无内边距" :padding="false">
      <view
        class="
          flex h-[160rpx] items-center justify-center bg-gradient-to-r
          from-indigo-500 to-purple-500
        "
      >
        <text class="text-[28rpx] text-white">通铺内容（padding=false）</text>
      </view>
    </RebornCard>
  </RebornPage>
</template>
