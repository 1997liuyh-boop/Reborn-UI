<script setup lang="ts">
import type { QrConfig, ValueOption } from '../types'
interface Props {
  logoSizeOptions: readonly ValueOption<QrConfig['logoSize']>[]
  logoMarginOptions: readonly ValueOption<QrConfig['logoMargin']>[]
}
defineProps<Props>()
defineEmits<{ uploadLogo: [], removeLogo: [], selectPredefinedLogo: [image: string] }>()
const qrConfig = defineModel<QrConfig>({ required: true })
function patch<K extends keyof QrConfig>(key: K, value: QrConfig[K]) {
  qrConfig.value = { ...qrConfig.value, [key]: value }
}
/** 同时兼容原生 switch 事件与 DOM 事件声明，只提交布尔载荷。 */
function setShadow(event: Event | { detail: { value: boolean } }) {
  if ('detail' in event && typeof event.detail?.value === 'boolean') patch('logoShadow', event.detail.value)
}
function setBackgroundVisibility(event: Event | { detail: { value: boolean } }) {
  if ('detail' in event && typeof event.detail?.value === 'boolean') patch('logoHideBackgroundDots', event.detail.value)
}
</script>

<template>
    <view class="block">
        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">Logo图片</text>
            <view class="flex items-center gap-4">
                <view v-if="!qrConfig.logoImage"
                    class="w-[120rpx] h-[120rpx] flex flex-col items-center justify-center border-2 border-dashed border-[#d9d9d9] rounded-xl bg-[#fafafa]"
                    @tap="$emit('uploadLogo')">
                    <text class="text-2xl text-[#999] mb-1">+</text>
                    <text class="text-[20rpx] text-[#666]">上传Logo</text>
                </view>
                <view v-else class="flex flex-col items-center gap-2">
                    <view
                        class="w-[120rpx] h-[120rpx] border-2 border-[#e8e8e8] rounded-xl overflow-hidden flex items-center justify-center">
                        <image :src="qrConfig.logoImage" mode="aspectFit" class="w-full h-full" />
                    </view>
                    <view class="flex gap-2">
                        <button
                            class="!m-0 p-0 px-2 text-[20rpx] h-[40rpx] leading-[40rpx] bg-white border border-[#d9d9d9] text-[#666] rounded"
                            @tap="$emit('uploadLogo')">更换</button>
                        <button
                            class="!m-0 p-0 px-2 text-[20rpx] h-[40rpx] leading-[40rpx] bg-white border border-[#ff4d4f] text-[#ff4d4f] rounded"
                            @tap="$emit('removeLogo')">删除</button>
                    </view>
                </view>

                <view class="flex-1">
                    <text class="block text-xs font-medium text-[#666] mb-2">预设Logo</text>
                    <view class="flex gap-2">
                        <view
                            class="w-[80rpx] h-[80rpx] border border-[#e8e8e8] rounded-lg overflow-hidden flex items-center justify-center bg-[#fafafa]"
                            :class="{ 'border-[#1890ff] bg-[#e6f7ff]': qrConfig.logoImage === '/static/starbucks.png' }"
                            @tap="$emit('selectPredefinedLogo', '/static/starbucks.png')">
                            <image src="/static/starbucks.png" class="w-[48rpx] h-[48rpx]" mode="aspectFit" />
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <view class="mb-4" v-if="qrConfig.logoImage">
            <text class="block text-sm font-medium text-[#262626] mb-1">Logo尺寸</text>
            <view class="grid grid-cols-4 gap-3 mt-3">
                <view v-for="item in logoSizeOptions" :key="item.value"
                    class="flex flex-col items-center justify-center py-[12rpx] px-[8rpx] border-[2rpx] border-solid rounded-[12rpx] bg-[#fafafa] min-h-[50rpx]"
                    :class="qrConfig.logoSize === item.value ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8]'"
                    @tap="patch('logoSize', item.value)">
                    <text class="text-[22rpx] font-medium text-center"
                        :class="qrConfig.logoSize === item.value ? 'text-[#1890ff]' : 'text-[#666]'">{{
                            item.name }}</text>
                </view>
            </view>
        </view>

        <view class="mb-4" v-if="qrConfig.logoImage">
            <text class="block text-sm font-medium text-[#262626] mb-1">Logo边距</text>
            <view class="grid grid-cols-4 gap-3 mt-3">
                <view v-for="item in logoMarginOptions" :key="item.value"
                    class="flex flex-col items-center justify-center py-[12rpx] px-[8rpx] border-[2rpx] border-solid rounded-[12rpx] bg-[#fafafa] min-h-[50rpx]"
                    :class="qrConfig.logoMargin === item.value ? 'border-[#1890ff] bg-[#e6f7ff]' : 'border-[#e8e8e8]'"
                    @tap="patch('logoMargin', item.value)">
                    <text class="text-[22rpx] font-medium text-center"
                        :class="qrConfig.logoMargin === item.value ? 'text-[#1890ff]' : 'text-[#666]'">{{
                            item.name }}</text>
                </view>
            </view>
        </view>

        <view class="mb-4" v-if="qrConfig.logoImage">
            <view class="flex items-center justify-between gap-4">
                <view
                    class="flex items-center justify-between flex-1 bg-[#fafafa] p-3 rounded-lg border border-[#e8e8e8]">
                    <text class="text-[24rpx] font-medium text-[#262626]">投影效果</text>
                    <switch :checked="qrConfig.logoShadow" @change="setShadow"
                        color="#1890ff" style="transform:scale(0.7)" />
                </view>
                <view
                    class="flex items-center justify-between flex-1 bg-[#fafafa] p-3 rounded-lg border border-[#e8e8e8]">
                    <text class="text-[24rpx] font-medium text-[#262626]">隐藏背景</text>
                    <switch :checked="qrConfig.logoHideBackgroundDots"
                        @change="setBackgroundVisibility" color="#1890ff"
                        style="transform:scale(0.7)" />
                </view>
            </view>
        </view>
    </view>
</template>
