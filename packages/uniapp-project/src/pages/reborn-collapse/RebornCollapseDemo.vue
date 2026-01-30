<script lang="ts" setup>
import { ref } from "vue";

import RebornPage from "@/components/reborn-page/RebornPage.vue";
import RebornCard from "@/components/reborn-card/RebornCard.vue";
import RebornButton from "@/components/reborn-button/RebornButton.vue";
import RebornCollapse from "@/components/reborn-collapse/RebornCollapse.vue";
// demo组件
import Pinyin from "./components/pinyin.vue";


const visible = ref(false);
const collapseRef = ref<InstanceType<typeof RebornCollapse> | null>(null);


function toggle() {
    collapseRef.value?.toggle?.();
}
</script>

<template>
    <RebornPage title="Collapse" description="折叠面板组件用于展示和隐藏内容区域，支持平滑的展开收起动画效果，常用于 FAQ、详情展示等场景。">
        <RebornCard title="基本用法">

            <RebornCollapse v-model="visible">
                <template #default="{ open }">
                    <view
                        class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors active:bg-slate-100 dark:active:bg-slate-700 select-none">
                        <text class="text-sm font-semibold text-slate-700 dark:text-white">春江花月夜</text>
                        <view class="i-lucide-chevron-down size-5 text-slate-500 transition-transform duration-200"
                            :class="{ 'rotate-180': open }" />
                    </view>
                </template>
                <template #content>
                    <Pinyin />
                </template>
            </RebornCollapse>
        </RebornCard>

        <RebornCard title="ref 方式调用">
            <RebornButton @click="toggle">切换状态</RebornButton>

            <RebornCollapse ref="collapseRef" :ui="{ content: 'pt-4' }">
                <template #content>
                    <Pinyin />
                </template>
            </RebornCollapse>
        </RebornCard>
    </RebornPage>
</template>
