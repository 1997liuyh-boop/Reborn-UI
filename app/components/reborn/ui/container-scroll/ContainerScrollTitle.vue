<script setup lang="ts">
interface Props {
  /** 纵向位移，单位 px */
  translate?: number;
}

defineProps<Props>();
</script>

<template>
  <div
    :style="{ transform: `translateY(${translate}px)` }"
    class="mx-auto max-w-5xl text-center"
  >
    <slot />
  </div>
</template>
