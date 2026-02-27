<script setup lang="ts">
import RebornRate from "~/components/reborn/ui/reborn-rate/RebornRate.vue";
import { rateColors, rateSizes } from "~/components/reborn/ui/reborn-rate/reborn-rate.config";

const val1 = ref(3);
const currentSize = ref<any>("md");
const currentColor = ref<any>("warning");
const maxCount = ref(5);
const isAllowHalf = ref(false);
const isShowValue = ref(true);
const isDisabled = ref(false);
const isReadonly = ref(false);
</script>

<template>
    <div class="flex w-full flex-col gap-10">
        <!-- Controls -->
        <div
            class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">尺寸</span>
                <USelect v-model="currentSize" :items="[...rateSizes]" class="w-28" />
            </div>
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">颜色</span>
                <USelect v-model="currentColor" :items="[...rateColors]" class="w-28" />
            </div>
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">数量</span>
                <UInput v-model.number="maxCount" type="number" class="w-20" />
            </div>
            <UCheckbox v-model="isAllowHalf" label="半星" />
            <UCheckbox v-model="isShowValue" label="显示分数" />
            <UCheckbox v-model="isDisabled" label="禁用" />
            <UCheckbox v-model="isReadonly" label="只读" />
        </div>

        <div class="grid gap-8">
            <!-- 基础 -->
            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">基础</h3>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">默认</span>
                    <RebornRate v-model="val1" :size="currentSize" :color="currentColor" :allow-half="isAllowHalf"
                        :show-value="isShowValue" :disabled="isDisabled" :readonly="isReadonly" :count="maxCount" />
                </div>
            </div>

            <!-- 自定义图标 -->
            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">自定义图标</h3>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">爱心</span>
                    <RebornRate v-model="val1" :size="currentSize" :color="currentColor" :allow-half="isAllowHalf"
                        :show-value="isShowValue" :disabled="isDisabled" :readonly="isReadonly" :count="maxCount">
                        <template #icon="{ active }">
                            <Icon name="lucide:heart" class="size-full" />
                        </template>
                    </RebornRate>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">火焰</span>
                    <RebornRate v-model="val1" :size="currentSize" :color="currentColor" :allow-half="isAllowHalf"
                        :show-value="isShowValue" :disabled="isDisabled" :readonly="isReadonly" :count="maxCount">
                        <template #icon="{ active }">
                            <Icon name="lucide:flame" class="size-full" />
                        </template>
                    </RebornRate>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">点赞</span>
                    <RebornRate v-model="val1" :size="currentSize" :color="currentColor" :allow-half="isAllowHalf"
                        :show-value="isShowValue" :disabled="isDisabled" :readonly="isReadonly" :count="maxCount">
                        <template #icon="{ active }">
                            <Icon name="lucide:thumbs-up" class="size-full" />
                        </template>
                    </RebornRate>
                </div>
            </div>

            <!-- 图片URL -->
            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">图片 URL</h3>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">自定义图片</span>
                    <RebornRate v-model="val1" :size="currentSize" :color="currentColor" :allow-half="isAllowHalf"
                        :show-value="isShowValue" :disabled="isDisabled" :readonly="isReadonly" :count="maxCount">
                        <template #icon="{ active, style }">
                            <img src="https://www.leyifan.com/favicon.ico" class="size-full object-contain"
                                :class="!active && 'opacity-30'" :style="style" />
                        </template>
                    </RebornRate>
                </div>
            </div>

            <!-- 颜色 -->
            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">颜色</h3>
                <div class="flex flex-col gap-3">
                    <RebornRate v-for="c in rateColors" :key="c" :model-value="3" :color="c" :size="currentSize" />
                </div>
            </div>
        </div>
    </div>
</template>
