<script setup lang="ts">
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import type { ButtonProps } from '@/components/reborn-button/RebornButton.vue'

// Demo State
const demoVariant = ref<ButtonProps['variant']>('solid')
const demoColor = ref<ButtonProps['color']>('primary')
const demoSize = ref<ButtonProps['size']>('md')
const demoLoading = ref(false)
const demoDisabled = ref(false)
const demoSquare = ref(false)
const demoLabel = ref("Reborn UI")

// Options
const variants: ButtonProps['variant'][] = ["solid", "outline", "soft", "subtle"]
const colors: ButtonProps['color'][] = ["primary", "secondary", "success", "info", "warning", "error", "neutral"]
const sizes: ButtonProps['size'][] = ["xs", "sm", "md", "lg", "xl", "2xl"]
</script>

<template>
    <view class="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-8 pb-20">

        <!-- Header -->
        <view class="space-y-2">
            <view class="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Button</view>
            <view class="text-slate-500 dark:text-slate-400">Trigger an action or navigate to another page.</view>
        </view>

        <!-- Interactive Playground -->
        <view class="space-y-4">
            <view class="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <view class="w-1 h-5 bg-blue-500 rounded-full"></view>
                Playground
            </view>

            <view
                class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <!-- Preview Area -->
                <view
                    class="flex items-center justify-center p-8 bg-slate-100 dark:bg-slate-950/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 min-h-[160px]">
                    <ReButton :variant="demoVariant" :color="demoColor" :size="demoSize" :loading="demoLoading"
                        :disabled="demoDisabled" :square="demoSquare">
                        {{ demoLabel }}
                    </ReButton>
                </view>

                <!-- Controls -->
                <view class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <view class="space-y-3">
                        <view class="text-sm font-medium text-slate-500">Variant</view>
                        <view class="flex flex-wrap gap-2">
                            <view v-for="v in variants" :key="v"
                                class="px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-colors"
                                :class="demoVariant === v ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-transparent text-slate-600 border-slate-300 hover:border-slate-400'"
                                @click="demoVariant = v">
                                {{ v }}
                            </view>
                        </view>
                    </view>

                    <view class="space-y-3">
                        <view class="text-sm font-medium text-slate-500">Color</view>
                        <view class="flex flex-wrap gap-2">
                            <view v-for="c in colors" :key="c"
                                class="w-6 h-6 rounded-full cursor-pointer ring-2 ring-offset-2 ring-transparent transition-all"
                                :class="[
                                    `bg-${c}`,
                                    demoColor === c ? 'ring-slate-400 scale-110' : 'hover:scale-110'
                                ]"
                                :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
                                @click="demoColor = c"></view>
                        </view>
                    </view>

                    <view class="space-y-3">
                        <view class="text-sm font-medium text-slate-500">Size</view>
                        <view class="flex flex-wrap gap-2">
                            <view v-for="s in sizes" :key="s"
                                class="px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-colors"
                                :class="demoSize === s ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-transparent text-slate-600 border-slate-300 hover:border-slate-400'"
                                @click="demoSize = s">
                                {{ s }}
                            </view>
                        </view>
                    </view>

                    <view class="space-y-3 sm:col-span-2 lg:col-span-3">
                        <view class="text-sm font-medium text-slate-500">States & Options</view>
                        <view class="flex flex-wrap gap-4">
                            <label
                                class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                <checkbox :checked="demoLoading" @click="demoLoading = !demoLoading"
                                    :value="String(demoLoading)" color="#0ea5e9" style="transform:scale(0.8)" />
                                Loading
                            </label>
                            <label
                                class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                <checkbox :checked="demoDisabled" @click="demoDisabled = !demoDisabled"
                                    :value="String(demoDisabled)" color="#0ea5e9" style="transform:scale(0.8)" />
                                Disabled
                            </label>
                            <label
                                class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                <checkbox :checked="demoSquare" @click="demoSquare = !demoSquare"
                                    :value="String(demoSquare)" color="#0ea5e9" style="transform:scale(0.8)" />
                                Square
                            </label>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- Icons -->
        <view class="space-y-4">
            <view class="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <view class="w-1 h-5 bg-orange-500 rounded-full"></view>
                With Icons
            </view>
            <view
                class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <view class="flex flex-wrap gap-4">
                    <ReButton>
                        <template #leading>
                            <view class="i-lucide-mail w-4 h-4"></view>
                        </template>
                        Login with Email
                    </ReButton>
                    <ReButton variant="outline">
                        Next Step
                        <template #trailing>
                            <view class="i-lucide-arrow-right w-4 h-4"></view>
                        </template>
                    </ReButton>
                    <ReButton size="icon-md" variant="soft" custom-class="p-2.5">
                        <view class="i-lucide-settings size-4"></view>
                    </ReButton>
                    <ReButton size="icon-lg" color="error" custom-class="rounded-full p-2.5">
                        <view class="i-lucide-trash-2 size-6"></view>
                    </ReButton>
                </view>
            </view>
        </view>

    </view>
</template>