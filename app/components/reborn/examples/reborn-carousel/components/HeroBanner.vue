<template>
  <RebornCarousel v-model="activeIndex" :slides-perview="3" :space-between="24" :autoplay="false" :motion-blur="false"
    loop arrow="always" :centeredSlides="true" grab-cursor indicator-position="outside"
    :pagination="{ clickable: true, type: 'dot' }">
    <template v-for="(value, index) in featureSlides" :key="index">
      <img :src="value" :alt="value" class="h-auto w-[480px]" />
    </template>
  </RebornCarousel>
</template>

<script lang="ts" setup>
import { useBreakpoints } from '@vueuse/core'

const activeIndex = ref(0);

const featureSlides = [
  'https://cms-image.leyifan.cn/resources/image/2025/06/17/688137139101765.png',
  'https://cms-image.leyifan.cn/resources/image/2026/03/27/788331602907205.png',
  'https://cms-image.leyifan.cn/resources/image/2026/03/16/784459468873797.png',
  'https://cms-image.leyifan.cn/resources/image/2025/06/27/691626932961349.png',
  'https://cms-image.leyifan.cn/resources/image/2025/03/25/658424656220229.png',
  'https://cms-image.leyifan.cn/resources/image/2024/04/08/534269540880453_2560x860.png',
];

</script>
