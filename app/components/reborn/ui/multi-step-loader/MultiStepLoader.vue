<script setup lang="ts">
/* eslint vue/custom-event-name-casing: off -- 保留既有公开事件名 */
import { useMounted } from "@vueuse/core";
import { onUnmounted, shallowRef, watch } from "vue";

interface Step {
  text: string;
  afterText?: string;
  async?: boolean;
  duration?: number;
  action?: () => void | Promise<void>;
}

interface Props {
  steps: Step[];
  loading?: boolean;
  defaultDuration?: number;
  preventClose?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  defaultDuration: 1500,
  preventClose: false,
});

const emit = defineEmits<{
  "state-change": [number];
  complete: [];
  close: [];
}>();
const currentState = shallowRef(0);
const isLastStepComplete = shallowRef(false);
// 步骤定时器与 action 只在客户端挂载后运行：SSR 中 immediate 回调同样会执行，
// 服务端却没有卸载钩子来清理定时器，action 会在服务端请求里跑一遍、水合后再跑一遍。
const mounted = useMounted();
let currentTimer: ReturnType<typeof setTimeout> | undefined;
let generation = 0;
let advancing = false;

function stop() {
  generation++;
  advancing = false;
  clearTimeout(currentTimer);
  currentTimer = undefined;
}

async function proceedToNextStep(version: number) {
  if (version !== generation || !props.loading || advancing) return;
  const step = props.steps[currentState.value];
  if (!step) return;
  advancing = true;
  try {
    await step.action?.();
  } finally {
    if (version === generation) advancing = false;
  }
  // 关闭、重开或卸载后，旧异步任务不再推进新一轮流程。
  if (version !== generation || !props.loading) return;
  if (currentState.value < props.steps.length - 1) {
    currentState.value++;
    emit("state-change", currentState.value);
    processCurrentStep();
  } else {
    isLastStepComplete.value = true;
    emit("complete");
  }
}

function processCurrentStep() {
  clearTimeout(currentTimer);
  currentTimer = undefined;
  const step = props.steps[currentState.value];
  if (!mounted.value || !props.loading || !step || step.async || advancing || isLastStepComplete.value) return;
  const version = generation;
  currentTimer = setTimeout(() => { void proceedToNextStep(version); }, step.duration ?? props.defaultDuration);
}
function close() { emit("close"); }

watch(() => props.steps[currentState.value]?.async, processCurrentStep);
// 首次 loading=true 在挂载后自动开始；之后每次由 false 变为 true 都从第一步重新开始。
watch(() => props.loading && mounted.value, (running) => {
  stop();
  if (!running) return;
  currentState.value = 0;
  isLastStepComplete.value = false;
  processCurrentStep();
}, { immediate: true });
onUnmounted(stop);
</script>

<template>
  <Teleport to="#teleports">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="loading && steps.length > 0"
        class="fixed inset-0 z-[100] flex size-full items-center justify-center backdrop-blur-2xl"
      >
        <!-- 关闭按钮 -->
        <button
          v-show="!preventClose"
          class="bg-primary text-primary-foreground ring-offset-background hover:bg-primary/90 focus-visible:ring-ring absolute top-4 right-4 z-[101] inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          @click="close"
        >
          <!-- 关闭图标 -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <div class="relative h-96">
          <div class="relative mx-auto mt-40 flex max-w-xl flex-col justify-start">
            <div v-for="(step, index) in steps" :key="index">
              <div
                v-if="step"
                class="mb-4 flex items-center gap-2 text-left transition-all duration-300 ease-in-out"
                :style="{
                  opacity: index === currentState ? 1 : Math.max(1 - Math.abs(index - currentState) * 0.2, 0),
                  transform: `translateY(${
                    index === currentState ? -(currentState * 40) : -(currentState * 40)
                  }px)`,
                }"
              >
                <!-- 完成图标 -->
                <svg
                  v-if="
                    index < currentState ||
                      (index === steps.length - 1 && index === currentState && isLastStepComplete)
                  "
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="text-primary size-6"
                >
                  <path
                    fill-rule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                    clip-rule="evenodd"
                  />
                </svg>
                <!-- 进行中图标 -->
                <svg
                  v-else-if="index === currentState && (!isLastStepComplete || index !== steps.length - 1)"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="text-primary size-6 animate-spin"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z"
                    clip-rule="evenodd"
                  />
                </svg>
                <!-- 待执行图标 -->
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-6 text-black opacity-50 dark:text-white"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <div class="flex flex-col">
                  <span
                    class="text-lg text-black dark:text-white"
                    :class="[index > currentState && 'opacity-50']"
                  >
                    {{ step.text }}
                  </span>
                  <Transition
                    enter-active-class="transition-all duration-300"
                    enter-from-class="opacity-0 -translate-y-1"
                    enter-to-class="opacity-100 translate-y-0"
                  >
                    <span
                      v-if="
                        step.afterText &&
                          (index < currentState ||
                            (index === steps.length - 1 && index === currentState && isLastStepComplete))
                      "
                      class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                    >
                      {{ step.afterText }}
                    </span>
                  </Transition>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="absolute inset-x-0 bottom-0 z-[-1] h-full bg-white bg-gradient-to-t [mask-image:radial-gradient(900px_at_center,white_30%,transparent)] dark:bg-black"
        />
      </div>
    </Transition>
  </Teleport>
</template>
