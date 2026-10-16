<script lang="ts" setup>
/**
 * 组件总览
 * - 头图：浅色舞台卡片，点阵、漂移光晕与跟随鼠标的聚光 / 描边 / 标题着色，参考 prodclub.xyz 的资源头图；
 *   中部是 3D 自行车（OverviewBike），指针靠近解体、离开合体，上下移动调整俯仰
 * - 两大区（Reborn 组件 / 社区移植）+ 区内按分类分块 + 卡片网格；卡片悬停时边框与底色跟随鼠标泛光
 * - 系列与分类规则来自 useComponentsCatalog，与侧栏同源；组件在分类内按 slug 字母序，与侧栏一致
 */
import type { DocsCollectionItem } from '@nuxt/content'
import type { ComponentSeries } from '~/composables/useComponentsCatalog'
import type { ComponentPlatform } from '~/composables/useDocsPlatform'
import { computed, onBeforeUnmount, ref } from 'vue'
import ComponentsScrollBackground from './ComponentsScrollBackground.vue'

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
  /** 组件可用平台，缺省视为仅 Web（与侧栏筛选口径一致） */
  platform: ComponentPlatform
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
      const meta = item as { category?: string, series?: string, badge?: string, tags?: string[], platform?: string }
      return {
        id: item.id,
        path: item.path,
        title: item.title || englishNameFromPath(item.path),
        description: item.description,
        series: resolveSeries(item.path, meta.series),
        category: normalizeCategory(meta.category),
        platform: meta.platform === 'uniapp' || meta.platform === 'both' ? meta.platform : 'web',
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

/** 卡片平台标签文案 */
const PLATFORM_TEXT: Record<ComponentPlatform, string> = {
  web: 'Web',
  uniapp: 'UniApp',
  both: 'Web · UniApp',
}

/** 标题已含英文名（如「Badge 徽章」）时不再重复追加 */
function showEnglishName(item: OverviewItem) {
  return !!item.englishName && !item.title.toLowerCase().includes(item.englishName.toLowerCase())
}

/**
 * 头图光照：鼠标位置写进 --lx / --ly，--lit 控制聚光、亮点、描边与标题着色的显隐；
 * --ox / --oy 是标题相对头图的偏移，标题着色层据此换算到自身坐标。只响应鼠标，触屏不点亮。
 */
const heroRef = ref<HTMLElement | null>(null)
const heroTitleRef = ref<HTMLElement | null>(null)
let heroFrame = 0

function onHeroMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  const { clientX, clientY } = event
  cancelAnimationFrame(heroFrame)
  heroFrame = requestAnimationFrame(() => {
    const hero = heroRef.value
    if (!hero) return
    const rect = hero.getBoundingClientRect()
    hero.style.setProperty('--lx', `${clientX - rect.left}px`)
    hero.style.setProperty('--ly', `${clientY - rect.top}px`)
    const title = heroTitleRef.value?.getBoundingClientRect()
    if (title) {
      hero.style.setProperty('--ox', `${title.left - rect.left}px`)
      hero.style.setProperty('--oy', `${title.top - rect.top}px`)
    }
    hero.style.setProperty('--lit', '1')
  })
}

function onHeroLeave() {
  cancelAnimationFrame(heroFrame)
  heroRef.value?.style.setProperty('--lit', '0')
}

/** 卡片泛光：在网格上统一监听，把鼠标相对卡片的位置写进该卡片的 --mx / --my */
function onCardMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  const card = (event.target as HTMLElement | null)?.closest<HTMLElement>('.overview-card')
  if (!card) return
  const rect = card.getBoundingClientRect()
  card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  card.style.setProperty('--my', `${event.clientY - rect.top}px`)
}

onBeforeUnmount(() => cancelAnimationFrame(heroFrame))
</script>

