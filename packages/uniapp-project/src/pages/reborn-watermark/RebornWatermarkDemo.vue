<script setup lang="ts">
import { reactive } from 'vue'
import RebornWatermark from "../../components/reborn-watermark/RebornWatermark.vue"

const font = reactive({
  color: 'rgba(0, 0, 0, .15)',
  fontSize: 14,
  fontWeight: '600'
})

const multiContent = ['Reborn UI', 'ID: 9527', 'CONFIDENTIAL']
</script>

<template>
  <view class="container">
    <!-- Header -->
    <view class="header p-6">
      <text class="title">Watermark 水印</text>
      <text class="subtitle">为页面或元素添加多行文本/图片水印。</text>
    </view>

    <!-- Basic -->
    <view class="section px-4 pb-8">
      <view class="section-title px-2 mb-4">基础文本水印</view>
      <view class="demo-card shadow-lg rounded-32 overflow-hidden border border-gray-100">
        <RebornWatermark :font="font" content="Reborn UI Premium">
          <view class="content-box bg-white p-6">
            <view class="flex flex-col gap-4">
              <view class="h-200 bg-gray-50 rounded-16 flex items-center justify-center">
                <text class="text-gray-300">内容占位区</text>
              </view>
              <text class="text-28 font-bold">用户信息保护</text>
              <text class="text-24 text-gray-500 italic">此区域已被水印系统覆盖，防止未经授权的截图传播。</text>
            </view>
          </view>
        </RebornWatermark>
      </view>
    </view>

    <!-- Multi-line -->
    <view class="section px-4 pb-8">
      <view class="section-title px-2 mb-4">多行与旋转自定义</view>
      <view class="demo-card shadow-lg rounded-32 overflow-hidden border border-gray-100">
        <RebornWatermark 
          :font="{ color: 'rgba(239, 68, 68, 0.1)', fontSize: 12 }" 
          :content="multiContent" 
          :rotate="-45"
          :gap="[80, 80]"
        >
          <view class="content-box bg-white p-8">
             <view class="border-2 border-dashed border-gray-100 rounded-24 p-10 flex flex-col items-center">
                <text class="text-36 font-black text-gray-100 uppercase tracking-widest mb-4">Secret Area</text>
                <text class="text-24 text-gray-300">仅限内部受权人员访问</text>
             </view>
          </view>
        </RebornWatermark>
      </view>
    </view>

    <!-- Image -->
    <view class="section px-4 pb-8">
      <view class="section-title px-2 mb-4">图片品牌水印</view>
      <view class="demo-card shadow-lg rounded-32 overflow-hidden border border-gray-100">
        <RebornWatermark 
          :width="100" 
          :height="24" 
          image="https://element-plus.org/images/element-plus-logo.svg"
          :gap="[80, 80]"
        >
          <view class="content-box bg-white h-400 flex items-center justify-center">
             <text class="text-gray-200">Logo 模式演示</text>
          </view>
        </RebornWatermark>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #fbfbfb;
}
.header {
  background-color: #fff;
  margin-bottom: 20rpx;
}
.title {
  font-size: 48rpx;
  font-weight: 800;
  color: #111;
  display: block;
}
.subtitle {
  font-size: 26rpx;
  color: #666;
  margin-top: 10rpx;
  display: block;
}
.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.demo-card {
  background-color: #fff;
}
.content-box {
  min-height: 300rpx;
}
.h-200 {
  height: 200rpx;
}
.h-400 {
  height: 400rpx;
}
.rounded-32 {
  border-radius: 32rpx;
}
.rounded-24 {
  border-radius: 24rpx;
}
.rounded-16 {
  border-radius: 16rpx;
}
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.gap-4 { gap: 16rpx; }
.p-6 { padding: 32rpx; }
.p-8 { padding: 48rpx; }
.mb-4 { margin-bottom: 24rpx; }
</style>
