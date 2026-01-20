<script setup lang="ts">
import { ref } from 'vue'
import ReInput from '@/components/re-input/ReInput.vue'

const input1 = ref('')
const input2 = ref('')
const input3 = ref('')
const input4 = ref('')
const input5 = ref('')
const input6 = ref('')
</script>

<template>
    <view class="p-4 space-y-6 bg-slate-50 min-h-screen pb-safe">
        <view class="space-y-2">
            <view class="text-xl font-bold text-slate-900">Input</view>
            <view class="text-slate-500">Text inputs for user data capabilities.</view>
        </view>

        <!-- Basic -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Basic</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <ReInput v-model="input1" placeholder="Type something..." />
                <ReInput v-model="input2" placeholder="Disabled input" disabled />
                <ReInput v-model="input2" placeholder="Readonly input" readonly />
            </view>
        </view>

        <!-- Features -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Features</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <ReInput v-model="input3" placeholder="Password input" password />
                <ReInput v-model="input4" placeholder="Clearable input" clearable />
            </view>
        </view>

        <!-- With Icons -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">With Icons</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <ReInput v-model="input5" placeholder="Search...">
                    <template #leading>
                        <view class="i-lucide-search text-gray-400 size-4" />
                    </template>
                </ReInput>
                <ReInput v-model="input5" placeholder="Amount">
                    <template #trailing>
                        <text class="text-gray-500 text-sm font-medium">USD</text>
                    </template>
                </ReInput>
            </view>
        </view>

        <!-- Textarea -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Textarea</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
                <ReInput v-model="input6" as="textarea" :rows="4" placeholder="Type your message..." />
            </view>
        </view>
    </view>
</template>
