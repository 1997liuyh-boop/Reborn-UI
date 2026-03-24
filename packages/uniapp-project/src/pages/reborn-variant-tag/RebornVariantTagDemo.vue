<script setup lang="ts">
import { ref } from 'vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import { variantTagColors, variantTagPositions } from '@/components/reborn-variant-tag/reborn-variant-tag.config'
import RebornVariantTag from '@/components/reborn-variant-tag/RebornVariantTag.vue'

const currentColor = ref<typeof variantTagColors[number]>('primary')
const currentPosition = ref<typeof variantTagPositions[number]>('top-left')
const reverseActivity = ref(false)
</script>

<template>
  <RebornPage title="Variant Tag" description="多种贴近商品卡、活动位与状态位的变体标签组件。">
    <RebornCard title="基础颜色与位置" custom-class="space-y-4">
      <view class="space-y-3">
        <text class="text-sm text-slate-500">颜色</text>
        <view class="flex flex-wrap gap-2">
          <view
            v-for="item in variantTagColors"
            :key="item"
            class="rounded-full border px-[20rpx] py-[10rpx] text-24"
            :class="currentColor === item ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : 'border-slate-300 text-slate-600'"
            @tap="currentColor = item"
          >
            {{ item }}
          </view>
        </view>
      </view>

      <view class="space-y-3">
        <text class="text-sm text-slate-500">角标位置</text>
        <view class="flex flex-wrap gap-2">
          <view
            v-for="item in variantTagPositions"
            :key="item"
            class="rounded-full border px-[20rpx] py-[10rpx] text-24"
            :class="currentPosition === item ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 text-slate-600'"
            @tap="currentPosition = item"
          >
            {{ item }}
          </view>
        </view>
      </view>

      <view class="grid grid-cols-2 gap-4">
        <view class="flex items-center justify-center py-[20rpx]">
          <RebornVariantTag variant="corner-ribbon" :color="currentColor" label="首发" :position="currentPosition">
            <view class="h-[248rpx] w-[288rpx] rounded-[36rpx] bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800" />
          </RebornVariantTag>
        </view>
        <view class="flex items-center justify-center py-[20rpx]">
          <RebornVariantTag variant="promo-badge" :color="currentColor" label="限时" sub-label="优惠" />
        </view>
        <view class="flex items-center justify-center py-[20rpx]">
          <RebornVariantTag
            variant="activity-badge"
            color="info"
            label="2024/12/30"
            sub-label="发售"
            :reverse="reverseActivity"
          />
        </view>
        <view class="flex items-center justify-center py-[20rpx]">
          <RebornVariantTag variant="status-tag" color="secondary" label="新品 · 未开封" sub-label="N\nRANK" />
        </view>
      </view>
    </RebornCard>

    <RebornCard title="折角与自定义" custom-class="space-y-4">
      <view class="flex items-center justify-between gap-3">
        <text class="text-sm text-slate-500">折角标签支持自定义颜色、尺寸与偏移。</text>
        <view class="rounded-full border border-slate-300 px-[20rpx] py-[10rpx] text-24 text-slate-600" @tap="reverseActivity = !reverseActivity">
          {{ reverseActivity ? '恢复顺序' : '反转活动标签' }}
        </view>
      </view>

      <view class="grid grid-cols-2 gap-4">
        <view class="flex items-center justify-center py-[20rpx]">
          <RebornVariantTag
            variant="fold-corner"
            color="info"
            label="请点击"
            position="top-left"
            width="164rpx"
            height="68rpx"
            fold-size="28rpx"
          >
            <view class="h-[160rpx] w-[240rpx] rounded-[32rpx] bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800" />
          </RebornVariantTag>
        </view>
        <view class="flex items-center justify-center py-[20rpx]">
          <RebornVariantTag
            variant="fold-corner"
            custom-color="#7c3aed"
            accent-color="#8b5cf6"
            label="自定义"
            position="bottom-right"
            width="168rpx"
            height="72rpx"
            fold-size="32rpx"
          >
            <view class="h-[160rpx] w-[240rpx] rounded-[32rpx] bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800" />
          </RebornVariantTag>
        </view>
      </view>
    </RebornCard>
  </RebornPage>
</template>
