<script setup lang="ts">
import { ref } from 'vue'
import RebornSlider from '@/components/reborn-slider/RebornSlider.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import RebornInputNumber from '@/components/reborn-input-number/RebornInputNumber.vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'

const val1 = ref(30)
const val2 = ref([50, 70])
const isDisabled = ref(false);
const isLoading = ref(false);
const isShowValue = ref(true);
const step = ref(10);
const max = ref(100);

// Dynamic Configuration
const currentSize = ref<any>('md')
const currentColor = ref<any>('primary')

const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const
</script>

<template>
    <RebornPage title="滑块" description="用于在一定范围内选择数值的滑动组件。">

        <!-- Basic -->
        <RebornCard title="自定义" custom-class="space-y-4">
            <RebornSlider v-model="val1" :size="currentSize" :color="currentColor" :show-value="isShowValue"
                :step="step" :max="max" :disabled="isDisabled" :loading="isLoading" />

            <view class="flex justify-between">
                <text class="text-sm text-slate-500">尺寸 (Size)</text>
                <view class="flex flex-wrap gap-2">
                    <view v-for="size in sizes" :key="size">
                        <ReButton size="xs" :variant="currentSize === size ? 'solid' : 'outline'"
                            :color="currentSize === size ? 'primary' : 'neutral'" @tap="currentSize = size">
                            {{ size }}
                        </ReButton>
                    </view>
                </view>
            </view>
            <view class="flex justify-between">
                <text class="text-sm text-slate-500">颜色 (Color)</text>
                <view class="flex flex-wrap gap-2">
                    <view v-for="c in colors" :key="c"
                        class="w-4 h-4 rounded-full cursor-pointer ring-2 ring-offset-2 ring-transparent transition-all"
                        :class="[
                            `bg-${c}`,
                            currentColor === c ? 'ring-slate-400 scale-110' : 'hover:scale-110'
                        ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
                        @click="currentColor = c"></view>
                </view>
            </view>
            <view class="flex justify-between">
                <text class="text-sm text-slate-500">显示值</text>
                <RebornSwitch v-model="isShowValue" size="sm" />
            </view>
            <view class="flex justify-between">
                <text class="text-sm text-slate-500">步长值</text>
                <RebornInputNumber v-model="step" size="sm" />
            </view>
            <view class="flex justify-between">
                <text class="text-sm text-slate-500">最大值</text>
                <RebornInputNumber v-model="max" :max="100" :min="20" size="sm" />
            </view>
            <view class="flex justify-between">
                <text class="text-sm text-slate-500">禁用</text>
                <RebornSwitch v-model="isDisabled" size="sm" />
            </view>
        </RebornCard>
        <RebornCard title="范围选择器" custom-class="space-y-4">
            {{ val2.join(' ~ ') }}
            <RebornSlider v-model:values="val2" range />
        </RebornCard>

        <!-- Custom UI -->
        <RebornCard title="自定义样式" custom-class="space-y-4">
            <view class="space-y-2">
                <text class="text-sm text-slate-500">自定义轨道与滑块</text>
                <RebornSlider v-model="val1" :ui="{
                    track: 'bg-purple-100 dark:bg-purple-900',
                    progress: 'bg-purple-500',
                }">
                    <template #thumb="{ value }">
                        <view :style="value.style"
                            class="absolute rounded-full border-2 border-solid border-white pointer-events-none z-[1] w-7 text-center bg-warning text-24 text-white">
                            {{ value.value }}
                        </view>
                    </template>
                </RebornSlider>
            </view>
        </RebornCard>
    </RebornPage>
</template>
