<template>
  <div class="landing-shell relative isolate overflow-hidden [--color-primary:#ff3d58]">
    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,249,0.96)_0%,rgba(248,248,252,0.94)_46%,rgba(239,243,255,0.98)_100%)] dark:bg-[linear-gradient(180deg,rgba(12,8,15,0.98)_0%,rgba(15,9,18,0.97)_40%,rgba(8,12,24,0.99)_100%)]" />
      <div class="absolute -top-52 left-[-8rem] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,_rgba(255,61,88,0.28)_0%,_rgba(255,61,88,0.14)_30%,_transparent_72%)] blur-[110px]" />
      <div class="absolute right-[-10rem] bottom-[-12rem] h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,_rgba(82,104,255,0.24)_0%,_rgba(111,76,255,0.14)_34%,_transparent_72%)] blur-[130px]" />
      <div class="absolute top-[18%] right-[14%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.65)_0%,_transparent_72%)] blur-[70px] dark:bg-[radial-gradient(circle,_rgba(255,255,255,0.12)_0%,_transparent_72%)]" />
      <div class="landing-grid absolute inset-0 opacity-50 dark:opacity-20" />
      <div class="landing-noise absolute inset-0 opacity-[0.06] dark:opacity-[0.08]" />
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/20" />
    </div>

    <div class="relative z-10">
      <Hero />
    </div>
  </div>
</template>

<style scoped>
.landing-grid {
  background-image:
    linear-gradient(to right, rgba(15, 23, 42, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at center, black 44%, transparent 88%);
}

.dark .landing-grid {
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
}

.landing-noise {
  background-image:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.8) 0 1px, transparent 1px),
    radial-gradient(circle at 80% 30%, rgba(255, 255, 255, 0.5) 0 1px, transparent 1px),
    radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.6) 0 1px, transparent 1px);
  background-size: 120px 120px;
  mix-blend-mode: soft-light;
}
</style>
