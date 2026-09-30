<script setup lang="ts">
/**
 * 总览卡片缩略：已输入关键词的胶囊搜索框
 */
import { ref } from 'vue'
import RebornSearchBox from '~/components/reborn/ui/reborn-search-box/RebornSearchBox.vue'

const keyword = ref('组件')
</script>

<template>
  <div class="w-full max-w-[210px]">
    <RebornSearchBox
      v-model="keyword"
      size="sm"
      placeholder="搜索组件"
    />
  </div>
</template>
