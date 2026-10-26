<script lang="ts" setup>
import { onMounted, ref, shallowRef } from "vue";
import { onReachBottom, onPageScroll, onUnload } from "@dcloudio/uni-app";
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornBadge from "@/components/reborn-badge/RebornBadge.vue";
import RebornImage from '@/components/reborn-image/RebornImage.vue'
import RebornText from '@/components/reborn-text/RebornText.vue'
import RebornLoadmore from '@/components/reborn-loadmore/RebornLoadmore.vue'
import RebornWaterfall from '@/components/reborn-waterfall/RebornWaterfall.vue'
import RebornBackTop from "@/components/reborn-back-top/RebornBackTop.vue";

const waterfallRef = ref<InstanceType<typeof RebornWaterfall> | null>(null);
const loading = shallowRef(false);
const state = shallowRef<'loading' | 'error' | 'finished'>('loading')
const page = shallowRef(1);
const pageSize = 4;
const isError = shallowRef(false);
const scrollTop = shallowRef(0);

let requestTimer: ReturnType<typeof setTimeout> | undefined
onUnload(() => clearTimeout(requestTimer))

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
    requestTimer = setTimeout(() => {
        // 失败时不写入瀑布流，只有明确重试才重新请求当前页。
        if (page.value === 2 && !isError.value) {
            isError.value = true
            state.value = 'error'
            loading.value = false
            return
        }
        const start = (page.value - 1) * pageSize

        // 使用取模运算循环利用固定的 8 张图片生成每一页的数据
        const mappedData = Array.from({ length: pageSize }).map((_, index) => {
            const globalIndex = start + index;
            const imgData = fixedImages[globalIndex % fixedImages.length]!;
            return {
                id: globalIndex + 1,
                title: `精选热门风景推荐 ${globalIndex + 1}`,
                body: '远离城市的喧嚣，感受大自然最纯粹的呼吸与心跳。在这里将美好定格，把宁静永留心间。',
                isAd: globalIndex === 3,
                image: imgData.url,
                ratio: imgData.ratio,
                likes: random(10, 999)
            }
        })

        waterfallRef.value?.append(mappedData)

        if (page.value >= 25) {
            state.value = 'finished'
        } else {
            state.value = 'loading'
            page.value++
        }
        loading.value = false
    }, 600)
}

function reload() {
    if (state.value !== 'error' || loading.value) return
    state.value = 'loading'
    getList()
}

function random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function del(id: unknown) {
    if (typeof id === 'number') waterfallRef.value?.remove(id);
}
onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onReachBottom(() => {
    getList();
});

onMounted(() => {
    getList();
});
</script>

<template>
    <RebornPage :ui="{ body: 'p-0' }">
        <view class="py-2">
            <RebornWaterfall ref="waterfallRef" :column="2">
                <template #item="{ item }">
                    <view class="bg-white mb-2 rounded-xl dark:!bg-gray-8 relative shadow-sm overflow-hidden">
                        <view class="w-full relative overflow-hidden" :style="{ aspectRatio: item['ratio'] || 1 }">
                            <RebornImage :src="item['image']" mode="aspectFill" width="100%" height="100%"
                                :lazyLoad="true" custom-class="absolute left-0 top-0 w-full h-full">
                            </RebornImage>
                        </view>

                        <view class="p-3">
                            <template v-if="item['isAd']">
                                <RebornBadge customClass="absolute left-1 top-1 scale-75">
                                    广告
                                </RebornBadge>
                                <view
                                    class="absolute right-2 top-2 flex items-center justify-center bg-white rounded-full p-1"
                                    @tap="del(item['id'])">
                                    <view class="i-lucide-x h-3 w-3"></view>
                                </view>
                            </template>
                            <RebornText ellipsis :lines="2" custom-class="mb-1 text-sm font-bold">
                                {{ item["title"] }}
                            </RebornText>
                            <RebornText :size="24" ellipsis color="secondary" :lines="4"
                                custom-class="mb-2 leading-tight">{{
                                    item["body"] }}</RebornText>
                            <view class="mt-2 flex justify-between items-center">
                                <view class="flex items-center text-gray-400">
                                    <view class="i-lucide-user text-xs"></view>
                                    <RebornText :size="24" custom-class="ml-1">User {{ item["id"] }}</RebornText>
                                </view>
                                <view class="flex items-center text-red-400">
                                    <view class="i-lucide-heart text-xs"></view>
                                    <RebornText :size="24" custom-class="ml-1">{{ item.likes }}</RebornText>
                                </view>
                            </view>
                        </view>
                    </view>
                </template>
            </RebornWaterfall>

        </view>
        <RebornLoadmore :state="state" color="primary" @reload="reload"></RebornLoadmore>
        <RebornBackTop :scroll-top="scrollTop" :bottom="100" :ui="{ wrapper: 'fixed right-5 z-50' }">
            <view
                class="flex size-12 items-center justify-center rounded-full bg-success text-white shadow-lg border-2 border-white">
                <text class="text-xs font-bold leading-none">TOP</text>
            </view>
        </RebornBackTop>
    </RebornPage>
</template>
