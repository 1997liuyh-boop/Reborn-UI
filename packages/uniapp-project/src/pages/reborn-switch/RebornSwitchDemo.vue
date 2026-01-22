<script setup lang="ts">
import { ref } from 'vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

const checked1 = ref(true)
const checked2 = ref(false)
const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const

// Dynamic configuration
const onValue = ref(true)
const currentSize = ref<typeof sizes[number]>('md')
const currentColor = ref<typeof colors[number]>('primary')
</script>

<template>
    <view class="p-4 space-y-6 bg-slate-50 min-h-screen pb-safe">
        <view class="space-y-2">
            <view class="text-xl font-bold text-slate-900">开关 (Switch)</view>
            <view class="text-slate-500">允许用户在两种状态之间切换的控件。</view>
        </view>

        <!-- Colors -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">颜色 (Colors)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
                <RebornSwitch v-for="color in colors" :key="color" v-model="checked1" :color="color" :label="color" />
            </view>
        </view>

        <view class="space-y-4">
            <view class="text-base font-medium text-gray-400">加载状态与自定义 (Loading & Customization)</view>

            <!-- Configuration Controls -->
            <view class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                <view class="space-y-2">
                    <text class="text-sm text-gray-500">尺寸 (Size)</text>
                    <view class="flex flex-wrap gap-2">
                        <button v-for="size in sizes" :key="size"
                            class="px-3 py-1 text-sm rounded-full border transition-colors"
                            :class="currentSize === size ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200'"
                            @tap="currentSize = size">
                            {{ size }}
                        </button>
                    </view>
                </view>

                <view class="space-y-2">
                    <text class="text-sm text-gray-500">颜色 (Color)</text>
                    <view class="flex flex-wrap gap-2">
                        <button v-for="color in colors" :key="color"
                            class="px-3 py-1 text-sm rounded-full border transition-colors capitalize"
                            :class="currentColor === color ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200'"
                            @tap="currentColor = color">
                            {{ color }}
                        </button>
                    </view>
                </view>
            </view>

            <!-- Examples -->
            <view class="grid gap-4 md:grid-cols-2">
                <!-- Loading State -->
                <view class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
                    <RebornSwitch v-model="onValue" :size="currentSize" :color="currentColor" label="加载中 (Loading)"
                        loading />
                </view>

                <!-- Custom UI (Square) -->
                <view class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
                    <RebornSwitch v-model="onValue" :size="currentSize" :color="currentColor" label="方形 UI (Custom UI)"
                        :ui="{ track: 'rounded-md', thumb: 'rounded-sm' }" />
                </view>
            </view>

            <view class="grid gap-4 md:grid-cols-2">
                <!-- Custom Thumb Content (Icon) -->
                <view class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
                    <RebornSwitch v-model="onValue" :size="currentSize" :color="currentColor" label="自定义图标 (Thumb Slot)"
                        :ui="{ track: 'group-[.is-checked]:bg-orange-6 bg-blue-6' }">
                        <template #thumb="{ checked }">
                            <view :class="[
                                'size-3.5 transition-colors',
                                checked ? 'i-lucide-check text-orange-6' : 'i-lucide-x text-blue-6'
                            ]" />
                        </template>
                    </RebornSwitch>
                </view>

                <!-- Custom Thumb + Loading -->
                <view class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
                    <RebornSwitch v-model="onValue" :size="currentSize" :color="currentColor" label="加载中 (Custom Icon)"
                        loading>
                        <template #thumb="{ loading }">
                            <view v-if="loading" class="i-lucide-loader size-full p-0.5 animate-spin text-primary" />
                        </template>
                    </RebornSwitch>
                </view>

                <!-- Custom Size (XL) -->
                <view class="flex items-center gap-4 rounded-xl border border-gray-100 bg-white dark:bg-gray-800 p-4">
                    <RebornSwitch v-model="onValue" :color="currentColor" label="自定义大小 (Custom XL)" :ui="{
                        track: 'h-8 w-14',
                        thumb: 'size-7 group-[.is-checked]:translate-x-6'
                    }" />
                </view>
            </view>
        </view>
    </view>
</template>
