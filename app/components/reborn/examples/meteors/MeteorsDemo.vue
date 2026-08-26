<template>
  <ClientOnly>
    <DemoSection
      title="基础用法"
      description="Meteors 会在父容器内随机生成流星轨迹，父容器需要 relative 与 overflow-hidden；深色底更能凸显拖尾效果。"
    >
      <DemoBlock
        layout="stack"
        align="center"
      >
        <!-- 卡片本体即被演示的载体，深色表面是流星效果的一部分 -->
        <div
          class="rounded-ui-lg border-gray-8/40 relative flex w-full max-w-xs flex-col items-start justify-end overflow-hidden border bg-gray-10 px-4 py-8 dark:bg-gray-1"
        >
          <Icon
            name="lucide:arrow-up-right"
            class="text-gray-6 mb-4 size-5"
          />

          <h3 class="relative z-10 mb-4 text-xl font-bold text-white">流星划过夜空</h3>

          <p class="text-gray-6 relative z-10 mb-4 text-base leading-relaxed">
            在任意深色区块上叠加一层流星动画，可用于产品首屏、活动页头图或空状态插画，无需额外的图片资源。
          </p>

          <button
            type="button"
            class="rounded-ui-2xs border-gray-6 text-gray-6 hover:text-white border px-4 py-1 text-sm transition-colors hover:border-white"
          >
            了解更多
          </button>

          <Meteors />
        </div>
      </DemoBlock>
    </DemoSection>
  </ClientOnly>
</template>
