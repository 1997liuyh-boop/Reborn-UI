<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getSafeAreaBottomInset } from '@/lib/device'
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
const landscapeSignatureValue = ref('')
const signing = ref(false)
const deviceBottomSafeAreaInset = ref(0)

// #ifdef H5
/** H5 可视视口（iOS Safari 底部标签栏显隐时 100vh 不会同步收缩） */
const visualViewportWidth = ref(0)
const visualViewportHeight = ref(0)
const visualViewportOffsetTop = ref(0)
const visualViewportOffsetLeft = ref(0)

function syncVisualViewport(options?: { force?: boolean }) {
    if (typeof window === 'undefined') {
        return
    }

    // iOS Safari 正在书写时可能收起浏览器工具栏，持续同步会让横屏容器在笔画中途重排。
    if (show.value && signing.value && !options?.force && visualViewportHeight.value > 0) {
        return
    }

    const viewport = window.visualViewport
    if (viewport) {
        visualViewportWidth.value = viewport.width
        visualViewportHeight.value = viewport.height
        visualViewportOffsetTop.value = viewport.offsetTop
        visualViewportOffsetLeft.value = viewport.offsetLeft
        return
    }

    visualViewportWidth.value = window.innerWidth
    visualViewportHeight.value = window.innerHeight
    visualViewportOffsetTop.value = 0
    visualViewportOffsetLeft.value = 0
}

function handleVisualViewportChange() {
    syncVisualViewport()
}

function bindVisualViewportListeners() {
    syncVisualViewport({ force: true })
    window.visualViewport?.addEventListener('resize', handleVisualViewportChange)
    window.addEventListener('resize', handleVisualViewportChange)
    window.addEventListener('orientationchange', handleVisualViewportChange)
}

function unbindVisualViewportListeners() {
    window.visualViewport?.removeEventListener('resize', handleVisualViewportChange)
    window.removeEventListener('resize', handleVisualViewportChange)
    window.removeEventListener('orientationchange', handleVisualViewportChange)
}

onMounted(() => {
    bindVisualViewportListeners()
})

onUnmounted(() => {
    unbindVisualViewportListeners()
})

watch(show, (visible) => {
    if (visible) {
        signing.value = false
        landscapeSignatureValue.value = modelValue.value
        nextTick(() => syncVisualViewport({ force: true }))
    }
})
// #endif

// #ifndef H5
function syncDeviceSafeArea() {
    deviceBottomSafeAreaInset.value = getSafeAreaBottomInset()
}

onMounted(() => {
    syncDeviceSafeArea()
})

watch(show, (visible) => {
    if (visible) {
        syncDeviceSafeArea()
    }
})
// #endif

const overlayStyle = computed(() => {
    // #ifdef H5
    if (visualViewportHeight.value > 0) {
        return {
            top: `${visualViewportOffsetTop.value}px`,
            left: `${visualViewportOffsetLeft.value}px`,
            width: `${visualViewportWidth.value}px`,
            height: `${visualViewportHeight.value}px`,
            right: 'auto',
            bottom: 'auto',
        }
    }
    // #endif

    return {}
})

const containerStyle = computed(() => {
    const style: Record<string, string> = {
        position: 'fixed',
        width: '100vh',
        height: '100vw',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(90deg)',
        transformOrigin: 'center center',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
    }

    // #ifdef H5
    // 旋转 90° 后：CSS width 对应屏幕可视高度，height 对应可视宽度
    if (visualViewportHeight.value > 0 && visualViewportWidth.value > 0) {
        style.width = `${visualViewportHeight.value}px`
        style.height = `${visualViewportWidth.value}px`
    }
    else {
        style.width = '100dvh'
        style.height = '100dvw'
    }
    style.paddingLeft = 'calc(var(--window-top, 0px) + 16rpx)'
    // #endif

    // #ifndef H5
    // 旋转 90° 后本地右侧会落到手机物理底部，left/bottom 布局需要避开 iPhone Home 指示条（微信小程序 / App 等端）。
    if (props.toolbarPosition !== 'right' && deviceBottomSafeAreaInset.value > 0) {
        style.paddingRight = `calc(${deviceBottomSafeAreaInset.value}px + 16rpx)`
    }
    // #endif

    return style
})

const signatureHeight = computed(() => {
    const toolbarGap = props.toolbarPosition === 'bottom' ? 120 : 24

    // #ifdef H5
    if (visualViewportWidth.value > 0) {
        return `calc(${visualViewportWidth.value}px - ${toolbarGap}rpx)`
    }
    // #endif

    return props.toolbarPosition === 'bottom' ? 'calc(100vw - 120rpx)' : 'calc(100vw - 24rpx)'
})

function close() {
    landscapeSignatureRef.value?.clear()
    landscapeSignatureValue.value = ''
    signing.value = false
    // #ifdef H5
    syncVisualViewport({ force: true })
    // #endif
    show.value = false
    emit('close')
}

function onSave(payload: SignatureSavePayload) {
    landscapeSignatureValue.value = payload.tempFilePath
    modelValue.value = payload.tempFilePath
    signing.value = false
    // #ifdef H5
    syncVisualViewport({ force: true })
    // #endif
    emit('save', payload)
    show.value = false
}

function onClear() {
    emit('clear')
}

function onStart() {
    signing.value = true
}

function onEnd() {
    signing.value = false
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
    <view v-if="show" class="fixed inset-0 z-[60] overflow-hidden bg-white" :style="overlayStyle"
        @touchmove.stop.prevent>
        <view class="relative box-border flex bg-white p-[12rpx]" :style="containerStyle">
            <RebornSignature ref="landscapeSignatureRef" v-model="landscapeSignatureValue" v-model:pen-color="currentPenColor"
                class="size-full" size="sm" :show-pen-colors="false" :pen-pressure="penPressure" :line-width="lineWidth"
                :min-line-width="minLineWidth" :max-line-width="maxLineWidth" :show-undo="showUndo"
                :show-redo="showRedo" :toolbar-position="toolbarPosition" :height="signatureHeight" :ui="SIGNATURE_UI"
                :show-close="true" :rotate="90" @start="onStart" @end="onEnd" @save="onSave" @clear="onClear"
                @close="close" />
        </view>
    </view>
</template>