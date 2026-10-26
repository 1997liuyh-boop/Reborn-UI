<script setup lang="ts">
// 将默认插槽传送到页面根部，避免祖先定位和裁剪影响浮层。
defineSlots<{ default?: () => any }>();
</script>

<template>
  <Teleport to="body">
    <slot />
  </Teleport>
</template>
