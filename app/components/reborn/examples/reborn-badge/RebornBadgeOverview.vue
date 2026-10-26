<script setup lang="ts">
/**
 * 总览卡片缩略：一枚主色徽标
 *
 * 只放单个示例，取 lg 尺寸：默认 md 只有 24px 高，在缩略预览里显得太小。
 */
import RebornBadge from "~/components/reborn/ui/reborn-badge/RebornBadge.vue";
</script>

<template>
  <RebornBadge
    color="primary"
    size="lg"
    label="推荐"
  />
</template>
