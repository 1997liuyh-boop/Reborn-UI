<script setup lang="ts">
import { Icon } from '#components';

/**
 * 总览卡片缩略：滚动中的订单列表，分组标题条吸在框顶，下方条目从它底下滑过
 *
 * RebornSticky 依赖 window 滚动计算吸顶时机，缩略图不挂载真实组件，
 * 直接用静态 DOM 画出「已吸顶」的状态：首个条目被标题条压住一半，右侧滚动条滑块已离开顶部。
 */

/** 列表条目，只用于撑出被吸顶条压住的滚动内容 */
const rows = ['订单 1024', '订单 1025', '订单 1026', '订单 1027']
</script>

<template>
  <div class="relative h-[124px] w-[200px] overflow-hidden rounded-lg border border-gray-3 bg-gray-1">
    <!-- 滚动中的列表：首行被吸顶条压住一半 -->
    <div class="absolute inset-x-0 top-[14px] flex flex-col pr-2">
      <div
        v-for="row in rows"
        :key="row"
        class="flex h-[26px] items-center justify-between border-b border-gray-2 px-3"
      >
        <span class="text-xs text-gray-7">{{ row }}</span>
        <span class="h-1.5 w-8 rounded-sm bg-gray-3" />
      </div>
    </div>

    <!-- 吸顶条：固定在框顶 -->
    <div class="absolute inset-x-0 top-0 z-1 flex h-7 items-center gap-1.5 bg-primary px-3 text-xs text-white shadow-md">
      <Icon
        name="lucide:pin"
        class="size-3.5"
      />
      全部订单
    </div>

    <!-- 滚动条：滑块已离开顶部 -->
    <div class="absolute top-8 right-1 bottom-2 w-1 rounded-full bg-gray-2">
      <div class="absolute top-[30%] h-[35%] w-full rounded-full bg-gray-4" />
    </div>
  </div>
</template>
