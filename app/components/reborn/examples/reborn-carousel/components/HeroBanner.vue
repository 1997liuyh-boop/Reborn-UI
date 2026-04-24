<template>
  <RebornCarousel v-model="activeIndex" :slidesPerview="1" :spaceBetween="0" :loop="true" arrow="always" height="100%"
    :thumbs="{ position: 'left', arrow: 'hover' }" :indicatorPosition="'none'" :ui="{
      thumbsShell: 'gap-4',
      thumbsPanel: '!w-[98px] !md:w-[98px] !mr-4',
      thumbsViewport: 'rounded-[8px]',
      thumbsTrack: 'gap-4',
      thumb: '!w-[98px] !aspect-square rounded-[8px] cursor-pointer border-2 overflow-hidden',
      thumbActive: '!border-[#252626] !border-[1.5px] !rounded-[12px] !opacity-100',
      thumbInactive: '!border-transparent !opacity-100 hover:!border-gray-200',
      thumbPreview: '',
      thumbOverlay: '!opacity-0',
      root: 'rounded-[16px] overflow-hidden',
      slideInner: 'aspect-square',
      arrowGroup: 'inset-x-3',
      arrow: 'size-9',
    }">
    <div v-for="(img, index) in featureSlides" :key="index" class="w-full h-full flex items-center justify-center">
      <RebornImage :src="img" width="668" height="668" magnifier :magnifierZoom="3" :magnifierSize="150"
        :magnifierWidth="500" :magnifierHeight="500"
        customClass="w-full h-full object-contain cursor-crosshair transition-opacity duration-300" />
    </div>
  </RebornCarousel>
</template>

<script lang="ts" setup>

const activeIndex = ref(0);

const featureSlides = [
  'https://static.mercdn.net/item/detail/orig/photos/m24438016683_1.jpg?1776917811',
  'https://static.mercdn.net/item/detail/orig/photos/m24438016683_2.jpg?1776917811',
  'https://static.mercdn.net/item/detail/orig/photos/m24438016683_3.jpg?1776917811',
  'https://static.mercdn.net/item/detail/orig/photos/m24438016683_4.jpg?1776917811',
  'https://static.mercdn.net/item/detail/orig/photos/m24438016683_5.jpg?1776917811',
  'https://static.mercdn.net/item/detail/orig/photos/m24438016683_6.jpg?1776917811',
  'https://static.mercdn.net/item/detail/orig/photos/m24438016683_7.jpg?1776917811',
];

</script>
