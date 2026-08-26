<template>
  <DemoSection
    title="基础用法"
    description="三种描边动画；内部输入框是被包裹的主体，用 default 表面，不再写 bg-background。"
  >
    <DemoBlock
      layout="stack"
      align="center"
    >
      <div class="flex w-full flex-col items-center justify-center gap-16 py-8">
        <NeonBorder animation-type="none">
          <input
            type="text"
            class="bg-default size-full rounded-ui-sm px-4 text-sm"
            placeholder="无动画"
          >
        </NeonBorder>

        <NeonBorder>
          <input
            type="text"
            class="bg-default size-full rounded-ui-sm px-4 text-sm"
            placeholder="半圈描边动画"
          >
        </NeonBorder>

        <NeonBorder animation-type="full">
          <input
            type="text"
            class="bg-default size-full rounded-ui-sm px-4 text-sm"
            placeholder="全圈描边动画"
          >
        </NeonBorder>
      </div>
    </DemoBlock>
  </DemoSection>
</template>
