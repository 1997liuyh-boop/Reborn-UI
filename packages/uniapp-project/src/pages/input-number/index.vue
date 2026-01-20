<script setup lang="ts">
import { ref } from 'vue'
import ReInputNumber from '@/components/re-input-number/re-input-number.vue'

const val1 = ref(1)
const val2 = ref(10)
const val3 = ref(5)
const val4 = ref(0)
const val5 = ref(1)

const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const
const shapes = ['square', 'circle'] as const
</script>

<template>
    <view class="p-4 space-y-6 bg-slate-50 min-h-screen pb-safe">
        <view class="space-y-2">
            <view class="text-xl font-bold text-slate-900">Input Number</view>
            <view class="text-slate-500">Numeric input with increment and decrement controls.</view>
        </view>

        <!-- Basic -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Basic</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <ReInputNumber v-model="val1" />
                <ReInputNumber v-model="val1" disabled />
            </view>
        </view>

        <!-- Limits & Step -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Limits & Step</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <view class="flex items-center justify-between">
                    <text class="text-sm text-slate-600">Min 5, Max 20, Step 5</text>
                    <ReInputNumber v-model="val2" :min="5" :max="20" :step="5" />
                </view>
            </view>
        </view>

        <!-- Sizes -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Sizes</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <view v-for="size in sizes" :key="size" class="flex items-center justify-between">
                    <text class="text-sm text-slate-600 capitalize">{{ size }}</text>
                    <ReInputNumber v-model="val3" :size="size" />
                </view>
            </view>
        </view>

        <!-- Shapes -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Shapes</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <view v-for="shape in shapes" :key="shape" class="flex items-center justify-between">
                    <text class="text-sm text-slate-600 capitalize">{{ shape }}</text>
                    <ReInputNumber v-model="val4" :shape="shape" />
                </view>
            </view>
        </view>

        <!-- Colors -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Colors</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
                <ReInputNumber v-for="color in colors" :key="color" v-model="val5" :color="color" />
            </view>
        </view>
    </view>
</template>
