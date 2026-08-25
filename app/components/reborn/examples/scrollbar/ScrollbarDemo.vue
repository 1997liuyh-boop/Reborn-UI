<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Playground from '~/components/common/play-ground/Playground.vue'

// 三档尺寸选项
const sizeOptions = [
  { label: '4px（极细）', value: '4' },
  { label: '6px（默认）', value: '6' },
  { label: '8px（加粗）', value: '8' },
]

// 演示用滚动内容
const lines = Array.from({ length: 24 }, (_, i) => `第 ${i + 1} 条滚动内容，用于撑出滚动空间并验证滚动条表现。`)

// 颜色变量自定义示例（品牌色）
const customColors = [
  { name: '靛蓝', thumb: '#6366f1', hover: '#818cf8' },
  { name: '翠绿', thumb: '#10b981', hover: '#34d399' },
  { name: '玫红', thumb: '#f43f5e', hover: '#fb7185' },
]

// 统一状态
const state = ref({
  size: '6',
  thumbColor: '#71717a',
  hoverColor: '#a1a1aa',
  dark: false,
})

// 默认状态，用于重置
const defaultState = {
  size: '6',
  thumbColor: '#71717a',
  hoverColor: '#a1a1aa',
  dark: false,
}

function resetState() {
  state.value = { ...defaultState }
}

// 尺寸修饰类
const sizeClass = computed(() => `reborn-scrollbar--${state.value.size}`)

// 颜色变量覆盖
const thumbStyle = computed(() => ({
  '--reborn-scrollbar-thumb': state.value.thumbColor,
  '--reborn-scrollbar-thumb-hover': state.value.hoverColor,
}))

// 控制面板配置
const controls = [
  {
    title: '外观配置',
    children: [
      { label: '滚动条尺寸', key: 'size', component: 'select' as const, defaultValue: '6', props: { options: sizeOptions } },
      { label: 'thumb 颜色', key: 'thumbColor', component: 'color-picker' as const, defaultValue: '#71717a' },
      { label: '悬停颜色', key: 'hoverColor', component: 'color-picker' as const, defaultValue: '#a1a1aa' },
      { label: '暗色模式', key: 'dark', component: 'checkbox' as const, defaultValue: false },
    ],
  },
]

// 静态示例代码（纯 CSS 工具类，不生成组件代码）
const code = `<div class="reborn-scrollbar reborn-scrollbar--6 h-64 overflow-auto rounded-2xl">
  <!-- 滚动内容 -->
</div>`

// 不占宽度对比测量
const scrollBox = ref<HTMLElement | null>(null)
const plainBox = ref<HTMLElement | null>(null)
const widthResult = ref({ scroll: 0, plain: 0, equal: false })

function measureWidths() {
  if (!scrollBox.value || !plainBox.value) return
  const scrollW = scrollBox.value.clientWidth
  const plainW = plainBox.value.clientWidth
  widthResult.value = { scroll: scrollW, plain: plainW, equal: scrollW === plainW }
}

