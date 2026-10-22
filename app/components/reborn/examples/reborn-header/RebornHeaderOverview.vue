<script setup lang="ts">
/**
 * 总览卡片缩略：页面顶部的导航栏，左侧站点标题、中间导航、右侧菜单开关，下方是页面内容
 *
 * 默认 64px 高、20px 标题放进卡片太重，这里通过 ui 收小高度、间距与字号；
 * 中间导航沿用组件自身的 lg 断点，窄屏下只剩标题与菜单按钮，与真实表现一致。
 */
import RebornHeader from '~/components/reborn/ui/reborn-header/RebornHeader.vue'

/** 中间导航文案，首项为当前页 */
const links = ['首页', '组件', '文档']
</script>

<template>
  <div class="h-[124px] w-[200px] overflow-hidden rounded-lg border border-gray-3 bg-gray-1">
    <RebornHeader
      title="Reborn"
      to="/"
      class="border-b border-gray-3"
      :ui="{ container: 'min-h-9 gap-2 px-3', left: 'gap-2', title: 'text-sm', center: 'gap-2', right: 'gap-2 lg:flex-none' }"
    >
      <span
        v-for="(link, index) in links"
        :key="link"
        class="shrink-0 text-xs whitespace-nowrap"
        :class="index === 0 ? 'font-medium text-primary' : 'text-gray-7'"
      >{{ link }}</span>

      <template #toggle>
        <Icon
          name="lucide:menu"
          class="size-4 text-gray-7"
        />
      </template>
    </RebornHeader>

    <!-- 页面内容 -->
    <div class="flex flex-col gap-2 p-2.5">
      <div class="h-3 w-24 rounded-sm bg-gray-3" />
      <div class="h-2 w-full rounded-sm bg-gray-2" />
      <div class="grid grid-cols-3 gap-1.5">
        <div class="h-6 rounded-sm bg-primary/15" />
        <div class="h-6 rounded-sm bg-gray-2" />
        <div class="h-6 rounded-sm bg-gray-2" />
      </div>
    </div>
  </div>
</template>
