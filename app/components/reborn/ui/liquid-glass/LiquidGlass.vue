<script setup lang="ts">
import type { LiquidGlassProps } from "./index";
import { computed, onMounted, onUnmounted, reactive, ref, useId } from "vue";
import { cn } from "~/lib/utils";
import liquidGlassConfig from "./liquid-glass.config";

const props = withDefaults(defineProps<LiquidGlassProps>(), {
  radius: 16,
  border: 0.07,
  lightness: 50,
  blend: "difference",
  xChannel: "R",
  yChannel: "B",
  alpha: 0.93,
  blur: 11,
  rOffset: 0,
  gOffset: 10,
  bOffset: 20,
  scale: -180,
  frost: 0.05,
  position: "fixed",
  displace: 14,
});

const liquidGlassRoot = ref<HTMLElement | null>(null);
const dimensions = reactive({
  width: 0,
  height: 0,
});

const filterId = `liquid-glass-filter-${useId().replace(/[^\w-]/g, "")}`;

let observer: ResizeObserver | null = null;

const baseStyle = computed<Record<string, string>>(() => ({
  ...liquidGlassConfig.styles.effect,
  "--frost": String(props.frost),
  "backdrop-filter": `url(#${filterId})`,
  "border-radius": `${props.radius}px`,
  position: props.position,
}));

const displacementImage = computed(() => {
  const width = Math.max(1, dimensions.width);
  const height = Math.max(1, dimensions.height);
  const border = Math.min(width, height) * (props.border * 0.5);

  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#0000"/>
          <stop offset="100%" stop-color="red"/>
        </linearGradient>
        <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0000"/>
          <stop offset="100%" stop-color="blue"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" fill="black" />
      <rect x="0" y="0" width="${width}" height="${height}" rx="${props.radius}" fill="url(#red)" />
      <rect x="0" y="0" width="${width}" height="${height}" rx="${props.radius}" fill="url(#blue)" style="mix-blend-mode:${props.blend}" />
      <rect
        x="${border}"
        y="${border}"
        width="${Math.max(0, width - border * 2)}"
        height="${Math.max(0, height - border * 2)}"
        rx="${props.radius}"
        fill="hsl(0 0% ${props.lightness}% / ${props.alpha})"
        style="filter:blur(${props.blur}px)"
      />
    </svg>
  `;
});

const displacementDataUri = computed(() => `data:image/svg+xml,${encodeURIComponent(displacementImage.value)}`);

onMounted(() => {
  if (!liquidGlassRoot.value) return;

  observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;

    let width = 0;
    let height = 0;

    if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
      width = entry.borderBoxSize[0]!.inlineSize;
      height = entry.borderBoxSize[0]!.blockSize;
    } else {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    }

    dimensions.width = width;
    dimensions.height = height;
  });

  observer.observe(liquidGlassRoot.value);
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>

<template>
  <div ref="liquidGlassRoot" :style="baseStyle" :class="cn(props.containerClass)">
    <div :style="liquidGlassConfig.styles.slotContainer" :class="cn(props.class)">
      <slot />
    </div>

    <svg :style="liquidGlassConfig.styles.filter" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter :id="filterId" color-interpolation-filters="sRGB">
          <feImage x="0" y="0" width="100%" height="100%" :href="displacementDataUri" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" :xChannelSelector="props.xChannel" :yChannelSelector="props.yChannel" :scale="props.scale + props.rOffset" result="dispRed" />
          <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
          <feDisplacementMap in="SourceGraphic" in2="map" :xChannelSelector="props.xChannel" :yChannelSelector="props.yChannel" :scale="props.scale + props.gOffset" result="dispGreen" />
          <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
          <feDisplacementMap in="SourceGraphic" in2="map" :xChannelSelector="props.xChannel" :yChannelSelector="props.yChannel" :scale="props.scale + props.bOffset" result="dispBlue" />
          <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />
          <feGaussianBlur :stdDeviation="props.displace" />
        </filter>
      </defs>
    </svg>
  </div>
</template>
