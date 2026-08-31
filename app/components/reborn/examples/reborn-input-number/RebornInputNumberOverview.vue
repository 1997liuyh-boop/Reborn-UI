<script setup lang="ts">
/**
 * 总览卡片缩略：描边胶囊与填充方角两种形态
 *
 * 不用 controls-position="left" / "right"：那套按钮是悬停才滑入的，
 * 而卡片预览层是 pointer-events-none 的，静态缩略图里会看不到按钮。
 */
import { ref } from 'vue'
import RebornInputNumber from '~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue'

const outlined = ref(3)
const filled = ref(12)
</script>

<template>
  <div class="flex w-full max-w-[210px] flex-col items-center gap-4">
    <RebornInputNumber
      v-model="outlined"
      size="sm"
      shape="circle"
      variant="outlined"
      :min="0"
      :max="99"
    />
    <RebornInputNumber
      v-model="filled"
      size="sm"
      shape="square"
      variant="filled"
      :min="0"
      :max="99"
    />
  </div>
</template>
