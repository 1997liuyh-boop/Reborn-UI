<script setup lang="ts">
/**
 * 总览卡片缩略：完成 75% 的环形进度
 *
 * 选环形而非线形：线形在窄卡片里只是一根细条，辨识度低。
 */
import RebornProgress from '~/components/reborn/ui/reborn-progress/RebornProgress.vue'
</script>

<template>
  <RebornProgress
    type="circle"
    :percent="75"
  />
</template>
