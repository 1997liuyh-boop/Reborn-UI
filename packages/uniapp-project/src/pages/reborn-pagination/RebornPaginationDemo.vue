<script lang="ts" setup>
import { ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPagination from '@/components/reborn-pagination/RebornPagination.vue'
import RebornText from '@/components/reborn-text/RebornText.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import { paginationColors } from '@/components/reborn-pagination/reborn-pagination.config'

const page1 = ref(1)
const page3 = ref(1)

const demoColor = ref<any>('primary')
const demoDisabled = ref(false)
const demoBackground = ref(false)
const demoMode = ref<'multi' | 'simple'>('multi')

function handleChange(page: number) {
    console.log('Page changed to:', page)
}
</script>

<template>
    <RebornPage title="Pagination 分页" description="当数据量过多时，使用分页分解数据。">

        <RebornCard title="配置演示">
            <!-- 颜色切换 -->
            <view>
                <RebornText color="neutral" custom-class="mb-2">主题颜色</RebornText>
                <view class="flex flex-wrap gap-2">
                    <view v-for="c in paginationColors" :key="c"
                        class="size-6 rounded-full border-2 border-transparent transition-all"
                        :class="[demoColor === c ? 'scale-110 !border-slate-400' : '', `bg-${c}`]"
                        :style="{ backgroundColor: `var(--color-${c})` }" @tap="demoColor = c" />
                </view>
            </view>

            <RebornText color="neutral">显示模式</RebornText>
            <RebornSwitch v-model="demoMode" active-label="列表" active-value="multi" inactive-label="简易"
                inactive-value="simple" />

            <RebornText color="neutral">禁用状态</RebornText>
            <RebornSwitch v-model="demoDisabled" active-label="禁用" inactive-label="启用" />

            <RebornText color="neutral">背景状态</RebornText>
            <RebornSwitch v-model="demoBackground" active-label="禁用" inactive-label="启用" />

        </RebornCard>

        <RebornCard title="动态演示">
            <view class="py-4">
                <RebornPagination v-model="page1" :total="100" :pageSize="10" :mode="demoMode" :color="demoColor"
                    :disabled="demoDisabled" :background="demoBackground" @change="handleChange" />
                <view class="mt-4 text-center text-slate-400 text-sm">
                    当前页码: {{ page1 }} / 10
                </view>
            </view>
        </RebornCard>

        <RebornCard title="特殊场景 (total=0)">
            <view class="py-4">
                <RebornPagination :total="0" :color="demoColor" />
                <view class="mt-4 text-center text-slate-400 text-sm italic">无数据时强制显示第 1 页并禁用翻页</view>
            </view>
        </RebornCard>

        <RebornCard title="自定义 Slot 扩展">
            <view class="py-4">
                <view>
                    <RebornText color="neutral" custom-class="mb-2">自定义文字与颜色</RebornText>
                    <RebornPagination v-model="page3" :total="50" prevText="上一页" nextText="下一页" color="success" />
                </view>

                <view class="mt-8">
                    <RebornText color="neutral" custom-class="mb-2">自定义 Slot 图标</RebornText>
                    <RebornPagination v-model="page3" :total="50" color="error">
                        <template #prev="{ prev }">
                            <view
                                class="reborn-pagination-item flex items-center justify-center rounded-md size-7 min-w-7 bg-error/10 text-error active:scale-95"
                                @tap="prev">
                                <view class="i-lucide-arrow-left-circle text-24" />
                            </view>
                        </template>
                        <template #next="{ next }">
                            <view
                                class="reborn-pagination-item flex items-center justify-center rounded-md size-7 min-w-7 bg-error/10 text-error active:scale-95"
                                @tap="next">
                                <view class="i-lucide-arrow-right-circle text-24" />
                            </view>
                        </template>
                    </RebornPagination>
                </view>

                <view class="mt-8">
                    <RebornText color="neutral" custom-class="mb-2">自定义颜色插槽 (#67C23A & #F56C6C)</RebornText>
                    <RebornPagination v-model="page3" :total="50">
                        <template #page="{ page, active, handlePageClick }">
                            <view
                                class="flex items-center justify-center rounded-md size-7 min-w-7 transition-all active:scale-95 border"
                                :style="{
                                    backgroundColor: active ? '#F56C6C' : '#67C23A10',
                                    color: active ? '#FFFFFF' : '#67C23A',
                                    borderColor: active ? '#F56C6C' : '#67C23A30'
                                }" @tap="handlePageClick(page as number)">
                                <text class="text-24 font-bold">{{ page }}</text>
                            </view>
                        </template>
                        <template #prev="{ prev }">
                            <view
                                class="flex items-center justify-center rounded-md size-7 min-w-7 bg-slate-100 dark:bg-slate-800"
                                @tap="prev">
                                <view class="i-lucide-chevron-left text-24" style="color: #67C23A" />
                            </view>
                        </template>
                        <template #next="{ next }">
                            <view
                                class="flex items-center justify-center rounded-md size-7 min-w-7 bg-slate-100 dark:bg-slate-800"
                                @tap="next">
                                <view class="i-lucide-chevron-right text-24" style="color: #67C23A" />
                            </view>
                        </template>
                    </RebornPagination>
                </view>

                <view class="mt-8">
                    <RebornText color="neutral" custom-class="mb-2">自定义形状 (药丸型)</RebornText>
                    <RebornPagination v-model="page3" :total="50" color="warning">
                        <template #page="{ page, active, handlePageClick }">
                            <view
                                class="flex items-center justify-center rounded-full h-7 px-3 min-w-7 transition-all active:scale-95 border"
                                :class="active ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-500 border-orange-200'"
                                @tap="handlePageClick(page as number)">
                                <text class="text-24 font-medium">{{ page }}</text>
                            </view>
                        </template>
                    </RebornPagination>
                </view>
            </view>
        </RebornCard>

    </RebornPage>
</template>
