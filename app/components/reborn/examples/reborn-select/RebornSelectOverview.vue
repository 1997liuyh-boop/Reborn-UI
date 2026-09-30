<script setup lang="ts">
/**
 * 总览卡片缩略：已选中一项的收起态选择器
 *
 * 只渲染触发框、不展开下拉面板：面板默认挂到 body 上，会逃出卡片。
 */
import type { SelectOption } from '~/components/reborn/ui/reborn-select/RebornSelect.vue'
import { ref } from 'vue'
import RebornSelect from '~/components/reborn/ui/reborn-select/RebornSelect.vue'

const city = ref('beijing')

const options: SelectOption[] = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' },
]
</script>

<template>
  <div class="w-full max-w-[210px]">
    <RebornSelect
      v-model="city"
      :options="options"
      size="sm"
      placeholder="请选择城市"
    />
  </div>
</template>
