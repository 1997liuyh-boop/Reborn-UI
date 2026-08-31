<script setup lang="ts">
/**
 * 总览卡片缩略：常驻滚动条的纵向列表
 *
 * 卡片预览层是 pointer-events-none 的，悬停不会触发滚动条淡入，
 * 因此这里必须显式开 always，否则缩略图里看不到 thumb。
 */
import RebornScrollbar from '~/components/reborn/ui/scrollbar/RebornScrollbar.vue'

const rows = ['组件总览', '快速开始', '主题令牌', '表单与输入', '导航', '反馈', '数据展示', '特效']
</script>

<template>
  <div class="border-default bg-elevated w-full max-w-[210px] overflow-hidden rounded-lg border">
    <RebornScrollbar
      always
      track
      :size="6"
      :horizontal="false"
      class="h-[148px]"
    >
      <ul class="divide-default divide-y">
        <li
          v-for="row in rows"
          :key="row"
          class="text-muted px-3 py-2 text-xs"
        >
          {{ row }}
        </li>
      </ul>
    </RebornScrollbar>
  </div>
</template>
