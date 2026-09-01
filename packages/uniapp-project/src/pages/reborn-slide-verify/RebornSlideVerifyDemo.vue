<script setup lang="ts">
import type {
    SlideVerifyColor,
    SlideVerifySize,
} from '@/components/reborn-slide-verify/reborn-slide-verify.config'
import { computed, ref } from 'vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornSlider from '@/components/reborn-slider/RebornSlider.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import {
    slideVerifyColors,
    slideVerifySizes,
} from '@/components/reborn-slide-verify/reborn-slide-verify.config'
import RebornSlideVerify from '@/components/reborn-slide-verify/RebornSlideVerify.vue'

const basicRef = ref<InstanceType<typeof RebornSlideVerify> | null>(null)
const basicVerified = ref(false)
const customVerified = ref(false)
const slotVerified = ref(false)
const thresholdSliderValue = ref(70)
const currentColor = ref<SlideVerifyColor>('primary')
const currentSize = ref<SlideVerifySize>('md')
const isDisabled = ref(false)
const isLoading = ref(false)
const splitText = ref(true)
const showFailText = ref(true)
const isSquare = ref(false)
const widthPercent = ref(100)
const currentWidth = computed(() => widthPercent.value === 100 ? '' : `${widthPercent.value}%`)
const logs = ref<string[]>(['等待滑动验证'])
const statusTextClass = 'text-24 text-gray-5 dark:text-gray-3'
const colorDotBaseClass = 'size-6 rounded-full shadow-sm transition-transform'

function addLog(text: string) {
    logs.value.unshift(`${new Date().toLocaleTimeString()} ${text}`)
}

function handleSuccess(name: string) {
    addLog(`${name} 验证通过`)
}

function handleFail(name: string) {
    addLog(`${name} 未滑动到终点`)
}

function resetBasic() {
    basicRef.value?.reset()
    logs.value = []
    addLog('基础示例已重置')
}

function verifyBasic() {
    basicRef.value?.verify()
}

function handleThresholdChange() {
    customVerified.value = false
}

function getColorDotClass(color: SlideVerifyColor) {
    return currentColor.value === color ? 'scale-110' : ''
}

function getShieldIcon(verified: boolean) {
    return verified ? 'i-lucide-shield-check' : 'i-lucide-shield'
}

</script>

