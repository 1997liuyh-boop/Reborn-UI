<script setup lang="ts">
/**
 * 总览卡片缩略：描边胶囊形态的数字输入框
 *
 * 不用 controls-position="left" / "right"：那套按钮是悬停才滑入的，
 * 而卡片预览层是 pointer-events-none 的，静态缩略图里会看不到按钮。
 */
import { ref } from 'vue'
import RebornInputNumber from '~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue'

const value = ref(3)
</script>

<template>
  <div class="flex w-full max-w-[210px] justify-center">
    <RebornInputNumber
      v-model="value"
      size="sm"
      shape="circle"
      variant="outlined"
      :min="0"
      :max="99"
    />
  </div>
</template>
