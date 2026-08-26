<template>
  <DemoSection
    title="基础用法"
    description="3D 文字需要深色舞台才看得清阴影层；两种模式都保持深色。"
  >
    <div class="flex flex-col items-center justify-center overflow-hidden rounded-ui-md bg-gray-10 px-4 py-16 dark:bg-gray-1">
      <Text3d
        class="text-8xl font-bold max-md:text-7xl"
        shadow-color="red"
      >
        3D
      </Text3d>
      <Text3d
        class="text-8xl font-black max-md:text-7xl"
        shadow-color="skyblue"
        :animate="false"
      >
        就是
      </Text3d>
      <Text3d class="text-8xl font-bold max-md:text-7xl">厉害</Text3d>
    </div>
  </DemoSection>
</template>
