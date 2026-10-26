<script setup lang="ts">
import type { QrConfig } from '../types'
import { computed, ref, toRef } from 'vue'
import RebornQrcode from '@/components/reborn-qrcode/RebornQrcode.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'

interface Props {
  config: QrConfig
  isGenerating: boolean
  modalOpen?: boolean
}
const props = defineProps<Props>()
defineEmits<{ save: [], share: [], reset: [] }>()
const qrConfig = toRef(props, 'config')
const qrcodeRef = ref<InstanceType<typeof RebornQrcode> | null>(null)
const qrMode = computed(() => qrConfig.value.dotsType)
const logoSize = computed(() => ({ small: 20, medium: 40, large: 60 })[qrConfig.value.logoSize])
const logoOptions = computed(() => ({
  image: qrConfig.value.logoImage, size: qrConfig.value.logoSize, margin: qrConfig.value.logoMargin,
  shape: qrConfig.value.logoShape, hideBackgroundDots: qrConfig.value.logoHideBackgroundDots, shadow: qrConfig.value.logoShadow,
}))
const cornersSquareOptions = computed(() => ({
  type: qrConfig.value.cornersSquareType, color: qrConfig.value.dotsColor, gradient: qrConfig.value.cornersSquareGradient,
}))
const cornersDotOptions = computed(() => ({
  type: qrConfig.value.cornersDotType, color: qrConfig.value.dotsColor, gradient: qrConfig.value.cornersDotGradient,
}))
defineExpose({ toPng: () => qrcodeRef.value?.toPng() })
</script>

<template>
    <view class="bg-white rounded-xl p-4 shadow-lg w-full box-border flex items-start flex-col gap-4 sm:flex-row">
        <!-- 左侧：二维码预览 -->
        <view class="flex items-center justify-center size-[400rpx]">
            <RebornQrcode v-if="!modalOpen" ref="qrcodeRef" :text="qrConfig.text" :size="200" :padding="qrConfig.margin * 5"
                    :mode="qrMode"
                    :foreground="qrConfig.dotsColor || '#000000'" :background="qrConfig.backgroundColor || '#ffffff'"
                    :logo="qrConfig.logoImage || ''"
                    :logoSize="logoSize"
                    :pdColor="qrConfig.dotsColor || '#000000'" :pdOuterRadius="qrConfig.cornersSquareType"
                    :pdInnerRadius="qrConfig.cornersDotType" :ecc="qrConfig.ecc" :dotsGradient="qrConfig.dotsGradient"
                    :dotsImage="qrConfig.dotsImage" :backgroundGradient="qrConfig.backgroundGradient"
                    :backgroundTransparent="qrConfig.backgroundTransparent" :logoOptions="logoOptions" :cornersSquareGradient="qrConfig.cornersSquareGradient || qrConfig.dotsGradient"
                    :cornersDotGradient="qrConfig.cornersDotGradient || qrConfig.dotsGradient"
                    :cornersSquareOptions="cornersSquareOptions"
                    :cornersDotOptions="cornersDotOptions" />
            <view v-else class="size-[400rpx] rounded-[16rpx] bg-[#fafafa] border border-solid border-[#f0f0f0]"></view>
        </view>

        <!-- 右侧：操作按钮区 -->
        <view class="flex-1 shrink-0 flex flex-col justify-start gap-3 w-full sm:max-w-[240rpx]">
            <text class="text-[24rpx] text-gray-500">导出图片固定为 600×600 像素</text>

            <!-- 操作按钮 -->
            <view class="flex flex-row flex-wrap mb-2 overflow-visible">
                <RebornButton @click="$emit('save')" :loading="isGenerating" variant="filled" color="primary" gap>
                    保存
                </RebornButton>
                <RebornButton @click="$emit('share')" :loading="isGenerating" variant="filled" color="secondary" gap>
                    分享
                </RebornButton>
                <RebornButton @click="$emit('reset')" variant="filled" color="warning" gap>重置</RebornButton>
            </view>
        </view>
    </view>
</template>
