<script setup lang="ts">
/**
 * 总览卡片缩略：一句话按词依次从模糊中浮现，最后停在清晰的完整句子上
 *
 * 入场动画由一组一次性 setTimeout 驱动，挂载时播放一次就结束，不会常驻，直接用真实组件。
 * 组件按空格拆词，中文文案里手动留出空格，让「逐词」的节奏能看出来。
 */
</script>

<template>
  <TextGenerateEffect
    class="text-highlighted max-w-[200px] text-center text-lg font-semibold"
    words="每个 词语 依次 从模糊中 清晰浮现"
  />
</template>
