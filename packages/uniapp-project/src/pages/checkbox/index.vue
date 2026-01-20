<script setup lang="ts">
import { ref } from 'vue'
import ReCheckbox from '@/components/re-checkbox/ReCheckbox.vue'

const checked1 = ref(true)
const checked2 = ref(false)
const groupValues = ref(['Option A'])
const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const
</script>

<template>
    <view class="p-4 space-y-6 bg-slate-50 min-h-screen pb-safe">
        <view class="space-y-2">
            <view class="text-xl font-bold text-slate-900">Checkbox</view>
            <view class="text-slate-500">Interactive checkbox component for boolean or multiple selection.</view>
        </view>

        <!-- Basic Usage -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Basic</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <ReCheckbox v-model="checked1" label="Accept terms and conditions" />
                <ReCheckbox v-model="checked2" label="Subscribe to newsletter" />
            </view>
        </view>

        <!-- States -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">States</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4">
                <ReCheckbox :model-value="true" label="Checked" />
                <ReCheckbox :model-value="false" label="Unchecked" />
                <ReCheckbox :model-value="true" disabled label="Disabled Checked" />
                <ReCheckbox :model-value="false" disabled label="Disabled Unchecked" />
            </view>
        </view>

        <!-- Colors -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Colors</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
                <ReCheckbox v-for="color in colors" :key="color" v-model="checked1" :color="color" :label="color" />
            </view>
        </view>

        <!-- Sizes -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Sizes</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <ReCheckbox v-for="size in sizes" :key="size" v-model="checked1" :size="size" :label="`Size ${size}`" />
            </view>
        </view>

        <!-- Group -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Group</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <view class="text-sm text-slate-600">Selected: {{ groupValues }}</view>
                <view class="flex flex-col gap-2">
                    <ReCheckbox v-model="groupValues" value="Option A" label="Option A" />
                    <ReCheckbox v-model="groupValues" value="Option B" label="Option B" />
                    <ReCheckbox v-model="groupValues" value="Option C" label="Option C" />
                </view>
            </view>
        </view>
    </view>
</template>
