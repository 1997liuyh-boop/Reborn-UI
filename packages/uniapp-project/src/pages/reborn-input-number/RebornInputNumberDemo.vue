<script setup lang="ts">
import { ref } from 'vue'
import RebornInputNumber from '@/components/reborn-input-number/RebornInputNumber.vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'

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
    <RebornPage title="数字输入框" description="带有加减控制的数字输入组件。">

        <!-- Dynamic Configuration -->
        <RebornCard title="动态配置" custom-class="flex flex-col gap-2">
            <!-- Size -->
            <view class="space-y-3">
                <text class="text-sm text-slate-500">尺寸 (Size)</text>
                <view class="flex flex-wrap gap-2">
                    <ReButton v-for="size in sizes" :key="size" size="xs"
                        :variant="currentSize === size ? 'solid' : 'outline'"
                        :color="currentSize === size ? 'primary' : 'neutral'" @tap="currentSize = size">
                        {{ size }}
                    </ReButton>
                </view>
            </view>

            <!-- Shape -->
            <view class="space-y-3">
                <text class="text-sm text-slate-500">形状 (Shape)</text>
                <view class="flex flex-wrap gap-2">
                    <ReButton v-for="shape in shapes" :key="shape" size="xs"
                        :variant="currentShape === shape ? 'solid' : 'outline'"
                        :color="currentShape === shape ? 'primary' : 'neutral'" @tap="currentShape = shape">
                        {{ shape }}
                    </ReButton>
                </view>
            </view>

            <!-- Color -->
            <view class="space-y-3">
                <text class="text-sm text-slate-500">颜色 (Color)</text>
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

            <view class="pt-4 flex justify-center">
                <RebornInputNumber v-model="val3" :size="currentSize" :color="currentColor" :shape="currentShape" />
            </view>
        </RebornCard>

        <!-- Basic -->
        <RebornCard title="基础用法" custom-class="space-y-3">
            <view class="flex items-center justify-between">
                <text class="text-sm text-slate-600 dark:text-gray-5">默认</text>
                <RebornInputNumber v-model="val1" />
            </view>
            <view class="flex items-center justify-between">
                <text class="text-sm text-slate-600 dark:text-gray-5">禁用状态</text>
                <RebornInputNumber v-model="val1" disabled />
            </view>
        </RebornCard>

        <!-- Limits & Step -->
        <RebornCard title="限制与步长" custom-class="space-y-3">
            <view class="flex items-center justify-between">
                <text class="text-sm text-slate-600 dark:text-gray-5">Min 5, Max 20, Step 5</text>
                <RebornInputNumber v-model="val2" :min="5" :max="20" :step="5" />
            </view>
        </RebornCard>
        <!-- Custom Color -->
        <RebornCard title="自定义颜色" custom-class="space-y-3">
            <view class="flex items-center justify-between">
                <text class="text-sm text-slate-600 dark:text-gray-5">Purple Theme</text>
                <RebornInputNumber v-model="val3" :ui="{
                    wrapper: 'ring-purple-500 dark:ring-purple-500 focus-within:ring-purple-500/20',
                    divider: 'bg-purple-500 dark:bg-purple-500!',
                    button: 'hover:text-purple-600 dark:hover:text-purple-600'
                }" />
            </view>
        </RebornCard>

        <!-- Width Adjustment -->
        <RebornCard title="宽度调整" custom-class="space-y-3">
            <!-- Full Width -->
            <view class="space-y-2">
                <text class="text-sm text-slate-500">全宽 (Full Width)</text>
                <RebornInputNumber v-model="val3" :ui="{ wrapper: 'w-full' }" />
            </view>

            <view class="flex gap-2">
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
        </RebornCard>

        <!-- Fully Customized -->
        <RebornCard title="完全自定义" custom-class="space-y-3">
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
                        wrapper: 'bg-slate-900 dark:bg-slate-900 border-slate-700 ring-slate-800 rounded-md h-8',
                        input: 'text-white w-12 text-sm',
                        button: 'text-slate-400 hover:text-white px-2',
                        divider: 'bg-slate-700 w-px group-focus-within:bg-slate-600'
                    }" />
                </view>

                <!-- Ultra Small Height Theme -->
                <view class="space-y-2">
                    <text class="text-sm text-slate-500">超小高度主题 (h-7)</text>
                    <RebornInputNumber v-model="val3" :ui="{
                        wrapper: 'h-7 rounded bg-emerald-50 dark:bg-emerald-500 border-emerald-200 ring-emerald-200',
                        input: 'text-emerald-700 text-xs w-10',
                        button: 'text-emerald-600 dark:text-emerald-100 hover:text-emerald-800 dark:hover:text-warning px-1.5',
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
        </RebornCard>
    </RebornPage>
</template>
