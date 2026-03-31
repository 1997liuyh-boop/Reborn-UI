<script setup lang="ts">
import { ref, reactive } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornSearchBox from '@/components/reborn-search-box/RebornSearchBox.vue'
import RebornSelect from '@/components/reborn-select/RebornSelect.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import { searchBoxColors, searchBoxSizes, type SearchBoxSize, type SearchBoxColor } from '@/components/reborn-search-box/reborn-search-box.config'

// 1. 交互演练场状态
const state = reactive({
  value: '',
  placeholder: '关键词/商品ID/网址',
  size: 'sm' as SearchBoxSize,
  color: 'primary' as SearchBoxColor,
  border: false,
  disabled: false
})

// 默认搜索值
const searchQuery = ref('')
const customSlotQuery = ref('')

// 颜色选项转换
const colorOptions: { label: string, value: SearchBoxColor }[] = searchBoxColors.map(c => ({
  label: c.charAt(0).toUpperCase() + c.slice(1),
  value: c as SearchBoxColor
}))

// 尺寸选项转换
const sizeOptions: { label: string, value: SearchBoxSize }[] = [
  { label: '小 (sm)', value: 'sm' },
  { label: '中 (md)', value: 'md' },
  { label: '大 (lg)', value: 'lg' }
]

const handleSearch = (value: string) => {
  uni.showToast({
    title: `搜索: ${value || '空内容'}`,
    icon: 'none',
  })
}
</script>

<template>
  <RebornPage title="SearchBox 搜索框" description="支持多端适配、翻译切换及高度自定义插槽的搜索核心。">

    <!-- 交互预览区 (直接平铺) -->
    <view class="mb-6">
      <view class="text-xs text-gray-400 mb-3 px-1 font-bold uppercase tracking-widest">LIVE PREVIEW</view>
      <RebornSearchBox v-model="state.value" :placeholder="state.placeholder" :size="state.size" :color="state.color"
        :border="state.border" :disabled="state.disabled" @search="handleSearch" />
    </view>

    <!-- 配置面板 -->
    <RebornCard padding custom-class="mb-8">
      <view class="grid grid-cols-1 gap-6">
        <view class="grid grid-cols-2 gap-4">
          <view class="flex flex-col gap-2">
            <text class="text-[22rpx] text-gray-400 uppercase font-bold px-1">尺寸规格</text>
            <RebornSelect v-model="state.size" :options="sizeOptions" size="sm" placeholder="选择尺寸" title="切换尺寸" />
          </view>
          <view class="flex flex-col gap-2">
            <text class="text-[22rpx] text-gray-400 uppercase font-bold px-1">主题颜色</text>
            <RebornSelect v-model="state.color" :options="colorOptions" size="sm" placeholder="选择颜色" title="切换主题颜色" />
          </view>
        </view>

        <view class="flex items-center justify-start gap-12 px-1">
          <RebornSwitch v-model="state.border" size="sm" active-label="显示边框"
            :ui="{ activeLabel: 'text-sm text-gray-500', inactiveLabel: 'text-sm text-gray-500' }" />
          <RebornSwitch v-model="state.disabled" size="sm" active-label="禁用状态"
            :ui="{ activeLabel: 'text-sm text-gray-500', inactiveLabel: 'text-sm text-gray-500' }" />
        </view>
      </view>
    </RebornCard>

    <!-- 分隔标题样式 -->
    <view class="flex items-center gap-4 mb-4 mt-2">
      <view class="w-1 h-6 bg-primary rounded-full"></view>
      <text class="text-28 font-bold text-gray-800 dark:text-gray-200">各尺寸对比</text>
    </view>
    <view class="flex flex-col gap-5 mb-8">
      <view v-for="size in sizeOptions" :key="size.value" class="flex flex-col gap-2">
        <text class="text-22 text-gray-400 px-1">{{ size.label }}</text>
        <RebornSearchBox :size="size.value" :placeholder="`${size.label} 搜索框预览`" border />
      </view>
    </view>

    <view class="flex items-center gap-4 mb-4 mt-2">
      <view class="w-1 h-6 bg-secondary rounded-full"></view>
      <text class="text-28 font-bold text-gray-800 dark:text-gray-200">色彩风格</text>
    </view>
    <view class="grid grid-cols-1 gap-5 mb-8">
      <view v-for="color in colorOptions.slice(0, 4)" :key="color.value" class="flex flex-col gap-2">
        <text class="text-22 text-gray-400 px-1">{{ color.label }}</text>
        <RebornSearchBox :color="color.value" :placeholder="`${color.label} 主题色展示`" border />
      </view>
    </view>

    <view class="flex items-center gap-4 mb-4 mt-2">
      <view class="w-1 h-6 bg-success rounded-full"></view>
      <text class="text-28 font-bold text-gray-800 dark:text-gray-200">高度自定义 (Slots)</text>
    </view>
    <view class="flex flex-col gap-5 mb-10">
      <view class="flex flex-col gap-2">
        <text class="text-22 text-gray-400 px-1">识图搜索场景 (Slot: default)</text>
        <RebornSearchBox v-model="customSlotQuery" color="success" placeholder="点击右侧图标试试">
          <view
            class="flex items-center gap-1.5 px-2.5 py-1 bg-success/10 rounded-full text-success active:scale-95 transition-all">
            <view class="i-lucide-scan-line text-28" />
            <text class="text-22 font-bold">识图</text>
          </view>
        </RebornSearchBox>
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-22 text-gray-400 px-1">默认相机样式</text>
        <RebornSearchBox placeholder="不传入插槽时的默认表现" />
      </view>
    </view>

    <!-- 提示区 -->
    <view
      class="p-6 bg-gray-100/50 dark:bg-gray-800/30 rounded-2xl text-center border border-gray-100 dark:border-gray-800">
      <text class="text-22 text-gray-500">
        💡 提示：点击组件右侧的“源/译”按钮，可体验平滑的切换动效。该功能已内置于组件核心。
      </text>
    </view>
    <view class="h-10"></view>
  </RebornPage>
</template>

<style scoped></style>
