<script setup lang="ts">
/**
 * 组件总览卡片的静态几何示意
 * 按分类给出轻量 CSS 图形，不挂真实 demo
 */
interface Props {
  /** 规范化后的分类名 */
  category?: string
}

const { category = '杂项' } = defineProps<Props>()

/** 分类 → 示意变体 */
const variant = computed(() => {
  switch (category) {
    case '按钮':
      return 'button'
    case '表单与输入':
      return 'form'
    case '导航':
      return 'nav'
    case '布局':
      return 'layout'
    case '卡片':
      return 'card'
    case '文字动画':
      return 'text'
    case '特效':
      return 'effect'
    case '数据':
      return 'data'
    case '反馈':
      return 'feedback'
    case '设备模型':
      return 'device'
    case '通用':
      return 'general'
    default:
      return 'misc'
  }
})
</script>

<template>
  <div
    class="text-muted flex h-full w-full items-center justify-center"
    aria-hidden="true"
  >
    <!-- 按钮：主/次/文字三态条 -->
    <div
      v-if="variant === 'button'"
      class="flex flex-col items-center gap-3"
    >
      <div class="bg-primary h-8 w-20 rounded-md" />
      <div class="border-default h-8 w-20 rounded-md border bg-transparent" />
      <div class="bg-primary/15 text-primary flex h-8 w-20 items-center justify-center rounded-md text-xs font-medium">
        Text
      </div>
    </div>

    <!-- 表单：输入线 + 开关/选择块 -->
    <div
      v-else-if="variant === 'form'"
      class="flex w-[70%] flex-col gap-3"
    >
      <div class="border-default h-9 rounded-md border px-3 flex items-center">
        <div class="bg-muted h-2 w-2/3 rounded-full opacity-60" />
      </div>
      <div class="border-default h-9 rounded-md border px-3 flex items-center justify-between">
        <div class="bg-muted h-2 w-1/3 rounded-full opacity-60" />
        <div class="border-default h-4 w-4 rounded-sm border" />
      </div>
      <div class="flex items-center gap-2">
        <div class="bg-primary h-5 w-9 rounded-full p-0.5">
          <div class="ml-auto h-4 w-4 rounded-full bg-white" />
        </div>
        <div class="bg-muted h-2 w-16 rounded-full opacity-50" />
      </div>
    </div>

    <!-- 导航：面包屑 + 菜单行 -->
    <div
      v-else-if="variant === 'nav'"
      class="flex w-[75%] flex-col gap-4"
    >
      <div class="flex items-center gap-2 text-xs">
        <div class="bg-muted h-2 w-10 rounded-full opacity-50" />
        <span class="opacity-40">/</span>
        <div class="bg-muted h-2 w-10 rounded-full opacity-50" />
        <span class="opacity-40">/</span>
        <div class="bg-primary/40 h-2 w-12 rounded-full" />
      </div>
      <div class="border-default overflow-hidden rounded-md border">
        <div
          v-for="i in 4"
          :key="i"
          class="border-default flex h-8 items-center gap-2 border-b px-3 last:border-b-0"
          :class="i === 1 ? 'bg-primary/8' : ''"
        >
          <div
            class="h-2 rounded-full"
            :class="i === 1 ? 'bg-primary/50 w-16' : 'bg-muted w-12 opacity-50'"
          />
        </div>
      </div>
    </div>

    <!-- 布局：栅格块 -->
    <div
      v-else-if="variant === 'layout'"
      class="grid w-[75%] grid-cols-3 gap-2"
    >
      <div class="bg-primary/20 col-span-2 h-16 rounded" />
      <div class="bg-muted/60 h-16 rounded" />
      <div class="bg-muted/60 h-12 rounded" />
      <div class="bg-primary/10 col-span-2 h-12 rounded" />
    </div>

    <!-- 卡片：标题条 + 内容块 -->
    <div
      v-else-if="variant === 'card'"
      class="border-default w-[70%] overflow-hidden rounded-lg border"
    >
      <div class="bg-muted/40 h-16" />
      <div class="space-y-2 p-3">
        <div class="bg-muted h-2.5 w-2/3 rounded-full opacity-70" />
        <div class="bg-muted h-2 w-full rounded-full opacity-40" />
        <div class="bg-muted h-2 w-5/6 rounded-full opacity-40" />
      </div>
    </div>

    <!-- 文字动画：阶梯字重条 -->
    <div
      v-else-if="variant === 'text'"
      class="flex flex-col items-start gap-2"
    >
      <div class="text-default text-2xl font-semibold tracking-tight opacity-90">
        Aa
      </div>
      <div class="bg-muted h-2 w-28 rounded-full opacity-50" />
      <div class="bg-muted h-2 w-20 rounded-full opacity-35" />
      <div class="bg-primary/35 h-2 w-24 rounded-full" />
    </div>

    <!-- 特效：放射点阵 -->
    <div
      v-else-if="variant === 'effect'"
      class="relative h-28 w-28"
    >
      <div class="bg-primary/25 absolute inset-4 rounded-full" />
      <div class="bg-primary/15 absolute inset-0 rounded-full" />
      <div class="bg-primary absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div class="border-primary/30 absolute inset-2 rounded-full border border-dashed" />
    </div>

    <!-- 数据：表格骨架 -->
    <div
      v-else-if="variant === 'data'"
      class="border-default w-[75%] overflow-hidden rounded-md border"
    >
      <div class="bg-muted/50 grid grid-cols-3 gap-px border-b border-default">
        <div
          v-for="i in 3"
          :key="`h-${i}`"
          class="h-8 px-2 flex items-center"
        >
          <div class="bg-muted h-2 w-10 rounded-full opacity-70" />
        </div>
      </div>
      <div
        v-for="r in 3"
        :key="`r-${r}`"
        class="border-default grid grid-cols-3 gap-px border-b last:border-b-0"
      >
        <div
          v-for="c in 3"
          :key="`c-${r}-${c}`"
          class="flex h-8 items-center px-2"
        >
          <div class="bg-muted h-2 rounded-full opacity-40" :class="c === 1 ? 'w-12' : 'w-8'" />
        </div>
      </div>
    </div>

    <!-- 反馈：提示条 -->
    <div
      v-else-if="variant === 'feedback'"
      class="flex w-[75%] flex-col gap-3"
    >
      <div class="bg-primary/10 border-primary/20 flex items-center gap-2 rounded-md border px-3 py-2">
        <div class="bg-primary h-2.5 w-2.5 rounded-full" />
        <div class="bg-primary/40 h-2 flex-1 rounded-full" />
      </div>
      <div class="border-default bg-muted/30 flex items-center gap-2 rounded-md border px-3 py-2">
        <div class="bg-muted h-2.5 w-2.5 rounded-full" />
        <div class="bg-muted h-2 flex-1 rounded-full opacity-60" />
      </div>
      <div class="border-default mx-auto flex h-16 w-28 flex-col items-center justify-center gap-2 rounded-lg border">
        <div class="bg-primary/30 h-6 w-6 rounded-full" />
        <div class="bg-muted h-2 w-14 rounded-full opacity-50" />
      </div>
    </div>

    <!-- 设备：圆角屏框 -->
    <div
      v-else-if="variant === 'device'"
      class="border-default relative h-32 w-20 rounded-[1.25rem] border-2 p-1.5"
    >
      <div class="bg-muted/40 h-full w-full rounded-[0.9rem]" />
      <div class="bg-muted absolute top-2.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full opacity-50" />
    </div>

    <!-- 通用：圆角容器 + 网格 -->
    <div
      v-else-if="variant === 'general'"
      class="border-default flex h-24 w-24 items-center justify-center rounded-xl border-2"
    >
      <div class="grid grid-cols-2 gap-2">
        <div class="bg-default h-6 w-6 rounded" />
        <div class="bg-default/40 h-6 w-6 rounded" />
        <div class="bg-default/40 h-6 w-6 rounded" />
        <div class="bg-default h-6 w-6 rounded" />
      </div>
    </div>

    <!-- 杂项：抽象模块 -->
    <div
      v-else
      class="flex items-end gap-2"
    >
      <div class="bg-muted/70 h-10 w-8 rounded" />
      <div class="bg-primary/25 h-16 w-8 rounded" />
      <div class="bg-muted/50 h-12 w-8 rounded" />
      <div class="bg-primary/15 h-20 w-8 rounded" />
    </div>
  </div>
</template>
