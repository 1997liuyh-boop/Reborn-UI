<template>
  <div class="flex w-full justify-center">
    <Compare
      class="rounded-ui-md overflow-hidden"
      :autoplay="true"
      :autoplay-duration="3000"
      slide-mode="hover"
    >
      <template #first-content>
        <div class="flex size-full items-center justify-center bg-blue-500">
          <div class="text-4xl font-bold text-white">☀️ 白天</div>
        </div>
      </template>
      <template #second-content>
        <!-- 夜间侧必须在两种模式下都保持深色 -->
        <div class="flex size-full items-center justify-center bg-gray-10 dark:bg-gray-1">
          <div class="text-4xl font-bold text-white">🌙 夜晚</div>
        </div>
      </template>
    </Compare>
  </div>
</template>
