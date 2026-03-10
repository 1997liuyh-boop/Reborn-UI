<script setup lang="ts">
import { computed } from 'vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'

const props = defineProps<{
    modelValue: any
    dotsStyles: any[]
    cornersSquareStyles: any[]
    cornersDotStyles: any[]
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
            <text class="block text-sm font-medium text-[#262626] mb-1">码点形状</text>
            <RebornRadioGroup v-model="qrConfig.dotsType" size="sm">
                <RebornRadio v-for="item in dotsStyles" :key="item.type" :label="item.name" :value="item.type" />
            </RebornRadioGroup>
        </view>

        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">码眼外框形状</text>
            <RebornRadioGroup v-model="qrConfig.cornersSquareType" size="sm">
                <RebornRadio v-for="item in cornersSquareStyles" :key="item.type" :label="item.name"
                    :value="item.type" />
            </RebornRadioGroup>
        </view>

        <view class="mb-4">
            <text class="block text-sm font-medium text-[#262626] mb-1">码眼内点形状</text>
            <RebornRadioGroup v-model="qrConfig.cornersDotType" size="sm">
                <RebornRadio v-for="item in cornersDotStyles" :key="item.type" :label="item.name" :value="item.type" />
            </RebornRadioGroup>
        </view>
    </view>
</template>
