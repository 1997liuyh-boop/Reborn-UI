<script setup lang="ts">
/**
 * 总览卡片缩略：两行三列的 Bento 网格，宽窄格子交错，每格上方是骨架占位、下方是标题
 *
 * 直接使用组件；默认行高 18rem、格子内边距 1rem 放不进卡片，
 * 这里用 important 压低行高、间距与内边距，并把标题区的上下外边距收小。
 * 跨两列的格子沿用 Demo 的写法（col-span-2），首行宽格在左、次行宽格在右，体现错落。
 */
const items = [
  { title: '创新的黎明', class: 'col-span-2!' },
  { title: '数字革命', class: '' },
  { title: '设计之美', class: '' },
  { title: '沟通的力量', class: 'col-span-2!' },
]
</script>

<template>
  <BentoGrid class="w-[200px] grid-cols-3! auto-rows-[56px]! gap-2!">
    <BentoGridItem
      v-for="item in items"
      :key="item.title"
      class="space-y-1! p-1.5! [&_.my-2]:my-0!" :class="[item.class]"
    >
      <template #header>
        <div class="flex size-full min-h-0 flex-1 rounded-md bg-elevated" />
      </template>

      <template #title>
        <span class="block truncate text-[10px] leading-tight">{{ item.title }}</span>
      </template>
    </BentoGridItem>
  </BentoGrid>
</template>
