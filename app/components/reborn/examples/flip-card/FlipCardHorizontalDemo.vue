<template>
  <div class="flex items-center justify-center">
    <FlipCard rotate="x">
      <template #default>
        <img
          src="https://images.unsplash.com/photo-1525373698358-041e3a460346?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
          alt="卡片正面配图"
          class="rounded-ui-lg size-full object-cover"
        >
      </template>
      <template #back>
        <div class="flex min-h-full flex-col gap-2 text-white">
          <h3 class="text-xl font-bold">Reborn UI</h3>
          <p class="border-current/30 mt-1 border-t py-4 text-base leading-normal font-medium">
            把 rotate 设为 x 即可改为沿 X 轴上下翻转，其余用法与默认方向完全一致。
          </p>
        </div>
      </template>
    </FlipCard>
  </div>
</template>
