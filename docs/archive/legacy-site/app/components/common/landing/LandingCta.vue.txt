<template>
  <section class="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
    <div class="relative flex flex-col items-start gap-6 overflow-hidden rounded-2xl border border-[#8b5cf6]/25 bg-gradient-to-r from-[#1B6DFA]/15 via-[#6d5cf6]/15 to-[#a855f7]/10 px-8 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-12 dark:border-[#8b5cf6]/30">
      <!-- 左侧的星球光晕 -->
      <div class="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(196,181,253,0.55)_0%,rgba(109,92,246,0.35)_45%,transparent_72%)] blur-md" />
      <div class="pointer-events-none absolute top-0 right-0 h-full w-40 bg-[radial-gradient(circle,rgba(255,255,255,0.25)_1px,transparent_1.5px)] [background-size:14px_14px] opacity-40 dark:opacity-20" />

      <div class="relative flex flex-col gap-2">
        <h2 class="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
          准备好开始构建了吗？
        </h2>
        <p class="text-base text-zinc-600 dark:text-white/65">
          快速上手 Reborn UI，构建美丽的应用界面
        </p>
      </div>

      <NuxtLink to="/getting-started" class="relative">
        <RebornButton
          size="lg"
          class="bg-gradient-to-r from-[#1B6DFA] to-[#8b5cf6] text-white shadow-[0_16px_40px_rgba(109,92,246,0.45)] hover:from-[#3b82f6] hover:to-[#a78bfa]"
        >
          开始使用 Reborn UI
          <template #trailing>
            <Icon name="lucide:arrow-right" class="size-4" />
          </template>
        </RebornButton>
      </NuxtLink>
    </div>
  </section>
</template>
