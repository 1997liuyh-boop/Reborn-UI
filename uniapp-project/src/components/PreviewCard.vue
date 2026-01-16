<template>
  <view class="preview-card">
    <view class="preview-title">{{ title }}</view>
    <view class="preview-desc">{{ description }}</view>
    <view class="preview-chip">{{ tag }}</view>
  </view>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "Reborn UI"
  },
  description: {
    type: String,
    default: "UniApp component rendered inside Nuxt"
  },
  tag: {
    type: String,
    default: "H5"
  }
});
</script>

<style scoped>
.preview-card {
  padding: 24rpx;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.preview-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #0f172a;
}

.preview-desc {
  font-size: 26rpx;
  color: #475569;
}

.preview-chip {
  align-self: flex-start;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: #e2e8f0;
  font-size: 22rpx;
  color: #475569;
}
</style>
