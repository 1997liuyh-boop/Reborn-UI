<script setup lang="ts">
/**
 * 总览卡片缩略：已向下滚动的页面框，右下角是带滚动进度环的回到顶部按钮
 *
 * 真实组件固定在视口右下角并监听 window 滚动，缩略图改用主题样式静态渲染按钮主体；
 * 进度环固定在 70%，右侧再画一条滑块靠下的滚动条，交代「页面已滚过大半」。
 */
import theme, { BACK_TOP_PROGRESS_PATHS } from '~/components/reborn/ui/reborn-back-top/reborn-back-top.config'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'

const ui = tv(theme)({ color: 'primary', size: 'md', shape: 'circle' })

/** 进度 70%：路径总长归一为 100，回到顶部的虚线偏移为 100 - 进度 */
const progressDashOffset = 30
</script>

<template>
  <div class="relative h-[124px] w-[200px] overflow-hidden rounded-lg border border-gray-3 bg-gray-1">
    <!-- 页面内容：顶部被滚出视口，只露出后半段 -->
    <div class="flex flex-col gap-2 pt-2 pr-6 pl-3">
      <div class="h-2 w-[80%] rounded-sm bg-gray-2" />
      <div class="mt-1 h-2.5 w-20 rounded-sm bg-gray-3" />
      <div class="h-2 w-full rounded-sm bg-gray-2" />
      <div class="h-2 w-[90%] rounded-sm bg-gray-2" />
      <div class="h-2 w-[60%] rounded-sm bg-gray-2" />
      <div class="h-2 w-[75%] rounded-sm bg-gray-2" />
    </div>

    <!-- 滚动条：滑块已靠下 -->
    <div class="absolute top-2 right-1.5 bottom-2 w-1 rounded-full bg-gray-2">
      <div class="absolute top-[56%] h-[30%] w-full rounded-full bg-gray-4" />
    </div>

    <!-- 回到顶部按钮主体：外层定位由组件的 fixed 改为框内 absolute -->
    <div :class="cn(ui.base(), 'absolute right-4 bottom-3')">
      <svg
        :class="ui.progress()"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <path
          :class="ui.progressTrack()"
          :d="BACK_TOP_PROGRESS_PATHS.circle"
          pathLength="100"
        />
        <path
          :class="ui.progressBar()"
          :d="BACK_TOP_PROGRESS_PATHS.circle"
          pathLength="100"
          stroke-dasharray="100"
          :stroke-dashoffset="progressDashOffset"
        />
      </svg>
      <Icon
        name="lucide:arrow-up"
        :class="cn(ui.icon(), 'size-4')"
      />
    </div>
  </div>
</template>
