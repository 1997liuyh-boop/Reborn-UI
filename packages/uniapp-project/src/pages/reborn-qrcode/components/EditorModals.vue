<script setup lang="ts">
import { ref, computed } from 'vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'

const props = defineProps<{
    // State
    showColorPickerModal: boolean
    showGradientEditorModal: boolean
    showForegroundImageModal: boolean

    // Data
    selectedColor: string
    colorPalette: string[]
    gradientType: string
    gradientDirection: string
    gradientDirectionOptions: any[]
    gradientColors: any[]
    predefinedForegroundImages: any[]
    qrConfig: any
}>()

const emit = defineEmits([
    'update:selectedColor', 'hideColorPicker', 'selectColor', 'onCustomColorInput',
    'hideGradientEditor', 'switchGradientType', 'onGradientDirectionChange', 'showGradientColorPicker', 'applyGradient',
    'hideForegroundImagePicker', 'selectForegroundImage', 'uploadForegroundImage', 'clearForegroundImage'
])

const selColor = computed({
    get: () => props.selectedColor,
    set: (val) => emit('update:selectedColor', val)
})
</script>

<template>
    <view>
        <!-- 颜色选择器弹窗 -->
        <view v-if="showColorPickerModal"
            class="fixed inset-0 z-[10002] flex items-center justify-center bg-[rgba(0,0,0,0.5)]"
            @tap="$emit('hideColorPicker')">
            <view
                class="w-[600rpx] max-w-[90vw] bg-white rounded-[16rpx] p-[32rpx] shadow-[0_8rpx_32rpx_rgba(0,0,0,0.2)]"
                @tap.stop="">
                <view class="flex justify-between items-center mb-[32rpx]">
                    <text class="text-[32rpx] font-[600] text-[#262626]">选择颜色</text>
                    <text class="text-[40rpx] text-[#999] leading-none" @tap="$emit('hideColorPicker')">×</text>
                </view>
                <view class="grid grid-cols-6 gap-[16rpx] mb-[32rpx]">
                    <view v-for="color in colorPalette" :key="color"
                        class="w-[80rpx] h-[80rpx] rounded-[12rpx] border-[3rpx] border-solid border-white shadow-[0_2rpx_8rpx_rgba(0,0,0,0.15)]"
                        :style="{ backgroundColor: color }" @tap="$emit('selectColor', color)"></view>
                </view>
                <view class="flex items-center gap-[16rpx]">
                    <text class="text-[26rpx] text-[#262626] font-[500]">自定义:</text>
                    <RebornInput v-model="selColor" size="sm" @input="(e: any) => $emit('onCustomColorInput', e)" />
                </view>
            </view>
        </view>

        <!-- 渐变编辑器弹窗 -->
        <view v-if="showGradientEditorModal"
            class="fixed inset-0 z-[10001] flex items-center justify-center bg-[rgba(0,0,0,0.5)]"
            @tap="$emit('hideGradientEditor')">
            <view
                class="w-[600rpx] max-w-[90vw] bg-white rounded-[16rpx] p-[32rpx] shadow-[0_8rpx_32rpx_rgba(0,0,0,0.2)]"
                @tap.stop="">
                <view class="flex justify-between items-center mb-[32rpx]">
                    <text class="text-[32rpx] font-[600] text-[#262626]">渐变设置</text>
                    <text class="text-[40rpx] text-[#999] leading-none" @tap="$emit('hideGradientEditor')">×</text>
                </view>

                <!-- 渐变类型 -->
                <view class="mb-[32rpx]">
                    <text class="block text-[26rpx] font-[500] text-[#262626] mb-[16rpx]">渐变类型</text>
                    <view class="flex gap-[16rpx]">
                        <view class="flex-1 py-[16rpx] border-[2rpx] border-solid rounded-[8rpx] text-center"
                            :class="gradientType === 'linear' ? 'border-[#1890ff] bg-[#e6f7ff] text-[#1890ff]' : 'border-[#e8e8e8] text-[#333]'"
                            @tap="$emit('switchGradientType', 'linear')">
                            <text class="text-[26rpx]">线性渐变</text>
                        </view>
                        <view class="flex-1 py-[16rpx] border-[2rpx] border-solid rounded-[8rpx] text-center"
                            :class="gradientType === 'radial' ? 'border-[#1890ff] bg-[#e6f7ff] text-[#1890ff]' : 'border-[#e8e8e8] text-[#333]'"
                            @tap="$emit('switchGradientType', 'radial')">
                            <text class="text-[26rpx]">径向渐变</text>
                        </view>
                    </view>
                </view>

                <!-- 渐变方向 -->
                <view class="mb-[32rpx]" v-if="gradientType === 'linear'">
                    <text class="block text-[26rpx] font-[500] text-[#262626] mb-[16rpx]">渐变方向</text>
                    <view class="grid grid-cols-4 gap-[12rpx]">
                        <view v-for="item in gradientDirectionOptions" :key="item.value"
                            class="flex flex-col items-center justify-center border-[2rpx] border-solid rounded-[12rpx] min-h-[80rpx] p-[12rpx]"
                            :class="gradientDirection === item.value ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                            @tap="$emit('onGradientDirectionChange', item.value)">
                            <text class="text-[24rpx] font-[600]"
                                :class="gradientDirection === item.value ? 'text-[#1890ff]' : 'text-[#333]'">{{
                                    item.name }}</text>
                        </view>
                    </view>
                </view>

                <!-- 渐变颜色 -->
                <view class="mb-[32rpx]">
                    <text class="block text-[26rpx] font-[500] text-[#262626] mb-[16rpx]">渐变颜色</text>
                    <view class="flex gap-[24rpx]">
                        <view class="flex flex-col items-center flex-1">
                            <text class="text-[24rpx] text-[#666] mb-[12rpx]">起始颜色</text>
                            <view
                                class="w-[60rpx] h-[60rpx] rounded-[12rpx] border-[3rpx] border-solid border-white shadow-[0_4rpx_12rpx_rgba(0,0,0,0.15)] mb-[8rpx]"
                                :style="{ backgroundColor: gradientColors[0].color }"
                                @tap="$emit('showGradientColorPicker', 0)">
                            </view>
                            <text class="text-[20rpx] text-[#999]">{{ gradientColors[0].color }}</text>
                        </view>
                        <view class="flex flex-col items-center flex-1">
                            <text class="text-[24rpx] text-[#666] mb-[12rpx]">结束颜色</text>
                            <view
                                class="w-[60rpx] h-[60rpx] rounded-[12rpx] border-[3rpx] border-solid border-white shadow-[0_4rpx_12rpx_rgba(0,0,0,0.15)] mb-[8rpx]"
                                :style="{ backgroundColor: gradientColors[1].color }"
                                @tap="$emit('showGradientColorPicker', 1)">
                            </view>
                            <text class="text-[20rpx] text-[#999]">{{ gradientColors[1].color }}</text>
                        </view>
                    </view>
                </view>

                <view class="mt-[32rpx] flex justify-end">
                    <button
                        class="bg-[#1890ff] text-white py-[16rpx] px-[48rpx] rounded-[8rpx] text-[28rpx] !m-0 leading-none"
                        @tap="$emit('applyGradient')">确定</button>
                </view>
            </view>
        </view>

        <!-- 前景图选择弹窗 -->
        <view v-if="showForegroundImageModal"
            class="fixed inset-0 z-[10001] flex items-center justify-center bg-[rgba(0,0,0,0.5)]"
            @tap="$emit('hideForegroundImagePicker')">
            <view
                class="w-[650rpx] max-w-[90vw] bg-white rounded-[16rpx] p-[32rpx] shadow-[0_8rpx_32rpx_rgba(0,0,0,0.2)]"
                @tap.stop="">
                <view class="flex justify-between items-center mb-[32rpx]">
                    <text class="text-[32rpx] font-[600] text-[#262626]">选择前景图</text>
                    <text class="text-[40rpx] text-[#999] leading-none"
                        @tap="$emit('hideForegroundImagePicker')">×</text>
                </view>

                <!-- 预定义前景图 -->
                <view class="mb-[32rpx]">
                    <text class="block text-[26rpx] font-[500] text-[#262626] mb-[16rpx]">预设纹理</text>
                    <view class="grid grid-cols-3 gap-[16rpx]">
                        <view v-for="img in predefinedForegroundImages" :key="img.id"
                            class="flex flex-col items-center p-[12rpx] border-[2rpx] border-solid rounded-[12rpx]"
                            :class="qrConfig.dotsImage === img.path ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8] bg-[#fafafa]'"
                            @tap="$emit('selectForegroundImage', img.path)">
                            <image :src="img.path" mode="aspectFill"
                                class="w-[120rpx] h-[120rpx] rounded-[8rpx] mb-[8rpx]"></image>
                            <text class="text-[22rpx]"
                                :class="qrConfig.dotsImage === img.path ? 'text-[#1890ff]' : 'text-[#666]'">{{
                                    img.name }}</text>
                        </view>
                    </view>
                </view>

                <!-- 自定义上传 -->
                <view class="mb-[32rpx]">
                    <text class="block text-[26rpx] font-[500] text-[#262626] mb-[16rpx]">自定义图片</text>
                    <view class="flex gap-[16rpx]">
                        <button
                            class="flex-1 bg-[#1890ff] text-white py-[16rpx] rounded-[8rpx] text-[26rpx] !m-0 leading-none"
                            @tap="$emit('uploadForegroundImage')">上传图片</button>
                        <button v-if="qrConfig.dotsImage"
                            class="flex-1 bg-[#ff4d4f] text-white py-[16rpx] rounded-[8rpx] text-[26rpx] !m-0 leading-none"
                            @tap="$emit('clearForegroundImage')">清除</button>
                    </view>
                </view>

                <view class="mt-[32rpx] flex justify-end">
                    <button
                        class="bg-[#1890ff] text-white py-[16rpx] px-[48rpx] rounded-[8rpx] text-[28rpx] !m-0 leading-none"
                        @tap="$emit('hideForegroundImagePicker')">确定</button>
                </view>
            </view>
        </view>
    </view>
</template>
