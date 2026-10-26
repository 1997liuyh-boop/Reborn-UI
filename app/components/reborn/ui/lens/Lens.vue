<script setup lang="ts">
import { AnimatePresence, Motion } from "motion-v";
import { computed, shallowRef } from "vue";

interface LensProps {
  zoomFactor?: number;
  lensSize?: number;
  position?: {
    x: number;
    y: number;
  };
  isStatic?: boolean;
}

const props = withDefaults(defineProps<LensProps>(), {
  zoomFactor: 1.5,
  lensSize: 170,
  isStatic: false,
  position: () => ({ x: 200, y: 150 }),
});

/**
 * 悬停状态，支持 v-model:hovering；未绑定时由组件内部维护。
 * 类型含 Boolean，未传时会被强转为 false，因此写 default: undefined 保留「未传」
 */
const hovering = defineModel<boolean>("hovering", { default: undefined });
// 指针位置每次整体替换
const mousePosition = shallowRef({ x: 100, y: 100 });

const isHovering = computed(() => hovering.value ?? false);

function setIsHovering(hover: boolean) {
  hovering.value = hover;
}

function handleMouseMove(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  mousePosition.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

const maskPosition = computed(() => {
  const pos = props.isStatic ? props.position : mousePosition.value;
  return `circle ${props.lensSize! / 2}px at ${pos.x}px ${pos.y}px`;
});

const transformOrigin = computed(() => {
  const pos = props.isStatic ? props.position : mousePosition.value;
  return `${pos.x}px ${pos.y}px`;
});
</script>

<template>
  <div
    class="relative z-20 overflow-hidden rounded-lg"
    @mouseenter="setIsHovering(true)"
    @mouseleave="setIsHovering(false)"
    @mousemove="handleMouseMove"
  >
    <slot />

    <!-- AnimatePresence 管理镜头的 v-if 移除，exit 离场动画才会生效（motion-v 没有 leave 属性） -->
    <AnimatePresence>
      <Motion
        v-if="props.isStatic || isHovering"
        :initial="{ opacity: 0, scale: 0.58 }"
        :animate="{
          opacity: 1,
          scale: 1,
        }"
        :transition="{ duration: 0.3, ease: 'easeOut' }"
        :exit="{ opacity: 0, scale: 0.8 }"
        class="absolute inset-0 overflow-hidden"
        :style="{
          maskImage: `radial-gradient(${maskPosition}, black 100%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(${maskPosition}, black 100%, transparent 100%)`,
          transformOrigin,
        }"
      >
        <div
          class="absolute inset-0"
          :style="{ transform: `scale(${props.zoomFactor})`, transformOrigin }"
        >
          <slot />
        </div>
      </Motion>
    </AnimatePresence>
  </div>
</template>
