<script setup lang="ts">
/**
 * 总览卡片缩略：五星评分，点亮三颗半
 */
import { ref } from 'vue'
import RebornRate from '~/components/reborn/ui/reborn-rate/RebornRate.vue'

const score = ref(3.5)
</script>

<template>
  <RebornRate
    v-model="score"
    allow-half
  />
</template>
