<script setup lang="ts">
import { ref } from 'vue'
import RebornBadge from '@/components/reborn-badge/RebornBadge.vue'

const showBadge = ref(true)
const sizes = ['sm', 'md', 'lg'] as const
const variants = ['solid', 'outline', 'soft', 'inverted'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const

const handleClose = () => {
    showBadge.value = false
    setTimeout(() => {
        showBadge.value = true
    }, 2000)
}
</script>

<template>
    <view class="p-4 space-y-6 bg-slate-50 min-h-screen pb-safe">
        <view class="space-y-2">
            <view class="text-xl font-bold text-slate-900">Badge</view>
            <view class="text-slate-500">Badge component for status, labels, and notifications.</view>
        </view>

        <!-- Variants -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Variants</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3">
                <RebornBadge v-for="variant in variants" :key="variant" :variant="variant" :label="variant" />
            </view>
        </view>

        <!-- Colors -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Colors</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3">
                <RebornBadge v-for="color in colors" :key="color" :color="color" :label="color" />
            </view>
        </view>

        <!-- Sizes -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Sizes</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
                <RebornBadge v-for="size in sizes" :key="size" :size="size" :label="`Size ${size}`" />
            </view>
        </view>

        <!-- Icons -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Icons</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3">
                <RebornBadge icon="i-lucide-check" label="Success" color="success" />
                <RebornBadge icon="i-lucide-alert-circle" label="Warning" color="warning" />
                <RebornBadge icon="i-lucide-info" label="Info" color="info" />
                <RebornBadge icon="i-lucide-star" />
            </view>
        </view>

        <!-- Closable -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Closable</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3">
                <RebornBadge v-if="showBadge" label="Closable (Reappears in 2s)" closable @close="handleClose" />
                <RebornBadge label="Closable Outline" variant="outline" closable />
                <RebornBadge label="Closable Soft" variant="soft" closable />
            </view>
        </view>

        <!-- Square -->
        <view class="space-y-3">
            <view class="text-sm font-medium text-slate-500 uppercase tracking-wider">Square</view>
            <view class="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3">
                <RebornBadge label="Square Badge" square />
                <RebornBadge label="Square Outline" variant="outline" square />
            </view>
        </view>
    </view>
</template>
