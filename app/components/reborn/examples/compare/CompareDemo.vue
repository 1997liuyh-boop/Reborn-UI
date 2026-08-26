<template>
  <DemoSection
    title="基础用法"
    description="悬停即可推动分割线，对比两张图片；外框是对比控件的机身，属于被演示对象的一部分。"
  >
    <DemoBlock
      layout="stack"
      align="center"
    >
      <div class="border-default bg-elevated rounded-ui-lg border p-4">
        <Compare
          first-image="https://images.vscodethemes.com/antfu.theme-vitesse/vitesse-light-soft-js-preview-4JM.svg"
          second-image="https://images.vscodethemes.com/antfu.theme-vitesse/vitesse-dark-soft-js-preview-4JM.svg"
          first-content-class="object-cover object-left-top rounded-ui-md overflow-hidden"
          second-content-class="object-cover object-left-top rounded-ui-md overflow-hidden"
          class="h-[250px] w-[200px] md:h-96 md:w-[500px]"
          slide-mode="hover"
        />
      </div>
    </DemoBlock>
  </DemoSection>
</template>
