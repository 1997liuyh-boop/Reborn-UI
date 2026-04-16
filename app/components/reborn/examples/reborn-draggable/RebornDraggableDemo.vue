<script lang="ts" setup>
import { ref } from "vue";

// 基础数据
const list1 = ref([
    { name: "项目 1", color: "bg-red-500" },
    { name: "项目 2", color: "bg-blue-500" },
    { name: "项目 3", color: "bg-green-500" },
    { name: "项目 4", color: "bg-yellow-500" },
]);

// 网格数据
const list2 = ref([
    { name: "A", color: "bg-purple-500" },
    { name: "B", color: "bg-pink-500", disabled: true },
    { name: "C", color: "bg-indigo-500" },
    { name: "D", color: "bg-cyan-500", disabled: true },
    { name: "E", color: "bg-teal-500" },
    { name: "F", color: "bg-orange-500" },
]);

function onStart(payload: any) {
    console.log("开始拖拽:", payload);
}

function onEnd(index?: number) {
    console.log("结束拖拽:", index);
}

function onChange(newList: any[]) {
    console.log("数据已更新:", newList);
}
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-4">
            <h3 class="text-lg font-medium">基本使用</h3>
            <div class="rounded-xl border bg-card text-card-foreground shadow p-4">
                <RebornDraggable v-model="list1" @start="onStart" @end="onEnd" @change="onChange">
                    <template #item="{ item }">
                        <div class="flex h-16 items-center rounded-lg px-4 text-white shadow-sm" :class="item.color">
                            {{ item.name }}
                        </div>
                    </template>
                </RebornDraggable>
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-medium">禁用部分项目 (网格)</h3>
            <div class="rounded-xl border bg-card text-card-foreground shadow p-4">
                <!-- 注意：在 Web 端我们用 CSS 网格实现多列，可以在 config 中调整 root class，这里我们直接传递自定义 class 也可以 -->
                <RebornDraggable v-model="list2" className="flex flex-wrap gap-2">
                    <template #item="{ item }">
                        <div class="flex h-16 w-16 items-center justify-center rounded-lg text-white shadow-sm" :class="[
                            { 'opacity-50 cursor-not-allowed': item.disabled },
                            item.color
                        ]">
                            {{ item.name }}
                        </div>
                    </template>
                </RebornDraggable>
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-medium">全部禁用</h3>
            <div class="rounded-xl border bg-card text-card-foreground shadow p-4">
                <RebornDraggable v-model="list1" disabled>
                    <template #item="{ item }">
                        <div class="mb-2 flex h-16 items-center rounded-lg px-4 text-white shadow-sm opacity-60"
                            :class="item.color">
                            {{ item.name }} (禁用)
                        </div>
                    </template>
                </RebornDraggable>
            </div>
        </div>
    </div>
</template>
