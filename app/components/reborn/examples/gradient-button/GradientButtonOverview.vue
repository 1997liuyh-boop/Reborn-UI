<script lang="ts" setup>
/**
 * 总览卡片缩略：渐变按钮默认外观
 */
import { useColorMode } from "#imports";
import { computed } from 'vue'

// 读取站点现有主题，避免创建会改写全站 class 的独立主题状态
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
