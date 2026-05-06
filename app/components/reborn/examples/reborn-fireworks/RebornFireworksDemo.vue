<script lang="ts" setup>
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-10 pt-20 pb-20 md:flex-row">

    <section class="flex flex-1 flex-col gap-4">
      <div class="flex items-start justify-center">
        <div
          class="h-[550px] w-80 overflow-hidden rounded-3xl border border-white/5 bg-gray-950 shadow-2xl shadow-black/60">
          <Fireworks>
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
                  <span class="text-[10px] tracking-[0.4em] text-gray-600 uppercase">v 1.0.0 ·
                    stable</span>
                  <h1 class="mt-3 text-6xl leading-none font-black tracking-tight text-white">
                    Fireworks<br />Container
                  </h1>
                  <div class="mt-3 text-2xl font-bold cursor-pointer" @click="launch($event.currentTarget)">
                    <ColourfulText text="experience" />
                  </div>
                  <p class="mt-5 text-xs leading-relaxed text-gray-600">
                    Cross-platform consistency · highly customizable<br />For the next generation of
                    applications
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
          </Fireworks>
        </div>
      </div>
    </section>

    <section class="flex flex-1 flex-col gap-4">
      <div class="flex items-start justify-center">
        <div
          class="h-[550px] w-80 overflow-hidden rounded-3xl border border-white/5 bg-gray-950 shadow-2xl shadow-black/60">
          <Fireworks :teleport="true">
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
                  <span class="text-[10px] tracking-[0.4em] text-gray-600 uppercase">v 1.0.0 ·
                    stable</span>
                  <h1 class="mt-3 text-6xl leading-none font-black tracking-tight text-white">
                    Fireworks<br />Browser Popup
                  </h1>
                  <div class="mt-3 text-2xl font-bold cursor-pointer" @click="launch($event.currentTarget)">
                    <ColourfulText text="experience" />
                  </div>
                  <p class="mt-5 text-xs leading-relaxed text-gray-600">
                    Cross-platform consistency · highly customizable<br />For the next generation of
                    applications
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
          </Fireworks>
        </div>
      </div>
    </section>
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
