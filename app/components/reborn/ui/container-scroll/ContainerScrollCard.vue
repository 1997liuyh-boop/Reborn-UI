<script setup lang="ts">
interface Props {
  /** 绕 X 轴的旋转角度，单位度 */
  rotate?: number;
  /** 缩放倍数 */
  scale?: number;
}

defineProps<Props>();
</script>

<template>
  <div
    :style="{
      transform: `rotateX(${rotate}deg) scale(${scale})`,
      boxShadow:
        '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
    }"
    class="mx-auto -mt-12 h-[30rem] w-full max-w-5xl rounded-[30px] border-4 border-[#6C6C6C] bg-[#222222] p-2 shadow-2xl md:h-[40rem] md:p-6"
  >
    <div
      class="size-full overflow-hidden rounded-2xl bg-gray-100 md:rounded-2xl md:p-4 dark:bg-zinc-900"
    >
      <slot />
    </div>
  </div>
</template>
