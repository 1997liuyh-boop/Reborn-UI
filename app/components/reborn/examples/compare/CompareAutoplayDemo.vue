<template>
  <div class="flex h-[60vh] w-full items-center justify-center px-1 [perspective:800px] [transform-style:preserve-3d] md:px-8">
    <!-- 外层是承载对比控件的机身外框，属于被演示对象的一部分 -->
    <div
      class="border-default bg-elevated rounded-ui-lg mx-auto h-1/2 w-3/4 border p-1 md:h-3/4 md:p-4"
      :style="{ transform: 'rotateX(15deg) translateZ(80px)' }"
    >
      <Compare
        first-image="https://cdn.reborn-ui.com/images/reborn-light.png"
        second-image="https://cdn.reborn-ui.com/images/reborn-dark.png"
        first-content-class="object-cover object-left-center w-full h-96"
        second-content-class="object-cover object-left-center w-full h-96"
        class="rounded-ui-md size-full"
        slide-mode="hover"
        :autoplay="true"
      />
    </div>
  </div>
</template>
