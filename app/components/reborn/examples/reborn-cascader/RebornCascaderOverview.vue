<script setup lang="ts">
/**
 * 总览卡片缩略：已选中「浙江 / 杭州 / 西湖」的收起态级联选择器
 *
 * 只渲染触发框、不展开多列面板：面板挂到 body 上会逃出卡片，多列宽度也放不下。
 */
import type { CascaderOption } from '~/components/reborn/ui/reborn-cascader/reborn-cascader.config'
import { ref } from 'vue'
import RebornCascader from '~/components/reborn/ui/reborn-cascader/RebornCascader.vue'

const region = ref('xihu')

const options: CascaderOption[] = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      {
        value: 'hangzhou',
        label: '杭州',
        children: [{ value: 'xihu', label: '西湖' }],
      },
    ],
  },
]
</script>

<template>
  <div class="w-full max-w-[210px]">
    <RebornCascader
      v-model="region"
      :options="options"
      size="sm"
      placeholder="请选择地区"
    />
  </div>
</template>
