<script setup lang="ts">
/**
 * 总览卡片缩略：收起状态的复古电脑，两侧是 REUI 字标
 *
 * 组件是纯 SVG + CSS 关键帧，没有画布和脚本循环，直接挂载并收窄到 200px 宽；
 * 不传 expanded，停在收起的初始画面，屏幕保留默认的 CRT 扫描。
 */
import ReuiLaunchDoodle from "~/components/reborn/ui/reui-launch/ReuiLaunchDoodle.vue";
</script>

<template>
  <div class="w-50">
    <ReuiLaunchDoodle
      text="REUI"
      screen-text="RE"
    />
  </div>
</template>
