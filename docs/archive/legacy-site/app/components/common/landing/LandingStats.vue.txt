<script lang="ts" setup>
/** 数据条：只放可核实的数字 */
const stats = [
  { icon: "lucide:box", value: "148", label: "组件数量" },
  { icon: "lucide:monitor-smartphone", value: "2 端", label: "Web · uniapp 同一套 API" },
  { icon: "lucide:code-xml", value: "100%", label: "TypeScript" },
  { icon: "lucide:sparkles", value: "MCP", label: "组件知识库，AI 就绪" },
] as const;
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
    <div class="grid gap-6 rounded-2xl border border-[#8b5cf6]/25 bg-gradient-to-r from-[#1B6DFA]/10 via-[#8b5cf6]/10 to-[#1B6DFA]/10 px-6 py-8 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4 lg:px-10 dark:border-[#8b5cf6]/30">
      <div v-for="stat in stats" :key="stat.label" class="flex items-center gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/60 text-[#6d5cf6] dark:bg-white/[0.06] dark:text-[#c4b5fd]">
          <Icon :name="stat.icon" class="size-6" />
        </div>
        <div class="flex flex-col">
          <span class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{{ stat.value }}</span>
          <span class="text-sm text-zinc-600 dark:text-white/60">{{ stat.label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
