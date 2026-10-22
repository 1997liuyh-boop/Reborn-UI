<script setup lang="ts">
/**
 * 总览卡片缩略：页面框右下角已展开的悬浮按钮，三个操作项向左排开
 *
 * 真实组件 fixed 定位在视口上，还会监听滚动做半隐藏，缩略图用主题样式静态渲染展开态：
 * 触发按钮取 active 变体（加号旋转 45° 变成关闭），操作项容器取 direction="left" 的展开类。
 * 选向左展开而非默认的向上：卡片高度放不下竖排的三个操作项。
 */
import theme from '~/components/reborn/ui/reborn-fab/reborn-fab.config'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'

const ui = tv(theme)({ variant: 'float', color: 'primary', size: 'sm', direction: 'left', active: true })

/** 展开后的操作项，第一项紧挨触发按钮 */
const actions = ['lucide:pencil', 'lucide:share-2', 'lucide:star']
</script>

<template>
  <div class="relative h-[124px] w-[200px] overflow-hidden rounded-lg border border-gray-3 bg-gray-1">
    <!-- 页面内容条 -->
    <div class="flex flex-col gap-2 p-3">
      <div class="h-2.5 w-20 rounded-sm bg-gray-3" />
      <div class="h-2 w-full rounded-sm bg-gray-2" />
      <div class="h-2 w-[85%] rounded-sm bg-gray-2" />
      <div class="h-2 w-[65%] rounded-sm bg-gray-2" />
    </div>

    <!-- 悬浮按钮：外层定位由组件的 fixed 改为框内 absolute -->
    <div class="absolute right-3 bottom-3">
      <div :class="cn(ui.actions(), 'gap-2')">
        <div
          v-for="icon in actions"
          :key="icon"
          class="flex size-8 items-center justify-center rounded-full bg-gray-1 text-primary shadow-md ring-1 ring-gray-3"
        >
          <Icon
            :name="icon"
            class="size-4"
          />
        </div>
      </div>
      <div :class="ui.trigger()">
        <Icon
          name="lucide:plus"
          :class="ui.icon()"
        />
      </div>
    </div>
  </div>
</template>
