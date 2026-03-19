<script lang="ts" setup>
import { ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornFab from '@/components/reborn-fab/RebornFab.vue'
import RebornFabAction from '@/components/reborn-fab/RebornFabAction.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornText from '@/components/reborn-text/RebornText.vue'
import { fabColors, fabDirections } from '@/components/reborn-fab/reborn-fab.config'

const active1 = ref(false)
const defaultActive = ref(false)
const draggable = ref(true)
const useTriggerSlot = ref(false)
const demoColor = ref<any>('primary')
const demoDirection = ref<any>('top')

function handleClick() {
    uni.showToast({ title: '点击了主按钮', icon: 'none' })
}

function handleCustomClick() {
    uni.showToast({ title: '触发了自定义分享', icon: 'none' })
}

function handleAction(name: string) {
    uni.showToast({ title: '点击了动作: ' + name, icon: 'none' })
}
</script>

<template>
    <RebornPage title="Fab 悬浮按钮" description="悬浮在页面固定位置的按钮，点按可触发主要操作。">

        <RebornCard title="配置演示">
            <RebornText color="neutral">主题颜色</RebornText>
            <view class="flex flex-wrap gap-2">
                <view v-for="c in fabColors" :key="c"
                    class="size-6 rounded-full border-2 border-transparent transition-all"
                    :class="[demoColor === c ? 'scale-110 !border-slate-400' : '', `bg-${c}`]"
                    :style="{ backgroundColor: `var(--color-${c})` }" @tap="demoColor = c" />
            </view>

            <RebornText color="neutral">展开方向 (仅展开模式生效)</RebornText>
            <RebornRadioGroup v-model="demoDirection">
                <RebornRadio v-for="d in fabDirections" :key="d" :value="d">{{ d }}</RebornRadio>
            </RebornRadioGroup>

            <view class="flex items-center justify-between">
                <RebornText color="neutral">默认展开 (activeProp)</RebornText>
                <RebornSwitch v-model="defaultActive" />
            </view>

            <view class="flex items-center justify-between">
                <RebornText color="neutral">开启拖拽</RebornText>
                <RebornSwitch v-model="draggable" />
            </view>

            <view class="flex items-center justify-between">
                <RebornText color="neutral">自定义触发器 (Slot)</RebornText>
                <RebornSwitch v-model="useTriggerSlot" />
            </view>

            <view class="p-4 bg-gray-50 rounded italic text-sm text-gray-400">
                提示：开启拖拽后移动至左右边缘会自动切换方向。当方向变化时，菜单会自动收起。
            </view>
        </RebornCard>

        <!-- 演示组件 -->
        <RebornFab v-if="!useTriggerSlot" v-model="active1" :active="defaultActive" :color="demoColor"
            :draggable="draggable" :direction="demoDirection" expandable @click="handleClick">
            <RebornFabAction icon="i-lucide-share-2" color="#007aff" @click="handleAction('分享')" />
            <RebornFabAction icon="i-lucide-star" color="#ff9500" @click="handleAction('收藏')" />
            <RebornFabAction icon="i-lucide-download" color="#4cd964" @click="handleAction('下载')" />
        </RebornFab>

        <RebornFab v-else position="left-bottom" :draggable="draggable" :expandable="false">
            <template #trigger>
                <view
                    class="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-error text-white rounded-full shadow-lg active:scale-95 transition-transform"
                    @tap="handleCustomClick">
                    <view class="i-lucide-share-2 text-32" />
                    <text class="text-28">分享给朋友</text>
                </view>
            </template>
        </RebornFab>

    </RebornPage>
</template>
