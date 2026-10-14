<script setup lang="ts">
/**
 * 总览卡片缩略：已输入关键词的胶囊搜索框
 */
import type { SearchBoxModelValue } from '~/components/reborn/ui/reborn-search-box/RebornSearchBox.vue'
import { ref } from 'vue'
import RebornSearchBox from '~/components/reborn/ui/reborn-search-box/RebornSearchBox.vue'

// 搜索框的 v-model 是 { inputValue, selectValue } 组合对象，不能直接传字符串
const keyword = ref<SearchBoxModelValue>({ inputValue: '组件', selectValue: '' })
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
