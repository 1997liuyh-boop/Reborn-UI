<script setup lang="ts">
/**
 * 总览卡片缩略：填写了一段反馈内容、右下角显示字数统计的三行文本域
 *
 * 带字数统计比空文本域更容易和单行输入框区分开。
 * 组件根节点默认写死 bg-white，描边在暗色下取 gray-1（近底色），暗色卡片里会是一块刺眼的白框；
 * 缩略图用 ui.root 换成随明暗切换的 bg-gray-1，并让暗色描边沿用 gray-4。
 */
import { shallowRef } from "vue";
import RebornTextarea from '~/components/reborn/ui/reborn-textarea/RebornTextarea.vue'

const feedback = shallowRef('签到流程很顺畅，希望下次活动能多安排一些互动环节。')

const ui = { root: 'bg-gray-1 dark:ring-gray-4' }
</script>

<template>
  <div class="w-[200px]">
    <RebornTextarea
      v-model="feedback"
      size="sm"
      :rows="3"
      :maxlength="100"
      show-word-limit
      :ui="ui"
    />
  </div>
</template>
