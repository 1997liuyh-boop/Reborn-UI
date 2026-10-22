<script setup lang="ts">
/**
 * 总览卡片缩略：微微倾斜的照片卡片，左上方有一团高光、表面泛着彩虹箔光
 *
 * 倾角、高光位置和箔光透明度都由 pointermove 写进组件根节点的 CSS 变量，
 * 没有强制状态的 prop；缩略图禁交互，这里通过 style 透传到根节点，
 * 直接给出「指针停在左上方」时的一组变量值，并把默认为 0 的 --opacity 调成悬停时的 0.6。
 * 卡面用同目录多卡片 Demo 里的照片：Logo 那张走 cdn 外链、本地 /logo-dark.svg 又靠 currentColor 着色
 * （放进 img 后是黑色，深色卡面上看不见），照片在缩小后也更容易看出高光与箔光。
 * 组件宽度写死 320px，整体缩放到 0.3 放进卡片。
 */
const glareVars = {
  '--m-x': '28%',
  '--m-y': '20%',
  '--r-x': '-10deg',
  '--r-y': '-6deg',
  '--bg-x': '42%',
  '--bg-y': '38%',
  '--opacity': '0.6',
}
</script>

<template>
  <div class="relative h-[119px] w-[96px]">
    <div class="absolute top-0 left-0 origin-top-left scale-[0.3]">
      <GlareCard
        class="relative"
        :style="glareVars"
      >
        <img
          src="https://images.unsplash.com/photo-1512618831669-521d4b375f5d?q=80&w=400&auto=format&fit=crop"
          alt="卡面照片"
          class="absolute inset-0 size-full object-cover"
        >
      </GlareCard>
    </div>
  </div>
</template>
