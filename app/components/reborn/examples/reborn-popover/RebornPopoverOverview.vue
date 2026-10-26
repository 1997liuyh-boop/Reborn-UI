<script setup lang="ts">

/** 缩略图使用静态结构，页面滚动不会关闭，也不注册浮层监听。 */
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
</script>

<template>
  <div class="inline-flex flex-col items-center gap-2">
    <RebornButton size="sm" variant="outlined">查看详情</RebornButton>
    <div class="w-40 rounded-lg border border-gray-3 bg-default p-3 text-sm text-gray-9 shadow-sm">
      订单已发货，预计明天送达
    </div>
  </div>
</template>
