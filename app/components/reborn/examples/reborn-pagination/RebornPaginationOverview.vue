<script setup lang="ts">
/**
 * 总览卡片缩略：背景模式的分页器
 *
 * 卡片宽度只有 210px，总数压到 3 页（前后箭头 + 3 个页码共 5 格），
 * 否则背景模式会换行。
 */
import { ref } from 'vue'
import RebornPagination from '~/components/reborn/ui/reborn-pagination/RebornPagination.vue'

const page = ref(2)
</script>

<template>
  <div class="flex w-full max-w-[210px] justify-center">
    <RebornPagination
      v-model="page"
      :total="30"
      :pager-count="5"
      size="sm"
      background
    />
  </div>
</template>
