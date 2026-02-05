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
    <RebornPage title="Sticky 吸顶"
        description="该组件与CSS中position: sticky属性实现的效果一致，当组件达到预设的到顶部距离时， 就会固定在指定位置，组件位置大于预设的顶部距离时，会重新按照正常的布局排列。"
        custom-class="space-y-2">

        <RebornSticky :scroll-top="scrollTop">
            <view class="bg-primary p-3 h-[40px] text-white flex flex-row items-center">
                Header - 1
            </view>
        </RebornSticky>

        <view v-for="item in items" :key="item" class="p-3 bg-white dark:bg-gray-800 dark:text-white rounded shadow">
            {{ item }}
        </view>

        <RebornSticky :scroll-top="scrollTop" :offset-top="40">
            <view class="bg-warning p-3 h-[40px] text-white flex flex-row items-center">
                Header - 2
            </view>
        </RebornSticky>

        <view v-for="item in items" :key="item" class="p-3 bg-white dark:bg-gray-800 dark:text-white rounded shadow">
            {{ item }}
        </view>


        <RebornSticky :scroll-top="scrollTop" :offset-top="80">
            <view class="bg-success p-3 h-[40px] text-white flex flex-row items-center">
                Header - 3
            </view>
        </RebornSticky>

        <view v-for="item in items" :key="item" class="p-3 bg-white dark:bg-gray-800 dark:text-white rounded shadow">
            {{ item }}
        </view>

        <!-- 基础用法 -->
        <reborn-back-top :color="color" :size="size" :scroll-top="scrollTop" />
    </RebornPage>
</template>