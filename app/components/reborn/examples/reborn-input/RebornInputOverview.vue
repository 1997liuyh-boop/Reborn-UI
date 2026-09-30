<script setup lang="ts">
/**
 * 总览卡片缩略：带前缀图标、可清空的描边输入框
 *
 * 卡片宽度有限，用 sm 尺寸并限宽 210px，避免被裁切。
 */
import { ref } from 'vue'
import RebornInput from '~/components/reborn/ui/reborn-input/RebornInput.vue'

const value = ref('Reborn UI')
</script>

<template>
  <div class="w-full max-w-[210px]">
    <RebornInput
      v-model="value"
      size="sm"
      variant="outlined"
      clearable
      prefix-icon="lucide:search"
    />
  </div>
</template>
