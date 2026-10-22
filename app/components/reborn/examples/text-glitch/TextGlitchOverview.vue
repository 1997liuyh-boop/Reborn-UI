<script setup lang="ts">
/**
 * 总览卡片缩略：深色底上的白色粗体字，被红、青两道错位切片撕开
 *
 * 组件的切片抖动是无限循环动画、也没有关闭开关；按要求把它定格在某一帧：
 * 两层伪元素停止动画，各自固定一段裁切区间，保留红 / 青描边错位的观感。
 * 组件把文字色和切片底色写死为白字配 #060606，浅色主题下白字会消失，所以外面垫一块同色深底；
 * 字号与错位距离按卡片尺寸等比收小。
 */
</script>

<template>
  <div class="glitch-frame rounded-lg bg-[#060606] px-6 py-3">
    <TextGlitch
      :speed="1"
      :enable-shadows="true"
      text="Reborn UI"
    />
  </div>
</template>

<style scoped>
/* 原组件字号随视口在 2rem ~ 6rem 间伸缩，卡片里固定成 30px */
.glitch-frame :deep(.glitch) {
  font-size: 30px;
  line-height: 1.2;
}

/* 定格的一帧：红色切片偏右、取上半段 */
.glitch-frame :deep(.glitch:not(.enable-on-hover))::after {
  left: 4px;
  animation: none;
  clip-path: inset(18% 0 52% 0);
}

/* 定格的一帧：青色切片偏左、取下半段 */
.glitch-frame :deep(.glitch:not(.enable-on-hover))::before {
  left: -4px;
  animation: none;
  clip-path: inset(58% 0 18% 0);
}
</style>