<template>
  <div class="components-overview relative isolate w-full mt-10">
    <ComponentsScrollBackground />
    <!-- 头图：浅色舞台卡片 + 点阵与光照层，文字区在上层 -->
    <section
      ref="heroRef" aria-labelledby="components-hero-title" class="overview-hero relative isolate overflow-hidden"
      @pointermove.passive="onHeroMove" @pointerleave="onHeroLeave"
    >
      <div aria-hidden="true" class="hero-rim" />
      <div aria-hidden="true" class="hero-top-line" />
      <div aria-hidden="true" class="pointer-events-none absolute inset-0">
        <div class="hero-glow hero-glow-a" />
        <div class="hero-glow hero-glow-b" />
      </div>
      <div aria-hidden="true" class="pointer-events-none absolute inset-0">
        <div class="hero-spot" />
        <div class="hero-dots" />
        <div class="hero-dots-lit" />
      </div>

      <div class="relative z-20 grid items-center gap-8 px-6 py-9 sm:px-9 sm:py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-11 lg:py-12">
        <div class="relative z-10 min-w-0">
          <h1 id="components-hero-title" class="hero-title">
            <span ref="heroTitleRef" class="relative inline-block">
              组件总览<br><span class="hero-title-accent">Reborn UI</span> 全部组件
              <!-- 着色层：同一段文字换成主色，只在鼠标附近露出 -->
              <span aria-hidden="true" class="hero-ink-lit absolute inset-0 select-none">
                组件总览<br><span class="hero-title-accent">Reborn UI</span> 全部组件
              </span>
            </span>
          </h1>
          <p class="hero-subtitle text-muted mt-4 max-w-[46ch]">
            Web / UniApp 双端基础与扩展组件，覆盖按钮、表单、导航、反馈与特效；设计与实现持续迭代，欢迎在文档页反馈问题。
          </p>
          <div class="mt-6">
            <NuxtLink to="/getting-started" class="hero-cta">
              <span aria-hidden="true" class="hero-cta-disc">
                <UIcon name="i-lucide-book-open" class="size-4" />
              </span>
              <span class="hero-cta-label">先读入门指南</span>
              <span aria-hidden="true" class="hero-cta-tail">
                <UIcon name="i-lucide-arrow-right" class="size-3.5" />
              </span>
            </NuxtLink>
          </div>
          <!-- 窄屏没有右侧计数区，计数并入正文 -->
          <p class="text-muted mt-5 text-xs lg:hidden">
            {{ platformLabel }} 端共 <span class="text-default font-medium">{{ totalCount }}</span> 个组件 · {{ seriesSummary }} · 顶栏可切换平台
          </p>
        </div>

        <!-- 右侧：3D 自行车 + 系列锚点 + 组件总数 -->
        <div class="relative hidden items-center gap-12 self-stretch lg:flex xl:gap-16">
          <!--
            自行车舞台上下越过网格的 lg:py-12（3rem），占满头图高度；解体时镜头拉远，散开的零件完整留在头图里。
            只在 xl 及以上显示：lg 档右侧区左移后会压到正文。指针在整个头图上移动都驱动解体与俯仰。
            左侧文字区与右侧锚点、总数、署名都是 z-10，舞台 z-0：画布比舞台宽，散开的零件会伸到这些文字附近，从下方穿过而不是盖住文字
          -->
          <OverviewBike
            :trigger="heroRef"
            class="pointer-events-none absolute right-full -top-12 -bottom-12 z-0 mr-12 hidden aspect-[3/2] xl:block"
          />
          <!-- 模型授权 CC BY-SA 4.0 要求署名 -->
          <a
            href="https://sketchfab.com/3d-models/carbon-frame-bike-398999b3360b4e6997a9aae253d6acbd"
            target="_blank" rel="noopener" class="hero-model-credit absolute right-0 -bottom-9 z-10 hidden xl:block"
          >自行车模型 © Robert Schweier &amp; prefrontal cortex · CC BY-SA 4.0</a>
          <nav aria-label="组件系列" class="hero-signature relative z-10">
            <a v-for="series in seriesSections" :key="series.id" :href="`#series-${series.id}`" class="hero-signature-item">
              <span class="hero-signature-title">{{ series.title }}</span>
              <span class="hero-signature-copy">{{ series.count }} 个组件</span>
            </a>
          </nav>
          <div class="relative z-10 text-center">
            <p class="hero-wordmark">
              {{ totalCount }}
            </p>
            <p class="hero-brand-tagline">
              {{ platformLabel }} 端组件
            </p>
            <p class="hero-brand-credit">
              顶栏可切换平台
            </p>
          </div>
        </div>
      </div>
    </section>

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

            <div class="overview-grid grid gap-4" @pointermove.passive="onCardMove">
              <NuxtLink
                v-for="item in section.items" :key="item.id" :to="item.path"
                class="overview-card group relative isolate flex h-full min-w-0 flex-col rounded-xl p-[18px]"
              >
                <!-- 悬停泛光：底色一层 + 描边一层，位置取 --mx / --my -->
                <span aria-hidden="true" class="card-light card-light-fill" />
                <span aria-hidden="true" class="card-light card-light-rim" />

                <!-- 标题行：中文名 + 英文名，右侧徽标 -->
                <div class="flex items-center justify-between gap-3">
                  <div class="flex min-w-0 items-baseline gap-2">
                    <span class="text-highlighted truncate text-base font-medium">{{ item.title }}</span>
                    <span v-if="showEnglishName(item)" class="text-dimmed truncate text-sm">{{ item.englishName }}</span>
                  </div>
                  <span
                    v-if="item.badge" class="card-pill shrink-0 font-medium"
                    :class="item.badge.toLowerCase() === 'new' ? 'card-pill-success' : 'card-pill-warning'"
                  >{{ item.badge }}</span>
                </div>

                <!-- 平台标签 -->
                <div class="mt-2.5 flex min-w-0 items-center gap-1.5">
                  <span class="card-pill">
                    <span class="text-muted">平台</span>
                    <span class="text-default font-medium">{{ PLATFORM_TEXT[item.platform] }}</span>
                  </span>
                </div>

                <!-- Overview 缩略预览（视口懒加载；未补齐时回退几何示意） -->
                <div class="overview-card-preview relative mt-4 flex-1 overflow-hidden rounded-lg">
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
/*
 * 中性色取 Nuxt UI 语义变量；主色 / 成功 / 警告取 Reborn 令牌（--color-*），
 * 站点的 --ui-primary 固定为黑白，只有 --color-primary 跟随顶栏主题色选择器。明暗由 .dark 切换。
 * 色值与比例参考 prodclub.xyz 的头图（hero-stage）与资源卡片（hall-card）。
 */
