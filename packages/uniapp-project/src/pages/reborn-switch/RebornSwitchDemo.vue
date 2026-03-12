<script setup lang="ts">
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

const checked1 = ref(true)
const checked2 = ref(false)
const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const

// 动态配置
const onValue = ref(true)
const currentSize = ref<typeof sizes[number]>('md')
const currentColor = ref<typeof colors[number]>('primary')

// 自定义值示例
const customValue = ref('yes')

// 切换拦截示例
const beforeChangeValue = ref(false)
const handleBeforeChange = () => {
  return new Promise<boolean>((resolve) => {
    // #ifdef MP-WEIXIN || APP-PLUS || H5
    uni.showModal({
      title: '提示',
      content: '确认切换状态吗？',
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      }
    })
    // #endif
  })
}

// 聚焦示例
const switchRef = ref<any>(null)
const focusSwitch = () => {
  // UniApp 中 focus 主要是设置状态类名
  switchRef.value?.focus()
}
</script>

<template>
  <RebornPage title="开关 (Switch)" description="允许用户在两种状态之间切换的控件。" custom-class="flex flex-col gap-y-4">
    <!-- 加载状态与样式定制 -->
    <RebornCard title="加载状态与样式定制" custom-class="space-y-4">
      <!-- 配置控制 -->
      <view class="space-y-2">
        <text class="text-sm text-gray-500">尺寸控制</text>
        <view class="flex flex-wrap gap-2">
          <ReButton v-for="size in sizes" :key="size" :variant="currentSize === size ? 'solid' : 'outline'"
            :color="currentSize === size ? 'primary' : 'neutral'" @click="currentSize = size">
            {{ size.toUpperCase() }}
          </ReButton>
        </view>
      </view>

      <view class="space-y-2">
        <text class="text-sm text-gray-500">颜色控制</text>
        <view class="flex flex-wrap gap-2">
          <view v-for="c in colors" :key="c" class="
              size-6 cursor-pointer rounded-full ring-2 ring-transparent
              ring-offset-2 transition-all
            " :class="[
              currentColor === c ? 'scale-110 ring-slate-400' : 'hover:scale-110',
            ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
            @click="currentColor = c" />
        </view>
      </view>

      <!-- 示例展示 -->
      <view class="grid gap-4 md:grid-cols-2">
        <!-- 加载状态 -->
        <view class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 dark:bg-gray-800">
          <RebornSwitch v-model="onValue" :size="currentSize" :color="currentColor" active-label="加载中 (Loading)"
            loading />
        </view>

        <!-- 自定义 UI (方形) -->
        <view class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 dark:bg-gray-800">
          <RebornSwitch v-model="onValue" :size="currentSize" :color="currentColor" active-label="方形风格 (Square)"
            :ui="{ track: 'rounded-md', thumb: 'rounded-sm' }" />
        </view>

        <!-- 自定义滑块内容 (图标) -->
        <view class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 dark:bg-gray-800">
          <RebornSwitch v-model="onValue" :size="currentSize" :color="currentColor" active-label="插槽图标"
            :ui="{ track: 'group-[.is-checked]:bg-orange-6 bg-blue-6' }">
            <template #thumb="{ checked }">
              <view class="flex size-4 transition-colors" :class="[
                checked ? 'i-lucide-check text-orange-6' : 'i-lucide-x text-blue-6',
              ]" />
            </template>
          </RebornSwitch>
        </view>

        <!-- 自定义滑块 + 加载 -->
        <view class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 dark:bg-gray-800">
          <RebornSwitch v-model="onValue" :size="currentSize" :color="currentColor" active-label="自定义加载图标" loading>
            <template #thumb="{ loading }">
              <view v-if="loading" class="i-lucide-loader flex size-4 animate-spin p-0.5 text-primary" />
            </template>
          </RebornSwitch>
        </view>

        <!-- 自定义尺寸 (XL) -->
        <view class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 dark:bg-gray-800">
          <RebornSwitch v-model="onValue" :color="currentColor" active-label="特殊尺寸 (XL)" :ui="{
            track: 'h-8 w-14',
            thumb: 'size-7 group-[.is-checked]:translate-x-6',
          }" />
        </view>
      </view>
    </RebornCard>
    <!-- 高级功能 -->
    <RebornCard title="高级功能 (New Features)" custom-class="space-y-4">
      <view class="grid gap-4 md:grid-cols-2">
        <!-- 自定义值 -->
        <view class="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 dark:bg-gray-800">
          <text class="text-xs text-gray-400 uppercase font-bold">自定义 Value ({{ customValue }})</text>
          <RebornSwitch v-model="customValue" active-value="yes" inactive-value="no" active-label="Yes"
            inactive-label="No" />
        </view>

        <!-- 切换拦截 -->
        <view class="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 dark:bg-gray-800">
          <text class="text-xs text-gray-400 uppercase font-bold">同步/异步拦截 (beforeChange)</text>
          <RebornSwitch v-model="beforeChangeValue" :before-change="handleBeforeChange" active-label="需确认" />
        </view>

        <!-- 手动聚焦 -->
        <view class="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 dark:bg-gray-800">
          <view class="flex justify-between items-center">
            <text class="text-xs text-gray-400 uppercase font-bold">手动聚焦</text>
            <ReButton size="xs" variant="soft" @click="focusSwitch">点击聚焦</ReButton>
          </view>
          <RebornSwitch ref="switchRef" active-label="Focus Me" />
        </view>
      </view>
    </RebornCard>

  </RebornPage>
</template>

<style scoped></style>
