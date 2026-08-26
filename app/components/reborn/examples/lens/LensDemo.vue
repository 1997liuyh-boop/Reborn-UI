<script setup lang="ts">
const hovering = ref(false);

function setHovering(value: boolean) {
  hovering.value = value;
}
</script>

<template>
  <DemoSection
    title="基础用法"
    description="鼠标移入图片后出现圆形放大镜；下方文案在悬停时轻微模糊，突出镜头焦点。"
  >
    <DemoBlock
      layout="stack"
      align="center"
    >
      <!-- 深色舞台是放大镜效果的一部分，两种模式都保持深色 -->
      <div class="rounded-ui-lg relative w-full max-w-lg overflow-hidden bg-gray-10 p-8 dark:bg-gray-1">
        <Rays />
        <Beams />
        <div class="relative z-10">
          <Lens
            :hovering="hovering"
            @hover-update="setHovering"
          >
            <img
              src="https://images.unsplash.com/photo-1713869820987-519844949a8a?q=80&w=3500&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Vision Pro 配图"
              width="500"
              height="500"
              class="rounded-ui-md"
            >
          </Lens>
          <div
            :style="{ filter: hovering ? 'blur(2px)' : 'blur(0px)' }"
            class="relative z-20 py-4 text-white"
          >
            <h3 class="text-left text-2xl font-bold">Apple Vision Pro</h3>
            <p class="text-gray-6 mt-4 text-left">
              空间计算头显，把数字内容叠到现实空间里。把鼠标移到图片上即可局部放大。
            </p>
          </div>
        </div>
      </div>
    </DemoBlock>
  </DemoSection>
</template>
