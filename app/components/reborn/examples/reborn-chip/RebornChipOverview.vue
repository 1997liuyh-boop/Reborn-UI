<script setup lang="ts">
/**
 * 总览卡片缩略：角标挂在占位块上的基础态
 */
import RebornChip from '~/components/reborn/ui/reborn-chip/RebornChip.vue'
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-8">
    <RebornChip
      color="primary"
      text="8"
    >
      <div class="size-12 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800" />
    </RebornChip>
    <RebornChip
      color="error"
      text="NEW"
    >
      <div class="size-12 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800" />
    </RebornChip>
    <RebornChip
      color="success"
      size="sm"
      text=""
    >
      <div class="flex size-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <UIcon
          name="i-lucide-mail"
          class="size-5 text-gray-500"
        />
      </div>
    </RebornChip>
  </div>
</template>
