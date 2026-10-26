<script setup lang="ts">
import type { ForegroundImage } from '../types'
import { shallowRef, watch } from 'vue'

interface Props { image: string | null, images: readonly ForegroundImage[] }
const props = defineProps<Props>()
const emit = defineEmits<{ apply: [image: string | null] }>()
const open = defineModel<boolean>('open', { default: undefined })
const draft = shallowRef<string | null>(null)
watch(() => open.value, (value) => { if (value) draft.value = props.image }, { immediate: true })
function upload() {
  uni.chooseImage({
    count: 1,
    success: (result) => {
      if (open.value) draft.value = result.tempFilePaths[0] ?? null
    },
  })
}
function apply() {
  emit('apply', draft.value)
  open.value = false
}
</script>

<template>
  <view v-if="open" class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50" @tap="open = false">
    <view class="w-[650rpx] max-w-[90vw] rounded-[16rpx] bg-white p-[32rpx]" @tap.stop>
      <view class="mb-[24rpx] flex justify-between text-[32rpx]"><text>选择前景图</text><text @tap="open = false">×</text></view>
      <view class="mb-[24rpx] grid grid-cols-3 gap-[16rpx]">
        <view
          v-for="item in images" :key="item.id" class="flex flex-col items-center rounded-[12rpx] border p-[12rpx]"
          :class="draft === item.path ? 'border-blue-500 text-blue-500' : 'border-gray-200'" @tap="draft = item.path"
        >
          <image :src="item.path" mode="aspectFill" class="mb-[8rpx] size-[120rpx] rounded-[8rpx]" />
          <text class="text-[22rpx]">{{ item.name }}</text>
        </view>
      </view>
      <view class="mb-[24rpx] flex gap-[16rpx]">
        <button class="flex-1 text-[26rpx]" @tap="upload">上传图片</button>
        <button v-if="draft" class="flex-1 text-[26rpx] text-red-500" @tap="draft = null">清除</button>
      </view>
      <button class="rounded-[8rpx] bg-blue-500 text-[28rpx] text-white" @tap="apply">应用</button>
    </view>
  </view>
</template>

