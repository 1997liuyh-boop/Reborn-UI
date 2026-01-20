<script setup lang="ts">
import { ref } from 'vue'
import RebornSwitch from '@/components/reborn-switch/reborn-switch.vue'

const checked1 = ref(true)
const checked2 = ref(false)
const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const
</script>

<template>
    <view class="p-4 space-y-6 bg-slate-50 min-h-screen pb-safe">
        <view class="space-y-2">
            <view class="text-xl font-bold text-slate-900">Switch</view>
            <view class="text-slate-500">A control that allows the user to toggle between checked and not checked.
            </view>
        </view>

        <!-- Basic -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Basic</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <view class="flex items-center justify-between">
                    <text class="text-sm text-slate-600">Airplane Mode</text>
                    <RebornSwitch v-model="checked1" />
                </view>
                <view class="flex items-center justify-between">
                    <text class="text-sm text-slate-600">Bluetooth</text>
                    <RebornSwitch v-model="checked2" />
                </view>
                <view class="flex items-center justify-between">
                    <text class="text-sm text-slate-600">Disabled</text>
                    <RebornSwitch :model-value="true" disabled />
                </view>
            </view>
        </view>

        <!-- Colors -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Colors</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
                <RebornSwitch v-for="color in colors" :key="color" v-model="checked1" :color="color" :label="color" />
            </view>
        </view>

        <!-- Sizes -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Sizes</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <view v-for="size in sizes" :key="size" class="flex items-center justify-between">
                    <text class="text-sm text-slate-600 capitalize">{{ size }}</text>
                    <RebornSwitch v-model="checked1" :size="size" />
                </view>
            </view>
        </view>
    </view>
</template>
