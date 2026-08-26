<template>
  <DemoSection
    title="基础用法"
    description="默认沿 Y 轴翻转，默认插槽是正面、#back 插槽是背面；两面尺寸由父容器决定，需保持一致以免翻转时跳动。"
  >
    <DemoBlock
      layout="stack"
      align="center"
    >
      <FlipCard>
        <template #default>
          <img
            src="https://images.unsplash.com/photo-1525373698358-041e3a460346?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
            alt="卡片正面配图"
            class="rounded-ui-lg size-full object-cover"
          >
          <div class="absolute bottom-4 left-4 text-xl font-bold text-white">Reborn UI</div>
        </template>
        <template #back>
          <div class="flex min-h-full flex-col gap-2 text-white">
            <h3 class="text-xl font-bold">Reborn UI</h3>
            <p class="border-current/30 mt-1 border-t py-4 text-base leading-normal font-medium">
              Reborn UI 提供了一套设计精良、可直接复用的动效组件，既包含团队自研的组件，也收录了社区贡献的实现。
            </p>
          </div>
        </template>
      </FlipCard>
    </DemoBlock>
  </DemoSection>
</template>
