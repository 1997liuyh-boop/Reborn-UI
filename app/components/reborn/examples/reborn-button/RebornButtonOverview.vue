<script setup lang="ts">
/**
 * 总览卡片缩略：仅展示按钮基础态，无演练场
 */
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <RebornButton color="primary">
      确认
    </RebornButton>
    <RebornButton
      color="neutral"
      variant="outline"
    >
      取消
    </RebornButton>
    <RebornButton
      color="error"
      variant="soft"
    >
      删除
    </RebornButton>
    <RebornButton
      color="primary"
      variant="text"
    >
      文字
    </RebornButton>
  </div>
</template>
