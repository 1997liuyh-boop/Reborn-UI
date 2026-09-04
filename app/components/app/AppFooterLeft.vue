<script setup lang="ts">
/** 覆盖 Docus 默认的页脚左侧文案：站点版权 + 品牌口号 */
const year = new Date().getFullYear();
</script>

<template>
  <div class="text-muted text-sm">
    © {{ year }} Reborn UI. Be yourself.
  </div>
</template>
