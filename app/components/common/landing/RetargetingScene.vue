<script setup lang="ts">
import type { RetargetingController } from "~/lib/three/retargetingScene";
import { useRuntimeConfig } from "#imports";
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { ensureWebGPUGlobals } from "~/lib/three/webgpuGlobals";

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
    // 先补齐 three/webgpu 在模块顶层要读的 WebGPU 全局，再动态导入。
    // 顺序不能反：那个模块一求值就会读 GPUShaderStage.VERTEX，缺了直接抛错，
    // 而模块级错误不带 retryWithWebGL 标记，下面的兼容模式回退救不回来。
    ensureWebGPUGlobals();
    const { createRetargetingScene } = await import("~/lib/three/retargetingScene");
    // 环境没有 WebGPU 时直接从 WebGL 起步，省掉一次必然失败的初始化和画布重建。
    const supportsWebGPU = typeof navigator !== "undefined" && "gpu" in navigator;
    const modes = props.compatibility || !supportsWebGPU ? [true] : [false, true];
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
