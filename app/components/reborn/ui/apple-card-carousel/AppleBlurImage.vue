<script setup lang="ts">
import { onMounted, shallowRef, useTemplateRef, watch } from "vue";

interface Props {
  height?: number | string;
  width?: number | string;
  src: string;
  class?: string;
  alt?: string;
  fill?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: undefined,
  width: undefined,
  class: "",
  alt: "Background of a beautiful view",
  fill: false,
});

const imgRef = useTemplateRef<HTMLImageElement>("imgRef");
const isLoading = shallowRef(true);

function handleLoad() {
  isLoading.value = false;
}

// 服务端渲染的页面里，图片可能在水合挂上 @load 之前就已加载完成（命中缓存），load 不会再触发
onMounted(() => {
  if (imgRef.value?.complete) isLoading.value = false;
});

// 换图后回到模糊态，等新图加载完成再清晰
watch(
  () => props.src,
  () => {
    isLoading.value = true;
  },
);
</script>

<template>
  <img
    ref="imgRef"
    class="transition duration-300"
    :class="[isLoading ? 'blur-sm' : 'blur-0', props.class, fill ? 'h-full w-full' : '']"
    :src="src"
    :width="width"
    :height="height"
    loading="lazy"
    decoding="async"
    :alt="alt"
    @load="handleLoad"
  />
</template>
