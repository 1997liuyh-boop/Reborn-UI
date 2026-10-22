<script setup lang="ts">
/**
 * 总览卡片缩略：「颜色 / 尺码」两组规格标签，各选中其一
 *
 * 属性组默认 24px 的组间距在卡片里显得松散，用 ui 收到 12px；标题降一档字号。
 * 标题自带 dark:text-gray-1，而 gray 色阶在暗色下会反转成近底色，这里同时覆盖暗色下的文字色，避免标题消失。
 */
import { ref } from 'vue'
import RebornSku from '~/components/reborn/ui/reborn-sku/RebornSku.vue'

const selected = ref<Record<string, any>>({
  color: 'black',
  size: 'M',
})

const options = [
  {
    title: '颜色',
    key: 'color',
    children: [
      { label: '曜石黑', value: 'black' },
      { label: '云雾白', value: 'white' },
      { label: '远峰蓝', value: 'blue' },
    ],
  },
  {
    title: '尺码',
    key: 'size',
    children: [
      { label: 'S', value: 'S' },
      { label: 'M', value: 'M' },
      { label: 'L', value: 'L' },
      { label: 'XL', value: 'XL' },
    ],
  },
]

const ui = {
  wrapper: 'w-[200px] gap-3',
  group: 'gap-1.5',
  title: 'text-sm text-gray-8 dark:text-gray-8',
}
</script>

<template>
  <RebornSku
    v-model="selected"
    :options="options"
    :ui="ui"
  />
</template>
