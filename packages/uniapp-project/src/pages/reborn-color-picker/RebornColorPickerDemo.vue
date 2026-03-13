<script setup lang="ts">
import { ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornColorPicker from '@/components/reborn-color-picker/RebornColorPicker.vue'

const color1 = ref('#4D80F0')
const color2 = ref('#10B981')
const color3 = ref('#F43F5E')
const colorHex = ref('#4D80F0')
const colorRgb = ref('rgb(16, 185, 129)')
const colorRgba = ref('rgba(244, 63, 94, 0.50)')
</script>

<template>
    <RebornPage title="Color Picker 取色器" description="提供颜色选择的定制面板，支持 HSVA 空间交互、透明度调节及主题预设。">
        <RebornCard title="常规使用" overflowVisible>
            <view class="flex items-center space-x-4">
                <RebornColorPicker v-model="color1" />
                <text class="text-xs font-mono bg-gray-100 p-1 rounded">{{ color1 }}</text>
            </view>
        </RebornCard>

        <RebornCard title="输出格式" overflowVisible>
            <view class="flex flex-col space-y-4">
                <view class="flex items-center space-x-4">
                    <RebornColorPicker v-model="colorHex" default-format="hex" />
                    <text class="text-xs font-mono bg-gray-100 p-1 rounded">HEX: {{ colorHex }}</text>
                </view>
                <view class="flex items-center space-x-4">
                    <RebornColorPicker v-model="colorRgb" default-format="rgb" />
                    <text class="text-xs font-mono bg-gray-100 p-1 rounded">RGB: {{ colorRgb }}</text>
                </view>
                <view class="flex items-center space-x-4">
                    <RebornColorPicker v-model="colorRgba" default-format="rgba" />
                    <text class="text-xs font-mono bg-gray-100 p-1 rounded">RGBA: {{ colorRgba }}</text>
                </view>
            </view>
        </RebornCard>

        <RebornCard title="Popover 配置" overflowVisible>
            <view class="flex flex-col space-y-4">
                <view class="flex items-center space-x-4">
                    <RebornColorPicker v-model="color2" :content="{ side: 'right', sideOffset: 12 }" />
                    <text class="text-sm font-medium">右侧弹出 (Right Side)</text>
                </view>
                <view class="flex items-center space-x-4">
                    <RebornColorPicker v-model="color1" :arrow="false" />
                    <text class="text-sm font-medium">隐藏箭头 (No Arrow)</text>
                </view>
            </view>
        </RebornCard>

        <RebornCard title="不同尺寸" overflowVisible>
            <view class="flex flex-col space-y-4">
                <view class="flex items-center space-x-4">
                    <RebornColorPicker v-model="color2" size="sm" />
                    <text class="text-sm font-medium">小尺寸 (sm)</text>
                </view>
                <view class="flex items-center space-x-4">
                    <RebornColorPicker v-model="color3" size="lg" />
                    <text class="text-sm font-medium">大尺寸 (lg)</text>
                </view>
            </view>
        </RebornCard>

        <RebornCard title="禁用状态" overflowVisible>
            <view class="flex items-center space-x-4">
                <RebornColorPicker modelValue="#9CA3AF" disabled />
                <text class="text-sm font-medium text-gray-500">已禁用</text>
            </view>
        </RebornCard>
    </RebornPage>
</template>
