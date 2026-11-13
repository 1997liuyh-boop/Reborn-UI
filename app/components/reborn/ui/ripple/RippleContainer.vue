<script setup lang="ts">
// 兄弟组件一律显式导入：经 CLI 复制到使用方项目后，不能指望对方的自动导入按同样的名字解析（如 Nuxt 的 pathPrefix）
import Ripple from "./Ripple.vue";
</script>

<template>
  <div class="relative">
    <slot />
    <Ripple />
  </div>
</template>
