<script setup lang="ts">
/**
 * 总览卡片缩略：停在 40 的单滑块
 *
 * 滑块宽度随父级撑满，外层限定 180px，给两端手柄留出卡片内边距。
 */
import { ref } from 'vue'
import RebornSlider from '~/components/reborn/ui/reborn-slider/RebornSlider.vue'

const volume = ref(40)
</script>

<template>
  <div class="w-[180px]">
    <RebornSlider v-model="volume" />
  </div>
</template>
