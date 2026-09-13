<script lang="ts" setup>
/**
 * 组件总览：对齐 MasterGo 企业清爽版式
 * - 深色头图 + 两大区（Reborn 组件 / 社区移植）+ 区内按分类分块 + 白底示意卡片
 * - 系列与分类规则来自 useComponentsCatalog，与侧栏同源；组件在分类内按 slug 字母序，与侧栏一致
 */
import type { DocsCollectionItem } from '@nuxt/content'
import type { ComponentSeries } from '~/composables/useComponentsCatalog'
import { computed } from 'vue'

interface Props {
  routePath?: string
}

const { routePath = '/components' } = defineProps<Props>()

const { data: components } = await useAsyncData('tools', async () => {
  const docs = await queryCollection('docs').all() as DocsCollectionItem[]
  return docs.filter(item => item.path.startsWith(routePath) && item.path !== routePath)
})

/** 顶栏平台开关：总览只列出当前平台可用的组件（双端通用的两边都列） */
const { platform, isVisible } = useDocsPlatform()

/** 头图里的平台名，与侧栏说明行口径一致 */
const platformLabel = computed(() => (platform.value === 'uniapp' ? 'UniApp' : 'Web'))

/**
 * 从文档 path 推导英文展示名
 * /components/button/reborn-button → Button
 */
function englishNameFromPath(path: string) {
  const slug = path.split('/').filter(Boolean).pop() || ''
  const cleaned = slug.replace(/^reborn-/, '')
  return cleaned
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * 从 Nuxt Content minimark body 中提取 ComponentViewer 的 demo-file
 * 返回 PascalCase Demo 名（去掉 .vue）
 */
function demoFileFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const value = (body as { value?: unknown }).value
  if (!Array.isArray(value)) return undefined

  for (const node of value) {
    if (!Array.isArray(node) || node.length < 2) continue
    const [tag, attrs] = node as [unknown, Record<string, unknown>?]
    if (tag !== 'component-viewer' || !attrs || typeof attrs !== 'object') continue

    const demoFile = attrs['demo-file'] ?? attrs.demoFile
    if (typeof demoFile !== 'string' || !demoFile) continue
    return demoFile.replace(/\.vue$/i, '')
  }

  return undefined
}

/**
 * 推导总览缩略组件名
 * 优先 frontmatter overviewDemo；否则由 XxxDemo → XxxOverview
 */
function overviewNameFromItem(item: DocsCollectionItem): string | undefined {
  const explicit = (item as { overviewDemo?: string }).overviewDemo?.trim()
  if (explicit) return explicit.replace(/\.vue$/i, '')

  const demoFile = demoFileFromBody((item as { body?: unknown }).body)
  if (!demoFile) return undefined

  // RebornButtonDemo → RebornButtonOverview
  if (demoFile.endsWith('Demo')) {
    return `${demoFile.slice(0, -4)}Overview`
  }
  return `${demoFile}Overview`
}

interface OverviewItem {
  id: string
  path: string
  title: string
  description?: string
  /** 所属系列：Reborn 自研 / 社区移植 */
  series: ComponentSeries
  category: string
  englishName: string
  /** 总览缩略组件名，如 RebornButtonOverview；不存在时由子组件回退 Glyph */
  demoName?: string
  badge?: string
  tags?: string[]
}

/** 分类内的排序键：slug（componentId）字母序，与侧栏一致 */
function slugOf(path: string) {
  return path.split('/').filter(Boolean).pop() || ''
}

const overviewItems = computed<OverviewItem[]>(() => {
  if (!components.value) return []
  return components.value
    .filter(item => isVisible((item as { platform?: string }).platform))
    .map((item) => {
      const meta = item as { category?: string, series?: string, badge?: string, tags?: string[] }
      return {
        id: item.id,
        path: item.path,
        title: item.title || englishNameFromPath(item.path),
        description: item.description,
        series: resolveSeries(item.path, meta.series),
        category: normalizeCategory(meta.category),
        englishName: englishNameFromPath(item.path),
        demoName: overviewNameFromItem(item),
        badge: meta.badge,
        tags: meta.tags,
      }
    })
    .sort((a, b) => slugOf(a.path).localeCompare(slugOf(b.path)))
})

/** 两大区 → 分类 → 组件；空系列不出现（如 UniApp 档下没有社区移植组件时只剩 Reborn 区） */
const seriesSections = computed(() =>
  groupBySeriesAndCategory(overviewItems.value, item => ({ series: item.series, category: item.category })),
)

const totalCount = computed(() => overviewItems.value.length)

/** 头图里的系列计数文案，如「Reborn 组件 80 · 社区移植 73」 */
const seriesSummary = computed(() =>
  seriesSections.value.map(section => `${section.title} ${section.count}`).join(' · '),
)
</script>

