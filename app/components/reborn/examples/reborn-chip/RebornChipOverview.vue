<script setup lang="ts">
/**
 * 总览卡片缩略：铃铛图标右上角挂一枚数字角标
 *
 * 只放单个示例，与演示「基础用法」的第一例一致；锚点放图标而不是空白块，
 * 一眼能看出角标是「挂在某个元素上」的未读提示。
 */
import RebornChip from '~/components/reborn/ui/reborn-chip/RebornChip.vue'
</script>

<template>
  <RebornChip
    color="primary"
    text="9"
  >
    <div class="border-default text-dimmed flex size-12 items-center justify-center rounded-lg border">
      <Icon
        name="lucide:bell"
        class="size-6"
      />
    </div>
  </RebornChip>
</template>
