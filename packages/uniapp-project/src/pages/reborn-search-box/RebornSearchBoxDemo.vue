<script setup lang="ts">
import { onMounted, reactive, shallowRef } from 'vue'
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
const customSlotQuery = shallowRef('')
/** 演练场的历史记录：绑定 v-model:history 后由本页持有，组件不再读写本地存储 */
const history = shallowRef<string[]>([])

/** 历史回显的标签样式，演练场与本地存储示例共用 */
const historyChipClass = 'rounded-full bg-gray-100 px-[16rpx] py-[4rpx] text-22 text-gray-600 dark:bg-gray-800 dark:text-gray-300'

/** 清空演练场历史：历史归父级所有，直接整体替换即可 */
function clearHistory() {
  history.value = []
}

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

/** 默认插槽未传时渲染相机图标，点击派发 clickCamera */
function handleCameraClick() {
  uni.showToast({ title: '点击了相机图标', icon: 'none' })
}

// 本地存储示例
/** 本地存储示例的存储键：未绑定 history 时，组件按这个键读写 uni 本地存储 */
const storageHistoryKey = 'demo-search-history'
/** 从本地存储读回的历史，只用于回显（UniApp 端组件不渲染历史列表） */
const storedHistory = shallowRef<string[]>([])

/** 读取本地存储里的历史，读不到或格式不对时按空列表处理 */
function readStoredHistory() {
  try {
    const saved: unknown = uni.getStorageSync(storageHistoryKey)
    const parsed: unknown = typeof saved === 'string' ? JSON.parse(saved || '[]') : saved
    storedHistory.value = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  }
  catch {
    storedHistory.value = []
  }
}

/** 组件先写存储再派发 search，所以在回调里读到的已经包含本次关键词 */
function handleStorageSearch(value: string) {
  readStoredHistory()
  handleSearch(value)
}

// 进入页面先回显上次留下的记录，用来验证离开再进来历史仍在
onMounted(readStoredHistory)
</script>

<template>
  <RebornPage title="SearchBox 搜索框" description="支持关键词输入、历史记录及前后缀插槽的搜索框。">

    <!-- 交互预览区 (直接平铺) -->
    <view class="mb-6">
      <view class="text-xs text-gray-400 mb-3 px-1 font-bold uppercase tracking-widest">LIVE PREVIEW</view>
      <RebornSearchBox v-model="state.value" v-model:history="history"
        :placeholder="state.placeholder" :size="state.size" :color="state.color"
                       :border="state.border" :disabled="state.disabled" @search="handleSearch" />
      <!-- 历史回显：组件不渲染历史列表，绑定 v-model:history 后由本页自行展示 -->
      <view class="mt-[24rpx] flex flex-wrap items-center gap-[12rpx] px-[8rpx]">
        <text class="text-22 text-gray-400">history：</text>
        <text v-if="history.length === 0" class="text-22 text-gray-400">暂无，输入关键词后按键盘确认键</text>
        <text v-for="item in history" :key="item" :class="historyChipClass">{{ item }}</text>
        <text v-if="history.length > 0" class="text-22 text-primary" @tap="clearHistory">清空</text>
      </view>
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
        <text class="text-22 text-gray-400 px-1">自定义后缀操作（extra 插槽）</text>
        <RebornSearchBox v-model="customSlotQuery" color="success" placeholder="点击右侧图标试试">
          <template #extra>
            <view
              class="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-success active:scale-95"
              @tap="handleSearch(customSlotQuery)"
            >
              <view class="i-lucide-search text-28" />
              <text class="text-22 font-bold">搜索</text>
            </view>
          </template>
        </RebornSearchBox>
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-22 text-gray-400 px-1">默认相机图标（点击派发 clickCamera）</text>
        <RebornSearchBox placeholder="不传入插槽时的默认表现" @click-camera="handleCameraClick" />
      </view>
    </view>

    <!-- 本地存储历史：不绑定 history，只传 history-key -->
    <view class="mb-[32rpx] mt-[16rpx] flex items-center gap-[32rpx]">
      <view class="h-[48rpx] w-[8rpx] rounded-full bg-warning" />
      <text class="text-28 font-bold text-gray-800 dark:text-gray-200">本地存储历史</text>
    </view>
    <view class="mb-[64rpx] flex flex-col gap-[16rpx]">
      <text class="px-[8rpx] text-22 text-gray-400">
        未绑定 history 时按 history-key 读写本地存储，最多保留 10 条，离开本页再进来仍在；与 v-model:history 二选一，绑定后 history-key 不再生效。
      </text>
      <RebornSearchBox :history-key="storageHistoryKey" placeholder="搜索后返回首页再进来看看" @search="handleStorageSearch" />
      <view class="flex flex-wrap items-center gap-[12rpx] px-[8rpx]">
        <text class="text-22 text-gray-400">{{ storageHistoryKey }}：</text>
        <text v-if="storedHistory.length === 0" class="text-22 text-gray-400">存储中暂无记录</text>
        <text v-for="item in storedHistory" :key="item" :class="historyChipClass">{{ item }}</text>
      </view>
    </view>

    <!-- 提示区 -->
    <view
      class="p-6 bg-gray-100/50 dark:bg-gray-800/30 rounded-2xl text-center border border-gray-100 dark:border-gray-800">
      <text class="text-22 text-gray-500">
        输入关键词后按键盘确认键触发 search，非空关键词写入历史。演练场绑定了 v-model:history，历史由本页持有、不读写本地存储；「本地存储历史」一节不绑定 history，由组件按 history-key 读写存储。
      </text>
    </view>
    <view class="h-10"></view>
  </RebornPage>
</template>
