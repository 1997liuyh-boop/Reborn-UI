<script setup lang="ts">
import RebornSlider from "~/components/reborn/ui/reborn-slider/RebornSlider.vue";
import { sliderColors, sliderSizes } from "~/components/reborn/ui/reborn-slider/reborn-slider.config";

const size = ref<any>("md");
const color = ref<any>("primary");
const value1 = ref(40);
const rangeValues = ref([20, 80]);
const disabled = ref(false);
</script>

<template>
    <div class="flex w-full flex-col gap-10">
        <div
            class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">尺寸</span>
                <USelect v-model="size" :items="[...sliderSizes]" class="w-28" />
            </div>
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">颜色</span>
                <USelect v-model="color" :items="[...sliderColors]" class="w-28" />
            </div>
            <UCheckbox v-model="disabled" label="禁用" />
        </div>

        <div class="grid gap-8">
            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">基础</h3>
                <RebornSlider v-model="value1" :size="size" :color="color" :disabled="disabled" show-value />
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">步长 (step=10)</h3>
                <RebornSlider v-model="value1" :step="10" :size="size" :color="color" show-value />
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">范围选择</h3>
                <RebornSlider v-model:values="rangeValues" range :size="size" :color="color" show-value />
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">颜色</h3>
                <div class="flex flex-col gap-4">
                    <RebornSlider v-for="c in sliderColors" :key="c" :model-value="50" :color="c" :size="size" />
                </div>
            </div>
        </div>
    </div>
</template>
