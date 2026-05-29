<script lang="ts" setup>
const defaultState = {
  burstCount: 160,
  angleCenter: 270,
  angleSpread: 130,
  speedMin: 8,
  speedMax: 24,
  particleScale: 1,
  teleport: false,
}

const state = ref<Record<string, any>>({ ...defaultState })

function resetState() {
  state.value = { ...defaultState }
}

watch(() => state.value.particleScale, (val) => {
  const rounded = Math.round(val * 10) / 10
  if (rounded !== val) state.value.particleScale = rounded
})

const controls = [
  {
    title: '粒子属性',
    children: [
      {
        label: '粒子数量',
        key: 'burstCount',
        component: 'slider' as const,
        defaultValue: 160,
        props: { min: 20, max: 400, step: 10 },
      },
      {
        label: '最小速度',
        key: 'speedMin',
        component: 'slider' as const,
        defaultValue: 8,
        props: { min: 1, max: 30 },
      },
      {
        label: '最大速度',
        key: 'speedMax',
        component: 'slider' as const,
        defaultValue: 24,
        props: { min: 1, max: 60 },
      },
      {
        label: '粒子大小',
        key: 'particleScale',
        component: 'slider' as const,
        defaultValue: 1,
        props: { min: 0.2, max: 3, step: 0.1 },
      },
    ],
  },
  {
    title: '发射方向',
    children: [
      {
        label: '中心角度',
        key: 'angleCenter',
        component: 'slider' as const,
        defaultValue: 270,
        props: { min: 0, max: 360 },
      },
      {
        label: '扩散范围',
        key: 'angleSpread',
        component: 'slider' as const,
        defaultValue: 130,
        props: { min: 10, max: 360 },
      },
    ],
  }
]
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-12 pt-4 pb-24">

    <!-- Header -->
    <div class="flex flex-col gap-3">
      <h2 class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Fireworks 礼花</h2>
      <p class="text-xl text-gray-500 dark:text-gray-400 max-w-3xl">
        可为容器内任意元素附加点击烟花特效，支持容器内绽放与全屏弹出两种模式，高度可定制粒子参数。
      </p>
    </div>

    <!-- Playground -->
    <Playground v-model="state" :controls="controls" component-name="RebornFireworks" title="交互演练场"
      description="实时调节粒子参数，点击卡片中的按钮触发礼花效果">
      <template #tag>
        <button
          class="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary transition-all hover:bg-primary/20 active:scale-95 cursor-pointer"
          @click="resetState">
          <Icon name="lucide:rotate-ccw" size="12" />
          重置配置
        </button>
      </template>
      <div
        class="h-[500px] w-72 overflow-hidden rounded-3xl border border-white/5 bg-gray-950 shadow-2xl shadow-black/60">
        <RebornFireworks class="h-full" :burst-count="state.burstCount" :angle-center="state.angleCenter"
          :angle-spread="state.angleSpread" :speed-min="state.speedMin" :speed-max="state.speedMax"
          :particle-scale="state.particleScale" :teleport="state.teleport">
          <template #default="{ launchCount, launch }">
            <div class="relative flex min-h-full flex-col">
              <div class="pointer-events-none absolute inset-0">
                <div
                  class="absolute top-1/4 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
              </div>
              <div class="flex items-center gap-3 px-7 pt-8">
                <span class="text-[9px] tracking-[0.5em] text-gray-600 uppercase">Reborn UI</span>
                <div class="h-px flex-1 bg-gray-800" />
              </div>
              <div class="mt-10 flex flex-col px-7">
                <span class="text-[10px] tracking-[0.4em] text-gray-600 uppercase">v 1.0.0 · stable</span>
                <h1 class="mt-3 text-5xl leading-none font-black tracking-tight text-white">
                  Fireworks<br />Container
                </h1>
                <div class="mt-3 text-2xl font-bold cursor-pointer" @click="launch($event.currentTarget)">
                  <ColourfulText text="experience" />
                </div>
                <p class="mt-5 text-xs leading-relaxed text-gray-600">
                  粒子数: {{ state.burstCount }} · 角度: {{ state.angleCenter }}° ± {{ Math.round(state.angleSpread / 2) }}°
                </p>
              </div>
              <div class="mt-auto flex flex-col gap-3 px-7 pb-4">
                <div class="h-px bg-gray-800" />
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] text-gray-700">2025 · REBORN</span>
                  <Transition name="fade" mode="out-in">
                    <span v-if="launchCount === 0" key="hint"
                      class="flex items-center gap-1 text-[10px] tracking-[0.2em] text-gray-700">
                      <Icon name="lucide:chevron-down" size="10" />
                      点击庆祝
                    </span>
                    <span v-else key="count" class="flex items-center gap-1.5 text-[10px] text-gray-600">
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
              <div class="group relative">
                <div
                  class="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-50" />
                <div
                  class="absolute -inset-px rounded-full bg-gradient-to-r from-violet-500/60 via-fuchsia-400/60 to-violet-500/60 opacity-30 transition-opacity duration-500 group-hover:opacity-80" />
                <button
                  class="relative cursor-pointer overflow-hidden rounded-full bg-gray-950/95 px-7 py-3 backdrop-blur-sm transition-transform duration-100 focus:outline-none active:scale-95"
                  @click="launch($event.currentTarget)">
                  <span
                    class="absolute inset-0 -translate-x-full skew-x-6 bg-gradient-to-r from-transparent via-white/8 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span class="relative z-10 flex items-center gap-2">
                    <span class="text-sm leading-none">🎉</span>
                    <span
                      class="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-violet-300 bg-clip-text text-[10px] font-bold tracking-[0.35em] text-transparent uppercase">庆祝一下</span>
                  </span>
                </button>
              </div>
            </div>
          </template>
        </RebornFireworks>
      </div>
    </Playground>

    <!-- Showcases -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">

      <!-- 标题行：grid 自动等高 -->
      <div class="flex flex-col gap-1">
        <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">容器内绽放</h4>
        <p class="text-sm text-gray-500">烟花效果限制在组件容器内，不影响页面其他区域。</p>
      </div>
      <div class="flex flex-col gap-1">
        <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">全屏弹出 <code
            class="text-sm font-normal text-violet-400">teleport</code></h4>
        <p class="text-sm text-gray-500">画布传送至 body，礼花覆盖整个浏览器窗口，突破容器 overflow 限制。</p>
      </div>

      <!-- 容器内绽放 -->
      <section class="flex flex-col gap-4">
        <div class="flex items-start justify-center">
          <div
            class="h-[550px] w-80 overflow-hidden rounded-3xl border border-white/5 bg-gray-950 shadow-2xl shadow-black/60">
            <RebornFireworks class="h-full">
              <template #default="{ launchCount, launch }">
                <div class="relative flex min-h-full flex-col">
                  <div class="pointer-events-none absolute inset-0">
                    <div
                      class="absolute top-1/4 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
                  </div>
                  <div class="flex items-center gap-3 px-7 pt-8">
                    <span class="text-[9px] tracking-[0.5em] text-gray-600 uppercase">Reborn UI</span>
                    <div class="h-px flex-1 bg-gray-800" />
                  </div>
                  <div class="mt-10 flex flex-col px-7">
                    <span class="text-[10px] tracking-[0.4em] text-gray-600 uppercase">v 1.0.0 · stable</span>
                    <h1 class="mt-3 text-6xl leading-none font-black tracking-tight text-white">
                      Fireworks<br />Container
                    </h1>
                    <div class="mt-3 text-2xl font-bold cursor-pointer" @click="launch($event.currentTarget)">
                      <ColourfulText text="experience" />
                    </div>
                    <p class="mt-5 text-xs leading-relaxed text-gray-600">
                      Cross-platform consistency · highly customizable<br />For the next generation of applications
                    </p>
                  </div>
                  <div class="mt-auto flex flex-col gap-3 px-7 pb-4">
                    <div class="h-px bg-gray-800" />
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-[10px] text-gray-700">2025 · REBORN</span>
                      <Transition name="fade" mode="out-in">
                        <span v-if="launchCount === 0" key="hint"
                          class="flex items-center gap-1 text-[10px] tracking-[0.2em] text-gray-700">
                          <Icon name="lucide:chevron-down" size="10" />
                          点击庆祝
                        </span>
                        <span v-else key="count" class="flex items-center gap-1.5 text-[10px] text-gray-600">
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
                  <div class="group relative">
                    <div
                      class="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-50" />
                    <div
                      class="absolute -inset-px rounded-full bg-gradient-to-r from-violet-500/60 via-fuchsia-400/60 to-violet-500/60 opacity-30 transition-opacity duration-500 group-hover:opacity-80" />
                    <button
                      class="relative cursor-pointer overflow-hidden rounded-full bg-gray-950/95 px-7 py-3 backdrop-blur-sm transition-transform duration-100 focus:outline-none active:scale-95"
                      @click="launch($event.currentTarget)">
                      <span
                        class="absolute inset-0 -translate-x-full skew-x-6 bg-gradient-to-r from-transparent via-white/8 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <span class="relative z-10 flex items-center gap-2">
                        <span class="text-sm leading-none">🎉</span>
                        <span
                          class="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-violet-300 bg-clip-text text-[10px] font-bold tracking-[0.35em] text-transparent uppercase">庆祝一下</span>
                      </span>
                    </button>
                  </div>
                </div>
              </template>
            </RebornFireworks>
          </div>
        </div>
      </section>

      <!-- 全屏弹出 -->
      <section class="flex flex-col gap-4">
        <div class="flex items-start justify-center">
          <div
            class="h-[550px] w-80 overflow-hidden rounded-3xl border border-white/5 bg-gray-950 shadow-2xl shadow-black/60">
            <RebornFireworks class="h-full" :teleport="true">
              <template #default="{ launchCount, launch }">
                <div class="relative flex min-h-full flex-col">
                  <div class="pointer-events-none absolute inset-0">
                    <div
                      class="absolute top-1/4 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
                  </div>
                  <div class="flex items-center gap-3 px-7 pt-8">
                    <span class="text-[9px] tracking-[0.5em] text-gray-600 uppercase">Reborn UI</span>
                    <div class="h-px flex-1 bg-gray-800" />
                  </div>
                  <div class="mt-10 flex flex-col px-7">
                    <span class="text-[10px] tracking-[0.4em] text-gray-600 uppercase">v 1.0.0 · stable</span>
                    <h1 class="mt-3 text-6xl leading-none font-black tracking-tight text-white">
                      Fireworks<br />Browser Popup
                    </h1>
                    <div class="mt-3 text-2xl font-bold cursor-pointer" @click="launch($event.currentTarget)">
                      <ColourfulText text="experience" />
                    </div>
                    <p class="mt-5 text-xs leading-relaxed text-gray-600">
                      Cross-platform consistency · highly customizable<br />For the next generation of applications
                    </p>
                  </div>
                  <div class="mt-auto flex flex-col gap-3 px-7 pb-4">
                    <div class="h-px bg-gray-800" />
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-[10px] text-gray-700">2025 · REBORN</span>
                      <Transition name="fade" mode="out-in">
                        <span v-if="launchCount === 0" key="hint"
                          class="flex items-center gap-1 text-[10px] tracking-[0.2em] text-gray-700">
                          <Icon name="lucide:chevron-down" size="10" />
                          点击庆祝
                        </span>
                        <span v-else key="count" class="flex items-center gap-1.5 text-[10px] text-gray-600">
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
                  <div class="group relative">
                    <div
                      class="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-50" />
                    <div
                      class="absolute -inset-px rounded-full bg-gradient-to-r from-violet-500/60 via-fuchsia-400/60 to-violet-500/60 opacity-30 transition-opacity duration-500 group-hover:opacity-80" />
                    <button
                      class="relative cursor-pointer overflow-hidden rounded-full bg-gray-950/95 px-7 py-3 backdrop-blur-sm transition-transform duration-100 focus:outline-none active:scale-95"
                      @click="launch($event.currentTarget)">
                      <span
                        class="absolute inset-0 -translate-x-full skew-x-6 bg-gradient-to-r from-transparent via-white/8 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <span class="relative z-10 flex items-center gap-2">
                        <span class="text-sm leading-none">🎉</span>
                        <span
                          class="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-violet-300 bg-clip-text text-[10px] font-bold tracking-[0.35em] text-transparent uppercase">庆祝一下</span>
                      </span>
                    </button>
                  </div>
                </div>
              </template>
            </RebornFireworks>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
