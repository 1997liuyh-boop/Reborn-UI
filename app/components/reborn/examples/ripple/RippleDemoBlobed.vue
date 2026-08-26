<template>
  <div
    class="rounded-ui-md relative flex h-[450px] w-full flex-col items-center justify-center overflow-hidden"
  >
    <p class="text-highlighted z-10 text-center text-5xl font-medium tracking-tighter">Blobs</p>
    <small class="text-muted z-10">不规则圆角也能正常扩散</small>
    <Ripple
      class="[mask-image:linear-gradient(to_bottom,white,transparent)]"
      circle-class="border-primary/30 bg-primary/25 blobed"
    />
  </div>
</template>

<style scoped>
/* 用非对称圆角把正圆压成不规则水滴形 */
:deep(.blobed) {
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
}
</style>
