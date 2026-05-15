<script setup lang="ts">
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornOverlay from '@/components/reborn-overlay/RebornOverlay.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import pinyin from './components/pinyin.vue'
import { ref } from 'vue'
const show = ref(false)
const show2 = ref(false)
const closeOnClickOverlay = ref(true)
</script>
<template>
    <RebornPage title="Overlay 遮罩层" description="创建一个遮罩层，用于强调特定的页面元素，并阻止用户进行其他操作。">
        <RebornCard custom-class="flex flex-col gap-4">
            <RebornSwitch v-model="closeOnClickOverlay" active-label="允许直接关闭" inactive-label="不允许直接关闭" />
            <ReButton v-if="closeOnClickOverlay" block @click="show = true">显示遮罩层</ReButton>
            <ReButton block @click="show2 = true">嵌入内容</ReButton>
        </RebornCard>
        <reborn-overlay v-model="show" :closeOnClickOverlay="closeOnClickOverlay" />
        <reborn-overlay v-model="show2" :closeOnClickOverlay="closeOnClickOverlay">
            <view class="h-full w-full flex justify-center items-center">
                <scroll-view
                    scroll-y
                    class="relative box-border h-3/4 w-3/4 mx-auto rounded-xl bg-white shadow-2xl"
                    @touchmove.stop>
                    <view
                        class="absolute right-4 top-4 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-all active:scale-95 hover:bg-gray-200"
                        @click="show2 = false">
                        <view class="i-lucide-x size-6 text-gray-600" />
                    </view>
                    <view class="p-6">
                        <pinyin />
                    </view>
                </scroll-view>
            </view>
        </reborn-overlay>
    </RebornPage>
</template>
