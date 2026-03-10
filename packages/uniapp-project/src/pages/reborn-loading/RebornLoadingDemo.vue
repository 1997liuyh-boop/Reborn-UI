<script setup lang="ts">
import RebornLoading from '@/components/reborn-loading/RebornLoading.vue'
</script>
<template>
    <view class="p-8 flex flex-col gap-12 items-center bg-gray-50 min-h-screen">
        <view class="flex flex-col items-center gap-4">
            <text class="text-sm text-gray-400">Ring (Default)</text>
            <view class="flex gap-4">
                <reborn-loading type="ring" color="error" size="40px" />
                <reborn-loading type="ring" color="primary" size="40px" />
                <reborn-loading type="ring" color="success" size="40px" />
            </view>
        </view>

        <view class="flex flex-col items-center gap-4">
            <text class="text-sm text-gray-400">Outline</text>
            <view class="flex gap-4">
                <reborn-loading type="outline" color="error" size="40px" />
                <reborn-loading type="outline" color="primary" size="40px" />
                <reborn-loading type="outline" color="success" size="40px" />
            </view>
        </view>

        <view class="flex flex-col items-center gap-4">
            <text class="text-sm text-gray-400">Spinner</text>
            <view class="flex gap-4">
                <reborn-loading type="spinner" color="error" size="40px" />
                <reborn-loading type="spinner" color="primary" size="40px" />
                <reborn-loading type="spinner" color="success" size="40px" />
            </view>
        </view>

        <view class="flex flex-col items-center gap-4">
            <text class="text-sm text-gray-400">Bars Scale</text>
            <view class="flex gap-4">
                <reborn-loading type="bars-scale" color="error" size="40px" />
                <reborn-loading type="bars-scale" color="primary" size="40px" />
                <reborn-loading type="bars-scale" color="success" size="40px" />
            </view>
        </view>

        <view class="flex flex-col items-center gap-4">
            <text class="text-sm text-gray-400">Blocks Shuffle</text>
            <view class="flex gap-4">
                <reborn-loading type="blocks-shuffle" color="error" size="40px" />
                <reborn-loading type="blocks-shuffle" color="primary" size="40px" />
                <reborn-loading type="blocks-shuffle" color="success" size="40px" />
            </view>
        </view>

        <view class="flex flex-col items-center gap-4">
            <text class="text-sm text-gray-400">Blocks Wave</text>
            <view class="flex gap-4">
                <reborn-loading type="blocks-wave" color="error" size="40px" />
                <reborn-loading type="blocks-wave" color="primary" size="40px" />
                <reborn-loading type="blocks-wave" color="success" size="40px" />
            </view>
        </view>

        <view class="flex flex-col items-center gap-4">
            <text class="text-sm text-gray-400">Gooey Balls</text>
            <view class="flex gap-4">
                <reborn-loading type="gooey-balls" color="error" size="40px" />
                <reborn-loading type="gooey-balls" color="primary" size="40px" />
                <reborn-loading type="gooey-balls" color="success" size="40px" />
            </view>
        </view>
    </view>
</template>
