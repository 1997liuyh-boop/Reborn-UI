<script setup lang="ts">
import type { QrConfig, ShapeOption } from '../types'
import type { RadioValue } from '@/components/reborn-radio/reborn-radio.config'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'

interface Props {
  dotsStyles: readonly ShapeOption<QrConfig['dotsType']>[]
  cornersSquareStyles: readonly ShapeOption<number>[]
  cornersDotStyles: readonly ShapeOption<number>[]
}
const props = defineProps<Props>()
const qrConfig = defineModel<QrConfig>({ required: true })
function patch<K extends keyof QrConfig>(key: K, value: QrConfig[K]) {
  qrConfig.value = { ...qrConfig.value, [key]: value }
}

/** 每类形状只接受自己的可选集合，拒绝其他控件的宽事件值。 */
function setDotsType(value: RadioValue) {
  const option = props.dotsStyles.find(item => item.type === value)
  if (option) patch('dotsType', option.type)
}
function setCornersSquareType(value: RadioValue) {
  const option = props.cornersSquareStyles.find(item => item.type === value)
  if (option) patch('cornersSquareType', option.type)
}
function setCornersDotType(value: RadioValue) {
  const option = props.cornersDotStyles.find(item => item.type === value)
  if (option) patch('cornersDotType', option.type)
}
</script>

<template>
    <view class="block">
        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">码点形状</text>
            <RebornRadioGroup :model-value="qrConfig.dotsType" size="sm" @update:model-value="setDotsType">
                <RebornRadio v-for="item in dotsStyles" :key="item.type" :value="item.type">
                    {{ item.name }}
                </RebornRadio>
            </RebornRadioGroup>
        </view>

        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">码眼外框形状</text>
            <RebornRadioGroup :model-value="qrConfig.cornersSquareType" size="sm" @update:model-value="setCornersSquareType">
                <RebornRadio v-for="item in cornersSquareStyles" :key="item.type" :value="item.type">
                    {{ item.name }}
                </RebornRadio>
            </RebornRadioGroup>
        </view>

        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">码眼内点形状</text>
            <RebornRadioGroup :model-value="qrConfig.cornersDotType" size="sm" @update:model-value="setCornersDotType">
                <RebornRadio v-for="item in cornersDotStyles" :key="item.type" :value="item.type">
                    {{ item.name }}
                </RebornRadio>
            </RebornRadioGroup>
        </view>
    </view>
</template>
