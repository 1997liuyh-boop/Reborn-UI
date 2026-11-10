<script setup lang="ts">
import { withBase } from 'ufo'
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'

/**
 * 组件总览的整页背景：一段 30 秒的「自由落体」视频（云海 → 海面 → 入水 → 珊瑚礁），
 * 固定铺满视口、静音循环自动播放，并做高斯模糊，只留下色彩与明暗作为氛围。
 * - 播放与滚动无关：滚动页面时视频既不移动也不跳帧；
 * - 页面隐藏（切到其它标签页）时暂停，回来接着播，不在后台白白解码；
 * - 模糊后细节都看不见，素材按 854 宽重新编码（约 3MB），解码与带宽开销都小；
 * - 减少动态效果或省流模式下只显示模糊后的首帧静态图。
 */

const { app } = useRuntimeConfig()
const source = withBase('/videos/components-free-fall.mp4?v=20261106b', app.baseURL)
const poster = withBase('/images/components-free-fall-poster.webp?v=20261106', app.baseURL)
const video = useTemplateRef<HTMLVideoElement>('video')
const motionAllowed = shallowRef(false)
const ready = shallowRef(false)
const failed = shallowRef(false)
let preference: MediaQueryList | undefined

function syncPreference() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  motionAllowed.value = !preference?.matches && !connection?.saveData
}

/** 页面隐藏时暂停，显示时继续；自动播放被浏览器拦截时保留静态图 */
function syncPlayback() {
  const media = video.value
  if (!media) return
  if (document.hidden) {
    media.pause()
    return
  }
  media.play().catch(() => {})
}

onMounted(() => {
  preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  preference.addEventListener('change', syncPreference)
  syncPreference()
  document.addEventListener('visibilitychange', syncPlayback)
})

onBeforeUnmount(() => {
  preference?.removeEventListener('change', syncPreference)
  document.removeEventListener('visibilitychange', syncPlayback)
  // 主动释放解码器与缓冲，离开页面后不再占内存
  const media = video.value
  if (media) {
    media.pause()
    media.removeAttribute('src')
    media.load()
  }
})
</script>

<template>
  <!-- 独立层只负责装饰，不占据文档高度，也不遮挡链接或卡片交互。 -->
  <div
    aria-hidden="true"
    data-components-background
    class="pointer-events-none fixed inset-0 -z-10 select-none overflow-hidden"
  >
    <img
      :src="poster"
      alt=""
      width="1280"
      height="720"
      class="components-background-media absolute inset-0 m-0! size-full max-w-none! object-cover"
      :class="ready && motionAllowed && !failed ? 'invisible' : ''"
    >
    <video
      v-if="motionAllowed && !failed"
      ref="video"
      :src="source"
      muted
      loop
      autoplay
      playsinline
      preload="auto"
      disable-picture-in-picture
      tabindex="-1"
      class="components-background-media absolute inset-0 m-0! size-full max-w-none! object-cover"
      :class="ready ? '' : 'invisible'"
      @loadeddata="ready = true"
      @canplay="syncPlayback"
      @error="failed = true"
    />
    <!-- 纸面色薄幕（20% 不透明）：进入页面后淡入，略微压低视频亮度 -->
    <div class="components-background-veil absolute inset-0" />
  </div>
</template>

<style scoped>
/* 高斯模糊；放大一点，避免模糊把画面四边的透明晕边带进来 */
.components-background-media {
  filter: blur(6px) saturate(1.1);
  transform: scale(1.05);
}

.components-background-veil {
  background: color-mix(in oklab, var(--color-gray-1) 20%, transparent);
  animation: components-veil-in 1.6s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both;
}

@keyframes components-veil-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .components-background-veil {
    animation: none;
  }
}
</style>
