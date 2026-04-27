<script setup lang="ts">
import { ref } from 'vue'
import { RebornBreadcrumb, RebornBreadcrumbItem } from '@/components/reborn-breadcrumb'

const separator = ref('/')
const separatorIcon = ref('')

const handleItemClick = (item: string) => {
  console.log('Clicked:', item)
}
</script>

<template>
  <view class="p-4 bg-gray-50 min-h-screen">
    <view class="mb-8">
      <view class="text-32 font-bold mb-2">Breadcrumb 面包屑</view>
      <view class="text-28 text-gray-500">显示当前页面的路径，快速返回之前的任意页面。</view>
    </view>

    <view class="space-y-6">
      <!-- 基础用法 -->
      <view class="bg-white p-4 rounded-xl shadow-sm">
        <view class="text-28 font-bold mb-4">基础用法</view>
        <RebornBreadcrumb separator="/">
          <RebornBreadcrumbItem to="/pages/index/index">首页</RebornBreadcrumbItem>
          <RebornBreadcrumbItem>活动管理</RebornBreadcrumbItem>
          <RebornBreadcrumbItem>活动列表</RebornBreadcrumbItem>
          <RebornBreadcrumbItem>活动详情</RebornBreadcrumbItem>
        </RebornBreadcrumb>
      </view>

      <!-- 图标分隔符 -->
      <view class="bg-white p-4 rounded-xl shadow-sm">
        <view class="text-28 font-bold mb-4">图标分隔符</view>
        <RebornBreadcrumb separator-icon="i-lucide-chevron-right">
          <RebornBreadcrumbItem to="/pages/index/index">首页</RebornBreadcrumbItem>
          <RebornBreadcrumbItem>推广管理</RebornBreadcrumbItem>
          <RebornBreadcrumbItem>推广列表</RebornBreadcrumbItem>
        </RebornBreadcrumb>
      </view>

      <!-- 自定义分隔符 -->
      <view class="bg-white p-4 rounded-xl shadow-sm">
        <view class="text-28 font-bold mb-4">自定义分隔符</view>
        <RebornBreadcrumb separator=">">
          <RebornBreadcrumbItem to="/pages/index/index">首页</RebornBreadcrumbItem>
          <RebornBreadcrumbItem>设置</RebornBreadcrumbItem>
          <RebornBreadcrumbItem>个人信息</RebornBreadcrumbItem>
        </RebornBreadcrumb>
      </view>

      <!-- 路由跳转 -->
      <view class="bg-white p-4 rounded-xl shadow-sm">
        <view class="text-28 font-bold mb-4">路由跳转 (Replace)</view>
        <RebornBreadcrumb separator="/">
          <RebornBreadcrumbItem to="/pages/index/index" replace>首页 (Replace)</RebornBreadcrumbItem>
          <RebornBreadcrumbItem>当前页</RebornBreadcrumbItem>
        </RebornBreadcrumb>
      </view>
    </view>
  </view>
</template>

<style scoped>
.space-y-6 > view + view {
  margin-top: 1.5rem;
}
</style>
