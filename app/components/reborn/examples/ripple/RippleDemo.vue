<template>
  <DemoSection
    title="基础用法"
    description="Ripple 会在容器中心生成一组同心圆并依次扩散，父容器需要 relative 与 overflow-hidden；通过 circle-class 可自定义每一圈的描边与填充。"
  >
    <DemoBlock
      layout="stack"
      align="center"
    >
      <div
        class="rounded-ui-md relative flex h-[450px] w-full flex-col items-center justify-center overflow-hidden"
      >
        <p class="text-highlighted z-10 text-center text-5xl font-medium tracking-tighter">Ripple</p>
        <Ripple
          class="[mask-image:linear-gradient(to_bottom,white,transparent)]"
          circle-class="border-primary/30 bg-primary/10 rounded-full"
        />
      </div>
    </DemoBlock>
  </DemoSection>
</template>
