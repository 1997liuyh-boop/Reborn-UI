<script setup lang="ts">
/**
 * 总览卡片缩略：深色舞台上带黑色描边与彩色错位投影的「3D」字样
 *
 * 组件本身是纯 CSS（文字描边 + 双层 text-shadow），摆动也是 CSS 关键帧，直接使用即可。
 * 默认 20px 描边按 8xl 字号设计，缩到 7xl 后描边与投影同比调小，否则字形会糊成一团；
 * 沿用 Demo 的深色舞台，浅色卡片上投影层的层次看不清。
 */
</script>

<template>
  <div class="flex items-center justify-center rounded-xl bg-gray-10 px-8 py-3 dark:bg-gray-1">
    <Text3d
      class="text-7xl font-black"
      shadow-color="skyblue"
      :stroke-size="14"
      :shadow1-size="5"
      :shadow2-size="8"
    >
      3D
    </Text3d>
  </div>
</template>
