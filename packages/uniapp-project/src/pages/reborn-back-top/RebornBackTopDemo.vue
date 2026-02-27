<script setup lang="ts">
import { backTopColors, backTopSizes } from '@/components/reborn-back-top/reborn-back-top.config'
import RebornBackTop from '@/components/reborn-back-top/RebornBackTop.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornSticky from '@/components/reborn-sticky/RebornSticky.vue'

const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`)
const scrollTop = ref(0)

const color = ref<typeof backTopColors[number]>('primary')
const size = ref<typeof backTopSizes[number]>('md')

onPageScroll((e) => {
  scrollTop.value = e.scrollTop
})
</script>

<template>
  <RebornPage title="Backtop 回到顶部" description="返回页面顶部的操作按钮">
    <RebornSticky :scroll-top="scrollTop">
      <template #default="{ isSticky }">
        <RebornCard :title="isSticky ? '' : '颜色'">
          <view class="flex flex-wrap gap-2">
            <view
              v-for="c in backTopColors" :key="c"
              class="
                size-6 cursor-pointer rounded-full ring-2 ring-transparent
                ring-offset-2 transition-all
              "
              :class="[`
                bg-${c}
              `, color === c ? 'scale-110 ring-slate-400' : `hover:scale-110`]"
              :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
              @click="color = c"
            />
          </view>
        </RebornCard>
      </template>
    </RebornSticky>

    <RebornSticky :scroll-top="scrollTop" :offset-top="66">
      <template #default="{ isSticky }">
        <RebornCard :title="isSticky ? '' : '大小'">
          <view class="flex flex-wrap gap-2">
            <view
              v-for="s in backTopSizes" :key="s"
              class="
                cursor-pointer rounded-full border px-3 py-1.5 text-xs
                transition-colors
              "
              :class="size === s ? `
                border-slate-900 bg-slate-900 text-white
                dark:bg-white dark:text-slate-900
              ` : `
                border-slate-300 bg-transparent text-slate-600
                hover:border-slate-400
              `"
              @click="size = s"
            >
              {{ s }}
            </view>
          </view>
        </RebornCard>
      </template>
    </RebornSticky>

    <RebornCard title="基础用法">
      <view>请向下滑动页面查看右下角返回顶部按钮。</view>
      <view class="mt-2 text-sm text-gray-500">
        默认阈值为 300px。
      </view>
    </RebornCard>

    <RebornCard title="自定义内容">
      <view>左下角有一个自定义样式的返回顶部按钮。</view>
    </RebornCard>

    <view class="space-y-4 p-4">
      <view
        v-for="item in items" :key="item" class="
          rounded bg-white p-4 shadow
          dark:bg-gray-800
        "
      >
        {{ item }}
      </view>
    </view>

    <!-- 基础用法 -->
    <RebornBackTop :color="color" :size="size" :scroll-top="scrollTop" />

    <!-- 自定义内容 & 样式 -->
    <RebornBackTop :scroll-top="scrollTop" :bottom="100" :ui="{ wrapper: 'fixed left-5 z-50' }" color="success">
      <view
        class="
          flex size-12 items-center justify-center rounded-lg bg-success
          text-white shadow-lg
        "
      >
        <text class="text-sm font-bold">TOP</text>
      </view>
    </RebornBackTop>
  </RebornPage>
</template>
