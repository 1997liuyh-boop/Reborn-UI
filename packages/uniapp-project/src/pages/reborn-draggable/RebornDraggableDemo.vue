<script lang="ts" setup>
/**
 * RebornDraggable 拖拽排序组件演示页面
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

// 「不需要长按」与「禁用状态」两张卡片各自持有一份拷贝：
// v-model 会整体替换数组，共用 list1 / list2 时拖动一处，其他示例也跟着换序
const noPressList = ref(list2.value.map(item => ({ ...item })))
const disabledList = ref(list1.value.map(item => ({ ...item })))

/**
 * 拖拽开始说明
 */
function onStart(index: number) {
    uni.showToast({ title: `开始拖拽：${index + 1}`, icon: 'none' });
    
}

/**
 * 拖拽结束说明
 */
function onEnd(index: number) {
    uni.showToast({ title: `结束拖拽：${index + 1}`, icon: 'none' });
    
}

/**
 * 数据变化说明
 */
function onChange(newList: any[]) {
    uni.showToast({ title: `已更新 ${newList.length} 项排序`, icon: 'none' });
}
</script>

<template>
    <RebornPage title="Draggable" description="拖拽排序组件，支持列表和网格布局。">
        <RebornCard title="单列排序 (长按触发)">
            <view class="p-4">
                <RebornDraggable v-model="list1" @start="onStart" @end="onEnd" @change="onChange">
                    <template #item="{ item }">
                        <view class="flex h-[80rpx] items-center rounded-lg px-4 text-white shadow-sm"
                            :class="item.color">
                            {{ item.name }}
                        </view>
                    </template>
                </RebornDraggable>
            </view>
        </RebornCard>

        <RebornCard title="单列排序 (不需要长按)">
            <view class="p-4">
                <RebornDraggable v-model="noPressList" :long-press="false">
                    <template #item="{ item }">
                        <view class="flex h-[80rpx] items-center rounded-lg px-4 text-white shadow-sm" :class="[
                            { 'opacity-50': item['disabled'] },
                            item.color
                        ]">
                            {{ item.name }}
                        </view>
                    </template>
                </RebornDraggable>
            </view>
        </RebornCard>

        <RebornCard title="多列排序">
            <view class="p-4">
                <RebornDraggable v-model="list2" :columns="3" :long-press="false">
                    <template #item="{ item }">
                        <view class="flex flex-row items-center justify-center p-3 rounded-lg text-white" :class="[
                            { 'opacity-50': item['disabled'] },
                            item.color
                        ]">
                            {{ item.name }}
                        </view>
                    </template>
                </RebornDraggable>
            </view>
        </RebornCard>

        <!-- 禁用状态 -->
        <RebornCard title="禁用状态">
            <view class="p-4">
                <RebornDraggable v-model="disabledList" disabled>
                    <template #item="{ item }">
                        <view class="flex h-[80rpx] items-center rounded-lg px-4 text-white shadow-sm"
                            :class="item.color">
                            {{ item.name }} (禁用)
                        </view>
                    </template>
                </RebornDraggable>
            </view>
        </RebornCard>
    </RebornPage>
</template>
