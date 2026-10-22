<script setup lang="ts">
/**
 * 总览卡片缩略：滚动结束后的定格画面——上方两行标题，下方一块摆正了的深色边框屏幕
 *
 * ContainerScroll 根据 window 滚动进度计算屏幕的倾角与缩放，缩略图里不能监听页面滚动，
 * 这里跳过外层容器，直接用它内部的 ContainerScrollTitle / ContainerScrollCard，
 * 按滚动完成时的取值传入（rotate 0、scale 1），透视容器照组件原样补上。
 * 屏幕里是 #card 插槽的内容：Demo 的截图走 cdn 外链，这里改用几块 DOM 色块示意一个后台页面，
 * 不依赖外链图片也能看出是「屏幕里放了一张界面」。
 * 屏幕默认高 40rem，用 important 压低后整体缩放到 0.45 放进卡片。
 */
const BAR_HEIGHTS = ['h-[40%]', 'h-[65%]', 'h-[50%]', 'h-[80%]', 'h-[60%]', 'h-[90%]', 'h-[70%]']
</script>

<template>
  <div class="relative h-[124px] w-[189px]">
    <div
      class="absolute top-0 left-0 w-[420px] origin-top-left scale-[0.45]"
      style="perspective: 1000px"
    >
      <ContainerScrollTitle :translate="0">
        <h3 class="text-xl font-semibold text-highlighted">
          释放滚动动画的力量
        </h3>
        <p class="mt-0.5 text-4xl leading-none font-bold text-highlighted">
          Scroll Animations
        </p>
      </ContainerScrollTitle>
      <ContainerScrollCard
        :rotate="0"
        :scale="1"
        class="mt-3! h-[180px]! p-2.5! shadow-none!"
      >
        <div class="flex size-full gap-3">
          <div class="flex w-16 flex-col gap-2 rounded-lg bg-gray-1 p-2 ring-1 ring-gray-3">
            <span class="h-2.5 rounded-full bg-primary" />
            <span class="h-2 rounded-full bg-gray-3" />
            <span class="h-2 rounded-full bg-gray-3" />
            <span class="h-2 rounded-full bg-gray-3" />
          </div>
          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <span class="h-3 w-28 rounded-full bg-gray-4" />
            <div class="grid grid-cols-3 gap-2">
              <span class="h-9 rounded-lg bg-gray-1 ring-1 ring-gray-3" />
              <span class="h-9 rounded-lg bg-gray-1 ring-1 ring-gray-3" />
              <span class="h-9 rounded-lg bg-gray-1 ring-1 ring-gray-3" />
            </div>
            <div class="flex flex-1 items-end gap-2 rounded-lg bg-gray-1 px-3 pt-3 ring-1 ring-gray-3">
              <span
                v-for="(height, index) in BAR_HEIGHTS"
                :key="index"
                class="flex-1 rounded-t bg-primary/70"
                :class="height"
              />
            </div>
          </div>
        </div>
      </ContainerScrollCard>
    </div>
  </div>
</template>
