<script setup lang="ts">
import RebornLoading from "~/components/reborn/ui/reborn-loading/RebornLoading.vue"
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue"
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue"
import { LoadingTypes, LoadingColors } from "~/components/reborn/ui/reborn-loading/reborn-loading.config"

const typeOptions = LoadingTypes.map(t => ({ label: t, value: t }))
const colorOptions = LoadingColors.map(c => ({ label: c, value: c }))

const type = ref<typeof LoadingTypes[number]>('ring')
const color = ref<typeof LoadingColors[number] | string>('primary')
const size = ref('40px')
</script>

<template>
  <div class="flex flex-col gap-10 w-full max-w-6xl mx-auto pb-20">
    <div class="flex flex-col gap-2">
      <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Loading 加载</h2>
      <p class="text-lg text-gray-500 dark:text-gray-400">用于展示加载状态、处理中或同步过程的视觉反馈。</p>
    </div>

    <!-- Interactive Playground -->
    <section class="flex flex-col gap-4">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">交互演示</h3>
      <div
        class="relative rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-1 shadow-2xl overflow-hidden">
        <!-- Backdrop Glow -->
        <div class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-secondary/10 blur-3xl"></div>

        <div class="relative flex flex-col md:flex-row gap-0">
          <!-- Config Panel -->
          <div
            class="w-full md:w-80 p-8 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/30 backdrop-blur-sm">
            <div class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-gray-400">动画类型</span>
                <RebornSelect v-model="type" :options="typeOptions" />
              </div>

              <div class="flex flex-col gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-gray-400">颜色风格</span>
                <RebornSelect v-model="color" :options="colorOptions" />
              </div>

              <div class="flex flex-col gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-gray-400">自定义尺寸 (px/rem/em)</span>
                <RebornInput v-model="size" placeholder="例如: 40px" />
              </div>
            </div>
          </div>

          <!-- Preview Area -->
          <div class="flex-1 p-12 flex flex-col items-center justify-center gap-8 min-h-[340px]">
            <RebornLoading :type="type" :color="color" :size="size" />
            <div class="text-xs text-gray-400 font-mono">
              Props: { type: '{{ type }}', color: '{{ color }}', size: '{{ size }}' }
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Detailed Showcase Grid -->
    <section class="flex flex-col gap-6">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">全样式预览</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
        <div v-for="t in LoadingTypes" :key="t"
          class="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border border-gray-100 dark:border-gray-900 bg-white/50 dark:bg-gray-800/30 backdrop-blur shadow-sm hover:shadow-md transition-shadow">
          <RebornLoading :type="t" color="primary" size="32px" />
          <span class="text-xs font-medium text-gray-400">{{ t }}</span>
        </div>
      </div>
    </section>

    <!-- Color variants -->
    <section class="flex flex-col gap-6">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">预设颜色</h3>
      <div
        class="flex flex-wrap gap-8 justify-center p-8 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div v-for="c in LoadingColors" :key="c" class="flex flex-col items-center gap-2">
          <RebornLoading type="spinner" :color="c" size="28px" />
          <span class="text-[10px] text-gray-400 uppercase tracking-tighter">{{ c }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
