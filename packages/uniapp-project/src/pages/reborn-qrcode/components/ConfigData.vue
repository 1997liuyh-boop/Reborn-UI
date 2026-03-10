<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    modelValue: any
}>()

const formattedData = computed(() => {
    return JSON.stringify(props.modelValue, null, 2)
})

const copyConfig = () => {
    uni.setClipboardData({
        data: formattedData.value,
        success: () => {
            uni.showToast({
                title: '复制成功',
                icon: 'success'
            })
        }
    })
}
</script>

<template>
    <view class="block">
        <view class="bg-[#282c34] rounded-lg p-4 mb-4 overflow-hidden relative">
            <text class="block text-xs text-[#abb2bf] font-mono leading-relaxed whitespace-pre">
                {{ formattedData }}
            </text>
            <view
                class="absolute top-2 right-2 bg-[#61afef] text-white px-2 py-1 rounded text-[20rpx] active:bg-[#528bff]"
                @tap="copyConfig">
                复制
            </view>
        </view>
        <view class="p-3 bg-blue-50 rounded-lg border border-blue-100 mb-4">
            <text class="text-xs text-blue-600 leading-relaxed block font-medium">
                💡 提示：您可以复制此配置并直接传给 reborn-qrcode 组件。
            </text>
        </view>
    </view>
</template>
