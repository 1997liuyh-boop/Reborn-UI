<script setup lang="ts">
/**
 * 组件总览卡片内的缩略预览
 * - 优先挂载独立 XxxOverview；未注册则立刻回退分类几何示意
 * - 已注册的 Overview 进入视口后才挂载，避免大量同时渲染
 * - 预览区禁交互，点击整卡仍跳转详情
 */
import type { Component } from 'vue'
import { camelize, capitalize, getCurrentInstance } from 'vue'

interface Props {
  /** PascalCase Overview 组件名，如 RebornButtonOverview */
  demoName?: string
  /** 无 Overview 时的分类示意回退 */
  category?: string
}

const props = withDefaults(defineProps<Props>(), {
  category: '杂项',
})

const rootRef = ref<HTMLElement | null>(null)
/** 是否已确认可尝试挂载 Overview（进入视口） */
const visible = ref(false)
/** null=尚未解析；false=确认无此组件；Component=可挂载 */
const resolvedDemo = shallowRef<Component | false | null>(null)

/**
 * 全局组件注册表（nuxt.config 中 components 为 global，Overview 都注册在这里）。
 * 不用 resolveComponent：它找不到时会在开发环境打印「Failed to resolve component」警告，
 * 而大多数组件本就没有 Overview、按设计回退 Glyph，总览页会因此刷出一屏无意义的警告。
 */
const globalComponents = getCurrentInstance()?.appContext.components ?? {}

function resolveOverview(): Component | false {
  const name = props.demoName
  if (!name) return false
  // 与 Vue 解析组件名的顺序一致：原名 → camelCase → PascalCase
  const camelName = camelize(name)
  return globalComponents[name] ?? globalComponents[camelName] ?? globalComponents[capitalize(camelName)] ?? false
}

function isNearViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  const margin = 240
  const vh = window.innerHeight || document.documentElement.clientHeight || 0
  const vw = window.innerWidth || document.documentElement.clientWidth || 0
  if (vh === 0 || vw === 0) return true
  return rect.bottom >= -margin && rect.top <= vh + margin
}

function markVisible() {
  if (visible.value) return
  visible.value = true
  if (resolvedDemo.value === null) {
    resolvedDemo.value = resolveOverview()
  }
}

onMounted(() => {
  // 先解析：未注册 Overview 立刻 Glyph，避免 100+ 卡片空转「加载中」
  const resolved = resolveOverview()
  resolvedDemo.value = resolved
  if (resolved === false) return

  const el = rootRef.value
  if (!el) {
    markVisible()
    return
  }

  if (typeof IntersectionObserver === 'undefined' || isNearViewport(el)) {
    markVisible()
    return
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        markVisible()
        io.disconnect()
      }
    },
    { rootMargin: '240px 0px' },
  )
  io.observe(el)

  // 部分预览环境 IO 不回调：滚动时用几何再判一次
  const onScrollCheck = () => {
    if (visible.value) {
      window.removeEventListener('scroll', onScrollCheck, true)
      return
    }
    if (isNearViewport(el)) {
      markVisible()
      io.disconnect()
      window.removeEventListener('scroll', onScrollCheck, true)
    }
  }
  window.addEventListener('scroll', onScrollCheck, true)

  onBeforeUnmount(() => {
    io.disconnect()
    window.removeEventListener('scroll', onScrollCheck, true)
  })
})
</script>

<template>
  <div
    ref="rootRef"
    class="overview-demo relative flex h-full min-h-[180px] w-full items-center justify-center overflow-hidden sm:min-h-[220px]"
  >
    <!-- 客户端：有派生名时先解析，再决定 Overview / Glyph / 加载中 -->
    <ClientOnly v-if="demoName">
      <!-- 确认无 Overview：几何示意 -->
      <ComponentPreviewGlyph
        v-if="resolvedDemo === false"
        :category="category"
      />
      <!-- 有 Overview 且已进入视口 -->
      <div
        v-else-if="resolvedDemo && visible"
        class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden p-6"
        aria-hidden="true"
      >
        <component :is="resolvedDemo" />
      </div>
      <!-- 有 Overview 但尚未进入视口 / 仍在解析 -->
      <div
        v-else
        class="text-muted flex items-center justify-center gap-2 text-xs"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-4 animate-spin"
        />
        <span>预览加载中</span>
      </div>
      <template #fallback>
        <div class="text-muted flex items-center justify-center gap-2 text-xs">
          <UIcon
            name="i-lucide-loader-circle"
            class="size-4 animate-spin"
          />
          <span>预览加载中</span>
        </div>
      </template>
    </ClientOnly>

    <!-- 无派生名：分类几何示意 -->
    <ComponentPreviewGlyph
      v-else
      :category="category"
    />
  </div>
</template>
