<script setup lang="ts">
import theme from '~/components/reborn/ui/reborn-drawer/reborn-drawer.config'
import { tv } from '~/lib/tv'

// 缩略预览复用真实区域样式，只缩小尺寸与间距。
const ui = tv(theme)({ direction: 'right', modal: true })
</script>

<template>
  <div class="relative h-[130px] w-[210px] overflow-hidden rounded-lg border border-gray-3 bg-gray-2">
    <div :class="ui.backdrop()" />
    <div :class="ui.root({ class: 'w-[140px]' })">
      <div :class="ui.header({ class: 'gap-2 px-3 py-2' })"><Icon name="lucide:x" class="size-4" /><span :class="ui.title({ class: 'text-sm' })">任务详情</span></div>
      <div :class="ui.body({ class: 'flex flex-col gap-2 p-3' })"><div v-for="i in 3" :key="i" class="h-2 rounded-sm bg-gray-2" /></div>
      <div :class="ui.footer({ class: 'px-3 py-2' })"><div class="h-4 rounded-sm bg-primary/20" /></div>
    </div>
  </div>
</template>
