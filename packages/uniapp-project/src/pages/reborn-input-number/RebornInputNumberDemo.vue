<script setup lang="ts">
import { ref } from 'vue'
import RebornInputNumber from '@/components/reborn-input-number/RebornInputNumber.vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'

const val1 = ref(1)
const val2 = ref(10)
const val3 = ref(5)

// Dynamic Configuration
const currentSize = ref<any>('sm')
const currentColor = ref<any>('primary')
const currentShape = ref<any>('circle')

const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const
const shapes = ['square', 'circle'] as const
</script>

<template>
    <view class="p-4 space-y-6 bg-slate-50 min-h-screen pb-safe">
        <view class="space-y-2">
            <view class="text-xl font-bold text-slate-900">数字输入框</view>
            <view class="text-slate-500">带有加减控制的数字输入组件。</view>
        </view>

        <!-- Dynamic Configuration -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">动态配置</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-6">
                <!-- Size -->
                <view class="space-y-3">
                    <text class="text-sm text-slate-500">尺寸 (Size)</text>
                    <view class="flex flex-wrap gap-2">
                        <ReButton v-for="size in sizes" :key="size" size="xs"
                            :variant="currentSize === size ? 'solid' : 'outline'" color="neutral"
                            @tap="currentSize = size">
                            {{ size }}
                        </ReButton>
                    </view>
                </view>

                <!-- Shape -->
                <view class="space-y-3">
                    <text class="text-sm text-slate-500">形状 (Shape)</text>
                    <view class="flex flex-wrap gap-2">
                        <ReButton v-for="shape in shapes" :key="shape" size="xs"
                            :variant="currentShape === shape ? 'solid' : 'outline'" color="neutral"
                            @tap="currentShape = shape">
                            {{ shape }}
                        </ReButton>
                    </view>
                </view>

                <!-- Color -->
                <view class="space-y-3">
                    <text class="text-sm text-slate-500">颜色 (Color)</text>
                    <view class="flex flex-wrap gap-2">
                        <ReButton v-for="color in colors" :key="color" size="xs"
                            :variant="currentColor === color ? 'solid' : 'outline'" color="neutral"
                            @tap="currentColor = color">
                            {{ color }}
                        </ReButton>
                    </view>
                </view>

                <view class="pt-4 border-t border-slate-100 flex justify-center">
                    <RebornInputNumber v-model="val3" :size="currentSize" :color="currentColor" :shape="currentShape" />
                </view>
            </view>
        </view>

        <!-- Basic -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">基础用法</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <view class="flex items-center justify-between">
                    <text class="text-sm text-slate-600">默认</text>
                    <RebornInputNumber v-model="val1" />
                </view>
                <view class="flex items-center justify-between">
                    <text class="text-sm text-slate-600">禁用状态</text>
                    <RebornInputNumber v-model="val1" disabled />
                </view>
            </view>
        </view>

        <!-- Limits & Step -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">限制与步长</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <view class="flex items-center justify-between">
                    <text class="text-sm text-slate-600">Min 5, Max 20, Step 5</text>
                    <RebornInputNumber v-model="val2" :min="5" :max="20" :step="5" />
                </view>
            </view>
        </view>
        <!-- Custom Color -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">自定义颜色 (Custom Color)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <view class="flex items-center justify-between">
                    <text class="text-sm text-slate-600">Purple Theme</text>
                    <RebornInputNumber v-model="val3" :ui="{
                        wrapper: 'ring-purple-500 focus-within:ring-purple-500/20',
                        divider: 'bg-purple-500',
                        button: 'hover:text-purple-600'
                    }" />
                </view>
            </view>
        </view>

        <!-- Width Adjustment -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">宽度调整 (Width)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-6">
                <!-- Full Width -->
                <view class="space-y-2">
                    <text class="text-sm text-slate-500">全宽 (Full Width)</text>
                    <RebornInputNumber v-model="val3" :ui="{ wrapper: 'w-full' }" />
                </view>

                <view class="grid grid-cols-2 gap-4">
                    <!-- Narrow -->
                    <view class="space-y-2">
                        <text class="text-sm text-slate-500">窄 (Narrow)</text>
                        <RebornInputNumber v-model="val3" :ui="{ input: 'w-8' }" />
                    </view>
                    <!-- Wide -->
                    <view class="space-y-2">
                        <text class="text-sm text-slate-500">宽 (Wide)</text>
                        <RebornInputNumber v-model="val3" :ui="{ input: 'w-24' }" />
                    </view>
                </view>
            </view>
        </view>

        <!-- Fully Customized -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">完全自定义 (Fully Customized)</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-8">
                <!-- Custom Button & Icon Size -->
                <view class="space-y-2">
                    <text class="text-sm text-slate-500">自定义按钮与图标大小</text>
                    <RebornInputNumber v-model="val3" :ui="{
                        wrapper: 'h-12 border-indigo-100 bg-indigo-50/30 ring-indigo-200 focus-within:ring-indigo-300 rounded-lg',
                        button: 'w-12 hover:bg-indigo-100 text-indigo-600 active:scale-90 transition-transform',
                        input: 'w-20 text-indigo-700 font-bold text-lg',
                        divider: 'bg-indigo-100 w-px group-focus-within:bg-indigo-200'
                    }">
                        <template #decrease-icon>
                            <view class="i-lucide-arrow-left size-5" />
                        </template>
                        <template #increase-icon>
                            <view class="i-lucide-arrow-right size-5" />
                        </template>
                    </RebornInputNumber>
                </view>

                <view class="flex items-center gap-8">
                    <!-- Compact Dark Theme -->
                    <view class="space-y-2">
                        <text class="text-sm text-slate-500">紧凑深色主题</text>
                        <RebornInputNumber v-model="val3" :ui="{
                            wrapper: 'bg-slate-900 border-slate-700 ring-slate-800 rounded-md h-8',
                            input: 'text-white w-12 text-sm',
                            button: 'text-slate-400 hover:text-white px-2',
                            divider: 'bg-slate-700 w-px group-focus-within:bg-slate-600'
                        }" />
                    </view>

                    <!-- Ultra Small Height Theme -->
                    <view class="space-y-2">
                        <text class="text-sm text-slate-500">超小高度主题 (h-7)</text>
                        <RebornInputNumber v-model="val3" :ui="{
                            wrapper: 'h-7 rounded bg-emerald-50 border-emerald-200 ring-emerald-200',
                            input: 'text-emerald-700 text-xs w-10',
                            button: 'text-emerald-600 hover:text-emerald-800 px-1.5',
                            divider: 'bg-emerald-200 w-px group-focus-within:bg-emerald-300'
                        }">
                            <template #decrease-icon>
                                <view class="i-lucide-heart-off size-3" />
                            </template>
                            <template #increase-icon>
                                <view class="i-lucide-heart size-3" />
                            </template>
                        </RebornInputNumber>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>
