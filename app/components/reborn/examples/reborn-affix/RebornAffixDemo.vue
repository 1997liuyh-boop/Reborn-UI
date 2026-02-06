<script setup lang="ts">
import RebornAffix from '@/components/reborn/ui/reborn-affix/RebornAffix.vue'
import { ref } from 'vue'

const isDark = ref(false)
const toggleDarkMode = () => isDark.value = !isDark.value
const list = ['i-meteocons-clear-day-fill', 'i-meteocons-solar-eclipse-fill']
</script>

<template>
    <div class="space-y-4">
        <div class="p-6 bg-slate-100 dark:bg-slate-900 rounded-xl space-y-2">
            <h3 class="font-bold text-lg">RebornAffix Demo</h3>
            <p class="text-slate-500">
                请尝试拖拽右下角的浮动按钮（支持鼠标和触摸）。
            </p>
        </div>

        <div class="h-[200px] border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
            Content Area
        </div>


        <RebornAffix :right="20" :bottom="400" disabled>
            <div class="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white shadow-lg cursor-not-allowed"
                title="Disabled">
                <UIcon name="i-lucide-lock" class="size-5" />
            </div>
        </RebornAffix>

        <RebornAffix :left="100" :bottom="100" :no-snapping="true">
            <div class="w-12 h-12 flex flex-col items-center justify-center rounded-full bg-blue-500 overflow-hidden shadow-xl cursor-move transition-transform active:scale-95"
                @click="toggleDarkMode">
                <UIcon name="i-lucide-sun" class="text-white size-6" />
            </div>
        </RebornAffix>
    </div>
</template>
