<script setup lang="ts">
import { computed, ref } from 'vue'
import RebornSignature, {
    type SignatureSavePayload,
} from './RebornSignature.vue'
import type { SignatureToolbarPosition } from './reborn-signature.config'

defineOptions({
    name: 'RebornSignatureLandscape',
})

// 模块级常量，避免每次实例化重复创建
const SIGNATURE_UI = {
    toolbar: 'gap-[12rpx]',
    action: 'h-[72rpx] min-w-[184rpx] gap-[2rpx] px-[10rpx]',
    actionIcon: 'size-[32rpx]',
    actionText: 'text-[30rpx]',
} as const

const EXIT_BUTTON_BASE_CLASS = 'absolute top-[20rpx] z-[5] flex h-[64rpx] flex-row items-center justify-center gap-[6rpx] rounded-full border border-solid border-gray-3 bg-white/95 px-[30rpx] text-gray-7 shadow-sm'

export interface RebornSignatureLandscapeProps {
    /** 是否启用笔锋 */
    penPressure?: boolean
    /** 画笔宽度，单位 px */
    lineWidth?: number
    /** 笔锋最小宽度，单位 px */
    minLineWidth?: number
    /** 笔锋最大宽度，单位 px */
    maxLineWidth?: number
    /** 是否显示撤销按钮 */
    showUndo?: boolean
    /** 是否显示恢复按钮 */
    showRedo?: boolean
    /** 工具栏位置 */
    toolbarPosition?: SignatureToolbarPosition
}

const props = withDefaults(defineProps<RebornSignatureLandscapeProps>(), {
    penPressure: false,
    lineWidth: 5,
    minLineWidth: 1.2,
    maxLineWidth: 7,
    showUndo: true,
    showRedo: true,
    toolbarPosition: 'right',
})

const show = defineModel<boolean>('show', { default: false })
const modelValue = defineModel<string>({ default: '' })
// penColor 改为 defineModel，支持 v-model:pen-color 双向绑定
const currentPenColor = defineModel<string>('penColor', { default: '#111827' })

const emit = defineEmits<{
    (e: 'save', payload: SignatureSavePayload): void
    (e: 'clear'): void
    (e: 'close'): void
}>()

const landscapeSignatureRef = ref<InstanceType<typeof RebornSignature> | null>(null)

const containerStyle = computed(() => {
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
        // #ifdef H5
        paddingLeft: 'calc(var(--window-top) + 16rpx)',
        // #endif
    }
})

// isBottom 内联，不单独声明 computed
const signatureHeight = computed(() => {
    return props.toolbarPosition === 'bottom' ? 'calc(100vw - 120rpx)' : 'calc(100vw - 24rpx)'
})

const exitButtonPositionClass = computed(() => {
    return props.toolbarPosition === 'right' ? 'left-[16rpx]' : 'right-[16rpx]'
})

const exitButtonPositionStyle = computed(() => {
    if (props.toolbarPosition === 'right') {
        // #ifdef H5
        return { left: 'calc(var(--window-top) + 20rpx)' }
        // #endif
    }
    return {}
})

function close() {
    landscapeSignatureRef.value?.clear()
    show.value = false
    emit('close')
}

function onSave(payload: SignatureSavePayload) {
    modelValue.value = payload.tempFilePath
    emit('save', payload)
    show.value = false
}

function onClear() {
    emit('clear')
}

defineExpose({
    clear: () => landscapeSignatureRef.value?.clear(),
    undo: () => landscapeSignatureRef.value?.undo(),
    redo: () => landscapeSignatureRef.value?.redo(),
    save: () => landscapeSignatureRef.value?.save(),
    toPng: () => landscapeSignatureRef.value?.toPng(),
    getStrokes: () => landscapeSignatureRef.value?.getStrokes(),
    get isEmpty() { return landscapeSignatureRef.value?.isEmpty },
    get canUndo() { return landscapeSignatureRef.value?.canUndo },
    get canRedo() { return landscapeSignatureRef.value?.canRedo },
    get strokeCount() { return landscapeSignatureRef.value?.strokeCount },
    get pointCount() { return landscapeSignatureRef.value?.pointCount },
})
</script>

<template>
    <view v-show="show" class="fixed inset-0 z-[60] bg-white" @touchmove.stop.prevent>
        <view class="relative box-border flex bg-white p-[12rpx]" :style="containerStyle">
            <view :class="[EXIT_BUTTON_BASE_CLASS, exitButtonPositionClass]" :style="exitButtonPositionStyle"
                @tap="close">
                <view class="i-lucide-log-out size-[32rpx]" />
                <text class="text-[30rpx] font-medium">退出</text>
            </view>

            <RebornSignature ref="landscapeSignatureRef" v-model="modelValue" v-model:pen-color="currentPenColor"
                class="size-full" size="sm" :show-pen-colors="false" :pen-pressure="penPressure" :line-width="lineWidth"
                :min-line-width="minLineWidth" :max-line-width="maxLineWidth" :show-undo="showUndo"
                :show-redo="showRedo" :toolbar-position="toolbarPosition" :height="signatureHeight" :ui="SIGNATURE_UI"
                :rotate="90" @save="onSave" @clear="onClear" />
        </view>
    </view>
</template>