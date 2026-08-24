<script lang="ts" setup>
/**
 * 组件总览：对齐 MasterGo 企业清爽版式
 * - 深色头图 + 分类分块 + 白底示意卡片
 * - 保留站内全部组件，按现有 category 分组（不强制改成稿面六类）
 */
import type { DocsCollectionItem } from '@nuxt/content'
import { computed } from 'vue'

interface Props {
  routePath?: string
}

const { routePath = '/components' } = defineProps<Props>()

const { data: components } = await useAsyncData('tools', async () => {
  const docs = await queryCollection('docs').all() as DocsCollectionItem[]
  return docs.filter(item => item.path.startsWith(routePath) && item.path !== routePath)
})

/** 分类别名规范化 */
const CATEGORY_ALIASES: Record<string, string> = {
  '输入与表单': '表单与输入',
}

/** 分类展示顺序：贴近稿面语义，未知类追加在后 */
const CATEGORY_ORDER = [
  '按钮',
  '通用',
  '布局',
  '导航',
  '表单与输入',
  '数据',
  '反馈',
  '卡片',
  '文字动画',
  '特效',
  '设备模型',
  '杂项',
]

function normalizeCategory(raw?: string | null) {
  const name = (raw || '杂项').trim() || '杂项'
  return CATEGORY_ALIASES[name] ?? name
}

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
  category: string
  englishName: string
  /** 总览缩略组件名，如 RebornButtonOverview；不存在时由子组件回退 Glyph */
  demoName?: string
  badge?: string
  tags?: string[]
}

const overviewItems = computed<OverviewItem[]>(() => {
  if (!components.value) return []
  return components.value.map((item) => {
    const category = normalizeCategory((item as { category?: string }).category)
    return {
      id: item.id,
      path: item.path,
      title: item.title || englishNameFromPath(item.path),
      description: item.description,
      category,
      englishName: englishNameFromPath(item.path),
      demoName: overviewNameFromItem(item),
      badge: (item as { badge?: string }).badge,
      tags: (item as { tags?: string[] }).tags,
    }
  })
})

const groupedSections = computed(() => {
  const map = new Map<string, OverviewItem[]>()
  for (const item of overviewItems.value) {
    const list = map.get(item.category) ?? []
    list.push(item)
    map.set(item.category, list)
  }

  for (const list of map.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
  }

  const known = CATEGORY_ORDER
    .filter(name => map.has(name))
    .map(name => ({
      name,
      count: map.get(name)!.length,
      items: map.get(name)!,
    }))

  const rest = [...map.keys()]
    .filter(name => !CATEGORY_ORDER.includes(name))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map(name => ({
      name,
      count: map.get(name)!.length,
      items: map.get(name)!,
    }))

  return [...known, ...rest]
})

const totalCount = computed(() => overviewItems.value.length)
</script>

<template>
  <div class="components-overview relative w-full">
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
        共 <span class="font-medium text-white/80">{{ totalCount }}</span> 个组件 · {{ groupedSections.length }} 个分类
      </p>
    </header>

    <!-- 分类分块 -->
    <div class="mt-10 flex flex-col gap-12 sm:mt-12 sm:gap-14">
      <section
        v-for="section in groupedSections"
        :id="`cat-${section.name}`"
        :key="section.name"
        class="scroll-mt-24"
      >
        <div class="mb-5 flex items-center gap-4 sm:mb-6">
          <h2 class="text-default text-xl font-medium tracking-tight sm:text-[28px] sm:leading-[34px]">
            {{ section.name }}
          </h2>
          <span class="overview-count inline-flex min-w-9 items-center justify-center rounded bg-[#F4F4F6] px-2 py-1 text-base font-medium text-[#3D3D3D] dark:bg-white/10 dark:text-neutral-200">
            {{ section.count }}
          </span>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
          <NuxtLink
            v-for="item in section.items"
            :key="item.id"
            :to="item.path"
            class="overview-card group relative flex flex-col overflow-hidden rounded-lg border border-[#E5E6EB] bg-white transition-colors hover:border-primary/40 hover:bg-[#FAFBFC] dark:border-white/10 dark:bg-neutral-900 dark:hover:border-primary/40 dark:hover:bg-neutral-900/80"
          >
            <!-- 标题栏：稿面顶栏浅底 + 居中标题 -->
            <div class="overview-card-head relative flex h-14 shrink-0 items-center justify-center bg-[rgba(1,27,70,0.04)] px-4 sm:h-16 dark:bg-white/[0.04]">
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
                v-if="item.badge"
                class="absolute top-3 right-3"
                variant="subtle"
                size="sm"
                :color="item.badge?.toLowerCase() === 'new' ? 'success' : 'warning'"
                :label="item.badge"
              />
            </div>

            <!-- Overview 缩略预览（视口懒加载；未补齐时回退几何示意） -->
            <div class="overview-card-preview relative min-h-[180px] flex-1 overflow-hidden sm:min-h-[220px]">
              <ComponentOverviewDemo
                :demo-name="item.demoName"
                :category="item.category"
              />
            </div>
          </NuxtLink>
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
