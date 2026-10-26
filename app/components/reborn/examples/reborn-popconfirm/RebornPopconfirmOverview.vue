<script setup lang="ts">

/** 缩略图只呈现确认气泡外观，不持有真实浮层及全局事件。 */
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
</script>

<template>
  <div class="inline-flex flex-col items-center gap-2">
    <RebornButton size="sm" color="error" variant="outlined">删除</RebornButton>
    <div class="flex w-[190px] flex-col gap-3 rounded-lg border border-gray-3 bg-default p-3 shadow-sm">
      <p class="text-sm font-medium text-gray-9">确定删除这条记录？</p>
      <div class="flex justify-end gap-2">
        <RebornButton size="sm" variant="outlined" color="neutral">取消</RebornButton>
        <RebornButton size="sm" color="error">确定</RebornButton>
      </div>
    </div>
  </div>
</template>
