<script lang="ts" setup>
import { ref } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'

import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornText from '@/components/reborn-text/RebornText.vue'
import RebornImage from '@/components/reborn-image/RebornImage.vue'
import RebornLoadmore from '@/components/reborn-loadmore/reborn-loadmore.vue'
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

const getList = () => {
    // 1. 拦截重复请求或已加载完成的状态
    if (loading.value || state.value === 'finished' || state.value === 'error') return

    loading.value = true
    state.value = 'loading'

    uni.request({
        // 替换为 JSONPlaceholder 接口，国内访问较快
        url: 'https://jsonplaceholder.typicode.com/posts',
        method: 'GET',
        data: {
            _page: page.value,   // 当前页码
            _limit: pageSize      // 每页数量
        },
        success: (res: any) => {
            const data = res.data || []

            // 模拟数据：因为 posts 接口没有图片，我们手动塞一个占位图以便展示
            const mappedData = data.map((item: any) => ({
                id: item.id,
                title: item.title,
                body: item.body,
                image: `https://picsum.photos/200/150?random=${item.id}` // 随机图片
            }))

            list.value.push(...mappedData)

            if (list.value.length === 20) {
                isError.value = !isError.value
                state.value = isError.value ? 'error' : 'loading'
            } else if (list.value.length >= 40) { // 这里演示加载到50条停止
                state.value = 'finished'
            } else {
                page.value++
            }
        },
        fail: () => {
            state.value = 'error'
        },
        complete: () => {
            loading.value = false
        }
    })
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