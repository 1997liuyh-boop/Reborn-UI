<script lang="ts" setup>
/** 四大特性：文案只写已具备的能力 */
const features = [
  {
    icon: "lucide:zap",
    title: "极速开发",
    description: "开箱即用的组件，文档内即可调参数、看效果、一键在 Playground 运行。",
    glow: "from-[#1B6DFA]/30",
  },
  {
    icon: "lucide:palette",
    title: "高度可定制",
    description: "设计令牌驱动的主题系统，ui 键位逐节点覆盖样式，轻松贴合品牌风格。",
    glow: "from-[#8b5cf6]/30",
  },
  {
    icon: "lucide:box",
    title: "丰富组件",
    description: "148 个组件覆盖表单、导航、反馈与数据展示，Web 与 uniapp 双端同一套 API。",
    glow: "from-[#a855f7]/30",
  },
  {
    icon: "lucide:code-xml",
    title: "TypeScript 支持",
    description: "接口式 defineProps 与完整类型定义，编辑器里就能拿到每个属性的提示。",
    glow: "from-[#1B6DFA]/30",
  },
] as const;
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="feature in features"
        :key="feature.title"
        class="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#8b5cf6]/40 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
      >
        <div class="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br to-transparent blur-3xl transition-transform duration-500 group-hover:scale-125" :class="feature.glow" />
        <div class="relative flex flex-col gap-4">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1B6DFA]/15 to-[#8b5cf6]/15 text-[#6d5cf6] dark:text-[#c4b5fd]">
            <Icon :name="feature.icon" class="size-5" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
            {{ feature.title }}
          </h3>
          <p class="text-sm leading-7 text-zinc-600 dark:text-white/60">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
