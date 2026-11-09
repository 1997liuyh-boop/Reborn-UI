<script setup lang="ts">
import type { JourneySceneController } from "~/lib/three/journeyScene";
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from "vue";

// 云海之旅的画布层：只负责创建场景、转发滚动进度与指针，并在不可见时暂停渲染。

interface JourneySceneProps {
  /** 滚动进度，0 在云上，1 停在海底 */
  progress: number;
}

const props = defineProps<JourneySceneProps>();

const emit = defineEmits<{
  /** 场景首帧准备好或创建失败 */
  status: [value: "ready" | "error"];
}>();

const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const ready = shallowRef(false);
let controller: JourneySceneController | undefined;
let observer: IntersectionObserver | undefined;
let resizeObserver: ResizeObserver | undefined;
let onScreen = true;

function syncPaused() {
  controller?.setPaused(!onScreen || document.visibilityState !== "visible");
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerType === "touch") return;
  controller?.setPointer((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY / window.innerHeight) * 2 - 1));
}

onMounted(async () => {
  if (!canvas.value) return;
  try {
    const { createJourneyScene } = await import("~/lib/three/journeyScene");
    if (!canvas.value) return;
    controller = createJourneyScene(canvas.value, {
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    controller.setProgress(props.progress);
    ready.value = true;
    emit("status", "ready");
  }
  catch {
    emit("status", "error");
    return;
  }

  observer = new IntersectionObserver(([entry]) => {
    onScreen = Boolean(entry?.isIntersecting);
    syncPaused();
  });
  observer.observe(canvas.value);
  resizeObserver = new ResizeObserver(() => controller?.resize());
  resizeObserver.observe(canvas.value);
  document.addEventListener("visibilitychange", syncPaused);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
});

watch(() => props.progress, value => controller?.setProgress(value));

onBeforeUnmount(() => {
  observer?.disconnect();
  resizeObserver?.disconnect();
  document.removeEventListener("visibilitychange", syncPaused);
  window.removeEventListener("pointermove", onPointerMove);
  controller?.dispose();
});
</script>

<template>
  <canvas
    ref="canvas"
    aria-hidden="true"
    class="block size-full transition-opacity duration-1000 motion-reduce:transition-none"
    :class="ready ? 'opacity-100' : 'opacity-0'"
  />
</template>