.components-overview {
  --ov-card: var(--ui-bg);
  --ov-line: color-mix(in oklab, var(--ui-text-highlighted) 7%, transparent);
  --ov-line-strong: color-mix(in oklab, var(--ui-text-highlighted) 16%, transparent);
  --ov-shadow: 0 1px 1px #10201608, 0 2px 6px -2px #1020160d;
  --ov-shadow-raised: 0 1px 2px #0000000d;
  --ov-well: color-mix(in oklab, var(--ui-text-highlighted) 2.5%, transparent);
  --ov-well-line: color-mix(in oklab, var(--ui-text-highlighted) 5%, transparent);
  --ov-ink: var(--ui-text-highlighted);
  --ov-accent: color-mix(in oklab, var(--color-primary) 70%, var(--ov-ink));
  --ov-lit-ink: var(--color-primary);
  --ov-glow: color-mix(in oklab, var(--color-primary) 14%, transparent);
  --ov-glow-soft: color-mix(in oklab, var(--color-primary) 9%, transparent);
  --ov-spot: color-mix(in oklab, var(--color-primary) 13%, transparent);
  --ov-dot: color-mix(in oklab, var(--ui-text-highlighted) 10%, transparent);
  --ov-dot-lit: color-mix(in oklab, var(--color-primary) 90%, transparent);
  --ov-rim: color-mix(in oklab, var(--color-primary) 85%, transparent);
  --ov-top-line: rgb(255 255 255 / 0.7);
  /* 胶囊文字：浅色下 green-6 / orange-6 对白底对比度不足（约 1.6:1），取更深的阶 */
  --ov-success: color-mix(in oklab, var(--color-green-8) 82%, black);
  --ov-warning: var(--color-orange-8);
  --ov-ease: cubic-bezier(0.22, 1, 0.36, 1);
  /* 回弹曲线：按下缩小后弹回；不支持 linear() 的浏览器整条 transition 失效，退回前一条声明 */
  --ov-spring: linear(0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017 19.4%, 1.061 22.1%, 1.072 24.3%, 1.066 27.4%, 1.036 32.8%, 1.009 39.6%, 0.996 46.9%, 0.993 53.8%, 0.998 69.8%, 1);
}

