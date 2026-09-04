<script lang="ts" setup></script>

<template>
  <!-- 该布局仅首页使用：不套 UContainer，让落地页的背景、地平线与页脚都能铺满屏幕宽度，内容宽度由各区块自行用 max-w 约束 -->
  <UMain class="relative -mt-16 pt-16">
    <div class="dark:pattern-background-d pattern-background-l absolute inset-0 z-[-1]" />
    <slot />
  </UMain>
</template>
