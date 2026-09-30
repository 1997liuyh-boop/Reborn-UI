<script setup lang="ts">
/**
 * 总览卡片缩略：横向排列的单选组，第一项选中
 */
import type { RadioOption } from '~/components/reborn/ui/reborn-radio/reborn-radio.config'
import { ref } from 'vue'
import RebornRadioGroup from '~/components/reborn/ui/reborn-radio/RebornRadioGroup.vue'

const period = ref('day')

const options: RadioOption[] = [
  { label: '按日', value: 'day' },
  { label: '按周', value: 'week' },
  { label: '按月', value: 'month' },
]
</script>

<template>
  <RebornRadioGroup
    v-model="period"
    :options="options"
  />
</template>
