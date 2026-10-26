<script setup lang="ts">
/**
 * 总览卡片缩略：手机屏上半截，页面容器渲染的标题、描述与下方内容区里的卡片
 *
 * Web 端无实现，按 UniApp 源码静态还原外观：Page 是页面根容器，灰底铺满整屏，
 * 头部为加粗大标题加灰色描述，内容区纵向排列子元素并统一间距。
 * 页面级容器脱离手机语境不好辨认，所以画一截手机屏框，底部渐隐表示页面继续向下延伸；
 * 各块高度按屏框高度精确分配，第二张卡片只露出顶部。
 */
import { Icon } from '#components';
</script>

<template>
  <div class="relative flex h-[124px] w-[176px] flex-col overflow-hidden rounded-t-[20px] border-x-[3px] border-t-[3px] border-gray-4 bg-gray-2 [mask-image:linear-gradient(to_bottom,#000_72%,transparent)]">
    <!-- 状态栏 -->
    <div class="flex h-4 shrink-0 items-center justify-between px-3 text-[8px] leading-none font-semibold text-gray-9">
      <span>9:41</span>
      <span class="flex items-center gap-0.5">
        <Icon
          name="lucide:signal"
          class="size-2.5"
        />
        <Icon
          name="lucide:wifi"
          class="size-2.5"
        />
        <Icon
          name="lucide:battery-full"
          class="size-3"
        />
      </span>
    </div>

    <!-- 头部：title + description -->
    <div class="flex h-10 shrink-0 flex-col justify-center gap-0.5 px-3">
      <div class="text-[13px] leading-4 font-bold text-gray-10">
        我的订单
      </div>
      <div class="text-[9px] leading-3 text-gray-5">
        共 3 笔订单待处理
      </div>
    </div>

    <!-- 内容区：子元素纵向排列、间距统一 -->
    <div class="flex flex-col gap-1.5 px-3">
      <div class="flex h-[38px] items-center gap-2 rounded-lg border border-gray-3 bg-gray-1 px-1.5">
        <div class="size-6 shrink-0 rounded-md bg-primary/15" />
        <div class="flex flex-1 flex-col gap-1">
          <div class="h-1.5 w-4/5 rounded-full bg-gray-4" />
          <div class="h-1.5 w-1/2 rounded-full bg-gray-3" />
        </div>
      </div>
      <div class="flex h-[21px] items-start gap-2 rounded-t-lg border border-b-0 border-gray-3 bg-gray-1 px-1.5 pt-2">
        <div class="h-1.5 w-3/5 rounded-full bg-gray-4" />
      </div>
    </div>
  </div>
</template>
