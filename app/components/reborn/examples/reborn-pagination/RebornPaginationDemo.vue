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
                <div>
                    <p class="text-sm text-gray-500 mb-3 font-medium">主题颜色</p>
                    <RebornRadioGroup v-model="demoColor">
                        <RebornRadio v-for="item in paginationColors" :key="item" :value="item" :showIcon="false">
                            <template #default="{ isChecked }">
                                <div class="relative flex size-5">
                                    <div v-if="isChecked"
                                        class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                                        :class="`bg-${item}`">
                                    </div>
                                    <div class="relative inline-flex size-5 rounded-full" :class="`bg-${item}`"></div>
                                </div>
                            </template>
                        </RebornRadio>
                    </RebornRadioGroup>
                </div>

                <div>
                    <p class="text-sm text-gray-500 mb-3 font-medium">尺寸大小</p>
                    <RebornRadioGroup v-model="demoSize">
                        <RebornRadio v-for="s in (['sm', 'md', 'lg'] as const)" :key="s" :value="s" :label="s">
                        </RebornRadio>
                    </RebornRadioGroup>
                </div>

                <div>
                    <p class="text-sm font-medium">显示模式</p>
                    <RebornSwitch v-model="demoMode" active-label="列表" active-value="multi" inactive-label="简易"
                        inactive-value="simple" />
                </div>


                <div>
                    <p class="text-sm font-medium">选项背景</p>
                    <RebornSwitch v-model="demoBackground" active-label="有背景" inactive-label="无背景" />
                </div>

                <div>
                    <p class="text-sm font-medium">禁用状态</p>
                    <RebornSwitch v-model="demoDisabled" color="error" active-label="禁用" inactive-label="启用" />
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
                        <template #page="{ page, active, handlePageClick }">
                            <!-- <RebornButton :variant="active ? 'solid' : 'subtle'" :color="active ? 'primary' : 'neutral'"
                                :class="[
                                    demoSize === 'sm' ? '!w-7 !h-7 text-xs' : demoSize === 'lg' ? '!w-10 !h-10 text-lg' : '!w-8 !h-8 text-sm',
                                    '!rounded-full !p-0 !min-w-0 font-mono',
                                    active ? 'ring-2 ring-primary/20' : 'bg-gray-100/50 hover:bg-gray-100'
                                ]" @click="handlePageClick(page as number)">
                                {{ page }}
                            </RebornButton> -->
                            <ContainerTextFlip v-if="active" :words="['你猜怎么着', '真没听说过', `现在第${page}集`]"
                                class="text-sm!" />
                            <RebornButton variant="subtle" color="neutral" v-else>{{ page }}</RebornButton>
                        </template>
                        <template #prev="{ prev, disabled }">
                            <RebornButton color="error" variant="subtle"
                                :class="[demoSize === 'sm' ? '!w-7 !h-7' : demoSize === 'lg' ? '!w-10 !h-10' : '!w-8 !h-8', 'bg-error/10 !p-0 !min-w-0']"
                                :disabled="disabled" @click="prev">
                                <Icon name="lucide:arrow-left-circle"
                                    :class="demoSize === 'lg' ? 'text-2xl' : 'text-lg'" />
                            </RebornButton>
                        </template>
                        <template #next="{ next, disabled }">
                            <RebornButton color="error" variant="subtle"
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
                            <RebornButton :variant="active ? 'solid' : 'subtle'" :color="active ? 'primary' : 'neutral'"
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
