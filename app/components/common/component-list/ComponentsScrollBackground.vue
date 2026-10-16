<script setup lang="ts">
import { withBase } from 'ufo'
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

const { app } = useRuntimeConfig()
const source = withBase('/videos/components-city-scroll.webm?v=7c2b604d', app.baseURL)
const poster = withBase('/images/components-city-poster.webp?v=7c2b604d', app.baseURL)
const video = useTemplateRef<HTMLVideoElement>('video')
const motionAllowed = ref(false)
const ready = ref(false)
const failed = ref(false)
const frameDuration = 1 / 24
let frame = 0
let preference: MediaQueryList | undefined
let resizeObserver: ResizeObserver | undefined

/** 前四屏的滚动距离映射到完整视频，向上回到这段范围时同步倒放。 */
function syncProgress() {
  frame = 0
  const media = video.value
  if (!media || document.hidden || media.seeking || !Number.isFinite(media.duration)) return

  const scrollRange = Math.min(
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
    window.innerHeight * 4,
  )
  const progress = scrollRange ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0
  // 避开 duration 处的结束状态，超出滚动区间后保持末帧，回到区间后可以继续定位。
  const time = progress * Math.max(0, media.duration - frameDuration)
  if (Math.abs(media.currentTime - time) > frameDuration / 2) media.currentTime = time
}

/** 滚动事件合并到下一帧；解码未完成时由 seeked 再追上最新位置，不堆积定位请求。 */
function scheduleSync() {
  if (!frame) frame = requestAnimationFrame(syncProgress)
}

function syncPreference() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  motionAllowed.value = !preference?.matches
    && !connection?.saveData
    && !!document.createElement('video').canPlayType('video/webm; codecs="vp9"')
  ready.value = false
  scheduleSync()
}

/** 个别浏览器能解码 VP9 却不能显示透明通道，此时保留透明静态图。 */
function onLoadedData() {
  const media = video.value
  if (!media) return
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('无法检查透明通道')
    context.drawImage(media, 0, 0, 1, 1, 0, 0, 1, 1)
    // 素材左上角始终透明，不透明的解码结果不能作为页面背景。
    if (context.getImageData(0, 0, 1, 1).data[3]! > 8) throw new Error('浏览器未保留透明通道')
    ready.value = true
    scheduleSync()
  }
  catch {
    failed.value = true
  }
}

onMounted(() => {
  preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  preference.addEventListener('change', syncPreference)
  syncPreference()
  window.addEventListener('scroll', scheduleSync, { passive: true })
  window.addEventListener('resize', scheduleSync, { passive: true })
  document.addEventListener('visibilitychange', scheduleSync)
  // 平台切换、卡片懒加载改变页面高度后，重新计算当前滚动进度。
  resizeObserver = new ResizeObserver(scheduleSync)
  resizeObserver.observe(document.body)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  preference?.removeEventListener('change', syncPreference)
  window.removeEventListener('scroll', scheduleSync)
  window.removeEventListener('resize', scheduleSync)
  document.removeEventListener('visibilitychange', scheduleSync)
  resizeObserver?.disconnect()
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
    class="pointer-events-none fixed inset-0 -z-10 select-none overflow-hidden opacity-15 dark:opacity-25"
  >
    <img
      :src="poster"
      alt=""
      width="1280"
      height="720"
      class="absolute inset-x-0 bottom-0 m-0! w-full max-w-none! dark:brightness-150"
      :class="ready && motionAllowed && !failed ? 'invisible' : ''"
    >
    <video
      v-if="motionAllowed && !failed"
      ref="video"
      :src="source"
      muted
      playsinline
      preload="auto"
      disable-picture-in-picture
      tabindex="-1"
      class="absolute inset-x-0 bottom-0 m-0! w-full max-w-none! dark:brightness-150"
      :class="ready ? '' : 'invisible'"
      @loadedmetadata="scheduleSync"
      @loadeddata="onLoadedData"
      @seeked="scheduleSync"
      @error="failed = true"
    />
  </div>
</template>
