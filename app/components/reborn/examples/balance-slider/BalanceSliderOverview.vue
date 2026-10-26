<script setup lang="ts">
/**
 * 总览卡片缩略：左右两段色带与中间指示条，两端标注「咖啡 60% / 40% 牛奶」
 *
 * 初始值取 60 而非默认 50：两段宽度不等才看得出是在调配比例。
 *
 * 右侧色带与指示条随明暗切换黑白，取色逻辑同 Demo：从 Nuxt 的 useColorMode 读取站点当前主题，只读不写。
 */
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const rightColor = computed(() => (isDark.value ? '#FFFFFF' : '#000000'))
const indicatorColor = computed(() => (isDark.value ? '#FFFFFF' : '#000000'))
</script>

<template>
  <div class="w-[200px]">
    <BalanceSlider
      :initial-value="60"
      :right-color="rightColor"
      :indicator-color="indicatorColor"
      left-content="咖啡"
      right-content="牛奶"
    />
  </div>
</template>
