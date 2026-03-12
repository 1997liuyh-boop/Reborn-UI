<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    modelValue: any
}>()

const emit = defineEmits(['update:modelValue', 'showColorPicker', 'showGradientEditor', 'showImagePicker'])

const qrConfig = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})
</script>

<template>
    <view class="block">
        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">前景色</text>
            <text class="text-xs text-[#666] mb-2 block">同时设置码点和码眼的颜色</text>
            <view class="flex gap-2 mt-2">
                <view
                    class="flex-1 flex flex-col items-center justify-center py-2 px-1 border-2 border-solid rounded-lg bg-[#fafafa] min-h-[80rpx]"
                    :class="!qrConfig.dotsImage && !qrConfig.dotsGradient ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8]'"
                    @tap="$emit('showColorPicker', 'foreground')">
                    <view
                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1"
                        :style="{ backgroundColor: qrConfig.dotsColor }"></view>
                    <text class="text-[20rpx] font-medium"
                        :class="!qrConfig.dotsImage && !qrConfig.dotsGradient ? 'text-[#1890ff]' : 'text-[#666]'">单色</text>
                </view>
                <view
                    class="flex-1 flex flex-col items-center justify-center py-2 px-1 border-2 border-solid rounded-lg bg-[#fafafa] min-h-[80rpx]"
                    :class="qrConfig.dotsGradient ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                    @tap="$emit('showGradientEditor', 'foreground')">
                    <view
                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1"
                        style="background: linear-gradient(45deg, #ff4d4f 0%, #1890ff 100%)"></view>
                    <text class="text-[20rpx] font-medium"
                        :class="qrConfig.dotsGradient ? 'text-[#1890ff]' : 'text-[#666]'">渐变</text>
                </view>
                <view
                    class="flex-1 flex flex-col items-center justify-center py-2 px-1 border-2 border-solid rounded-lg bg-[#fafafa] min-h-[80rpx]"
                    :class="qrConfig.dotsImage ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                    @tap="$emit('showImagePicker')">
                    <view v-if="qrConfig.dotsImage"
                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1 overflow-hidden">
                        <image :src="qrConfig.dotsImage" mode="aspectFill" class="w-full h-full" />
                    </view>
                    <view v-else
                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1 bg-[#f0f0f0] flex items-center justify-center">
                        <text class="text-[20rpx]">🖼</text>
                    </view>
                    <text class="text-[20rpx] font-medium"
                        :class="qrConfig.dotsImage ? 'text-[#1890ff]' : 'text-[#666]'">图片</text>
                </view>
            </view>
        </view>
    </view>
</template>
