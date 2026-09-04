<script lang="ts" setup>
/** 宣传视频：静音自动循环播放；视频底色为浅紫（#EEEEFE），用卡片包住以免在深色主题下显得突兀 */
const videoSrc = "/videos/reborn-intro.mp4";
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
    <div class="mb-8 flex flex-col items-center gap-3 text-center">
      <h2 class="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
        看看 Reborn UI
      </h2>
      <p class="text-base text-zinc-600 dark:text-white/60">
        一分钟了解双端同源的组件体系
      </p>
      <span class="mt-1 h-1 w-12 rounded-full bg-gradient-to-r from-[#1B6DFA] to-[#8b5cf6]" />
    </div>

    <div class="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-[#eeeefe] shadow-[0_24px_80px_rgba(109,92,246,0.25)] dark:border-white/10">
      <!-- 与视频底色同色的边缘光晕，让画面与卡片融为一体 -->
      <div class="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/40 ring-inset" />
      <video
        :src="videoSrc"
        class="aspect-video w-full object-cover"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        aria-label="Reborn UI 宣传视频"
      />
    </div>
  </section>
</template>
