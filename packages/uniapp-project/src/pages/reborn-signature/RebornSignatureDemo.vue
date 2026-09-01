<script setup lang="ts">
import { ref } from 'vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornPopup from '@/components/reborn-popup/RebornPopup.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import RebornSignature, { type SignatureSavePayload } from '@/components/reborn-signature/RebornSignature.vue'
import RebornSignatureLandscape from '@/components/reborn-signature/RebornSignatureLandscape.vue'

const signatureRef = ref<InstanceType<typeof RebornSignature> | null>(null)
const signaturePath = ref('')
const savedAt = ref('')
const signatureImageJson = ref('')
const signatureTraceJson = ref('')
const selectedPenColor = ref('#111827')
const penColors = ['#111827', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6']
const enablePenPressure = ref(true)
const showUndoButton = ref(true)
const showRedoButton = ref(true)
const showSignaturePopup = ref(false)
const popupSignaturePath = ref('')
const showLandscapePopup = ref(false)
const landscapeToolbarPosition = ref<'left' | 'right' | 'bottom'>('right')
const landscapeToolbarPositions = ['left', 'right', 'bottom'] as const

const penColorButtonClass = 'size-[52rpx] rounded-full ring-2 ring-transparent ring-offset-[4rpx] ring-offset-white transition-all duration-200'
const activePenColorButtonClass = 'scale-110 ring-gray-4'
const inactivePenColorButtonClass = 'opacity-90'

function updateSignatureRecord(payload: SignatureSavePayload) {
    signaturePath.value = payload.tempFilePath
    savedAt.value = new Date().toLocaleTimeString()
    signatureImageJson.value = JSON.stringify({
        tempFilePath: payload.tempFilePath,
    }, null, 2)
    signatureTraceJson.value = JSON.stringify({
        strokes: payload.strokes,
        isEmpty: payload.isEmpty,
    }, null, 2)
}

function onClear() {
    signaturePath.value = ''
    savedAt.value = ''
    signatureImageJson.value = ''
    signatureTraceJson.value = ''
}

function openSignaturePopup() {
    popupSignaturePath.value = signaturePath.value
    showSignaturePopup.value = true
}

function closeSignaturePopup() {
    showSignaturePopup.value = false
}

function updatePopupSignatureRecord(payload: SignatureSavePayload) {
    popupSignaturePath.value = payload.tempFilePath
    updateSignatureRecord(payload)
}
</script>

<template>
    <RebornPage title="签名" description="用于采集、记录和导出用户手写签名。">
        <RebornCard title="调试配置" custom-class="gap-[24rpx]">
            <view class="flex flex-row items-center justify-between gap-[24rpx]">
                <text class="text-[28rpx] text-gray-6">画笔颜色</text>
                <view class="flex flex-row flex-wrap justify-end gap-[12rpx]">
                    <view v-for="item in penColors" :key="item" :class="[
                        penColorButtonClass,
                        selectedPenColor === item ? activePenColorButtonClass : inactivePenColorButtonClass,
                    ]" :style="{ backgroundColor: item }" @tap="selectedPenColor = item" />
                </view>
            </view>

            <view class="flex flex-row items-center justify-between gap-[24rpx]">
                <text class="text-[28rpx] text-gray-6">笔锋</text>
                <RebornSwitch v-model="enablePenPressure" size="sm" />
            </view>

            <view class="flex flex-row items-center justify-between gap-[24rpx]">
                <text class="text-[28rpx] text-gray-6">撤销按钮</text>
                <RebornSwitch v-model="showUndoButton" size="sm" />
            </view>

            <view class="flex flex-row items-center justify-between gap-[24rpx]">
                <text class="text-[28rpx] text-gray-6">恢复按钮</text>
                <RebornSwitch v-model="showRedoButton" size="sm" />
            </view>

            <view class="flex flex-row items-center justify-between gap-[24rpx]">
                <text class="text-[28rpx] text-gray-6">横屏按钮位置</text>
                <view class="flex flex-row flex-wrap justify-end gap-[12rpx]">
                    <RebornButton v-for="item in landscapeToolbarPositions" :key="item" size="sm"
                        :variant="landscapeToolbarPosition === item ? 'filled' : 'outlined'"
                        :color="landscapeToolbarPosition === item ? 'primary' : 'neutral'"
                        @tap="landscapeToolbarPosition = item">
                        {{ item }}
                    </RebornButton>
                </view>
            </view>
        </RebornCard>

        <RebornCard title="基础用法" custom-class="gap-[24rpx]">
            <RebornSignature ref="signatureRef" v-model="signaturePath" :pen-color="selectedPenColor"
                :pen-colors="penColors" :pen-pressure="enablePenPressure" :line-width="5" :min-line-width="1.2"
                :max-line-width="7" :show-undo="showUndoButton" :show-redo="showRedoButton" @clear="onClear"
                @save="updateSignatureRecord" />
        </RebornCard>

        <RebornCard title="签名记录" custom-class="gap-[20rpx]">
            <view class="flex flex-row items-center justify-between">
                <text class="text-[28rpx] text-gray-5">状态</text>
                <text class="text-[28rpx] font-medium text-gray-8">{{ signaturePath ? '已保存' : '未保存' }}</text>
            </view>
            <view class="flex flex-row items-center justify-between">
                <text class="text-[28rpx] text-gray-5">笔画</text>
                <text class="text-[28rpx] font-medium text-gray-8">{{ signatureRef?.strokeCount ?? 0 }}</text>
            </view>
            <view class="flex flex-row items-center justify-between">
                <text class="text-[28rpx] text-gray-5">采样点</text>
                <text class="text-[28rpx] font-medium text-gray-8">{{ signatureRef?.pointCount ?? 0 }}</text>
            </view>
            <view v-if="savedAt" class="flex flex-row items-center justify-between">
                <text class="text-[28rpx] text-gray-5">保存时间</text>
                <text class="text-[28rpx] font-medium text-gray-8">{{ savedAt }}</text>
            </view>
            <image v-if="signaturePath" :src="signaturePath" mode="aspectFit"
                class="h-[240rpx] w-full rounded-lg bg-white ring-1 ring-gray-3" />
            <view v-if="signatureImageJson" class="flex flex-col gap-[12rpx]">
                <text class="text-[28rpx] font-medium text-gray-8">save() 导出图片</text>
                <scroll-view scroll-y class="h-[320rpx] w-full rounded-lg border border-solid border-gray-3 bg-gray-2">
                    <view class="box-border w-full p-[20rpx]">
                        <text
                            class="block w-full max-w-full whitespace-pre-wrap break-all text-[22rpx] leading-[32rpx] text-gray-7"
                            style="word-break: break-all; overflow-wrap: anywhere;">{{ signatureImageJson }}</text>
                    </view>
                </scroll-view>
            </view>
            <view v-if="signatureTraceJson" class="flex flex-col gap-[12rpx]">
                <text class="text-[28rpx] font-medium text-gray-8">getStrokes() 轨迹数据</text>
                <scroll-view scroll-y class="h-[320rpx] w-full rounded-lg border border-solid border-gray-3 bg-gray-2">
                    <view class="box-border w-full p-[20rpx]">
                        <text
                            class="block w-full max-w-full whitespace-pre-wrap break-all text-[22rpx] leading-[32rpx] text-gray-7"
                            style="word-break: break-all; overflow-wrap: anywhere;">{{ signatureTraceJson }}</text>
                    </view>
                </scroll-view>
            </view>
        </RebornCard>

        <RebornCard title="弹窗签名" custom-class="gap-[20rpx]">
            <RebornButton color="primary" @tap="openSignaturePopup">
                打开签名板
            </RebornButton>
        </RebornCard>

        <RebornCard title="横屏签名" custom-class="gap-[20rpx]">
            <RebornButton color="primary" @tap="showLandscapePopup = true">
                使用横屏签名
            </RebornButton>
        </RebornCard>

        <RebornPopup v-model="showSignaturePopup" position="bottom" title="签名板" size="78%" color="primary"
            :close-on-click-modal="false" :swipe-close="false">
            <view class="flex h-full flex-col gap-[24rpx] bg-white px-[28rpx] pb-[32rpx] pt-[12rpx]">
                <RebornSignature v-model="popupSignaturePath" v-model:pen-color="selectedPenColor" :show-pen-colors="false"
                    :pen-pressure="enablePenPressure" :line-width="5" :min-line-width="1.2" :max-line-width="7"
                    :show-undo="showUndoButton" :show-redo="showRedoButton" height="420rpx" :close-on-save="true"
                    @save="updatePopupSignatureRecord" @close="closeSignaturePopup" />
            </view>
        </RebornPopup>

        <RebornSignatureLandscape v-model="signaturePath" v-model:show="showLandscapePopup"
            :pen-color="selectedPenColor" :pen-pressure="enablePenPressure" :show-undo="showUndoButton"
            :show-redo="showRedoButton" :toolbar-position="landscapeToolbarPosition" @save="updateSignatureRecord" />
    </RebornPage>
</template>
