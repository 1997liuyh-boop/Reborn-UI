<script setup lang="ts">
import { computed } from 'vue'
import RebornQrcode from '@/components/reborn-qrcode/RebornQrcode.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornDropdownSelect from '@/components/reborn-dropdown-select/RebornDropdownSelect.vue'

const props = defineProps<{
    modelValue: any
    isGenerating: boolean
    exportSizeIndex: number
    dropdownOptions: any[]
    modalOpen?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'update:exportSizeIndex', 'save', 'share', 'reset'])

const qrConfig = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const exportSizeIdx = computed({
    get: () => props.exportSizeIndex,
    set: (val) => emit('update:exportSizeIndex', val)
})

const qrcodeRef = defineModel<any>('qrcodeRef')

defineExpose({
    toPng: () => qrcodeRef.value?.toPng()
})
</script>

<template>
    <view class="bg-white rounded-xl p-4 shadow-lg w-full box-border flex items-start flex-col gap-4 sm:flex-row">
        <!-- 左侧：二维码预览 -->
        <view class="flex items-center justify-center size-[200px]">
            <reborn-qrcode v-if="!modalOpen" ref="qrcodeRef" :text="qrConfig.text" :size="200" :padding="qrConfig.margin * 5"
                :mode="qrConfig.dotsType === 'circular' ? 'circular' : qrConfig.dotsType === 'line' ? 'line' : qrConfig.dotsType === 'rectSmall' ? 'rectSmall' : 'rect'"
                :foreground="qrConfig.dotsColor || '#000000'" :background="qrConfig.backgroundColor || '#ffffff'"
                :logo="qrConfig.logoImage || ''"
                :logoSize="qrConfig.logoSize === 'small' ? 20 : qrConfig.logoSize === 'large' ? 60 : 40"
                :pdColor="qrConfig.dotsColor || '#000000'" :pdOuterRadius="qrConfig.cornersSquareType"
                :pdInnerRadius="qrConfig.cornersDotType" :ecc="qrConfig.ecc" :dotsGradient="qrConfig.dotsGradient"
                :dotsImage="qrConfig.dotsImage" :backgroundGradient="qrConfig.backgroundGradient"
                :backgroundTransparent="qrConfig.backgroundTransparent" :logoOptions="{
                    image: qrConfig.logoImage,
                    size: qrConfig.logoSize,
                    margin: qrConfig.logoMargin,
                    shape: qrConfig.logoShape,
                    hideBackgroundDots: qrConfig.logoHideBackgroundDots,
                    shadow: qrConfig.logoShadow
                }" :cornersSquareGradient="qrConfig.cornersSquareGradient || qrConfig.dotsGradient"
                :cornersDotGradient="qrConfig.cornersDotGradient || qrConfig.dotsGradient"
                :cornersSquareOptions="{ type: qrConfig.cornersSquareType, color: qrConfig.dotsColor, gradient: qrConfig.cornersSquareGradient }"
                :cornersDotOptions="{ type: qrConfig.cornersDotType, color: qrConfig.dotsColor, gradient: qrConfig.cornersDotGradient }"></reborn-qrcode>
            <view v-else class="size-[200px] rounded-[16rpx] bg-[#fafafa] border border-solid border-[#f0f0f0]"></view>
        </view>

        <!-- 右侧：操作按钮区 -->
        <view class="flex-1 shrink-0 flex flex-col justify-start gap-3 w-full sm:max-w-[240rpx]">
            <view class="bg-[#f8f9fa] rounded-md p-2 shrink-0 overflow-visible">
                <text class="text-xs text-gray-500 mb-1 block">导出尺寸</text>
                <RebornDropdownSelect v-model="exportSizeIdx" :options="dropdownOptions" size="sm" />
            </view>

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
