<script setup lang="ts">
/**
 * 总览卡片缩略：「选择颜色」触发按钮与其下方展开的取色面板
 *
 * 触发按钮用真实的 ColorPicker 包裹；面板部分静态模拟：组件展开时面板宽 320px，
 * 还会铺一层 fixed 全屏遮罩，放不进卡片，这里只按原样式画出饱和度画布、色相条和快捷色。
 */
const swatches = ['#F8371A', '#FAC81C', '#3FD0B6', '#2CADF6', '#6462FC', '#A35FFF']
</script>

<template>
  <div class="flex w-[184px] scale-[0.92] flex-col items-center gap-1.5">
    <ColorPicker
      value="#A35FFF"
      type="hsla"
    >
      <RebornButton
        variant="outlined"
        color="neutral"
        size="sm"
        label="选择颜色"
      >
        <template #leading>
          <span class="size-3.5 rounded-sm border border-gray-3 bg-[#A35FFF]" />
        </template>
        <template #trailing>
          <Icon name="lucide:chevron-down" />
        </template>
      </RebornButton>
    </ColorPicker>

    <div class="w-full space-y-1.5 rounded-md border border-gray-3 bg-gray-1 p-2 shadow-md">
      <!-- 饱和度 / 明度画布：底色取 #A35FFF 的色相 -->
      <div class="relative h-[44px] w-full rounded border border-gray-3 bg-[linear-gradient(to_top,#000,transparent),linear-gradient(to_right,#fff,hsl(265,100%,50%))]">
        <span class="absolute top-[12%] left-[63%] size-3 -translate-1/2 rounded-full border-2 border-white" />
      </div>
      <!-- 色相条 -->
      <div class="relative h-2.5 w-full rounded bg-[linear-gradient(to_right,#f00_0%,#ff0_17%,#0f0_33%,#0ff_50%,#00f_67%,#f0f_83%,#f00_100%)]">
        <span class="absolute top-1/2 left-[74%] size-3 -translate-1/2 rounded-full border-2 border-gray-9 bg-white" />
      </div>
      <!-- 快捷色 -->
      <div class="flex justify-between border-t border-gray-3 pt-1.5">
        <span
          v-for="swatch in swatches"
          :key="swatch"
          class="size-3.5 rounded"
          :style="{ backgroundColor: swatch }"
        />
      </div>
    </div>
  </div>
</template>
