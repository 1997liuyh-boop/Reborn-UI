<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    modelValue: any
}>()

const emit = defineEmits(['update:modelValue', 'showColorPicker', 'showGradientEditor', 'setTransparent'])

const qrConfig = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})
</script>

<template>
    <view class="block">
        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">背景填充</text>
            <view class="flex gap-2 mt-2">
                <view
                    class="flex-1 flex flex-col items-center justify-center py-2 px-1 border-2 border-solid rounded-lg min-h-[80rpx]"
                    :class="qrConfig.backgroundColor && !qrConfig.backgroundGradient && !qrConfig.backgroundTransparent ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                    @tap="$emit('showColorPicker', 'background')">
                    <view
                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1"
                        :style="{ backgroundColor: qrConfig.backgroundColor }"></view>
                    <text class="text-[20rpx] font-medium"
                        :class="qrConfig.backgroundColor && !qrConfig.backgroundGradient && !qrConfig.backgroundTransparent ? 'text-[#1890ff]' : 'text-[#666]'">单色</text>
                </view>
                <view
                    class="flex-1 flex flex-col items-center justify-center py-2 px-1 border-2 border-solid rounded-lg min-h-[80rpx]"
                    :class="qrConfig.backgroundGradient ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                    @tap="$emit('showGradientEditor', 'background')">
                    <view
                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1"
                        style="background: linear-gradient(45deg, #ff4d4f 0%, #1890ff 100%)"></view>
                    <text class="text-[20rpx] font-medium"
                        :class="qrConfig.backgroundGradient ? 'text-[#1890ff]' : 'text-[#666]'">渐变</text>
                </view>
                <view
                    class="flex-1 flex flex-col items-center justify-center py-2 px-1 border-2 border-solid rounded-lg min-h-[80rpx]"
                    :class="qrConfig.backgroundTransparent ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                    @tap="$emit('setTransparent')">
                    <view
                        class="w-[36rpx] h-[36rpx] rounded-full border-[3rpx] border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)] mb-1"
                        style="background: repeating-conic-gradient(#cccccc 0% 25%, #ffffff 0% 50%) 50% / 8rpx 8rpx;">
                    </view>
                    <text class="text-[20rpx] font-medium"
                        :class="qrConfig.backgroundTransparent ? 'text-[#1890ff]' : 'text-[#666]'">透明</text>
                </view>
            </view>
        </view>
    </view>
</template>
