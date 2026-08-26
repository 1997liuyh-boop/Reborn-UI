<script setup lang="ts">
/** 吸顶演示需要一段可滚动内容，列表本身无背景，靠分隔线区分条目 */
const listA = Array.from({ length: 8 }, (_, i) => i + 1);
const listB = Array.from({ length: 8 }, (_, i) => i + 1);
const listC = Array.from({ length: 16 }, (_, i) => i + 1);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection
      title="基础用法"
      description="与 CSS position: sticky 一致：组件到达预设的顶部距离后固定。下方三条吸顶条分别使用 offset 0 / 40 / 80，可叠加。"
    >
      <DemoBlock
        layout="stack"
        tone="inset"
      >
        <RebornSticky>
          <div class="bg-primary rounded-ui-2xs flex h-10 items-center px-3 text-sm text-white">
            默认吸顶 · offset 0
          </div>
        </RebornSticky>

        <div
          v-for="item in listA"
          :key="`a-${item}`"
          class="border-default border-b py-3 last:border-b-0"
        >
          <span class="text-muted text-sm">条目 A · {{ item }}</span>
        </div>

        <RebornSticky :offset-top="40">
          <div class="bg-warning rounded-ui-2xs flex h-10 items-center px-3 text-sm text-white">
            吸顶 · offset 40px
          </div>
        </RebornSticky>

        <div
          v-for="item in listB"
          :key="`b-${item}`"
          class="border-default border-b py-3 last:border-b-0"
        >
          <span class="text-muted text-sm">条目 B · {{ item }}</span>
        </div>

        <RebornSticky :offset-top="80">
          <div class="bg-success rounded-ui-2xs flex h-10 items-center px-3 text-sm text-white">
            吸顶 · offset 80px
          </div>
        </RebornSticky>

        <div
          v-for="item in listC"
          :key="`c-${item}`"
          class="border-default border-b py-3 last:border-b-0"
        >
          <span class="text-muted text-sm">条目 C · {{ item }}</span>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
