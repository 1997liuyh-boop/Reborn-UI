<script setup lang="ts">
import { ref } from "vue";
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornInputOtp from "@/components/reborn-input-otp/RebornInputOtp.vue";
import { inputOtpSizes, inputOtpColors } from '@/components/reborn-input-otp/reborn-input-otp.config'

const demoColor = ref<typeof inputOtpColors[number]>('primary')
const demoSize = ref<typeof inputOtpSizes[number]>('md')
const value1 = ref("");
const value2 = ref("");
const value3 = ref("");
const value4 = ref("");
const value5 = ref("");
const value6 = ref("");
const value7 = ref("");
const value8 = ref("");
const value9 = ref("");
const value10 = ref("");
const value11 = ref("12");
const value12 = ref("1234");

</script>

<template>
    <RebornPage title="OTP 验证码输入" description="验证码输入组件，用于输入一次性密码（OTP）或验证码，支持自定义位数、自动聚焦等">

        <RebornCard title="基础用法" custom-class="space-y-4">
            <view class="space-y-3">
                <view class="text-sm font-medium text-slate-500 dark:text-slate-200">
                    按钮颜色
                </view>
                <view class="flex flex-wrap gap-2">
                    <view v-for="c in inputOtpColors" :key="c"
                        class="w-6 h-6 rounded-full cursor-pointer ring-2 ring-offset-2 ring-transparent transition-all"
                        :class="[
                            `bg-${c}`,
                            demoColor === c ? 'ring-slate-400 scale-110' : 'hover:scale-110'
                        ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
                        @click="demoColor = c"></view>
                </view>
            </view>

            <view class="space-y-3">
                <view class="text-sm font-medium text-slate-500 dark:text-slate-200">
                    按钮大小
                </view>
                <view class="space-x-2">
                    <RebornButton v-for="s in inputOtpSizes" :key="s" variant="outline"
                        :color="demoSize === s ? 'primary' : 'neutral'" @click="demoSize = s" size="sm" :square="false"
                        custom-class="rounded-full">
                        {{ s }}
                    </RebornButton>
                </view>
            </view>
            <RebornInputOtp v-model="value1" :color="demoColor" :size="demoSize" />
        </RebornCard>

        <RebornCard title="自动聚焦">
            <RebornInputOtp v-model="value2" :autofocus="true" />
        </RebornCard>

        <RebornCard title="自定义长度">
            <RebornInputOtp v-model="value3" :length="6" />
        </RebornCard>

        <RebornCard title="自定义样式">
            <RebornInputOtp v-model="value11" :ui="{
                item: 'bg-gray-100 rounded-full border-gray-200 !h-[90rpx] !w-[90rpx]',
                value: 'text-primary font-bold'
            }" />
        </RebornCard>

        <RebornCard title="禁用">
            <RebornInputOtp v-model="value12" disabled />
        </RebornCard>

    </RebornPage>
</template>