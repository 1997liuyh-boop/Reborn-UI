<script setup lang="ts">
/**
 * 总览卡片缩略：并排的环形、柱状缩放、粘连双球三种加载动画
 *
 * Web 端已有同名组件，类型、配色枚举与 CSS 关键帧都与 UniApp 版一致，直接复用 Web 组件。
 * 只挑子元素少的三种（共 8 个动画节点），避免在总览页常驻过多动画；
 * 三种各用一个语义色，顺带表现 color 属性。
 */
import RebornLoading from '~/components/reborn/ui/reborn-loading/RebornLoading.vue'
</script>

<template>
  <div class="flex items-center gap-7">
    <RebornLoading
      type="ring"
      color="primary"
      size="36px"
    />
    <RebornLoading
      type="bars-scale"
      color="success"
      size="36px"
    />
    <RebornLoading
      type="gooey-balls"
      color="warning"
      size="36px"
    />
  </div>
</template>
