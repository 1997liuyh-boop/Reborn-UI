<script setup lang="ts">
/**
 * 总览卡片缩略：徽标基础色与变体
 */
import RebornBadge from '~/components/reborn/ui/reborn-badge/RebornBadge.vue'
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <RebornBadge
      color="primary"
      label="Primary"
    />
    <RebornBadge
      color="success"
      variant="soft"
      label="Success"
    />
    <RebornBadge
      color="warning"
      variant="outline"
      label="Warning"
    />
    <RebornBadge
      color="error"
      variant="subtle"
      label="Error"
    />
  </div>
</template>
