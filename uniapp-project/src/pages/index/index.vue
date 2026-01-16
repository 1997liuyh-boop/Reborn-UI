<template>
  <view class="page">
    <view class="header">
      <view class="title">UniApp 组件预览</view>
      <view class="subtitle">该页面由 Nuxt 通过 Nitro 托管。</view>
    </view>
    <PreviewCard
      title="Reborn UI + UniApp"
      description="这是一个在 Nuxt 里通过 iframe 显示的 UniApp 组件。"
      tag="Preview"
    />
  </view>
</template>

<script setup>
import PreviewCard from "@/components/PreviewCard.vue";
</script>

<style scoped>
.page {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 700;
  color: #0f172a;
}

.subtitle {
  font-size: 24rpx;
  color: #64748b;
}
</style>
