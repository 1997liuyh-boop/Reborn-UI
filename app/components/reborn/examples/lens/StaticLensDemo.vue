<template>
  <div class="rounded-ui-lg relative w-full max-w-lg overflow-hidden bg-gray-10 p-8 dark:bg-gray-1">
    <Rays />
    <Beams />
    <div class="relative z-10">
      <Lens is-static>
        <img
          src="https://images.unsplash.com/photo-1713869820987-519844949a8a?q=80&w=3500&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Vision Pro 配图"
          width="500"
          height="500"
          class="rounded-ui-md"
        >
      </Lens>
      <div class="relative z-20 py-4 text-white">
        <h3 class="text-left text-2xl font-bold">Apple Vision Pro</h3>
        <p class="text-gray-6 mt-4 text-left">
          is-static 时镜头固定在预设位置，不再跟随鼠标。
        </p>
      </div>
    </div>
  </div>
</template>
