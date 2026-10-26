<script setup lang="ts">
import { Icon } from '#components';

/**
 * 总览卡片缩略：手机屏下半截，遮罩压暗页面，底部弹出带拖拽条、标题与关闭按钮的分享面板
 *
 * Web 端无实现，按 UniApp 源码静态还原外观：默认 position=bottom、圆角顶边 rounded-t-2xl，
 * 开启 swipeClose 时顶部显示拖拽条，头部左侧标题、右侧关闭图标。
 * 真实弹层是 fixed 全屏遮罩加贴底面板，缩略图不能用 fixed，改为在手机屏框内用绝对定位模拟；
 * 暗色下面板改用 gray-2，否则会和压暗后的页面融成一片。
 */
const shareItems = [
  { label: '微信好友', icon: 'lucide:message-circle', tone: 'bg-success/15 text-success' },
  { label: '复制链接', icon: 'lucide:link', tone: 'bg-info/15 text-info' },
  { label: '生成海报', icon: 'lucide:image', tone: 'bg-warning/15 text-warning' },
  { label: '更多', icon: 'lucide:share-2', tone: 'bg-primary/15 text-primary' },
]
</script>

<template>
  <div class="relative h-[124px] w-[176px] overflow-hidden rounded-b-[20px] border-x-[3px] border-b-[3px] border-gray-4 bg-gray-2 [mask-image:linear-gradient(to_top,#000_80%,transparent)]">
    <!-- 底层页面内容 -->
    <div class="flex flex-col gap-1.5 p-2.5">
      <div
        v-for="i in 3"
        :key="i"
        class="flex h-[30px] items-center gap-2 rounded-md border border-gray-3 bg-gray-1 px-2"
      >
        <div class="size-5 shrink-0 rounded bg-primary/15" />
        <div class="h-1.5 flex-1 rounded-full bg-gray-3" />
      </div>
    </div>

    <!-- 遮罩 -->
    <div class="absolute inset-0 bg-black/45" />

    <!-- 底部弹出面板 -->
    <div class="absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl bg-gray-1 dark:bg-gray-2">
      <div class="flex justify-center pt-1.5">
        <div class="h-1 w-8 rounded-full bg-gray-4" />
      </div>
      <div class="flex items-center justify-between px-3 pt-1 pb-1.5">
        <span class="text-[11px] leading-none font-medium text-gray-9">分享到</span>
        <Icon
          name="lucide:x"
          class="size-3 text-gray-5"
        />
      </div>
      <div class="flex justify-around px-2">
        <div
          v-for="item in shareItems"
          :key="item.label"
          class="flex flex-col items-center gap-1"
        >
          <span
            class="flex size-7 items-center justify-center rounded-full"
            :class="item.tone"
          >
            <Icon
              :name="item.icon"
              class="size-3.5"
            />
          </span>
          <span class="text-[8px] leading-none text-gray-7">{{ item.label }}</span>
        </div>
      </div>
      <!-- 底部安全区与系统横条 -->
      <div class="flex h-[18px] items-end justify-center pb-1">
        <div class="h-[3px] w-12 rounded-full bg-gray-9/70" />
      </div>
    </div>
  </div>
</template>
