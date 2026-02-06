<script setup lang="ts">
import RebornBackTop from '@/components/reborn/ui/reborn-back-top/RebornBackTop.vue'
import { backTopColors, backTopSizes } from '@/components/reborn/ui/reborn-back-top/reborn-back-top.config'
import { ref } from 'vue'

const items = Array.from({ length: 40 }, (_, i) => `Item ${i + 1}`)

const color = ref<typeof backTopColors[number]>('primary')
const size = ref<typeof backTopSizes[number]>('md')
</script>

<template>
    <div class="space-y-8">
        <div class="p-6 bg-slate-100 dark:bg-slate-900 rounded-xl space-y-4">
            <h3 class="font-bold text-lg">RebornBackTop Demo</h3>
            <p class="text-slate-500">
                请向下滑动页面查看右下角返回顶部按钮。
            </p>

            <!-- Color Picker -->
            <div class="space-y-2">
                <div class="text-sm font-medium">颜色 (Color)</div>
                <div class="flex flex-wrap gap-2">
                    <div v-for="c in backTopColors" :key="c" class="w-8 h-8 rounded-full border-2 transition-all"
                        :class="[`bg-${c}`, color === c ? 'ring-slate-400 scale-110' : 'hover:scale-110']"
                        @click="color = c">
                    </div>
                </div>
            </div>

            <!-- Size Picker -->
            <div class="space-y-2">
                <div class="text-sm font-medium">大小 (Size)</div>
                <div class="flex flex-wrap gap-2">
                    <button v-for="s in backTopSizes" :key="s"
                        class="px-3 py-1 text-sm rounded-md border transition-colors"
                        :class="size === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'"
                        @click="size = s">
                        {{ s }}
                    </button>
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <div v-for="item in items" :key="item"
                class="p-4 bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-slate-700">
                {{ item }}
            </div>
        </div>

        <!-- 基础用法 -->
        <RebornBackTop :color="color" :size="size" />

        <!-- 自定义内容 -->
        <RebornBackTop :bottom="100" :ui="{ wrapper: 'z-50' }" color="success">
            <div
                class="flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition-colors">
                <span class="text-xs font-bold">TOP</span>
            </div>
        </RebornBackTop>
    </div>
</template>
