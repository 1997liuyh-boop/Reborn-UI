<script setup lang="ts">
import type { QrConfig, ValueOption } from '../types'
import type { eccLevel } from '@/components/reborn-qrcode/draw'
import type { RadioValue } from '@/components/reborn-radio/reborn-radio.config'
import RebornTextarea from '@/components/reborn-textarea/RebornTextarea.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'

interface Props {
  marginOptions: readonly ValueOption<number>[]
  errorLevels: readonly ValueOption<eccLevel>[]
}
const props = defineProps<Props>()
const qrConfig = defineModel<QrConfig>({ required: true })
function patch<K extends keyof QrConfig>(key: K, value: QrConfig[K]) {
  qrConfig.value = { ...qrConfig.value, [key]: value }
}

/** 只接受控件展示的选项，从选项本身取回合法类型。 */
function setMargin(value: RadioValue) {
  const option = props.marginOptions.find(item => item.value === value)
  if (option) patch('margin', option.value)
}
function setEcc(value: RadioValue) {
  const option = props.errorLevels.find(item => item.value === value)
  if (option) patch('ecc', option.value)
}
</script>

<template>
    <view class="block">
        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">二维码内容</text>
            <view class="relative w-full">
                <RebornTextarea :model-value="qrConfig.text" :maxlength="2953" :auto-height="true"
                    placeholder="请输入网址或文本内容" @update:model-value="patch('text', $event ?? '')" />
            </view>
        </view>

        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">外边距</text>
            <RebornRadioGroup :model-value="qrConfig.margin" size="sm" @update:model-value="setMargin">
                <RebornRadio v-for="item in marginOptions" :key="item.value" :value="item.value">
                    {{ item.name }}
                </RebornRadio>
            </RebornRadioGroup>
        </view>

        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">容错率</text>
            <RebornRadioGroup :model-value="qrConfig.ecc" size="sm" @update:model-value="setEcc">
                <RebornRadio v-for="item in errorLevels" :key="item.value" :value="item.value">
                    {{ item.name }}
                </RebornRadio>
            </RebornRadioGroup>
        </view>
    </view>
</template>
