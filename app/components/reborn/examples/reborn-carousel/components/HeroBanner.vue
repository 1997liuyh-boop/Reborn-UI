<script setup lang="ts">
import RebornCarousel from "~/components/reborn/ui/reborn-carousel/RebornCarousel.vue";
import RebornImage from "~/components/reborn/ui/reborn-image/RebornImage.vue";

const featureSlides = [
  "https://static.mercdn.net/item/detail/orig/photos/m24438016683_1.jpg?1776917811",
  "https://static.mercdn.net/item/detail/orig/photos/m24438016683_2.jpg?1776917811",
  "https://static.mercdn.net/item/detail/orig/photos/m24438016683_3.jpg?1776917811",
  "https://static.mercdn.net/item/detail/orig/photos/m24438016683_4.jpg?1776917811",
  "https://static.mercdn.net/item/detail/orig/photos/m24438016683_5.jpg?1776917811",
  "https://static.mercdn.net/item/detail/orig/photos/m24438016683_6.jpg?1776917811",
  "https://static.mercdn.net/item/detail/orig/photos/m24438016683_7.jpg?1776917811",
];
</script>

<template>
  <RebornCarousel
    :slides-per-view="1"
    :space-between="0"
    :loop="true"
    arrow="always"
    height="100%"
    :thumbs="{ position: 'left', arrow: 'hover' }"
    indicator-position="none"
    :ui="{
      thumbsShell: 'gap-4',
      thumbsPanel: '!w-[98px] !md:w-[98px] !mr-4',
      thumbsViewport: 'rounded-lg',
      thumbsTrack: 'gap-4',
      thumb: '!w-[98px] !aspect-square rounded-lg cursor-pointer border-2 overflow-hidden',
      thumbActive: '!border-inverted !border-[1.5px] !rounded-xl !opacity-100',
      thumbInactive: '!border-transparent !opacity-100 hover:!border-accented',
      thumbPreview: '',
      thumbOverlay: '!opacity-0',
      root: 'rounded-2xl overflow-hidden',
      slideInner: 'aspect-square',
      arrowGroup: 'inset-x-3',
      arrow: 'size-9',
    }"
  >
    <div v-for="(img, index) in featureSlides" :key="index" class="w-full h-full flex items-center justify-center">
      <RebornImage
        :src="img"
        width="668"
        height="668"
        magnifier
        :magnifier-zoom="3"
        :magnifier-size="150"
        :magnifier-width="500"
        :magnifier-height="500"
        custom-class="w-full h-full object-contain cursor-crosshair transition-opacity duration-300"
      />
    </div>
  </RebornCarousel>
</template>
