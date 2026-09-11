<script setup lang="ts">
import type { RetargetingController } from "~/lib/three/retargetingScene";
import { useRuntimeConfig } from "#imports";
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";

interface Props {
  paused: boolean;
  compatibility?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  status: [value: "loading" | "ready" | "error"];
  error: [message: string];
}>();
const config = useRuntimeConfig();
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const canvasVersion = ref(0);
const ready = ref(false);
const abort = new AbortController();
let controller: RetargetingController | undefined;

function reportError(message: string) {
  ready.value = false;
  emit("error", message);
  emit("status", "error");
}

// 仅客户端加载；初次初始化失败后用新画布自动尝试 WebGL2。
onMounted(async () => {
  try {
    const { createRetargetingScene } = await import("~/lib/three/retargetingScene");
    const modes = props.compatibility ? [true] : [false, true];
    for (const compatibility of modes) {
      if (abort.signal.aborted || !canvas.value) return;
      try {
        controller = await createRetargetingScene(canvas.value, abort.signal, () => props.paused, reportError, {
          compatibility,
          baseURL: config.app.baseURL,
        });
        if (abort.signal.aborted) return;
        ready.value = true;
        emit("status", "ready");
        return;
      } catch (error) {
        if (abort.signal.aborted) return;
        if (compatibility || !(error instanceof Error && "retryWithWebGL" in error && error.retryWithWebGL)) throw error;
        // 不能在已绑定 WebGPU 上下文的同一画布上切换 WebGL。
        canvasVersion.value += 1;
        emit("status", "loading");
        await nextTick();
      }
    }
  } catch (error) {
    if (!abort.signal.aborted) reportError(error instanceof Error ? error.message : "3D 场景加载失败，请重新加载。");
  }
});
watch(() => props.paused, () => controller?.syncPlayback());
onBeforeUnmount(() => { abort.abort(); controller?.dispose(); });
</script>

<template>
  <div aria-hidden="true" class="pointer-events-none overflow-hidden bg-white">
    <canvas :key="canvasVersion" ref="canvas" :class="ready ? 'opacity-100' : 'opacity-0'" class="relative block size-full transition-opacity duration-1000 motion-reduce:transition-none" />
  </div>
</template>
