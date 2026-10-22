<script setup lang="ts">
/**
 * 总览卡片缩略：图片、文字、图标三种内容的头像并排
 *
 * 三种内容对应头像的三条回退路径（图片 → 默认插槽文字 → 图标），并排放最能说明它能装什么；
 * 第三个用方形，顺带展示形状差异。
 */
import { avatarPeople } from '~/components/reborn/examples/reborn-avatar/avatar-demo.data'
import RebornAvatar from '~/components/reborn/ui/reborn-avatar/RebornAvatar.vue'
</script>

<template>
  <div class="flex items-center gap-4">
    <RebornAvatar
      :size="48"
      :src="avatarPeople[0]!.src"
      alt="林舟"
    />
    <RebornAvatar
      :size="48"
      alt="陈雨"
      :ui="{ root: 'bg-primary/10 text-primary text-lg' }"
    >
      陈
    </RebornAvatar>
    <RebornAvatar
      :size="48"
      shape="square"
      icon="lucide:building-2"
      alt="组织账号"
    />
  </div>
</template>
