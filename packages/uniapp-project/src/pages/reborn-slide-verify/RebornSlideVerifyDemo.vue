<script setup lang="ts">
import type {
    SlideVerifyColor,
    SlideVerifySize,
} from '@/components/reborn-slide-verify/reborn-slide-verify.config'
import { ref } from 'vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import {
    slideVerifyColors,
    slideVerifySizes,
} from '@/components/reborn-slide-verify/reborn-slide-verify.config'
import RebornSlideVerify from '@/components/reborn-slide-verify/RebornSlideVerify.vue'

const basicRef = ref<InstanceType<typeof RebornSlideVerify> | null>(null)
const basicVerified = ref(false)
const customVerified = ref(false)
const slotVerified = ref(false)
const successVerified = ref(true)
const currentColor = ref<SlideVerifyColor>('primary')
const currentSize = ref<SlideVerifySize>('md')
const isDisabled = ref(false)
const isLoading = ref(false)
const logs = ref<string[]>(['等待滑动验证'])
const statusTextClass = 'text-24 text-gray-5 dark:text-gray-3'
const colorDotBaseClass = 'size-6 rounded-full border border-solid border-white shadow-sm transition-transform active:scale-95'
const logItemClass = 'rounded-[12rpx] bg-gray-1 px-[20rpx] py-[14rpx] dark:bg-gray-8'
const logTextClass = 'text-24 text-gray-6 dark:text-gray-3'

function addLog(text: string) {
    logs.value.unshift(`${new Date().toLocaleTimeString()} ${text}`)
    logs.value = logs.value.slice(0, 4)
}

function handleSuccess(name: string) {
    addLog(`${name} 验证通过`)
    uni.showToast({
        title: '验证通过',
        icon: 'success',
    })
}

function handleFail(name: string) {
    addLog(`${name} 未滑动到终点`)
}

function resetBasic() {
    basicRef.value?.reset()
    addLog('基础示例已重置')
}

function verifyBasic() {
    basicRef.value?.verify()
}

function getColorDotClass(color: SlideVerifyColor) {
    return currentColor.value === color ? 'ring-2 ring-gray-4 ring-offset-2' : ''
}

function getShieldIcon(verified: boolean) {
    return verified ? 'i-lucide-shield-check text-success' : 'i-lucide-shield'
}

function getSlotThumbIcon(verified: boolean, loading: boolean) {
    if (loading) {
        return 'i-svg-spinners-180-ring-with-bg'
    }
    return verified ? 'i-lucide-check' : 'i-lucide-arrow-right'
}
</script>