.dark .components-overview {
  --ov-card: color-mix(in oklab, var(--ui-text-highlighted) 3.5%, var(--ui-bg));
  --ov-line-strong: color-mix(in oklab, var(--ui-text-highlighted) 24%, transparent);
  --ov-shadow: inset 0 1px 0 #ffffff0d, 0 1px 2px #00000059;
  --ov-shadow-raised: 0 1px 2px #0006;
  --ov-well: color-mix(in oklab, var(--ui-text-highlighted) 3%, transparent);
  --ov-well-line: color-mix(in oklab, var(--ui-text-highlighted) 6%, transparent);
  --ov-accent: color-mix(in oklab, var(--color-primary) 75%, var(--ov-ink));
  --ov-lit-ink: color-mix(in oklab, var(--color-primary) 70%, #fff);
  --ov-glow: color-mix(in oklab, var(--color-primary) 18%, transparent);
  --ov-glow-soft: color-mix(in oklab, var(--color-primary) 12%, transparent);
  --ov-spot: color-mix(in oklab, var(--color-primary) 16%, transparent);
  --ov-dot: color-mix(in oklab, var(--ui-text-highlighted) 12%, transparent);
  --ov-dot-lit: color-mix(in oklab, color-mix(in oklab, var(--color-primary) 80%, #fff) 95%, transparent);
  --ov-rim: color-mix(in oklab, var(--color-primary) 90%, transparent);
  --ov-top-line: rgb(255 255 255 / 0.08);
  --ov-success: var(--color-success);
  --ov-warning: var(--color-warning);
}

/* ─── 头图 ─── */
.overview-hero {
  --lx: -1000px;
  --ly: -1000px;
  --lit: 0;
  --ox: 0px;
  --oy: 0px;
  border: 1px solid color-mix(in oklab, var(--ui-text-highlighted) 5%, transparent);
  border-radius: 1.25rem;
  background-color: var(--ov-card);
  box-shadow: var(--ov-shadow);
}

/* 顶边高光线 */
.hero-top-line {
  pointer-events: none;
  position: absolute;
  inset-inline: 2rem;
  top: 0;
  z-index: 30;
  height: 1px;
  background-image: linear-gradient(to right, transparent, var(--ov-top-line), transparent);
}

/* 两团缓慢漂移的主色光晕 */
.hero-glow {
  position: absolute;
  border-radius: 9999px;
}

.hero-glow-a {
  top: -28%;
  right: 6%;
  width: 52%;
  height: 150%;
  background-image: radial-gradient(ellipse at center, var(--ov-glow), transparent 68%);
  animation: hero-drift-a 19s ease-in-out infinite;
}

.hero-glow-b {
  bottom: -34%;
  left: 12%;
  width: 46%;
  height: 130%;
  background-image: radial-gradient(ellipse at center, var(--ov-glow-soft), transparent 70%);
  animation: hero-drift-b 26s ease-in-out infinite;
}

@keyframes hero-drift-a {
  0%,
  100% {
    transform: translate(0) scale(1);
  }
  50% {
    transform: translate(-9%, 10%) scale(1.1);
  }
}

@keyframes hero-drift-b {
  0%,
  100% {
    transform: translate(0) scale(1);
  }
  50% {
    transform: translate(12%, -8%) scale(0.92);
  }
}

/* 点阵：从左侧文字区之后渐显，避免压在标题上 */
.hero-dots,
.hero-dots-lit {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background-position: 9px 9px;
  background-size: 18px 18px;
}

.hero-dots {
  background-image: radial-gradient(circle, var(--ov-dot) 0.9px, transparent 1.4px);
  mask-image: linear-gradient(90deg, transparent 22%, #000 52%);
}

/* 鼠标附近的点阵换成主色亮点 */
.hero-dots-lit {
  background-image: radial-gradient(circle, var(--ov-dot-lit) 1.3px, transparent 1.8px);
  mask-image:
    radial-gradient(240px circle at var(--lx) var(--ly), #000, transparent 72%),
    linear-gradient(90deg, transparent 22%, #000 52%);
  mask-composite: intersect;
  opacity: var(--lit);
  transition: opacity 0.3s var(--ov-ease);
}

/* 跟随鼠标的聚光 */
.hero-spot {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background: radial-gradient(380px circle at var(--lx) var(--ly), var(--ov-spot), transparent 70%);
  opacity: var(--lit);
  transition: opacity 0.3s var(--ov-ease);
}

/* 跟随鼠标的描边高光：只保留 1px 边框环 */
.hero-rim {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 30;
  padding: 1px;
  border-radius: inherit;
  background: radial-gradient(260px circle at var(--lx) var(--ly), var(--ov-rim), transparent 72%);
  mask:
    linear-gradient(#000 0 0) content-box exclude,
    linear-gradient(#000 0 0);
  opacity: calc(var(--lit) * 0.72);
  transition: opacity 0.3s var(--ov-ease);
}

.hero-title {
  color: var(--ov-ink);
  font-size: clamp(1.9rem, 1.4rem + 1.95vw, 2.9rem);
  font-weight: 600;
  line-height: 1.16;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.hero-title-accent {
  color: var(--ov-accent);
  letter-spacing: -0.02em;
}

/* 标题着色层：坐标从头图换算到标题自身 */
.hero-ink-lit,
.hero-ink-lit .hero-title-accent {
  color: var(--ov-lit-ink);
}

.hero-ink-lit {
  pointer-events: none;
  mask-image: radial-gradient(160px circle at calc(var(--lx) - var(--ox)) calc(var(--ly) - var(--oy)), #000, transparent 72%);
  opacity: var(--lit);
  transition: opacity 0.3s var(--ov-ease);
}

.hero-subtitle {
  font-size: 15px;
  line-height: 1.6;
  text-wrap: balance;
}

/*
 * 自行车解体后零件会从头图文字下方穿过（窄一点的 xl 视口尤其明显），浅色下黑字压在黑色轮胎上看不清。
 * 给这些文字描一圈头图底色的光晕：底下没有零件时与底色融为一体看不出来，有零件时把字和零件隔开。
 */
@media (min-width: 1280px) {
  .hero-title,
  .hero-subtitle,
  .hero-signature,
  .hero-wordmark,
  .hero-brand-tagline,
  .hero-brand-credit {
    text-shadow:
      0 0 2px var(--ov-card),
      0 0 8px var(--ov-card),
      0 0 16px var(--ov-card);
  }
}

/* 入门指南胶囊按钮：主色圆片 + 文字 + 尾部箭头 */
.hero-cta {
  position: relative;
  display: inline-flex;
  height: 2.75rem;
  align-items: center;
  gap: 0.75rem;
  border-radius: 9999px;
  padding: 0.375rem;
  font-size: 13px;
  font-weight: 500;
  color: var(--ui-text-highlighted);
  background: color-mix(in oklab, var(--ov-card) 84%, transparent);
  backdrop-filter: blur(14px) saturate(1.5);
  box-shadow:
    inset 0 0 0 1px color-mix(in oklab, var(--ui-border) 90%, transparent),
    inset 0 1px 0 #ffffffbf,
    0 1px 2px #0000000a,
    0 12px 28px -16px #0000004d;
  transition:
    translate 0.32s var(--ov-ease),
    box-shadow 0.32s var(--ov-ease);
}

.dark .hero-cta {
  box-shadow:
    inset 0 0 0 1px color-mix(in oklab, var(--ui-text-highlighted) 12%, transparent),
    inset 0 1px 0 #ffffff12,
    0 12px 28px -16px #000000b3;
}

.hero-cta-disc {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 9999px;
  color: var(--color-inverted);
  background: radial-gradient(
    130% 130% at 30% 18%,
    color-mix(in oklab, var(--color-primary) 80%, white) 0%,
    var(--color-primary) 52%,
    color-mix(in oklab, var(--color-primary) 86%, black) 100%
  );
  box-shadow:
    inset 0 1px 0 #ffffff4d,
    inset 0 -1px 0 #00000014,
    0 3px 8px -3px color-mix(in oklab, var(--color-primary) 70%, transparent);
  transition: scale 0.42s var(--ov-ease);
  transition: scale 0.42s var(--ov-spring);
}

.hero-cta-label {
  letter-spacing: 0.01em;
}

.hero-cta-tail {
  display: inline-grid;
  height: 2rem;
  place-items: center;
  border-radius: 9999px;
  padding-inline: 0.7rem;
  color: var(--ui-text-muted);
  background: color-mix(in oklab, var(--ui-text-highlighted) 5%, transparent);
  transition: color 0.2s var(--ov-ease);
}

@media (hover: hover) and (pointer: fine) {
  .hero-cta:hover {
    translate: 0 -1px;
    box-shadow:
      inset 0 0 0 1px var(--ov-line-strong),
      inset 0 1px 0 #ffffffbf,
      0 1px 2px #0000000a,
      0 16px 32px -16px #00000057;
  }

  .dark .hero-cta:hover {
    box-shadow:
      inset 0 0 0 1px color-mix(in oklab, var(--ui-text-highlighted) 20%, transparent),
      inset 0 1px 0 #ffffff17,
      0 16px 32px -16px #000c;
  }

  .hero-cta:hover .hero-cta-disc {
    scale: 1.06;
  }

  .hero-cta:hover .hero-cta-tail {
    color: var(--ui-text-highlighted);
  }
}

.hero-cta:active {
  translate: 0 0;
}

.hero-cta:active .hero-cta-disc {
  scale: 0.96;
  transition-duration: 0.12s;
}

.hero-cta:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 右侧系列锚点：竖线 + 小号字距标题 */
.hero-signature {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  border-left: 1px solid var(--ov-line-strong);
  padding-left: 0.875rem;
}

.hero-signature-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.hero-signature-title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.14em;
  white-space: nowrap;
  color: var(--ui-text-highlighted);
  transition: color 0.2s var(--ov-ease);
}

.hero-signature-copy {
  font-size: 11px;
  line-height: 1.4;
  letter-spacing: 0.08em;
  color: var(--ui-text-dimmed);
}

.hero-signature-item:hover .hero-signature-title {
  color: var(--color-primary);
}

.hero-model-credit {
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
  color: var(--ui-text-dimmed);
  transition: color 0.2s var(--ov-ease);
}

.hero-model-credit:hover {
  color: var(--ui-text-muted);
}

.hero-wordmark {
  font-size: 3.25rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--ov-ink);
}

.hero-brand-tagline {
  margin-top: 0.875rem;
  font-size: 13px;
  line-height: 1.4;
  letter-spacing: 0.08em;
  white-space: nowrap;
  color: var(--ui-text-muted);
}

.hero-brand-credit {
  margin-top: 0.375rem;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.16em;
  white-space: nowrap;
  color: var(--ui-text-dimmed);
}

/* ─── 卡片网格 ─── */
.overview-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
}

.overview-card {
  border: 1px solid var(--ov-line);
  background-color: var(--ov-card);
  box-shadow: var(--ov-shadow);
  transition:
    border-color 0.14s var(--ov-ease),
    box-shadow 0.18s var(--ov-ease),
    scale 0.6s var(--ov-ease);
  transition:
    border-color 0.14s var(--ov-ease),
    box-shadow 0.18s var(--ov-ease),
    scale 0.6s var(--ov-spring);
}

.overview-card:hover {
  border-color: var(--ov-line-strong);
  box-shadow: var(--ov-shadow-raised);
}

.overview-card:active {
  scale: 0.975;
  box-shadow: none;
  transition-duration: 0.1s;
}

.overview-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 卡片内的小胶囊：平台、徽标 */
.card-pill {
  display: inline-flex;
  height: 1.25rem;
  align-items: center;
  gap: 0.25rem;
  border-radius: 9999px;
  padding-inline: 0.5rem;
  font-size: 11px;
  white-space: nowrap;
  box-shadow: inset 0 0 0 1px var(--ui-border);
}

.card-pill-success {
  padding-inline: 7px;
  color: var(--ov-success);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ov-success) 28%, transparent);
}

.card-pill-warning {
  padding-inline: 7px;
  color: var(--ov-warning);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ov-warning) 28%, transparent);
}

/* 预览框：内嵌浅底，与卡片本体分层 */
.overview-card-preview {
  background-color: var(--ov-well);
  box-shadow: inset 0 0 0 1px var(--ov-well-line);
}

/* 悬停泛光：只在精确指针设备上出现 */
.card-light {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  .card-light {
    pointer-events: none;
    position: absolute;
    inset: -1px;
    display: block;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.24s var(--ov-ease);
  }

  .overview-card:hover > .card-light {
    opacity: 1;
    transition-duration: 90ms;
  }

  .card-light-fill {
    z-index: -1;
    background: radial-gradient(
      320px circle at var(--mx, 50%) var(--my, 50%),
      color-mix(in oklab, var(--color-primary) 6%, transparent),
      transparent 70%
    );
  }

  .card-light-rim {
    padding: 1px;
    background: radial-gradient(
      180px circle at var(--mx, 50%) var(--my, 50%),
      color-mix(in oklab, var(--color-primary) 70%, transparent),
      transparent 72%
    );
    mask:
      linear-gradient(#000 0 0) content-box exclude,
      linear-gradient(#000 0 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-glow-a,
  .hero-glow-b {
    animation: none;
  }

  .card-light,
  .overview-card {
    transition: none;
  }

  .overview-card:active {
    scale: 1;
  }
}
</style>