onMounted(async () => {
  await nextTick()
  measureWidths()
  window.addEventListener('resize', measureWidths)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureWidths)
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-12 pt-4 pb-24">

    <!-- 标题头 -->
    <div class="flex flex-col gap-3">
      <h2 class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">滚动条 Scrollbar</h2>
      <p class="text-xl text-gray-500 dark:text-gray-400 max-w-3xl">
        通用滚动条样式：滚动条悬浮于内容之上、不挤压布局，提供 4 / 6 / 8 三档尺寸，颜色与暗色均可通过 CSS 变量按需定制。
      </p>
    </div>

    <!-- 交互演练场 -->
    <Playground v-model="state" :controls="controls" component-name="Scrollbar" :code="code"
      title="交互演练场" description="切换尺寸与颜色，右侧滚动条实时响应；勾选暗色模式查看深色下 thumb 的对比。">
      <template #tag>
        <button
          class="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary transition-all hover:bg-primary/20 active:scale-95 cursor-pointer"
          @click="resetState">
          <Icon name="lucide:rotate-ccw" size="12" />
          重置配置
        </button>
      </template>
      <div :class="state.dark ? 'dark bg-zinc-900' : 'bg-zinc-100'"
        class="flex items-center justify-center rounded-3xl p-8 transition-colors">
        <div class="reborn-scrollbar h-64 w-72 rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950"
          :class="sizeClass" :style="thumbStyle">
          <div class="space-y-2 px-4 py-4">
            <p v-for="line in lines" :key="line" class="text-sm text-zinc-600 dark:text-zinc-300">{{ line }}</p>
          </div>
        </div>
      </div>
    </Playground>

    <!-- 三档尺寸 -->
    <section class="flex flex-col gap-5">
      <div class="flex items-center gap-2">
        <Icon name="lucide:ruler" class="size-5 text-primary" />
        <h3 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">三档尺寸</h3>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
        通过 size 修饰类切换 4 / 6 / 8 三档，粗细统一由 --reborn-scrollbar-size 变量驱动，方便扩展任意尺寸。
      </p>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div v-for="size in ['4', '6', '8']" :key="size" class="flex flex-col gap-2">
          <div class="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-200">
            <span>{{ size }}px</span>
            <span class="font-mono text-xs text-gray-400">.reborn-scrollbar--{{ size }}</span>
          </div>
          <div class="reborn-scrollbar h-48 rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950"
            :class="'reborn-scrollbar--' + size">
            <div class="space-y-1.5 px-3 py-3">
              <p v-for="line in lines" :key="line" class="text-xs text-zinc-500 dark:text-zinc-400">{{ line }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 颜色变量自定义 -->
    <section class="flex flex-col gap-5">
      <div class="flex items-center gap-2">
        <Icon name="lucide:palette" class="size-5 text-primary" />
        <h3 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">颜色变量自定义</h3>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
        覆盖 --reborn-scrollbar-thumb 与 --reborn-scrollbar-thumb-hover 两个变量，即可把滚动条换成任意品牌色。
      </p>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div v-for="c in customColors" :key="c.name" class="flex flex-col gap-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ c.name }}</span>
          <div class="reborn-scrollbar h-48 rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950"
            :style="{ '--reborn-scrollbar-thumb': c.thumb, '--reborn-scrollbar-thumb-hover': c.hover }">
            <div class="space-y-1.5 px-3 py-3">
              <p v-for="line in lines" :key="line" class="text-xs text-zinc-500 dark:text-zinc-400">{{ line }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 暗色适配 -->
    <section class="flex flex-col gap-5">
      <div class="flex items-center gap-2">
        <Icon name="lucide:moon" class="size-5 text-primary" />
        <h3 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">暗色适配</h3>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
        在 .dark 祖先下会自动提升 thumb 对比度，浅色 / 暗色两套可并排对比。
      </p>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div class="reborn-scrollbar h-56 rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div class="space-y-1.5 px-4 py-4">
            <p v-for="line in lines" :key="line" class="text-xs text-zinc-500">{{ line }}</p>
          </div>
        </div>
        <div class="dark">
          <div class="reborn-scrollbar h-56 rounded-2xl border border-white/10 bg-zinc-950 shadow-sm">
            <div class="space-y-1.5 px-4 py-4">
              <p v-for="line in lines" :key="line" class="text-xs text-zinc-400">{{ line }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 不占宽度对比 -->
    <section class="flex flex-col gap-5">
      <div class="flex items-center gap-2">
        <Icon name="lucide:panel-right" class="size-5 text-primary" />
        <h3 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">不占宽度</h3>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
        滚动条悬浮于内容之上，有 / 无滚动条时内容可视宽度一致，不会引起布局抖动。
      </p>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">有滚动条（reborn-scrollbar）</span>
          <div ref="scrollBox" class="reborn-scrollbar h-48 rounded-2xl border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-950">
            <div class="space-y-1.5 px-3 py-3">
              <p v-for="line in lines" :key="line" class="text-xs text-zinc-500 dark:text-zinc-400">{{ line }}</p>
            </div>
          </div>
          <p class="text-xs text-gray-500">内容可视宽度：{{ widthResult.scroll }}px</p>
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">无滚动条（对照）</span>
          <div ref="plainBox" class="h-48 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-950">
            <div class="space-y-1.5 px-3 py-3">
              <p class="text-xs text-zinc-500 dark:text-zinc-400">内容不足一屏，未出现滚动条。</p>
            </div>
          </div>
          <p class="text-xs text-gray-500">内容可视宽度：{{ widthResult.plain }}px</p>
        </div>
      </div>
      <p class="text-sm font-medium" :class="widthResult.equal ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
        {{ widthResult.equal ? '✓ 两侧可视宽度一致，滚动条未挤压内容。' : '当前浏览器未走 overlay，滚动条占用少量宽度（Firefox 降级为 thin）。' }}
      </p>
    </section>

  </div>
</template>
