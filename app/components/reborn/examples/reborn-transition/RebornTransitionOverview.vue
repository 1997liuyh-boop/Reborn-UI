<script setup lang="ts">
/**
 * 总览卡片缩略：一张消息卡片按 zoom-in 进场的三帧定格，下方时间轴标出 0 / 150 / 300ms
 *
 * 过渡本身是动态的，缩略图把「淡入 + 放大」拆成三帧并排，静态也能读出变化过程；
 * 最后一帧由真实的 RebornTransition 包裹，卡片进入视口时会实际播放一次进场，之后停在终态。
 */

/** 前两帧：透明度与缩放逐帧递增，终态由真实过渡组件渲染 */
const frames = [
  { time: '0ms', style: { opacity: 0.25, scale: '0.8' } },
  { time: '150ms', style: { opacity: 0.6, scale: '0.92' } },
]
</script>

<template>
  <div class="flex w-[200px] flex-col gap-2">
    <div class="flex items-center justify-between">
      <!-- 过程帧：虚线框是元素的最终占位 -->
      <div
        v-for="frame in frames"
        :key="frame.time"
        class="flex h-[52px] w-[60px] items-center justify-center rounded-md border border-dashed border-gray-4"
      >
        <div
          class="flex h-11 w-[52px] flex-col justify-center gap-1 rounded-md bg-gray-1 px-1.5 shadow-sm ring-1 ring-gray-3"
          :style="frame.style"
        >
          <Icon
            name="lucide:circle-check"
            class="size-3.5 text-primary"
          />
          <div class="h-1 w-full rounded-sm bg-gray-3" />
          <div class="h-1 w-[60%] rounded-sm bg-gray-3" />
        </div>
      </div>

      <!-- 终态帧：真实过渡组件 -->
      <div class="flex h-[52px] w-[60px] items-center justify-center rounded-md border border-dashed border-primary/60">
        <RebornTransition
          :show="true"
          name="zoom-in"
          appear
        >
          <div class="flex h-11 w-[52px] flex-col justify-center gap-1 rounded-md bg-gray-1 px-1.5 shadow-md ring-1 ring-primary/40">
            <Icon
              name="lucide:circle-check"
              class="size-3.5 text-primary"
            />
            <div class="h-1 w-full rounded-sm bg-gray-3" />
            <div class="h-1 w-[60%] rounded-sm bg-gray-3" />
          </div>
        </RebornTransition>
      </div>
    </div>

    <!-- 时间轴：刻度与三帧中心对齐 -->
    <div class="relative mx-[30px] h-px bg-gray-4">
      <span class="absolute top-1/2 left-0 size-1.5 -translate-1/2 rounded-full bg-gray-5" />
      <span class="absolute top-1/2 left-1/2 size-1.5 -translate-1/2 rounded-full bg-gray-5" />
      <span class="absolute top-1/2 left-full size-1.5 -translate-1/2 rounded-full bg-primary" />
    </div>
    <div class="relative mx-[30px] h-2.5 text-[10px] leading-none">
      <span class="absolute left-0 -translate-x-1/2 text-gray-6">0ms</span>
      <span class="absolute left-1/2 -translate-x-1/2 text-gray-6">150ms</span>
      <span class="absolute left-full -translate-x-1/2 text-primary">300ms</span>
    </div>
  </div>
</template>
