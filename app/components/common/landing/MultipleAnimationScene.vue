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
// 共享骨骼每 6 秒自动切换一次，便于直观对比独立骨骼与共享骨骼的差异。
const SWITCH_DELAY = 6000;
let timer: ReturnType<typeof setTimeout> | undefined;
function stopAutoSwitch() { clearTimeout(timer); timer = undefined; }
// 暂停、未就绪、后台标签页与卸载后都不计时；手动勾选后同样重新计时，保证完整的观察时长。
function restartAutoSwitch() {
  stopAutoSwitch();
  if (unmounted || props.paused || status.value !== "ready" || document.hidden) return;
  timer = setTimeout(() => { shared.value = !shared.value; }, SWITCH_DELAY);
}
watch(() => props.paused, () => { controller?.syncPlayback(); restartAutoSwitch(); });
watch(shared, (value) => { controller?.setShared(value); restartAutoSwitch(); });
watch(status, restartAutoSwitch);
onMounted(() => { document.addEventListener("visibilitychange", restartAutoSwitch); loadScene(); });
onBeforeUnmount(() => {
  unmounted = true;
  stopAutoSwitch();
  document.removeEventListener("visibilitychange", restartAutoSwitch);
  abort?.abort();
  controller?.dispose();
});
</script>

<template>
  <section aria-label="多角色骨骼动画示例" class="flex h-full flex-col">
    <!-- 标题与共享骨骼开关已撤除，骨骼模式由 6 秒定时自动切换，画面高度让给舞台。 -->
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

