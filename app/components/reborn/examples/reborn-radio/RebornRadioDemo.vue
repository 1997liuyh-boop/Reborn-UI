<script setup lang="ts">
import RebornRadio from "~/components/reborn/ui/reborn-radio/RebornRadio.vue";
import { radioColors, radioSizes } from "~/components/reborn/ui/reborn-radio/reborn-radio.config";

const size = ref<any>("md");
const color = ref<any>("primary");
const selected = ref("apple");
const selected2 = ref("�");
const selected3 = ref("sun");
const disabled = ref(false);

const fruits = [
    { value: "apple", label: "苹果" },
    { value: "banana", label: "香蕉" },
    { value: "orange", label: "橘子" },
    { value: "grape", label: "葡萄" },
];

const emojis = [
    { value: "😀", label: "开心" },
    { value: "😍", label: "喜欢" },
    { value: "🤔", label: "思考" },
    { value: "🎉", label: "庆祝" },
];

const themes = [
    { value: "sun", label: "浅色", icon: "lucide:sun" },
    { value: "moon", label: "深色", icon: "lucide:moon" },
    { value: "monitor", label: "系统", icon: "lucide:monitor" },
];
</script>

<template>
    <div class="flex w-full flex-col gap-10">
        <div
            class="flex flex-wrap items-center gap-6 rounded-lg border bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">尺寸</span>
                <USelect v-model="size" :items="[...radioSizes]" class="w-28" />
            </div>
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">颜色</span>
                <USelect v-model="color" :items="[...radioColors]" class="w-28" />
            </div>
            <UCheckbox v-model="disabled" label="禁用" />
        </div>

        <div class="grid gap-8">
            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">基础</h3>
                <div class="flex flex-wrap gap-4">
                    <RebornRadio v-for="fruit in fruits" :key="fruit.value" v-model="selected" :value="fruit.value"
                        :label="fruit.label" :size="size" :color="color" :disabled="disabled" />
                </div>
                <p class="text-sm text-gray-500">选中: {{ selected }}</p>
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">颜色</h3>
                <div class="flex flex-wrap gap-4">
                    <RebornRadio v-for="c in radioColors" :key="c" v-model="color" :value="c" :label="c" :color="c"
                        :size="size" />
                </div>
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">自定义图标 (activeIcon prop)</h3>
                <div class="flex flex-wrap gap-4">
                    <RebornRadio v-for="t in themes" :key="t.value" v-model="selected3" :value="t.value"
                        :label="t.label" :active-icon="t.icon" :inactive-icon="t.icon" :size="size" :color="color" />
                </div>
                <p class="text-sm text-gray-500">选中: {{ selected3 }}</p>
            </div>

            <div class="space-y-4">
                <h3 class="text-base font-medium text-gray-400 dark:text-gray-500">自定义插槽 (Slot)</h3>
                <div class="flex flex-wrap gap-4">
                    <RebornRadio v-for="e in emojis" :key="e.value" v-model="selected2" :value="e.value"
                        :label="e.label" :size="size" :color="color">
                        <template #active-icon>
                            <span class="text-lg">{{ e.value }}</span>
                        </template>
                        <template #inactive-icon>
                            <span class="text-lg opacity-30">{{ e.value }}</span>
                        </template>
                    </RebornRadio>
                </div>
                <p class="text-sm text-gray-500">选中: {{ selected2 }}</p>
            </div>
        </div>
    </div>
</template>
