<script setup lang="ts">
import { ref } from 'vue'
import RebornOverlay from '@/components/reborn/ui/reborn-overlay/RebornOverlay.vue'

const show = ref(false)
const showTarget = ref(false)
const closeOnClickOverlay = ref(true)
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-4">
            <h3 class="text-lg font-medium">基本使用 (全屏遮罩)</h3>
            <div class="rounded-xl border bg-card text-card-foreground shadow p-4 flex gap-4">
                <RebornButton color="primary" variant="solid" @click="show = true">打开全局遮罩</RebornButton>
                <div class="flex items-center gap-2">
                    <UCheckbox v-model="closeOnClickOverlay" label="允许点击背景关闭" />
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-medium">指定节点遮罩 (绝对定位)</h3>
            <div class="rounded-xl border bg-card text-card-foreground shadow p-4">
                <div
                    class="relative h-[300px] w-full bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                    <RebornButton color="primary" variant="solid" @click="showTarget = true">在此区域打开遮罩</RebornButton>
                    <div class="absolute bottom-4 right-4 text-sm text-gray-500">此容器的 position 必须为 relative、absolute 或
                        fixed</div>

                    <RebornOverlay v-model="showTarget" absolute :closeOnClickOverlay="closeOnClickOverlay">
                        <div class="flex items-center justify-center h-full">
                            <div
                                class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl relative z-10 w-[250px] text-center">
                                <h4 class="text-base font-medium mb-4">区域内的遮罩内容</h4>
                                <RebornButton color="neutral" variant="solid" @click="showTarget = false" block>
                                    关闭
                                </RebornButton>
                            </div>
                        </div>
                    </RebornOverlay>
                </div>
            </div>
        </div>

        <RebornOverlay v-model="show" :closeOnClickOverlay="closeOnClickOverlay">
            <div class="flex items-center justify-center h-full">
                <div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl relative z-10 w-[300px] text-center">
                    <h4 class="text-lg font-medium mb-4">全局遮罩内容</h4>
                    <p class="text-sm text-gray-500 mb-6">点击四周背景关闭 (如果允许)</p>
                    <RebornButton color="primary" variant="solid" @click="show = false" block>我知道了</RebornButton>
                </div>
            </div>
        </RebornOverlay>
    </div>
</template>
