<template>
    <view :class="computedClass">

        <!-- Header Section -->
        <view v-if="title || description || $slots.header" class="space-y-2">
            <slot name="header">
                <view v-if="title" class="text-xl font-bold text-slate-900 dark:text-white">{{ title }}</view>
                <view v-if="description" class="text-slate-500 dark:text-slate-400">{{ description }}</view>
            </slot>
        </view>

        <slot />
    </view>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{
    title?: string
    description?: string
    customClass?: string
}>()

const computedClass = computed(() => {
    return cn(
        'w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-8 pb-20 transition-colors duration-300',
        props.customClass
    )
})
</script>
