<script setup lang="ts">
import RebornSelectDate from "~/components/reborn/ui/reborn-select-date/RebornSelectDate.vue";
import { selectDateColors, selectDateSizes } from "~/components/reborn/ui/reborn-select-date/reborn-select-date.config";

const size = ref<any>("md");
const color = ref<any>("primary");
const value1 = ref("");
const value2 = ref("");
const value3 = ref("");
const value4 = ref("");
const value5 = ref<string[]>([]);
const disabled = ref(false);
</script>

<template>
    <div class="flex w-full flex-col gap-10">
        <div
            class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">尺寸</span>
                <USelect v-model="size" :items="[...selectDateSizes]" class="w-28" />
            </div>
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">颜色</span>
                <USelect v-model="color" :items="[...selectDateColors]" class="w-28" />
            </div>
            <UCheckbox v-model="disabled" label="禁用" />
        </div>

        <div class="grid gap-8">
            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">日期选择</h3>
                <div class="grid gap-4 md:grid-cols-2">
                    <RebornSelectDate v-model="value1" type="date" :size="size" :color="color" :disabled="disabled" />
                </div>
                <p class="text-sm text-gray-500">选中: {{ value1 || '空' }}</p>
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">月份选择</h3>
                <RebornSelectDate v-model="value2" type="month" :size="size" :color="color" placeholder="选择月份"
                    class="max-w-xs" />
                <p class="text-sm text-gray-500">选中: {{ value2 || '空' }}</p>
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">年份选择</h3>
                <RebornSelectDate v-model="value3" type="year" :size="size" :color="color" placeholder="选择年份"
                    class="max-w-xs" />
                <p class="text-sm text-gray-500">选中: {{ value3 || '空' }}</p>
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">限定范围</h3>
                <RebornSelectDate v-model="value1" type="date" :size="size" :color="color" start="2024-01-01"
                    end="2025-12-31" placeholder="限2024-2025" class="max-w-xs" />
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">自定义样式</h3>
                <RebornSelectDate v-model="value1" type="date" :size="size" :color="color" :ui="{
                    trigger: 'border-dashed border-2 rounded-xl bg-purple-50/50 dark:bg-purple-900/20 px-4',
                    dropdown: 'rounded-2xl shadow-xl shadow-purple-500/10 border-purple-100 dark:border-purple-900 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm'
                }" placeholder="重写触点和下拉框样式" class="max-w-xs" />
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">自定义格式</h3>
                <RebornSelectDate v-model="value4" type="date" :size="size" :color="color"
                    labelFormat="YYYY年MM月DD日" valueFormat="YYYY/MM/DD"
                    placeholder="显示格式：年月日" class="max-w-xs" />
                <p class="text-sm text-gray-500">选中值: {{ value4 || '空' }}</p>
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">日期范围选择</h3>
                <RebornSelectDate v-model="value5" type="date" :size="size" :color="color"
                    rangeable placeholder="选择日期范围" class="max-w-md" />
                <p class="text-sm text-gray-500">选中范围: {{ value5.length ? value5.join(' ~ ') : '空' }}</p>
            </div>
        </div>
    </div>
</template>
