<template>
  <DemoSection title="基础用法">
    <ClientOnly>
      <BlurReveal
        :delay="0.2"
        :duration="0.75"
        class="p-8"
      >
        <h2 class="text-highlighted text-3xl font-bold tracking-tighter sm:text-5xl">你好 👋</h2>
        <span class="text-muted text-xl tracking-tighter text-pretty sm:text-3xl">
          最近怎么样？
        </span>
      </BlurReveal>
    </ClientOnly>
  </DemoSection>
</template>
