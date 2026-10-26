<script setup lang="ts">
import { Icon } from '#components';

/**
 * 总览卡片缩略：两条消息列表项，上面一条已左滑露出「收藏」「删除」操作，下面一条保持收起
 *
 * Web 端无实现，按 UniApp 源码静态还原外观：操作按钮叠在内容层下方，内容层左移后露出，
 * 按钮为语义色底、上图标下文字。缩略图不能让内容层真的移出卡片，
 * 所以把展开那一行的内容区直接收窄到操作区左侧，并省去被移出可视区的头像。
 */
const actions = [
  { text: '收藏', icon: 'lucide:star', tone: 'bg-warning' },
  { text: '删除', icon: 'lucide:trash-2', tone: 'bg-error' },
]
</script>

<template>
  <div class="flex w-[200px] flex-col overflow-hidden rounded-lg border border-gray-3 bg-gray-1">
    <!-- 已展开：右侧操作区露出 -->
    <div class="relative h-12 border-b border-gray-3">
      <div class="absolute inset-y-0 right-0 flex">
        <div
          v-for="action in actions"
          :key="action.text"
          class="flex w-[42px] flex-col items-center justify-center gap-1 text-white"
          :class="[action.tone]"
        >
          <Icon
            :name="action.icon"
            class="size-3.5"
          />
          <span class="text-[10px] leading-none font-medium">{{ action.text }}</span>
        </div>
      </div>
      <div class="absolute inset-y-0 right-[84px] left-0 flex flex-col justify-center gap-1 bg-gray-1 pr-2 pl-3 shadow-[2px_0_6px_rgba(15,23,42,0.08)]">
        <span class="truncate text-xs leading-none font-medium text-gray-9">系统通知</span>
        <span class="truncate text-[10px] leading-none text-gray-5">左滑可以收藏或删除</span>
      </div>
    </div>
    <!-- 收起态：完整内容 -->
    <div class="flex h-12 items-center gap-2 px-3">
      <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon
          name="lucide:mail"
          class="size-3.5 text-primary"
        />
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <span class="truncate text-xs leading-none font-medium text-gray-9">订单消息</span>
        <span class="truncate text-[10px] leading-none text-gray-5">您购买的商品已发货</span>
      </div>
      <Icon
        name="lucide:chevron-left"
        class="size-3.5 shrink-0 text-gray-4"
      />
    </div>
  </div>
</template>
