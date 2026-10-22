<script setup lang="ts">
/**
 * 总览卡片缩略：同一段代码的浅色 / 深色主题截图左右拼接，中间是带把手的发光分割线
 *
 * 直接使用组件：分割线默认停在 50%，自动播放默认关闭，禁交互后正好停在中间。
 * 分割线旁的星点装饰是 120 个各带两条无限循环关键帧的节点，对一张缩略图来说太多，
 * 这里从外层把它们 display:none（不显示的节点不会跑动画）。
 * 组件默认 400×400，按 Demo 的机身外框整体缩放到 0.5 放进卡片。
 */
</script>

<template>
  <div class="relative h-[117px] w-[177px]">
    <div class="absolute top-0 left-0 origin-top-left scale-50 rounded-3xl border border-default bg-elevated p-4 [&_.star]:hidden">
      <Compare
        first-image="https://images.vscodethemes.com/antfu.theme-vitesse/vitesse-light-soft-js-preview-4JM.svg"
        second-image="https://images.vscodethemes.com/antfu.theme-vitesse/vitesse-dark-soft-js-preview-4JM.svg"
        first-content-class="object-cover object-left-top rounded-xl overflow-hidden"
        second-content-class="object-cover object-left-top rounded-xl overflow-hidden"
        class="h-[200px]! w-[320px]!"
      />
    </div>
  </div>
</template>
