<script lang="ts" setup>
import { ref } from 'vue'
import { paginationColors } from '../../ui/reborn-pagination/reborn-pagination.config'

const page1 = ref(1)
const page3 = ref(1)

const demoColor = ref<any>('primary')
const demoDisabled = ref(false)
const demoBackground = ref(true)
const demoSize = ref<'sm' | 'md' | 'lg'>('md')
const demoMode = ref<'multi' | 'simple'>('multi')

function handleChange(page: number) {
    console.log('Page changed to:', page)
}
</script>

<template>
    <div class="space-y-12">
        <section>
            <h3 class="text-lg font-bold mb-4 border-l-4 border-primary pl-3">交互配置演示</h3>
            <div
                class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div class="space-y-6">
                    <div>
                        <p class="text-sm text-gray-500 mb-3 font-medium">主题颜色</p>
                        <div class="flex flex-wrap gap-3">
                            <div v-for="c in paginationColors" :key="c"
                                class="w-7 h-7 rounded-full border-2 transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-sm"
                                :class="[demoColor === c ? 'border-gray-400 scale-110 ring-2 ring-gray-200 dark:ring-gray-700' : 'border-transparent']"
                                :style="{ backgroundColor: `var(--color-${c === 'neutral' ? 'gray-6' : c + '-6'})` }"
                                @click="demoColor = c"></div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium">尺寸大小</p>
                            <p class="text-xs text-gray-400">sm | md | lg</p>
                        </div>
                        <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1 shadow-inner">
                            <RebornButton v-for="s in (['sm', 'md', 'lg'] as const)" :key="s"
                                :variant="demoSize === s ? 'solid' : 'ghost'" size="sm"
                                class="!px-3 !py-1 !min-w-0 font-bold uppercase"
                                :color="demoSize === s ? 'primary' : 'neutral'" @click="demoSize = s">
                                {{ s }}
                            </RebornButton>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium">显示模式</p>
                            <p class="text-xs text-gray-400">列表模式或简易翻页</p>
                        </div>
                        <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1 shadow-inner">
                            <RebornButton variant="solid" :color="demoMode === 'multi' ? 'primary' : 'neutral'"
                                :class="[demoMode === 'multi' ? '' : 'bg-transparent !text-gray-500 hover:!bg-gray-200 dark:hover:!bg-gray-700']"
                                size="sm" class="!px-4 !py-1 font-bold" @click="demoMode = 'multi'">列表</RebornButton>
                            <RebornButton variant="solid" :color="demoMode === 'simple' ? 'primary' : 'neutral'"
                                :class="[demoMode === 'simple' ? '' : 'bg-transparent !text-gray-500 hover:!bg-gray-200 dark:hover:!bg-gray-700']"
                                size="sm" class="!px-4 !py-1 font-bold" @click="demoMode = 'simple'">简易</RebornButton>
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-2">
                        <div>
                            <p class="text-sm font-medium">选项背景</p>
                            <p class="text-xs text-gray-400">开启后未选中项显示底色</p>
                        </div>
                        <RebornSwitch v-model="demoBackground" />
                    </div>

                    <div class="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                        <div>
                            <p class="text-sm font-medium text-error">禁用状态</p>
                            <p class="text-xs text-gray-400">锁定所有交互</p>
                        </div>
                        <RebornSwitch v-model="demoDisabled" color="error" />
                    </div>
                </div>
            </div>

            <div
                class="mt-10 flex flex-col items-center p-10 bg-white dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <RebornPagination v-model="page1" :total="100" :mode="demoMode" :color="demoColor" :size="demoSize"
                    :background="demoBackground" :disabled="demoDisabled" @change="handleChange" />
                <div class="mt-6 flex items-center gap-2 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <span class="text-xs text-gray-400 uppercase tracking-wider font-bold tracking-widest">Page</span>
                    <span class="text-sm font-mono font-bold text-primary">{{ page1 }}</span>
                    <span class="text-xs text-gray-300">/ 10</span>
                </div>
            </div>
        </section>

        <section>
            <h3 class="text-lg font-bold mb-4 border-l-4 border-error pl-3 text-error">特殊场景 (total=0)</h3>
            <div class="flex flex-col items-center p-8 bg-error/5 rounded-2xl border border-dashed border-error/20">
                <RebornPagination :total="0" :color="demoColor" :size="demoSize" :background="demoBackground" />
                <p class="mt-4 text-xs text-error/60 italic font-medium">无数据时强制显示第 1 页并禁用翻页</p>
            </div>
        </section>

        <section>
            <h3 class="text-lg font-bold mb-6 border-l-4 border-success pl-3 text-success">自定义 Slot 扩展</h3>
            <div class="space-y-10">
                <div class="p-6 bg-success/5 rounded-2xl border border-success/10 space-y-4">
                    <p class="text-sm font-bold text-success flex items-center gap-2">
                        <Icon name="lucide:type" /> 自定义文字与颜色
                    </p>
                    <RebornPagination v-model="page3" :total="50" prev-text="上一页" next-text="下一页" color="success"
                        :size="demoSize" :background="demoBackground" />
                </div>

                <div class="p-6 bg-error/5 rounded-2xl border border-error/10 space-y-6">
                    <p class="text-sm font-bold text-error flex items-center gap-2">
                        <Icon name="lucide:palette" /> 自定义 Slot 图标
                    </p>
                    <RebornPagination v-model="page3" :total="50" color="error" :size="demoSize">
                        <template #prev="{ prev, disabled }">
                            <RebornButton color="error" variant="ghost"
                                :class="[demoSize === 'sm' ? '!w-7 !h-7' : demoSize === 'lg' ? '!w-10 !h-10' : '!w-8 !h-8', 'bg-error/10 !p-0 !min-w-0']"
                                :disabled="disabled" @click="prev">
                                <Icon name="lucide:arrow-left-circle"
                                    :class="demoSize === 'lg' ? 'text-2xl' : 'text-lg'" />
                            </RebornButton>
                        </template>
                        <template #next="{ next, disabled }">
                            <RebornButton color="error" variant="ghost"
                                :class="[demoSize === 'sm' ? '!w-7 !h-7' : demoSize === 'lg' ? '!w-10 !h-10' : '!w-8 !h-8', 'bg-error/10 !p-0 !min-w-0']"
                                :disabled="disabled" @click="next">
                                <Icon name="lucide:arrow-right-circle"
                                    :class="demoSize === 'lg' ? 'text-2xl' : 'text-lg'" />
                            </RebornButton>
                        </template>
                    </RebornPagination>
                </div>

                <div class="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-6 text-center">
                    <p class="text-sm font-bold text-primary flex items-center justify-center gap-2">
                        <Icon name="lucide:shapes" /> 自定义形状 (圆形 / Circle)
                    </p>
                    <RebornPagination v-model="page3" :total="50" color="primary">
                        <template #page="{ page, active, handlePageClick }">
                            <RebornButton :variant="active ? 'solid' : 'ghost'" :color="active ? 'primary' : 'neutral'"
                                :class="[
                                    demoSize === 'sm' ? '!w-7 !h-7 text-xs' : demoSize === 'lg' ? '!w-10 !h-10 text-lg' : '!w-8 !h-8 text-sm',
                                    '!rounded-full !p-0 !min-w-0 font-mono',
                                    active ? 'ring-2 ring-primary/20' : 'bg-gray-100/50 hover:bg-gray-100'
                                ]" @click="handlePageClick(page as number)">
                                {{ page }}
                            </RebornButton>
                        </template>
                    </RebornPagination>
                </div>
            </div>
        </section>
    </div>
</template>
