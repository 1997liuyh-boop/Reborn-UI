<template>
  <DemoSection
    title="基础用法"
    description="标题是组件自己的 #title 插槽；卡片面上的图用白名单圆角。"
  >
    <div class="flex flex-col overflow-hidden">
      <ContainerScroll>
        <template #title>
          <h1 class="text-highlighted text-4xl font-semibold">
            释放滚动动画的力量
            <br>
            <span class="mt-1 text-4xl leading-none font-bold md:text-[6rem]">
              Scroll Animations
            </span>
          </h1>
        </template>
        <template #card>
          <img
            src="https://cdn.reborn-ui.com/images/linear.webp"
            class="mx-auto h-full rounded-ui-lg object-cover object-left-top"
            alt="滚动动画示意"
            height="720"
            width="1400"
          >
        </template>
      </ContainerScroll>
    </div>
  </DemoSection>
</template>
