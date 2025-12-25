<template>
  <div class="relative w-full flex flex-col items-center h-full min-h-screen">
    <div class="absolute inset-0 z-0">
      <ParticlesBg class="absolute inset-0" :quantity="100" :ease="100" color="#FFF" :staticity="10" refresh />
    </div>
    <div class="relative flex flex-1 w-full z-[2] opacity-80">
      <Spline :scene="sceneUrl" class="absolute bottom-0 inset-x-0 max-sm:h-[75%]" />
    </div>
  </div>
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