<template>
    <RebornPage title="滑块验证" description="通过滑动操作完成安全验证，适用于登录、提交等二次确认场景。">
        <RebornCard title="基础用法" custom-class="space-y-4" overflow-visible>
            <RebornSlideVerify ref="basicRef" v-model="basicVerified" @success="handleSuccess('基础示例')"
                @fail="handleFail('基础示例')" @change="addLog(`基础状态：${$event ? '已通过' : '未通过'}`)" />

            <view class="flex flex-row items-center justify-between gap-3">
                <text :class="statusTextClass">
                    当前状态：{{ basicVerified ? '已通过' : '未通过' }}
                </text>
                <view class="flex flex-row gap-2">
                    <RebornButton size="sm" variant="outline" color="neutral" @tap="resetBasic">
                        重置
                    </RebornButton>
                    <RebornButton size="sm" variant="soft" @tap="verifyBasic">
                        直接通过
                    </RebornButton>
                </view>
            </view>
        </RebornCard>

        <RebornCard title="动态配置" custom-class="space-y-4" overflow-visible>
            <RebornSlideVerify v-model="customVerified" :size="currentSize" :color="currentColor" :disabled="isDisabled"
                :loading="isLoading" :threshold="0.9" default-text="拖动滑块完成当前配置" @success="handleSuccess('动态配置')"
                @fail="handleFail('动态配置')" />

            <view class="flex flex-col gap-3">
                <view class="flex flex-row items-center justify-between gap-3">
                    <text class="text-24 text-gray-5">尺寸</text>
                    <view class="flex flex-row flex-wrap justify-end gap-2">
                        <RebornButton v-for="size in slideVerifySizes" :key="size" size="xs"
                            :variant="currentSize === size ? 'solid' : 'outline'"
                            :color="currentSize === size ? 'primary' : 'neutral'" @tap="currentSize = size">
                            {{ size }}
                        </RebornButton>
                    </view>
                </view>

                <view class="flex flex-row items-center justify-between gap-3">
                    <text class="text-24 text-gray-5">颜色</text>
                    <view class="flex flex-row flex-wrap justify-end gap-2">
                        <view v-for="color in slideVerifyColors" :key="color"
                            :class="[colorDotBaseClass, getColorDotClass(color)]"
                            :style="{ backgroundColor: `var(--color-${color}, ${color === 'neutral' ? '#737373' : ''})` }"
                            @tap="currentColor = color" />
                    </view>
                </view>

                <view class="grid grid-cols-2 gap-2">
                    <RebornButton size="sm" :variant="isLoading ? 'solid' : 'outline'"
                        :color="isLoading ? 'warning' : 'neutral'" @tap="isLoading = !isLoading">
                        {{ isLoading ? '关闭加载' : '加载状态' }}
                    </RebornButton>
                    <RebornButton size="sm" :variant="isDisabled ? 'solid' : 'outline'"
                        :color="isDisabled ? 'error' : 'neutral'" @tap="isDisabled = !isDisabled">
                        {{ isDisabled ? '取消禁用' : '禁用状态' }}
                    </RebornButton>
                </view>
            </view>
        </RebornCard>

        <RebornCard title="尺寸展示" custom-class="space-y-4" overflow-visible>
            <view v-for="size in slideVerifySizes" :key="size" class="space-y-2">
                <text class="text-24 font-medium text-gray-5">{{ size }}</text>
                <RebornSlideVerify :size="size" color="success" auto-reset @success="handleSuccess(`${size} 尺寸`)" />
            </view>
        </RebornCard>

        <RebornCard title="颜色展示" custom-class="space-y-4" overflow-visible>
            <view v-for="color in slideVerifyColors" :key="color" class="space-y-2">
                <text class="text-24 font-medium text-gray-5">{{ color }}</text>
                <RebornSlideVerify :color="color" size="sm" auto-reset @success="handleSuccess(`${color} 颜色`)" />
            </view>
        </RebornCard>

        <RebornCard title="状态演示" custom-class="space-y-4" overflow-visible>
            <RebornSlideVerify disabled default-text="禁用状态，无法拖动" />
            <RebornSlideVerify loading default-text="正在校验中" />
            <RebornSlideVerify v-model="successVerified" success-text="已完成安全校验" />
            <RebornSlideVerify default-text="这是一段比较长的验证提示文案，用于观察内容溢出时的截断表现" fail-text="还差一点，请继续向右滑动" />
        </RebornCard>

        <RebornCard title="样式覆盖与插槽" custom-class="space-y-4" overflow-visible>
            <RebornSlideVerify v-model="slotVerified" color="warning" :ui="{
                track: 'bg-purple-50 border-purple-100 dark:bg-purple-950 dark:border-purple-800',
                progress: 'bg-linear-to-r from-purple-400 to-pink-500',
                thumb: 'bg-black text-white border-black shadow-[0_10rpx_30rpx_rgba(168,85,247,0.35)]',
                text: 'text-purple-600 dark:text-purple-300',
            }" @success="handleSuccess('自定义插槽')">
                <template #default="{ verified, progress }">
                    <view class="flex flex-row items-center gap-2">
                        <view :class="getShieldIcon(verified)" class="text-32" />
                        <text class="text-26 font-semibold text-purple-600">
                            {{ verified ? '安全验证已完成' : `安全验证 ${progress}%` }}
                        </text>
                    </view>
                </template>

                <template #thumb="{ verified, loading }">
                    <view :class="getSlotThumbIcon(verified, loading)" class="text-36" />
                </template>
            </RebornSlideVerify>
        </RebornCard>

        <RebornCard title="事件日志" custom-class="space-y-2">
            <view v-for="log in logs" :key="log" :class="logItemClass">
                <text :class="logTextClass">
                    {{ log }}
                </text>
            </view>
        </RebornCard>
    </RebornPage>
</template>