<template>
  <div class="components-overview relative w-full mt-10">
    <!-- 深色头图：对齐稿面 #1E2E3E -->
    <header class="overview-hero rounded-xl px-6 py-10 sm:px-10 sm:py-12">
      <h1 class="text-2xl font-medium tracking-tight text-white sm:text-[32px] sm:leading-[38px]">
        组件总览
      </h1>
      <p class="mt-4 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-[14px] sm:leading-[1.5]">
        Reborn UI 组件库提供 Web / UniApp 双端基础与扩展组件，覆盖按钮、表单、导航、反馈与特效等能力。
        使用前请先阅读入门指南；设计与实现持续迭代，欢迎在文档页反馈问题。
      </p>
      <p class="mt-3 text-xs text-white/55">
        {{ platformLabel }} 端共 <span class="font-medium text-white/80">{{ totalCount }}</span> 个组件 · {{ seriesSummary }} · 顶栏可切换平台
      </p>
    </header>

    <!-- 两大区：Reborn 组件 / 社区移植，锚点与侧栏虚拟节点的 path 对应 -->
    <div class="mt-10 flex flex-col gap-16 sm:mt-12 sm:gap-20">
      <section v-for="series in seriesSections" :id="`series-${series.id}`" :key="series.id" class="scroll-mt-24">
        <!-- 大区标题：名称 + 总数 + 一句说明，下加分隔线与分类区分层级 -->
        <div class="mb-8 border-b border-[#E5E6EB] pb-5 sm:mb-10 dark:border-white/10">
          <div class="flex items-center gap-4">
            <h2 class="text-default text-2xl font-medium tracking-tight sm:text-[32px] sm:leading-[38px]">
              {{ series.title }}
            </h2>
            <span
              class="overview-count inline-flex min-w-9 items-center justify-center rounded bg-[#F4F4F6] px-2 py-1 text-base font-medium text-[#3D3D3D] dark:bg-white/10 dark:text-neutral-200"
            >
              {{ series.count }}
            </span>
          </div>
          <p class="text-muted mt-2 text-sm">
            {{ series.description }}
          </p>
        </div>

        <!-- 区内分类分块 -->
        <div class="flex flex-col gap-12 sm:gap-14">
          <section
            v-for="section in series.categories" :id="`series-${series.id}-${section.name}`" :key="section.name"
            class="scroll-mt-24"
          >
            <div class="mb-5 flex items-center gap-3 sm:mb-6">
              <h3 class="text-default text-lg font-medium tracking-tight sm:text-[22px] sm:leading-[30px]">
                {{ section.name }}
              </h3>
              <span
                class="overview-count inline-flex min-w-8 items-center justify-center rounded bg-[#F4F4F6] px-1.5 py-0.5 text-sm font-medium text-[#3D3D3D] dark:bg-white/10 dark:text-neutral-200"
              >
                {{ section.items.length }}
              </span>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
              <NuxtLink
                v-for="item in section.items" :key="item.id" :to="item.path"
                class="overview-card group relative flex flex-col overflow-hidden rounded-lg border border-[#E5E6EB] bg-white transition-colors hover:border-primary/40 hover:bg-[#FAFBFC] dark:border-white/10 dark:bg-neutral-900 dark:hover:border-primary/40 dark:hover:bg-neutral-900/80"
              >
                <!-- 标题栏：稿面顶栏浅底 + 居中标题 -->
                <div
                  class="overview-card-head relative flex h-14 shrink-0 items-center justify-center bg-[rgba(1,27,70,0.04)] px-4 sm:h-16 dark:bg-white/[0.04]"
                >
                  <div class="min-w-0 px-8 text-center">
                    <div class="truncate text-[15px] font-medium text-[#202229] dark:text-neutral-100 sm:text-base">
                      {{ item.title }}
                      <span
                        v-if="item.englishName && item.englishName !== item.title"
                        class="ml-1.5 font-normal text-[#86909C] dark:text-neutral-400"
                      >{{ item.englishName }}</span>
                    </div>
                  </div>
                  <UBadge
                    v-if="item.badge" class="absolute top-3 right-3" variant="subtle" size="sm"
                    :color="item.badge?.toLowerCase() === 'new' ? 'success' : 'warning'" :label="item.badge"
                  />
                </div>

                <!-- Overview 缩略预览（视口懒加载；未补齐时回退几何示意） -->
                <div class="overview-card-preview relative min-h-[180px] flex-1 overflow-hidden sm:min-h-[220px]">
                  <ComponentOverviewDemo :demo-name="item.demoName" :category="item.category" />
                </div>
              </NuxtLink>
            </div>
          </section>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* 头图固定稿面色，不随主题反相，保证对比度 */
.overview-hero {
  background: #1e2e3e;
}
</style>
