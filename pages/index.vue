<template>
  <NuxtLayout name="empty">
    <div class="relative w-full flex flex-col items-center h-full min-h-screen">
      <div class="absolute inset-0 z-0">
        <ParticlesBg class="absolute inset-0" :quantity="100" :ease="100" color="#FFF" :staticity="10" refresh />
      </div>
      <div class="mx-auto h-[30rem] w-[calc(100%-4rem)] overflow-hidden rounded-md">
        <Vortex background-color="black" class="flex size-full flex-col items-center justify-center px-2 py-4 md:px-10">
          <h2 class="text-center text-2xl font-bold text-white md:text-6xl">Reborn UI</h2>
          <p class="mt-6 max-w-xl text-center text-sm text-white md:text-2xl">
            我们致力于打造一个简洁、现代、灵活的ui组件库
          </p>
          <div class="mt-6 flex flex-col items-center gap-4 sm:flex-row">

            <InteractiveHoverButton text="阅读文档" @click="navigateTo('/getting-started/introduction')" />

            <RainbowButton class="rounded-full" @click="navigateTo('/components')"> 查看组件 </RainbowButton>
          </div>
        </Vortex>
      </div>
      <div class="relative flex flex-1 w-full z-[2] opacity-80">
        <Spline :scene="sceneUrl" class="absolute bottom-0 inset-x-0 h-full" />
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import Spline from '~/components/content/reborn/spline/Spline.vue';
import ParticlesBg from '~/components/content/reborn/particles-bg/ParticlesBg.vue';
import { computed, ref } from 'vue';
const config = useConfig();
const sceneUrl = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";
useSeoMeta({
  title: config.value.site.name,
  ogTitle: config.value.site.name,
  description: config.value.site.description,
  ogDescription: config.value.site.description,
  ogImage: config.value.site.ogImage,
  twitterCard: 'summary_large_image',
});

definePageMeta({
  layout: 'empty'
})
</script>
