<script lang="ts" setup>
/**
 * reborn-draggable 拖拽排序组件演示页面
 */
import { ref } from "vue";
import RebornDraggable from "@/components/reborn-draggable/RebornDraggable.vue";
import RebornPage from "@/components/reborn-page/RebornPage.vue";
import RebornCard from "@/components/reborn-card/RebornCard.vue";

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
    { name: "B", color: "bg-pink-500" },
    { name: "C", color: "bg-indigo-500" },
    { name: "D", color: "bg-cyan-500", disabled: true },
    { name: "E", color: "bg-teal-500" },
    { name: "F", color: "bg-orange-500" },
]);

/**
 * 拖拽开始说明
 */
function onStart(index: number) {
    console.log("开始拖拽:", index);
    
}

/**
 * 拖拽结束说明
 */
function onEnd(index: number) {
    console.log("结束拖拽:", index);
    
}

/**
 * 数据变化说明
 */
function onChange(newList: any[]) {
    console.log("数据已更新:", newList);
}
</script>

<template>
    <reborn-page title="Draggable" description="拖拽排序组件，支持列表和网格布局。">
        <reborn-card title="单列排序 (长按触发)">
            <view class="p-4">
                <reborn-draggable v-model="list1" @start="onStart" @end="onEnd" @change="onChange">
                    <template #item="{ item }">
                        <view class="flex h-[80rpx] items-center rounded-lg px-4 text-white shadow-sm"
                            :class="item.color">
                            {{ item.name }}
                        </view>
                    </template>
                </reborn-draggable>
            </view>
        </reborn-card>

        <reborn-card title="单列排序 (不需要长按)">
            <view class="p-4">
                <reborn-draggable v-model="list2" :long-press="false">
                    <template #item="{ item }">
                        <view class="flex h-[80rpx] items-center rounded-lg px-4 text-white shadow-sm" :class="[
                            { 'opacity-50': item['disabled'] },
                            item.color
                        ]">
                            {{ item.name }}
                        </view>
                    </template>
                </reborn-draggable>
            </view>
        </reborn-card>

        <reborn-card title="多列排序">
            <view class="p-4">
                <reborn-draggable v-model="list2" :columns="3" :long-press="false">
                    <template #item="{ item }">
                        <view class="flex flex-row items-center justify-center p-3 rounded-lg text-white" :class="[
                            { 'opacity-50': item['disabled'] },
                            item.color
                        ]">
                            {{ item.name }}
                        </view>
                    </template>
                </reborn-draggable>
            </view>
        </reborn-card>

        <!-- 禁用状态 -->
        <reborn-card title="禁用状态">
            <view class="p-4">
                <reborn-draggable v-model="list1" disabled>
                    <template #item="{ item }">
                        <view class="flex h-[80rpx] items-center rounded-lg px-4 text-white shadow-sm"
                            :class="item.color">
                            {{ item.name }} (禁用)
                        </view>
                    </template>
                </reborn-draggable>
            </view>
        </reborn-card>
    </reborn-page>
</template>

<style scoped>
/* 页面特定样式 */
</style>
