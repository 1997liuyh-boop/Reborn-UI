<script setup lang="ts">
/**
 * 总览卡片缩略：描边 / 填充 / 下划线三种变体
 *
 * 卡片宽度有限，统一用 sm 尺寸并限宽 210px，避免被裁切。
 */
import { ref } from 'vue'
import RebornInput from '~/components/reborn/ui/reborn-input/RebornInput.vue'

const outlined = ref('Reborn UI')
const filled = ref('')
const underlined = ref('')
</script>

<template>
  <div class="flex w-full max-w-[210px] flex-col gap-3">
    <RebornInput
      v-model="outlined"
      size="sm"
      variant="outlined"
      clearable
      prefix-icon="lucide:search"
    />
    <RebornInput
      v-model="filled"
      size="sm"
      variant="filled"
      placeholder="填充"
    />
    <RebornInput
      v-model="underlined"
      size="sm"
      variant="underlined"
      placeholder="下划线"
    />
  </div>
</template>
