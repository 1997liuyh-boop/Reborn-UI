<script setup lang="ts">
/**
 * 总览卡片缩略：「你好，世界」逐字从下方上提到位
 *
 * 上提动画挂载时播一次并停在终态，不常驻，可直接使用组件。
 * 文案里不能有重复字符：组件用字符本身做 v-for 的 key。
 */
</script>

<template>
  <LetterPullup
    words="你好，世界"
    :delay="0.05"
    class="text-highlighted"
  />
</template>
