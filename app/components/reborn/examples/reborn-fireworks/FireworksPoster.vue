<script setup lang="ts">
/**
 * 礼花演示海报
 *
 * 三处演示（演练场 / 容器内绽放 / 全屏弹出）共用同一张深色海报，
 * 深色底是特效本身的一部分（浅色底看不清粒子），属被演示对象而非装饰外壳。
 * 未声明的属性会透传给 RebornFireworks，因此粒子参数可直接写在本组件上。
 */
interface Props {
  /** 海报主标题第一行 */
  title: string;
  /** 海报主标题第二行 */
  subtitle: string;
  /** 标题下方的说明文字 */
  caption: string;
}

defineProps<Props>();

defineOptions({ inheritAttrs: false });
</script>

<template>
  <div class="rounded-ui-lg h-[500px] w-72 overflow-hidden border border-white/10 bg-gray-950">
    <RebornFireworks
      v-bind="$attrs"
      class="h-full"
    >
      <template #default="{ launchCount, launch }">
        <div class="relative flex min-h-full flex-col">
          <div class="flex items-center gap-3 px-7 pt-8">
            <span class="text-[9px] tracking-[0.5em] text-gray-600 uppercase">Reborn UI</span>
            <div class="h-px flex-1 bg-gray-800" />
          </div>

          <div class="mt-10 flex flex-col px-7">
            <span class="text-[10px] tracking-[0.4em] text-gray-600 uppercase">v 1.0.0 · stable</span>
            <p class="mt-3 text-4xl leading-none font-black tracking-tight text-white">
              {{ title }}<br>{{ subtitle }}
            </p>
            <div
              class="mt-3 cursor-pointer text-2xl font-bold"
              @click="launch($event.currentTarget)"
            >
              <ColourfulText text="experience" />
            </div>
            <p class="mt-5 text-xs leading-relaxed text-gray-600">
              {{ caption }}
            </p>
          </div>

          <div class="mt-auto flex flex-col gap-3 px-7 pb-4">
            <div class="h-px bg-gray-800" />
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] text-gray-700">2025 · REBORN</span>
              <Transition
                name="fade"
                mode="out-in"
              >
                <span
                  v-if="launchCount === 0"
                  key="hint"
                  class="flex items-center gap-1 text-[10px] tracking-[0.2em] text-gray-700"
                >
                  <Icon
                    name="lucide:chevron-down"
                    size="10"
                  />
                  点击庆祝
                </span>
                <span
                  v-else
                  key="count"
                  class="flex items-center gap-1.5 text-[10px] text-gray-600"
                >
                  <span class="size-1 animate-pulse rounded-full bg-violet-400/70" />
                  {{ launchCount }}×
                </span>
              </Transition>
            </div>
          </div>
        </div>
      </template>

      <template #overlay="{ launch }">
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2">
          <button
            type="button"
            class="cursor-pointer rounded-full border border-violet-500/40 bg-gray-950/95 px-7 py-3 transition-transform duration-100 focus:outline-none active:scale-95"
            @click="launch($event.currentTarget)"
          >
            <span class="flex items-center gap-2">
              <span class="text-sm leading-none">🎉</span>
              <span class="text-[10px] font-bold tracking-[0.35em] text-violet-200 uppercase">庆祝一下</span>
            </span>
          </button>
        </div>
      </template>
    </RebornFireworks>
  </div>
</template>

<style scoped>
/* 提示与计数的淡入淡出过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
