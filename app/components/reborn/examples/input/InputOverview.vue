<script setup lang="ts">
/**
 * 总览卡片缩略：带标签的单行输入框，显示占位文案
 */
</script>

<template>
  <div class="flex w-[200px] flex-col gap-2">
    <label class="ml-1 text-sm font-medium text-gray-9">邮箱地址</label>
    <IInput
      placeholder="请输入邮箱地址"
      container-class="w-full"
    />
  </div>
</template>
