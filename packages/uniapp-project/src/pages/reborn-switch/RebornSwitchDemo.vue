<script setup lang="ts">
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'

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
    <RebornPage title="开关 (Switch)" description="允许用户在两种状态之间切换的控件。" custom-class="space-y-2">

        <!-- Colors -->
        <RebornCard title="颜色 (Colors)" custom-class="flex flex-wrap gap-y-4">
            <RebornSwitch v-for="color in colors" :key="color" v-model="checked1" :color="color" :label="color"
                custom-class="w-1/2" />
        </RebornCard>

        <RebornCard title="尺寸 (Size)" custom-class="flex gap-2">
            <RebornSwitch v-for="size in sizes" :key="size" v-model="checked2" :size="size" :label="size" />
        </RebornCard>

        <RebornCard title="加载状态与自定义 (Loading & Customization)" custom-class="space-y-4">
            <!-- Configuration Controls -->
            <view class="space-y-2">
                <text class="text-sm text-gray-500">尺寸 (Size)</text>
                <view class="space-x-2">
                    <ReButton v-for="size in sizes" :key="size" :variant="currentSize === size ? 'solid' : 'outline'"
                        :color="currentSize === size ? 'primary' : 'neutral'" @click="currentSize = size">
                        {{ size.toUpperCase() }}
                    </ReButton>
                </view>
            </view>

            <view class="space-y-2">
                <text class="text-sm text-gray-500">颜色 (Color)</text>
                <view class="flex flex-wrap gap-2">
                    <view v-for="c in colors" :key="c"
                        class="w-6 h-6 rounded-full cursor-pointer ring-2 ring-offset-2 ring-transparent transition-all"
                        :class="[
                            `bg-${c}`,
                            currentColor === c ? 'ring-slate-400 scale-110' : 'hover:scale-110'
                        ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
                        @click="currentColor = c"></view>
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
        </RebornCard>
    </RebornPage>
</template>
