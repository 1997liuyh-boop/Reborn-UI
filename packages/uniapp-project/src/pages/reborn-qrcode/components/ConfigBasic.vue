<script setup lang="ts">
import { computed } from 'vue'
import RebornTextarea from '@/components/reborn-textarea/RebornTextarea.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'

const props = defineProps<{
    modelValue: any
    marginOptions: any[]
    errorLevels: any[]
}>()

const emit = defineEmits(['update:modelValue'])

const qrConfig = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})
</script>

<template>
    <view class="block">
        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">二维码内容</text>
            <view class="relative w-full">
                <RebornTextarea v-model="qrConfig.text" :maxlength="2953" :auto-height="true"
                    placeholder="请输入网址或文本内容" />
            </view>
        </view>

        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">外边距</text>
            <RebornRadioGroup v-model="qrConfig.margin" size="sm">
                <RebornRadio v-for="item in marginOptions" :key="item.value" :label="item.name" :value="item.value" />
            </RebornRadioGroup>
        </view>

        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">容错率</text>
            <RebornRadioGroup v-model="qrConfig.ecc" size="sm">
                <RebornRadio v-for="item in errorLevels" :key="item.value" :label="item.name" :value="item.value" />
            </RebornRadioGroup>
        </view>
    </view>
</template>
