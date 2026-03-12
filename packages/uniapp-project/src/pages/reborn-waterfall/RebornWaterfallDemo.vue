<template>
    <RebornPage :ui="{ body: 'p-0' }">
        <view class="py-2">
            <RebornWaterfall ref="waterfallRef" :column="2">
                <template #item="{ item }">
                    <view class="bg-white mb-2 rounded-xl dark:!bg-gray-8 relative shadow-sm overflow-hidden">
                        <RebornImage :src="item['image']" mode="widthFix" width="100%" height="100%" :lazyLoad="true"
                            custom-class="w-full h-auto">
                        </RebornImage>

                        <view class="p-3">
                            <template v-if="item['isAd']">
                                <RebornBadge customClass="absolute left-1 top-1 scale-75">
                                    广告
                                </RebornBadge>
                                <view
                                    class="absolute right-2 top-2 flex items-center justify-center bg-white rounded-full p-1"
                                    @tap="del(item['id'] as number)">
                                    <view class="i-lucide-x h-3 w-3"></view>
                                </view>
                            </template>
                            <RebornText :bold="true" ellipsis :lines="2" custom-class="mb-1 text-sm">
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
                                    <RebornText :size="24" custom-class="ml-1">{{ random(10, 999) }}</RebornText>
                                </view>
                            </view>
                        </view>
                    </view>
                </template>
            </RebornWaterfall>

            <RebornLoadmore :status="state" @click="getList" safe-area-bottom></RebornLoadmore>
        </view>
        <RebornBackTop :scroll-top="scrollTop" :bottom="100" :ui="{ wrapper: 'fixed right-5 z-50' }">
            <view
                class="flex size-12 items-center justify-center rounded-full bg-success text-white shadow-lg border-2 border-white">
                <text class="text-xs font-bold leading-none">TOP</text>
            </view>
        </RebornBackTop>
    </RebornPage>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { onReachBottom, onPageScroll } from "@dcloudio/uni-app";
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornBadge from "@/components/reborn-badge/RebornBadge.vue";
import RebornImage from '@/components/reborn-image/RebornImage.vue'
import RebornText from '@/components/reborn-text/RebornText.vue'
import RebornLoadmore from '@/components/reborn-loadmore/reborn-loadmore.vue'
import RebornWaterfall from '@/components/reborn-waterfall/RebornWaterfall.vue'
import RebornBackTop from "@/components/reborn-back-top/RebornBackTop.vue";

const waterfallRef = ref<any>(null);
const loading = ref(false);
const state = ref<'loading' | 'loadmore' | 'finished' | 'error'>('loadmore');
const page = ref(1);
const pageSize = 10;
const isError = ref(false);
const scrollTop = ref(0);

const getList = () => {
    // 1. 拦截重复请求或已加载完成的状态
    if (loading.value || state.value === 'finished') return

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
            const data = (res.data || []) as any[]

            if (data.length === 0) {
                state.value = 'finished'
                return
            }

            // 模拟数据：因为 posts 接口没有图片，我们手动塞一个占位图以便展示
            const mappedData = data.map((item: any, index: number) => ({
                id: item.id,
                title: item.title,
                body: item.body,
                isAd: index === 3,
                image: `https://picsum.photos/400/500?random=${index}` // 随机图片
            }))

            waterfallRef.value?.append(mappedData)

            // 模拟一个错误发生
            if (page.value === 3 && !isError.value) {
                isError.value = true
                state.value = 'error'
                return
            }

            if (data.length < pageSize || page.value >= 5) {
                state.value = 'finished'
            } else {
                state.value = 'loadmore'
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

function random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function del(id: number) {
    waterfallRef.value!.remove(id);
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
