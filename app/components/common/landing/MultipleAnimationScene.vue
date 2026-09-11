<script setup lang="ts">
import type { MultipleAnimationController } from "~/lib/three/multipleAnimationScene";
import { useRuntimeConfig } from "#imports";
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";

interface Props { paused: boolean; }
const props = defineProps<Props>();
const config = useRuntimeConfig();
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const version = ref(0);
const shared = ref(false);
const status = ref("loading");
const error = ref("");
let controller: MultipleAnimationController | undefined;
let abort: AbortController | undefined;
let unmounted = false;

function reportError(message: string) { error.value = message; status.value = "error"; }
async function loadScene() {
  abort?.abort();
  controller?.dispose();
  controller = undefined;
  const request = new AbortController();
  abort = request;
  status.value = "loading";
  error.value = "";
  // 重试使用新画布，避免复用已经丢失的图形上下文。
  version.value += 1;
  await nextTick();
  try {
    const { createMultipleAnimationScene } = await import("~/lib/three/multipleAnimationScene");
    if (unmounted || request.signal.aborted || !canvas.value) return;
    controller = await createMultipleAnimationScene(canvas.value, request.signal, () => props.paused, reportError, {
      baseURL: config.app.baseURL, shared: shared.value,
    });
    if (!request.signal.aborted) status.value = "ready";
  } catch (cause) {
    if (!request.signal.aborted) reportError(cause instanceof Error ? cause.message : "多角色场景加载失败。");
  }
}
watch(() => props.paused, () => controller?.syncPlayback());
watch(shared, value => controller?.setShared(value));
onMounted(loadScene);
onBeforeUnmount(() => { unmounted = true; abort?.abort(); controller?.dispose(); });
</script>

<template>
  <section aria-label="多角色骨骼动画示例" class="flex h-full flex-col">
    <div class="flex items-center justify-between gap-3 text-[10px] text-black/45">
      <span class="tracking-[0.14em]">THREE.JS / 多角色动画</span>
      <label class="flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full px-2 hover:bg-black/5">
        <input v-model="shared" type="checkbox" :disabled="status !== 'ready'" class="size-3 accent-black focus-visible:outline-2 focus-visible:outline-offset-2">共享骨骼
      </label>
    </div>
    <div class="relative min-h-0 flex-1 overflow-hidden">
      <canvas :key="version" ref="canvas" aria-hidden="true" class="block size-full transition-opacity duration-700 motion-reduce:transition-none" :class="status === 'ready' ? 'opacity-100' : 'opacity-0'" />
      <p v-if="status === 'loading'" role="status" class="absolute inset-0 flex items-center justify-center text-xs text-black/45">正在加载多角色动画…</p>
      <div v-if="status === 'error'" role="alert" class="absolute inset-0 flex flex-col items-start justify-center gap-2 bg-white text-xs text-black/60">
        <p>{{ error }}</p>
        <button type="button" class="min-h-9 rounded-full border border-black/15 px-4 text-black focus-visible:outline-2" @click="loadScene">重新加载多角色</button>
      </div>
    </div>
  </section>
</template>

