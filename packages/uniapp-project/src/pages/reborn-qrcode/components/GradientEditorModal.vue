<script setup lang="ts">
import type { QrGradient } from '../types'
import { ref, shallowRef, watch } from 'vue'
import ColorPickerModal from './ColorPickerModal.vue'

interface Props { gradient: QrGradient | null, background: boolean }
const props = defineProps<Props>()
const emit = defineEmits<{ apply: [gradient: QrGradient] }>()
const open = defineModel<boolean>('open', { default: undefined })
const draft = ref<QrGradient>({ type: 'linear', direction: 'horizontal', colorStops: [] })
const colorOpen = shallowRef(false)
const colorIndex = shallowRef(0)
const selectedColor = shallowRef('#000000')
const directions: { value: QrGradient['direction'], name: string }[] = [
  { value: 'horizontal', name: '水平' }, { value: 'vertical', name: '垂直' },
  { value: 'diagonal', name: '对角' }, { value: 'center', name: '中心' },
]
watch(() => open.value, (value) => {
  colorOpen.value = false
  if (!value) return
  const current = props.gradient
  draft.value = current
    ? { ...current, colorStops: current.colorStops.map(stop => ({ ...stop })) }
    : {
        type: 'linear', direction: 'horizontal',
        colorStops: [{ offset: 0, color: props.background ? '#ffffff' : '#000000' }, { offset: 1, color: props.background ? '#f0f8ff' : '#666666' }],
      }
}, { immediate: true })
function editColor(index: number) {
  colorIndex.value = index
  selectedColor.value = draft.value.colorStops[index]?.color ?? '#000000'
  colorOpen.value = true
}
function applyColor(color: string) {
  const stop = draft.value.colorStops[colorIndex.value]
  if (stop) stop.color = color
}
function apply() {
  emit('apply', { ...draft.value, colorStops: draft.value.colorStops.map(stop => ({ ...stop })) })
  open.value = false
}
</script>

<template>
  <view v-if="open" class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50" @tap="open = false">
    <view class="w-[600rpx] max-w-[90vw] rounded-[16rpx] bg-white p-[32rpx]" @tap.stop>
      <view class="mb-[24rpx] flex justify-between text-[32rpx]"><text>渐变设置</text><text @tap="open = false">×</text></view>
      <view class="mb-[24rpx] flex gap-[16rpx]">
        <button class="flex-1 text-[26rpx]" :class="draft.type === 'linear' ? 'text-blue-500' : ''" @tap="draft.type = 'linear'">线性渐变</button>
        <button class="flex-1 text-[26rpx]" :class="draft.type === 'radial' ? 'text-blue-500' : ''" @tap="draft.type = 'radial'">径向渐变</button>
      </view>
      <view v-if="draft.type === 'linear'" class="mb-[24rpx] grid grid-cols-4 gap-[12rpx]">
        <view
          v-for="item in directions" :key="item.value" class="rounded-[8rpx] border p-[12rpx] text-center text-[24rpx]"
          :class="draft.direction === item.value ? 'border-blue-500 text-blue-500' : 'border-gray-200'" @tap="draft.direction = item.value"
        >
          {{ item.name }}
        </view>
      </view>
      <view class="mb-[24rpx] flex gap-[24rpx]">
        <view v-for="(stop, index) in draft.colorStops" :key="stop.offset" class="flex flex-1 flex-col items-center gap-[12rpx]" @tap="editColor(index)">
          <text class="text-[24rpx]">{{ index === 0 ? '起始颜色' : '结束颜色' }}</text>
          <view class="size-[60rpx] rounded-[12rpx] border" :style="{ backgroundColor: stop.color }" />
          <text class="text-[22rpx]">{{ stop.color }}</text>
        </view>
      </view>
      <button class="rounded-[8rpx] bg-blue-500 text-[28rpx] text-white" @tap="apply">应用</button>
    </view>
  </view>
  <ColorPickerModal v-model:open="colorOpen" :color="selectedColor" @apply="applyColor" />
</template>

