<script setup lang="ts">
/**
 * 总览卡片缩略：引导标题下方一个胶囊输入框，显示轮换中的一条占位文案与未激活的发送按钮
 *
 * 不直接挂载组件：它在挂载时会主动 focus 输入框（总览页滚动到卡片时会抢走焦点），
 * 并用永不停止的 setInterval 轮换占位文案，模板里还常驻一块 canvas；
 * 这里按组件的胶囊外观与按钮禁用态，用 DOM 静态摆出其中一帧。
 */
</script>

<template>
  <div class="flex w-[200px] flex-col items-center gap-4">
    <h2 class="text-base text-highlighted">
      随便问点什么
    </h2>
    <div class="relative h-10 w-full overflow-hidden rounded-full bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] dark:bg-zinc-800">
      <p class="absolute inset-y-0 left-0 flex w-[calc(100%-2.5rem)] items-center truncate pl-4 text-xs text-neutral-500 dark:text-zinc-500">
        为什么我的代码总是坏掉？
      </p>
      <span class="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-700">
        <Icon
          name="lucide:arrow-right"
          class="size-4 text-gray-300"
        />
      </span>
    </div>
  </div>
</template>
