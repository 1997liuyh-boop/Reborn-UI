<script setup lang="ts">
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornBackTop from '@/components/reborn-back-top/RebornBackTop.vue'
import RebornSticky from '@/components/reborn-sticky/RebornSticky.vue'
import { backTopColors, backTopSizes } from '@/components/reborn-back-top/reborn-back-top.config'

const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`)
const scrollTop = ref(0)

const color = ref<typeof backTopColors[number]>('primary')
const size = ref<typeof backTopSizes[number]>('md')

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
})
</script>

<template>
    <RebornPage title="Backtop 回到顶部" description="返回页面顶部的操作按钮">
        <RebornSticky :scroll-top="scrollTop">
            <template #default="{ isSticky }">
                <RebornCard :title="isSticky ? '' : '颜色'">
                    <view class="flex flex-wrap gap-2">
                        <view v-for="c in backTopColors" :key="c"
                            class="w-6 h-6 rounded-full cursor-pointer ring-2 ring-offset-2 ring-transparent transition-all"
                            :class="[`bg-${c}`, color === c ? 'ring-slate-400 scale-110' : 'hover:scale-110']"
                            :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
                            @click="color = c"></view>
                    </view>
                </RebornCard>
            </template>
        </RebornSticky>

        <RebornSticky :scroll-top="scrollTop" :offset-top="66">
            <template #default="{ isSticky }">
                <RebornCard :title="isSticky ? '' : '大小'">
                    <view class="flex flex-wrap gap-2">
                        <view v-for="s in backTopSizes" :key="s"
                            class="px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-colors"
                            :class="size === s ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-transparent text-slate-600 border-slate-300 hover:border-slate-400'"
                            @click="size = s">
                            {{ s }}
                        </view>
                    </view>
                </RebornCard>
            </template>
        </RebornSticky>

        <reborn-card title="基础用法">
            <view>请向下滑动页面查看右下角返回顶部按钮。</view>
            <view class="text-sm text-gray-500 mt-2">默认阈值为 300px。</view>
        </reborn-card>

        <reborn-card title="自定义内容">
            <view>左下角有一个自定义样式的返回顶部按钮。</view>
        </reborn-card>


        <view class="space-y-4 p-4">
            <view v-for="item in items" :key="item" class="p-4 bg-white dark:bg-gray-800 rounded shadow">
                {{ item }}
            </view>
        </view>

        <!-- 基础用法 -->
        <reborn-back-top :color="color" :size="size" :scroll-top="scrollTop" />

        <!-- 自定义内容 & 样式 -->
        <reborn-back-top :scroll-top="scrollTop" :bottom="100" :ui="{ wrapper: 'fixed left-5 z-50' }" color="success">
            <view class="flex items-center justify-center w-12 h-12 bg-success text-white rounded-lg shadow-lg">
                <text class="text-sm font-bold">TOP</text>
            </view>
        </reborn-back-top>
    </RebornPage>
</template>