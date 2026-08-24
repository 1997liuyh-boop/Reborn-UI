<script lang="ts" setup>
/**
 * 总览卡片缩略：渐变按钮默认外观
 */
import { useColorMode } from '@vueuse/core'
import { computed } from 'vue'

const isDark = computed(() => useColorMode().value === 'dark')
const bgColor = computed(() => (isDark.value ? '#000' : '#fff'))
</script>

<template>
  <div class="flex items-center justify-center">
    <GradientButton :bg-color="bgColor">
      Gradient
    </GradientButton>
  </div>
</template>
