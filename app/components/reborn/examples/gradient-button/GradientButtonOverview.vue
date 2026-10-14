<script lang="ts" setup>
/**
 * 总览卡片缩略：渐变按钮默认外观
 */
import { useColorMode } from '@vueuse/core'
import { computed } from 'vue'

// 须在 setup 顶层调用：放进 computed 里会在 setup 之外注册生命周期钩子，触发 Vue 警告
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const bgColor = computed(() => (isDark.value ? '#000' : '#fff'))
</script>

<template>
  <div class="flex items-center justify-center">
    <GradientButton :bg-color="bgColor">
      Gradient
    </GradientButton>
  </div>
</template>
