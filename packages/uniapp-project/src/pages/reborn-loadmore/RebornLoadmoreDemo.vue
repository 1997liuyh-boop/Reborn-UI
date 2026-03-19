<script lang="ts" setup>
import { ref } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'

import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornText from '@/components/reborn-text/RebornText.vue'
import RebornImage from '@/components/reborn-image/RebornImage.vue'
import RebornLoadmore from '@/components/reborn-loadmore/RebornLoadmore.vue'
import { loadMoreColors, LoadMoreState } from "@/components/reborn-loadmore/reborn-loadmore.config";

const list = ref<any[]>([])

// 默认参数设置
const page = ref(1)
const pageSize = 10

const state = ref<'loading' | 'error' | 'finished'>('loading')
const isError = ref(false)
const loading = ref(false)
const demoColor = ref<typeof loadMoreColors[number]>('neutral')
const demoState = ref<typeof LoadMoreState[number]>('loading')

const fixedImages = [
    { url: 'http://image.mall.leyifan.cn/mp/static/assets/cn1.jpg', ratio: 0.75 },
    { url: 'http://image.mall.leyifan.cn/mp/static/assets/cn2.jpg', ratio: 1.25 },
    { url: 'http://image.mall.leyifan.cn/mp/static/assets/cn3.jpg', ratio: 0.6 },
    { url: 'http://image.mall.leyifan.cn/mp/static/assets/cn4.jpg', ratio: 1.5 },
    { url: 'http://image.mall.leyifan.cn/mp/static/assets/cn5.jpg', ratio: 0.8 },
    { url: 'http://image.mall.leyifan.cn/mp/static/assets/cn7.jpg', ratio: 1.1 },
    { url: 'http://image.mall.leyifan.cn/mp/static/assets/cn8.jpg', ratio: 0.9 },
    { url: 'http://image.mall.leyifan.cn/mp/static/assets/cn9.jpg', ratio: 1.33 }
];

const getList = () => {
    // 1. 拦截重复请求或已加载完成的状态
    if (loading.value || state.value === 'finished' || state.value === 'error') return

    loading.value = true
    state.value = 'loading'

    // 模拟网络请求延迟
    setTimeout(() => {
        const start = (page.value - 1) * pageSize

        // 模拟数据生成
        const mappedData = Array.from({ length: pageSize }).map((_, index) => {
            const globalIndex = start + index;
            const imgData = fixedImages[globalIndex % fixedImages.length];
            return {
                id: globalIndex + 1,
                title: `分页加载示例标题 ${globalIndex + 1}`,
                body: '这是一段模拟的分页加载描述文本，用于展示在列表项中。我们可以通过滚动到底部来触发更多的加载流程。',
                image: imgData.url
            }
        })

        list.value.push(...mappedData)

        // 模拟错误发生（在列表长度到达 20 时演示）
        if (list.value.length === 20 && !isError.value) {
            isError.value = true
            state.value = 'error'
            loading.value = false
            return
        }

        // 演示加载到 50 条停止
        if (list.value.length >= 50) {
            state.value = 'finished'
        } else {
            state.value = 'loading'
            page.value++
        }
        loading.value = false
    }, 800)
}

// 失败点击重试
function reload() {
    state.value = 'loading'
    getList()
}

onReachBottom(() => {
    getList()
})

onLoad(() => {
    getList()
})
</script>

<template>
    <reborn-page title="loadmore 分页加载" description="用于在列表底部展示加载状态。" :ui="{ body: 'px-0' }">
        <reborn-card title="基础用法">
            <view class="text-sm font-medium text-gray-5 mb-2">
                按钮颜色
            </view>
            <view class="flex flex-wrap gap-2 mb-3">
                <view v-for="c in loadMoreColors" :key="c" class="
                  size-6 cursor-pointer rounded-full ring-2 ring-transparent
                  ring-offset-2 transition-all
                " :class="[
                    `
                    bg-${c}
                  `,
                    demoColor === c ? 'scale-110 ring-slate-400' : `
                    hover:scale-110
                  `,
                ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
                    @click="demoColor = c" />
            </view>
            <view class="text-sm font-medium text-gray-5 mb-2">
                状态
            </view>
            <view class="flex flex-wrap gap-2 mb-3">
                <view v-for="c in LoadMoreState" :key="c" class="text-gray-6"
                    :class="[demoState === c ? 'scale-110 text-primary' : `hover:scale-110`]" @click="demoState = c">
                    {{ c }}
                </view>
            </view>
            <reborn-loadmore :state="demoState" :color="demoColor" @reload="reload" />
        </reborn-card>
        <view v-for="item in list" :key="item.id" class="flex gap-3 p-3 bg-white border-b border-gray-100 mt-3">
            <view class="w-[160rpx] h-[120rpx] overflow-hidden rounded-lg bg-gray-100">
                <RebornImage :src="item.image" width="100%" height="100%" mode="aspectFill" preview />
            </view>

            <view class="flex-1 flex flex-col justify-between">
                <RebornText :value="item.title" :ellipsis="true" :lines="1" :size="28" />

                <RebornText :value="item.body" :ellipsis="true" :lines="2" :size="24" color="neutral" />
            </view>
        </view>

        <reborn-loadmore :state="state" color="primary" :ui="{ line: 'bg-primary/20' }" @reload="reload" />
    </reborn-page>
</template>