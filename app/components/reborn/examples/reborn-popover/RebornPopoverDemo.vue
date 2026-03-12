<script setup lang="ts">
import { ref } from 'vue'

const isControlledOpen = ref(false)
const alignOptions = ['start', 'center', 'end'] as const
const sideOptions = ['top', 'bottom', 'left', 'right'] as const

const activeAlign = ref<typeof alignOptions[number]>('center')
const activeSide = ref<typeof sideOptions[number]>('bottom')

const arrowOptions = ref(true)

function closePopover() {
    isControlledOpen.value = false
}
</script>

<template>
    <div class="space-y-8 p-6">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold tracking-tight">Popover 气泡弹出框</h2>
                <p class="text-muted-foreground mt-2 text-sm">点击或悬浮出现的弹出内容区域。</p>
            </div>
        </div>

        <!-- Basic Examples -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UCard>
                <template #header>
                    <div class="font-semibold">基础点击触发 (Click)</div>
                </template>
                <div class="flex items-center gap-4 min-h-[150px] justify-center">
                    <RebornPopover>
                        <RebornButton>点我显示</RebornButton>
                        <template #content>
                            <div class="p-4 w-64 text-sm">
                                这是一个基础的 Popover 气泡内容，默认在底部显示。
                            </div>
                        </template>
                    </RebornPopover>
                </div>
            </UCard>

            <UCard>
                <template #header>
                    <div class="font-semibold">悬浮触发 (Hover)</div>
                </template>
                <div class="flex items-center gap-4 min-h-[150px] justify-center">
                    <RebornPopover mode="hover">
                        <RebornButton variant="soft">悬浮显示</RebornButton>
                        <template #content>
                            <div class="p-4 w-64 text-sm text-gray-600 dark:text-gray-300">
                                移入按钮显示，移出 popover 时自动隐藏。
                            </div>
                        </template>
                    </RebornPopover>
                </div>
            </UCard>

            <!-- Advanced Positions -->
            <UCard class="md:col-span-2">
                <template #header>
                    <div class="font-semibold">十二方向定位与箭头</div>
                </template>
                <div class="space-y-6 flex flex-col items-center">
                    <div
                        class="flex flex-wrap gap-4 items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg w-full max-w-2xl border border-dashed border-gray-200 dark:border-gray-800">
                        <div class="flex flex-col gap-2">
                            <span class="text-xs text-gray-400">选择方向 (side)</span>
                            <RebornSelect v-model="activeSide"
                                :options="sideOptions.map((v) => ({ label: v, value: v }))" class="w-32"
                                :clearable="false" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <span class="text-xs text-gray-400">选择对齐 (align)</span>
                            <RebornSelect v-model="activeAlign"
                                :options="alignOptions.map((v) => ({ label: v, value: v }))" class="w-32"
                                :clearable="false" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <span class="text-xs text-gray-400">显示箭头</span>
                            <RebornSwitch v-model="arrowOptions" active-label="开启" inactive-label="关闭" />
                        </div>
                    </div>

                    <div
                        class="min-h-[250px] flex items-center justify-center relative w-full border border-gray-100 dark:border-gray-800 rounded-xl">
                        <RebornPopover :content="{ side: activeSide, align: activeAlign, sideOffset: 12 }"
                            :arrow="arrowOptions">
                            <RebornButton size="xl" class="shadow-sm">触发目标</RebornButton>
                            <template #content>
                                <div class="p-3 w-40 text-center text-sm">
                                    当前的定位: <br> <span class="font-mono text-primary">
                                        {{ activeSide }}<br>
                                        {{ activeAlign }}<br>
                                    </span>
                                </div>
                            </template>
                        </RebornPopover>
                    </div>
                </div>
            </UCard>

            <!-- Controlled Example -->
            <UCard>
                <template #header>
                    <div class="font-semibold">受控模式与手动关闭</div>
                </template>
                <div class="flex flex-col items-center gap-4 min-h-[150px] justify-center space-y-4">
                    <div class="text-sm">当前状态: {{ isControlledOpen ? '打开' : '关闭' }}</div>

                    <RebornPopover v-model:open="isControlledOpen" :arrow="true"
                        :content="{ side: 'top', align: 'center', sideOffset: 12 }">
                        <RebornButton color="primary">{{ isControlledOpen ? '点击关闭' :
                            '点击打开受控组件' }}
                        </RebornButton>

                        <template #content>
                            <div class="p-4 w-64 space-y-4 flex flex-col items-center">
                                <p class="text-sm">你可以点击外部，或者点击下面的按钮关闭我。</p>
                                <RebornButton size="sm" variant="soft" @click="closePopover">确定并关闭</RebornButton>
                            </div>
                        </template>
                    </RebornPopover>
                </div>
            </UCard>
        </div>
    </div>
</template>
