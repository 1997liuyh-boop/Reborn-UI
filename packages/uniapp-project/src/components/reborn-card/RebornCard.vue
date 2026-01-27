<template>
    <view class="space-y-3">
        <view v-if="title" class="text-sm font-medium text-slate-500 dark:text-slate-200 uppercase tracking-wider">
            {{ title }}
        </view>
        <view
            class="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden"
            :class="[padding ? 'p-4' : '', customClass]">
            <slot />
        </view>
    </view>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    title?: string
    padding?: boolean
    customClass?: string
}>(), {
    padding: true,
    customClass: ''
})
</script>
