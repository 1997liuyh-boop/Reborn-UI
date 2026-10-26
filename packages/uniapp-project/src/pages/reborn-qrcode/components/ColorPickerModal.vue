<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'

interface Props { color: string }
const props = defineProps<Props>()
const emit = defineEmits<{ apply: [color: string] }>()
const open = defineModel<boolean>('open', { default: undefined })
const draft = shallowRef('')
const palette = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff4d4f', '#ff7a45', '#ffa940', '#ffec3d', '#bae637', '#52c41a',
  '#13c2c2', '#1890ff', '#2f54eb', '#722ed1', '#eb2f96', '#f759ab',
]
watch(() => open.value, (value) => { if (value) draft.value = props.color }, { immediate: true })
function apply(color = draft.value) {
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) {
    uni.showToast({ title: '请输入三位或六位十六进制色值', icon: 'none' })
    return
  }
  emit('apply', color)
  open.value = false
}
</script>

<template>
  <view v-if="open" class="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50" @tap="open = false">
    <view class="w-[600rpx] max-w-[90vw] rounded-[16rpx] bg-white p-[32rpx]" @tap.stop>
      <view class="mb-[32rpx] flex items-center justify-between">
        <text class="text-[32rpx] font-semibold">选择颜色</text>
        <text class="text-[40rpx]" @tap="open = false">×</text>
      </view>
      <view class="mb-[32rpx] grid grid-cols-6 gap-[16rpx]">
        <view
          v-for="swatch in palette" :key="swatch" class="size-[64rpx] rounded-[12rpx] border border-gray-200"
          :style="{ backgroundColor: swatch }" @tap="apply(swatch)"
        />
      </view>
      <!-- 逐键仅保存草稿，完成键或应用按钮才提交有效色值。 -->
      <RebornInput v-model="draft" size="sm" placeholder="#000000" @confirm="apply()" />
      <button class="mt-[24rpx] rounded-[8rpx] bg-blue-500 text-[28rpx] text-white" @tap="apply()">应用</button>
    </view>
  </view>
</template>