<template>
    <RebornPage title="滑块验证" description="通过滑动操作完成安全验证，适用于登录、提交等二次确认场景。">
        <RebornCard title="基础用法" custom-class="space-y-4" overflow-visible>
            <RebornSlideVerify ref="basicRef" v-model="basicVerified" show-toast @success="handleSuccess('基础示例')"
                @fail="handleFail('基础示例')"  />

            <view class="flex flex-row items-center justify-between gap-3">
                <text :class="statusTextClass">
                    当前状态：{{ basicVerified ? '已通过' : '未通过' }}
                </text>
                <view class="flex flex-row gap-2">
                    <RebornButton size="sm" variant="outlined" color="neutral" @tap="resetBasic">
                        重置
                    </RebornButton>
                    <RebornButton size="sm" @tap="verifyBasic" color="primary">
                        直接通过
                    </RebornButton>
                </view>
            </view>
        </RebornCard>

        <RebornCard title="动态配置" custom-class="space-y-4" overflow-visible>
            <RebornSlideVerify v-model="customVerified" :size="currentSize" :color="currentColor" :disabled="isDisabled"
                :loading="isLoading" :threshold="thresholdSliderValue" show-threshold-text
                threshold-text="拖动超过 {threshold}% 完成当前配置" :split-text="splitText"
                fail-text="未达到通过阈值，请继续向右滑动" :show-fail-text="showFailText"
                :width="currentWidth" :shape="isSquare ? 'square' : 'pill'"
                @success="handleSuccess('动态配置')"
                @fail="handleFail('动态配置')" />

            <view class="flex flex-col gap-3">
                <view class="flex flex-row items-center justify-between gap-3">
                    <text class="text-sm text-slate-500">尺寸</text>
                    <view class="flex flex-row flex-wrap justify-end gap-2">
                        <RebornButton v-for="size in slideVerifySizes" :key="size" size="xs"
                            :variant="currentSize === size ? 'filled' : 'outlined'"
                            :color="currentSize === size ? 'primary' : 'neutral'" @tap="currentSize = size">
                            {{ size }}
                        </RebornButton>
                    </view>
                </view>

                <view class="flex flex-row items-center justify-between gap-3">
                    <text class="text-sm text-slate-500">颜色</text>
                    <view class="flex flex-row flex-wrap justify-end gap-2">
                        <view v-for="color in slideVerifyColors" :key="color"
                            :class="[colorDotBaseClass, getColorDotClass(color)]"
                            :style="{ backgroundColor: `var(--color-${color}, ${color === 'neutral' ? '#737373' : ''})` }"
                            @tap="currentColor = color" />
                    </view>
                </view>

                <view class="flex flex-row items-center justify-between">
                    <text class="text-sm text-slate-500 dark:text-gray-3">容器宽度</text>
                    <view class="rounded-full px-[20rpx] py-[6rpx]"
                        :style="{ backgroundColor: `color-mix(in srgb, var(--color-${currentColor}) 15%, transparent)` }">
                        <text class="text-26 font-semibold tabular-nums"
                            :style="{ color: `var(--color-${currentColor})` }">
                            {{ widthPercent }}%
                        </text>
                    </view>
                </view>

                <RebornSlider v-model="widthPercent" :min="50" :max="100" :step="1" :color="currentColor"
                    @change="customVerified = false" />

                <view class="flex flex-row items-center justify-between">
                    <text class="text-sm text-slate-500 dark:text-gray-3">通过阈值</text>
                    <view class="rounded-full px-[20rpx] py-[6rpx]"
                        :style="{ backgroundColor: `color-mix(in srgb, var(--color-${currentColor}) 15%, transparent)` }">
                        <text class="text-26 font-semibold tabular-nums"
                            :style="{ color: `var(--color-${currentColor})` }">
                            {{ thresholdSliderValue }}%
                        </text>
                    </view>
                </view>

                <RebornSlider v-model="thresholdSliderValue" :min="50" :max="99" :step="1" :color="currentColor"
                    @change="handleThresholdChange" />

                <view class="flex justify-between">
                    <text class="text-sm text-slate-500">加载</text>
                    <RebornSwitch v-model="isLoading" />
                </view>
                <view class="flex justify-between">
                    <text class="text-sm text-slate-500">禁用</text>
                    <RebornSwitch v-model="isDisabled" />
                </view>
                <view class="flex justify-between">
                    <text class="text-sm text-slate-500">失败提示</text>
                    <RebornSwitch v-model="showFailText" />
                </view>
                <view class="flex justify-between">
                    <text class="text-sm text-slate-500">分层文案</text>
                    <RebornSwitch v-model="splitText" />
                </view>
                <view class="flex justify-between">
                    <text class="text-sm text-slate-500">方形</text>
                    <RebornSwitch v-model="isSquare" @change="customVerified = false" />
                </view>

            </view>
        </RebornCard>

        <RebornCard title="尺寸展示" custom-class="space-y-2" overflow-visible>
            <view v-for="size in slideVerifySizes" :key="size" class="space-y-2">
                <text class="font-medium text-sm text-slate-500">{{ size }}</text>
                <RebornSlideVerify :size="size" color="success" auto-reset @success="handleSuccess(`${size} 尺寸`)" />
            </view>
        </RebornCard>

        <RebornCard title="状态演示" custom-class="space-y-4" overflow-visible>
            <RebornSlideVerify disabled default-text="禁用状态，无法拖动" />
            <RebornSlideVerify loading default-text="正在校验中" />
            <RebornSlideVerify default-verified success-text="已完成安全校验" />
            <RebornSlideVerify default-text="这是一段比较长的验证提示文案，用于观察内容溢出时的截断表现" fail-text="还差一点，请继续向右滑动" />
        </RebornCard>

        <RebornCard title="样式覆盖与插槽" custom-class="space-y-4" overflow-visible>
            <RebornSlideVerify v-model="slotVerified" color="warning" thumb-icon="i-lucide-chevron-right" success-icon="i-lucide-check-check" :ui="{
                track: 'bg-green-50 border-green-100 dark:bg-green-950 dark:border-green-800',
                progress: 'bg-gradient-to-r from-green-200 to-emerald-300',
                thumb: 'h-[84rpx] w-[84rpx] bg-white border-green-200 text-green-400 shadow-[0_8rpx_24rpx_rgba(34,197,94,0.20)]',
                thumbIcon: 'text-green-400',
                text: 'text-green-400 dark:text-green-300',
                verifiedTrack: 'bg-green-100 border-green-200 dark:bg-green-900 dark:border-green-700',
                verifiedProgress: 'bg-gradient-to-r from-green-400 to-emerald-500',
                verifiedText: 'text-green-700 dark:text-green-200',
                verifiedThumb: 'h-[84rpx] w-[84rpx] bg-green-500 border-green-400 text-white shadow-[0_8rpx_28rpx_rgba(34,197,94,0.45)]',
                verifiedThumbIcon: 'text-white',
            }" @success="handleSuccess('自定义插槽')">
                <template #default="{ verified, progress, ui }">
                    <view class="flex flex-row items-center gap-2">
                        <view :class="[getShieldIcon(verified), verified ? ui.text() : 'text-green-400 dark:text-green-300']"
                            class="text-32" />
                        <text :class="verified ? ui.text() : 'text-green-500 dark:text-green-400'" class="text-30 font-semibold">
                            {{ verified ? '安全验证已完成' : `安全验证 ${progress}%` }}
                        </text>
                    </view>
                </template>

                <template #thumb="{ icon, ui }">
                    <view :class="[icon, ui.thumbIcon({ class: 'size-[32rpx] text-[32rpx]' })]" />
                </template>
            </RebornSlideVerify>
        </RebornCard>
    </RebornPage>
</template>
