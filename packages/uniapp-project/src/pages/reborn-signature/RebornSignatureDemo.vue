<script setup lang="ts">
import { computed, ref } from 'vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornPopup from '@/components/reborn-popup/RebornPopup.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import RebornSignature, {
    type SignatureChangePayload,
    type SignatureSavePayload,
    type SignatureStroke,
} from '@/components/reborn-signature/RebornSignature.vue'

declare const plus: any

const signatureRef = ref<InstanceType<typeof RebornSignature> | null>(null)
const popupSignatureRef = ref<InstanceType<typeof RebornSignature> | null>(null)
const landscapeSignatureRef = ref<InstanceType<typeof RebornSignature> | null>(null)
const signaturePath = ref('')
const strokeCount = ref(0)
const pointCount = ref(0)
const savedAt = ref('')
const signatureImageJson = ref('')
const signatureTraceJson = ref('')
const selectedPenColor = ref('#111827')
const penColors = ['#111827', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6']
const enablePenPressure = ref(true)
const showUndoButton = ref(true)
const showRedoButton = ref(true)
const redoCount = ref(0)
const canUndo = computed(() => strokeCount.value > 0)
const canRedo = computed(() => redoCount.value > 0)
const showSignaturePopup = ref(false)
const showLandscapePopup = ref(false)
const popupSignaturePath = ref('')
const landscapeSignaturePath = ref('')
const landscapeToolbarPosition = ref<'left' | 'right' | 'bottom'>('right')
const landscapeToolbarPositions = ['left', 'right', 'bottom'] as const
// 运行时平台判断：微信小程序使用 CSS 旋转模拟横屏，APP 端使用系统级横屏锁定
const IS_MP_WEIXIN = uni.getSystemInfoSync().uniPlatform === 'mp-weixin'


// 两端均使用 CSS 旋转模拟横屏，可视高度对应 100vw（竖屏视口宽度）
const landscapeSignatureHeight = computed(() => {
    const isBottom = landscapeToolbarPosition.value === 'bottom'

    return isBottom ? 'calc(100vw - 120rpx)' : 'calc(100vw - 24rpx)'
})
const landscapeSignatureUi = {
    toolbar: 'gap-[12rpx]',
    action: 'h-[72rpx] min-w-[184rpx] gap-[2rpx] px-[10rpx]',
    actionIcon: 'size-[32rpx]',
    actionText: 'text-[30rpx]',
}

const windowInfo = uni.getWindowInfo()
const h5SafeLeft = computed(() => {
    // #ifdef H5
    return windowInfo.safeAreaInsets?.top || 0
    // #endif
    return 0
})
console.log(h5SafeLeft.value)


// 微信小程序端：使用 CSS transform 旋转容器模拟横屏，保持导航栏不变
// 旋转后容器的 CSS 逻辑尺寸为 width:100vh, height:100vw（短边为高），视觉上填满横屏
const landscapeContainerStyle = computed(() => {
    const safeLeft = h5SafeLeft.value
    return {
        position: 'fixed' as const,
        width: '100vh',
        height: '100vw',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(90deg)',
        transformOrigin: 'center center',
        backgroundColor: '#fff',
        boxSizing: 'border-box' as const,
        // paddingLeft: '100rpx',
        // #ifdef H5
        paddingLeft: 'calc(var(--window-top) + 16rpx)',
        // #endif
    }
})
const landscapeExitButtonBaseClass = 'absolute top-[20rpx] z-[5] flex h-[64rpx] flex-row items-center justify-center gap-[6rpx] rounded-full border border-solid border-gray-3 bg-white/95 px-[30rpx] text-gray-7 shadow-sm'
const landscapeExitButtonPositionClass = computed(() => {
    if (landscapeToolbarPosition.value === 'right') {
        return 'left-[16rpx]'
    }
    return 'right-[16rpx]'
})
// 新增：H5 端退出按钮的补偿 style
const landscapeExitButtonPositionStyle = computed(() => {
    if (landscapeToolbarPosition.value === 'right') {
        // #ifdef H5
        return { left: 'calc(var(--window-top) + 20rpx)' }
        // #endif
    }
    return {}
})

const actionClass = 'h-[64rpx] min-w-[128rpx] flex flex-row items-center justify-center gap-[8rpx] rounded-full border border-solid border-transparent bg-primary/10 px-[24rpx] text-primary transition-all duration-200'
const actionIconClass = 'size-[30rpx]'
const actionTextClass = 'text-[26rpx] font-medium'
const activeHistoryActionClass = 'border-primary bg-primary/10 text-primary'
const inactiveHistoryActionClass = 'border-gray-3 bg-white text-gray-4 opacity-50'
const penColorButtonClass = 'size-[52rpx] rounded-full ring-2 ring-transparent ring-offset-[4rpx] ring-offset-white transition-all duration-200'
const activePenColorButtonClass = 'scale-110 ring-gray-4'
const inactivePenColorButtonClass = 'opacity-90'

const statusText = computed(() => {
    if (!signaturePath.value) {
        return '未保存'
    }
    return '已保存'
})

function onChange(payload: SignatureChangePayload) {
    strokeCount.value = payload.strokes.length
    pointCount.value = payload.strokes.reduce((total, stroke) => total + stroke.points.length, 0)
}

function updateSignatureRecord(payload: SignatureSavePayload) {
    signaturePath.value = payload.tempFilePath
    savedAt.value = new Date().toLocaleTimeString()
    strokeCount.value = payload.strokes.length
    pointCount.value = payload.strokes.reduce((total, stroke) => total + stroke.points.length, 0)
    signatureImageJson.value = JSON.stringify({
        tempFilePath: payload.tempFilePath,
    }, null, 2)
    signatureTraceJson.value = JSON.stringify({
        strokes: payload.strokes,
        isEmpty: payload.isEmpty,
    }, null, 2)
}

function onSave(payload: SignatureSavePayload) {
    updateSignatureRecord(payload)
}

function onStart() {
    redoCount.value = 0
}

function onUndo(stroke: SignatureStroke | undefined) {
    if (stroke) {
        redoCount.value += 1
    }
}

function onRedo(stroke: SignatureStroke | undefined) {
    if (stroke) {
        redoCount.value = Math.max(0, redoCount.value - 1)
    }
}

function clearSignature() {
    signatureRef.value?.clear()
    signaturePath.value = ''
    savedAt.value = ''
    signatureImageJson.value = ''
    signatureTraceJson.value = ''
    redoCount.value = 0
}

function undoSignature() {
    signatureRef.value?.undo()
    signaturePath.value = ''
    savedAt.value = ''
    signatureImageJson.value = ''
    signatureTraceJson.value = ''
}

function redoSignature() {
    signatureRef.value?.redo()
    signaturePath.value = ''
    savedAt.value = ''
    signatureImageJson.value = ''
    signatureTraceJson.value = ''
}

async function saveSignature() {
    await signatureRef.value?.save()
}

function openSignaturePopup() {
    showSignaturePopup.value = true
}

function onPopupSave(payload: SignatureSavePayload) {
    popupSignaturePath.value = payload.tempFilePath
    updateSignatureRecord(payload)
    showSignaturePopup.value = false
}

function resetPopupSignature() {
    popupSignatureRef.value?.clear()
    popupSignaturePath.value = ''
}

function lockLandscape() {
    // 两端均使用 CSS transform 旋转容器模拟横屏，无需锁定系统方向
}

function unlockLandscape() {
    // 无需解锁
}

function openLandscapeSignature() {
    showLandscapePopup.value = true
    lockLandscape()
}

function closeLandscapeSignature() {
    resetLandscapeSignature()
    showLandscapePopup.value = false
}

function onLandscapeSave(payload: SignatureSavePayload) {
    landscapeSignaturePath.value = payload.tempFilePath
    updateSignatureRecord(payload)
    closeLandscapeSignature()
}

function resetLandscapeSignature() {
    landscapeSignatureRef.value?.clear()
    landscapeSignaturePath.value = ''
    unlockLandscape()
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
                        :variant="landscapeToolbarPosition === item ? 'solid' : 'outline'"
                        :color="landscapeToolbarPosition === item ? 'primary' : 'neutral'"
                        @tap="landscapeToolbarPosition = item">
                        {{ item }}
                    </RebornButton>
                </view>
            </view>
        </RebornCard>

        <RebornCard title="基础用法" custom-class="gap-[24rpx]">
            <RebornSignature ref="signatureRef" v-model="signaturePath" :show-toolbar="false"
                :pen-color="selectedPenColor" :pen-colors="penColors" :pen-pressure="enablePenPressure" :line-width="5"
                :min-line-width="1.2" :max-line-width="7" :show-undo="showUndoButton" :show-redo="showRedoButton"
                @start="onStart" @change="onChange" @undo="onUndo" @redo="onRedo" @save="onSave" />

            <view class="flex flex-row flex-wrap items-center justify-end gap-[16rpx]">
                <view v-if="showUndoButton"
                    :class="[actionClass, canUndo ? activeHistoryActionClass : inactiveHistoryActionClass]"
                    @tap="undoSignature">
                    <view :class="[actionIconClass, 'i-lucide-undo-2']" />
                    <text :class="actionTextClass">撤销</text>
                </view>

                <view v-if="showRedoButton"
                    :class="[actionClass, canRedo ? activeHistoryActionClass : inactiveHistoryActionClass]"
                    @tap="redoSignature">
                    <view :class="[actionIconClass, 'i-lucide-redo-2']" />
                    <text :class="actionTextClass">恢复</text>
                </view>

                <view :class="[actionClass, !canUndo && 'opacity-50']" @tap="clearSignature">
                    <view :class="[actionIconClass, 'i-lucide-eraser']" />
                    <text :class="actionTextClass">清空</text>
                </view>

                <view :class="actionClass" @tap="saveSignature">
                    <view :class="[actionIconClass, 'i-lucide-check']" />
                    <text :class="actionTextClass">保存签名</text>
                </view>
            </view>
        </RebornCard>

        <RebornCard title="签名记录" custom-class="gap-[20rpx]">
            <view class="flex flex-row items-center justify-between">
                <text class="text-[28rpx] text-gray-5">状态</text>
                <text class="text-[28rpx] font-medium text-gray-8">{{ statusText }}</text>
            </view>
            <view class="flex flex-row items-center justify-between">
                <text class="text-[28rpx] text-gray-5">笔画</text>
                <text class="text-[28rpx] font-medium text-gray-8">{{ strokeCount }}</text>
            </view>
            <view class="flex flex-row items-center justify-between">
                <text class="text-[28rpx] text-gray-5">采样点</text>
                <text class="text-[28rpx] font-medium text-gray-8">{{ pointCount }}</text>
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
            <RebornButton color="primary" @tap="openLandscapeSignature">
                使用横屏签名
            </RebornButton>
        </RebornCard>

        <RebornPopup v-model="showSignaturePopup" position="bottom" title="签名板" size="78%" color="primary"
            :close-on-click-modal="false" :swipe-close="false" @closed="resetPopupSignature">
            <view class="flex h-full flex-col gap-[24rpx] bg-white px-[28rpx] pb-[32rpx] pt-[12rpx]">
                <RebornSignature ref="popupSignatureRef" v-model="popupSignaturePath" :show-pen-colors="false"
                    :pen-color="selectedPenColor" :pen-pressure="enablePenPressure" :line-width="5"
                    :min-line-width="1.2" :max-line-width="7" :show-undo="showUndoButton" :show-redo="showRedoButton"
                    height="420rpx" @save="onPopupSave" />
            </view>
        </RebornPopup>

        <view v-if="showLandscapePopup" class="fixed inset-0 z-[60] bg-white" @touchmove.stop.prevent>
            <!-- 两端均使用 CSS transform 旋转容器模拟横屏，导航栏不受影响 -->
            <view class="relative box-border flex bg-white p-[12rpx]" :style="landscapeContainerStyle">
                <view :class="[landscapeExitButtonBaseClass, landscapeExitButtonPositionClass]"
                    :style="landscapeExitButtonPositionStyle" @tap="closeLandscapeSignature">
                    <view class="i-lucide-log-out size-[32rpx]" />
                    <text class="text-[30rpx] font-medium">退出</text>
                </view>
                <RebornSignature ref="landscapeSignatureRef" v-model="landscapeSignaturePath" class="size-full"
                    size="sm" :show-pen-colors="false" :pen-color="selectedPenColor" :pen-pressure="enablePenPressure"
                    :line-width="5" :min-line-width="1.2" :max-line-width="7" :show-undo="showUndoButton"
                    :show-redo="showRedoButton" :toolbar-position="landscapeToolbarPosition"
                    :height="landscapeSignatureHeight" :ui="landscapeSignatureUi" :rotate="90"
                    @save="onLandscapeSave" />
            </view>
        </view>
    </RebornPage>
</template>
