<script lang="ts" setup>
/**
 * 组件总览
 * - 整页背景是随滚动逐帧定位的「自由落体」视频（ComponentsScrollBackground）；
 * - 开场：大标题先落下，说明卡片从左侧、两个系列的数量卡片从右侧飞入；
 * - 往下：各大区标题、分类标题与组件卡片进入视口时，按所在半屏从左或右飞入（v-fly-in）；
 * - 两大区（Reborn 组件 / 社区移植）+ 区内按分类分块 + 卡片网格（xl 起一行 4 张）；
 *   缩略预览在上、名称与平台在下；卡片悬停时缩略预览向下铺满整张卡片，描边跟随鼠标泛光
 * - 系列与分类规则来自 componentsCatalog，与侧栏同源；组件在分类内按 slug 字母序，与侧栏一致
 */
import type { DocsCollectionItem } from '@nuxt/content'
import type { Directive } from 'vue'
import type { ComponentPlatform } from '~/composables/useDocsPlatform'
import type { ComponentSeries } from '~/utils/componentsCatalog'
import { computed } from 'vue'
import { vFlyIn } from '~/lib/flyIn'
import { onceNearViewport } from '~/lib/nearViewport'
import ComponentsScrollBackground from './ComponentsScrollBackground.vue'

interface Props {
  routePath?: string
}

const { routePath = '/components' } = defineProps<Props>()

// 懒加载：客户端跳转时不再等数据就绪才切换页面（否则旧页面会一直停在屏幕上），
// 先渲染头图与卡片占位，数据到达后卡片分批替换占位；服务端渲染仍会等数据，首屏与 SEO 不受影响。
const { data: components } = useLazyAsyncData(() => `components-overview:${routePath}`, async () => {
  const prefix = `${routePath.replace(/\/$/, '')}/`
  // 只查组件分区：浏览器端的内容库查询会把命中的整篇文档（含正文 AST）读进内存
  const docs = await queryCollection('docs').where('path', 'LIKE', `${prefix}%`).all() as DocsCollectionItem[]
  // 正文只用于推导缩略图名称，避免把整站文档 AST 序列化进卡片 payload。
  return docs.filter(item => item.path.startsWith(prefix)).map(item => ({
    id: item.id, path: item.path, title: item.title, description: item.description,
    category: item.category, series: item.series, platform: item.platform,
    badge: item.badge, tags: item.tags, demoName: overviewNameFromItem(item),
  }))
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
  /** 缩略预览右上角的标记图标，由 badge 映射而来；无对应图标的 badge 不显示 */
  badgeIcon?: BadgeIcon
  tags?: string[]
}

interface BadgeIcon {
  icon: string
  /** 图标本身没有文字，读屏靠它说明含义 */
  label: string
}

/**
 * frontmatter badge → 缩略预览右上角的标记图标（键为小写）。
 * lsicon 图标集没有 update 图标，Update 取语义最近的 refresh-filled（循环箭头），与 New 同为实心风格。
 */
const BADGE_ICONS: Record<string, BadgeIcon> = {
  new: { icon: 'lsicon:badge-new-filled', label: '新组件' },
  update: { icon: 'lsicon:refresh-filled', label: '近期更新' },
}

/** 分类内的排序键：slug（componentId）字母序，与侧栏一致 */
function slugOf(path: string) {
  return path.split('/').filter(Boolean).pop() || ''
}

const overviewItems = computed<OverviewItem[]>(() => {
  if (!components.value) return []
  return components.value
    .filter(item => isVisible((item as { platform?: string }).platform))
    .map((item): OverviewItem => {
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
        demoName: item.demoName,
        badge: meta.badge,
        badgeIcon: meta.badge ? BADGE_ICONS[meta.badge.toLowerCase()] : undefined,
        tags: meta.tags,
      }
    })
    .sort((a, b) => slugOf(a.path).localeCompare(slugOf(b.path)))
})

/** 两大区 → 分类 → 组件；空系列不出现（如 UniApp 档下没有社区移植组件时只剩 Reborn 区） */
const seriesSections = computed(() =>
  groupBySeriesAndCategory(overviewItems.value, item => ({ series: item.series, category: item.category })),
)

// 数据未到时显示占位符，不显示一个会跳变的 0
const totalCount = computed(() => (components.value ? overviewItems.value.length : '—'))

/* ── 按需渲染 ─────────────────────────────────────────────────────────── */

/**
 * 分类区块接近视口（上下 240px 余量）时才渲染真卡片，此前只放同尺寸的卡片占位。
 * 首屏被头图占满，下面 150+ 张卡片（每张含缩略预览）随滚动逐个分类加载，进入视口时再按之字形飞入；
 * 跳转进来时不必一次布局全部卡片，内存也只随浏览到的分类增长。
 * 服务端渲染与水合时全部直出，保证 HTML 完整（SEO、无脚本可读）且水合结果一致。
 */
const nuxtApp = useNuxtApp()
const progressive = import.meta.client && !nuxtApp.isHydrating
const revealedSections = shallowRef(new Set<string>())

function sectionKey(seriesId: string, name: string) {
  return `${seriesId}/${name}`
}

function isSectionRevealed(key: string) {
  return !progressive || revealedSections.value.has(key)
}

function revealSection(key: string) {
  if (revealedSections.value.has(key)) return
  revealedSections.value = new Set(revealedSections.value).add(key)
}

const nearStops = new WeakMap<HTMLElement, () => void>()

/** v-near="回调"：元素接近视口时调用一次 */
const vNear: Directive<HTMLElement, () => void> = {
  mounted(element, binding) {
    nearStops.set(element, onceNearViewport(element, binding.value))
  },
  unmounted(element) {
    nearStops.get(element)?.()
    nearStops.delete(element)
  },
}

/** 数据未到时的占位分组：两大区各一组，撑出与真实卡片相同的网格 */
const PLACEHOLDER_SECTIONS = [10, 10]

/** 头图右侧的系列数量卡片：数据未到时数量显示占位符；当前平台下没有组件的系列不出现 */
const heroSeries = computed(() =>
  ([
    { id: 'reborn', label: 'REBORN 组件' },
    { id: 'community', label: '社区组件' },
  ] as const)
    .map(series => ({ ...series, count: components.value ? overviewItems.value.filter(item => item.series === series.id).length : '—' as const }))
    .filter(series => series.count !== 0),
)

/** 卡片平台徽标：Web 用主色、UniApp 用成功色，双端通用的两枚都列 */
const PLATFORM_BADGES: Record<ComponentPlatform, { label: string, text: string, color: 'primary' | 'success' }[]> = {
  web: [{ label: 'WEB', text: 'Web', color: 'primary' }],
  uniapp: [{ label: 'UNIAPP', text: 'UniApp', color: 'success' }],
  both: [{ label: 'WEB', text: 'Web', color: 'primary' }, { label: 'UNIAPP', text: 'UniApp', color: 'success' }],
}

/** 标题已含英文名（如「Badge 徽章」）时不再重复追加 */
function showEnglishName(item: OverviewItem) {
  return !!item.englishName && !item.title.toLowerCase().includes(item.englishName.toLowerCase())
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


// 飞入元素的初始隐藏态依赖脚本解除，禁用脚本时直接显示
// Anton：描边大标题用的窄体字，与首页水印同一来源（首页只在自己的 hero 里加载，这里需自行引入）
useHead({
  noscript: [{ textContent: '<style>.fly-in{opacity:1!important;transform:none!important}</style>' }],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Anton&display=swap' },
  ],
})
</script>

<template>
  <div class="components-overview relative isolate w-full mt-10">
    <ComponentsScrollBackground />
    <!-- 开场：描边大标题落下，说明卡片从左、系列卡片从右飞入；高度随内容，不再占满首屏 -->
    <section aria-labelledby="components-hero-title" class="overview-hero">
      <h1 id="components-hero-title" class="flex flex-col items-center text-center">
        <span class="hero-line block text-sm tracking-[0.4em] text-gray-8">组件总览</span>
        <!-- 外层负责落下，内层负责漂移：两段动画写在同一元素上会互相覆盖 -->
        <span class="hero-line hero-line-b mt-1 block max-w-full">
          <span class="hero-outline block">COMPONENTS</span>
        </span>
      </h1>

      <div class="mx-auto mt-6 grid max-w-5xl gap-4 md:grid-cols-2 lg:mt-8">
        <div class="hero-card hero-card-left flex flex-col justify-between gap-6 p-6">
          <p class="text-base leading-relaxed text-gray-9 sm:text-lg sm:leading-relaxed">
            Web / UniApp 双端基础与扩展组件，覆盖按钮、表单、导航、反馈与特效；设计与实现持续迭代，欢迎在文档页反馈问题。
          </p>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
            <NuxtLink to="/getting-started" class="hero-cta">
              <span aria-hidden="true" class="hero-cta-disc">
                <UIcon name="i-lucide-book-open" class="size-4" />
              </span>
              <span class="hero-cta-label">先读入门指南</span>
              <span aria-hidden="true" class="hero-cta-tail">
                <UIcon name="i-lucide-arrow-right" class="size-3.5" />
              </span>
            </NuxtLink>
            <span class="text-sm text-gray-6">{{ platformLabel }} 端共 {{ totalCount }} 个组件</span>
          </div>
        </div>

        <!-- 系列数量合进一张卡片，逐行跳到对应大区；某平台下没有组件的系列不出现 -->
        <nav aria-label="组件系列" class="hero-card hero-card-right flex flex-col justify-center gap-1 p-2">
          <a
            v-for="series in heroSeries" :key="series.id" :href="`#series-${series.id}`"
            class="hero-series group flex items-center justify-between gap-4 rounded-lg px-4 py-4"
          >
            <span class="flex flex-col gap-1">
              <span class="text-sm tracking-[0.2em] text-gray-6">{{ series.label }}</span>
              <span class="flex items-baseline gap-1.5 text-gray-10">
                <span class="text-4xl font-semibold tabular-nums">{{ series.count }}</span>
                <span class="text-sm">个组件</span>
              </span>
            </span>
            <UIcon name="i-lucide-arrow-down-right" class="size-5 shrink-0 text-gray-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:text-primary motion-reduce:transition-none" />
          </a>
        </nav>
      </div>
    </section>

    <!-- 数据未到：两组卡片占位，撑出与真实网格相同的版面 -->
    <div v-if="!components" class="mt-16 flex flex-col gap-16 sm:mt-12 sm:gap-20" aria-busy="true" aria-label="组件列表加载中">
      <section v-for="(count, index) in PLACEHOLDER_SECTIONS" :key="index">
        <div class="mb-8 border-b border-[#E5E6EB] pb-5 sm:mb-10 dark:border-white/10">
          <div class="overview-skeleton h-9 w-48 rounded" />
          <div class="overview-skeleton mt-3 h-5 w-80 max-w-full rounded" />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div v-for="card in count" :key="card" class="overview-card overview-card-placeholder rounded-lg p-3">
            <div class="overview-skeleton min-h-[180px] rounded-lg sm:min-h-[220px]" />
            <div class="overview-skeleton mt-3 h-6 w-3/5 rounded" />
            <div class="overview-skeleton mt-2 h-5 w-2/5 rounded" />
          </div>
        </div>
      </section>
    </div>

    <!-- 两大区：Reborn 组件 / 社区移植，锚点与侧栏虚拟节点的 path 对应 -->
    <div v-else class="mt-16 flex flex-col gap-16 sm:mt-20 sm:gap-20">
      <section v-for="series in seriesSections" :id="`series-${series.id}`" :key="series.id" class="scroll-mt-24">
        <!-- 大区标题：名称 + 总数 + 一句说明，下加分隔线与分类区分层级 -->
        <div v-fly-in class="fly-in fly-in-title mb-8 border-b border-[#E5E6EB] pb-5 sm:mb-10 dark:border-white/10">
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
          <p class="mt-2 text-sm text-gray-8">
            {{ series.description }}
          </p>
        </div>

        <!-- 区内分类分块 -->
        <div class="flex flex-col gap-12 sm:gap-14">
          <section
            v-for="section in series.categories" :id="`series-${series.id}-${section.name}`" :key="section.name"
            v-near="() => revealSection(sectionKey(series.id, section.name))" class="scroll-mt-24"
          >
            <div v-fly-in class="fly-in fly-in-title mb-5 flex items-center gap-3 sm:mb-6">
              <h3 class="text-default text-lg font-medium tracking-tight sm:text-[22px] sm:leading-[30px]">
                {{ section.name }}
              </h3>
              <span
                class="overview-count inline-flex min-w-8 items-center justify-center rounded bg-[#F4F4F6] px-1.5 py-0.5 text-sm font-medium text-[#3D3D3D] dark:bg-white/10 dark:text-neutral-200"
              >
                {{ section.items.length }}
              </span>
            </div>

            <!-- 窄屏逐级减列；xl（1280）起一行 5 张。卡片按「之」字形入场：偶数行从左、奇数行从右滑入 -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" @pointermove.passive="onCardMove">
              <template v-for="item in section.items" :key="item.id">
                <!-- 所在分类尚未接近视口：同尺寸的卡片占位 -->
                <div v-if="!isSectionRevealed(sectionKey(series.id, section.name))" aria-hidden="true" class="overview-card overview-card-placeholder rounded-lg p-3">
                  <div class="overview-skeleton min-h-[180px] rounded-lg sm:min-h-[220px]" />
                  <div class="overview-skeleton mt-3 h-6 w-3/5 rounded" />
                  <div class="overview-skeleton mt-2 h-5 w-2/5 rounded" />
                </div>
                <NuxtLink
                  v-else v-fly-in="{ zigzag: section.items.indexOf(item) }" :to="item.path"
                  class="overview-card fly-in group relative isolate flex h-full min-w-0 flex-col rounded-lg p-3"
                >
                  <!-- 悬停泛光：底色一层 + 描边一层，位置取 --mx / --my -->
                  <span aria-hidden="true" class="card-light card-light-fill" />
                  <span aria-hidden="true" class="card-light card-light-rim" />

                  <!-- 占位：在文档流里撑出缩略预览原本的高度，预览本体绝对定位、悬停时向下铺满整张卡片 -->
                  <div class="min-h-[180px] flex-1 sm:min-h-[220px]" />

                  <!-- 标题行（24px）与信息行（20px）都定高：缩略预览的底边按这两行算死，见样式里的 --ov-preview-bottom -->
                  <div class="mt-3 flex h-6 min-w-0 items-center justify-between gap-2 px-1">
                    <span class="truncate text-base font-medium text-gray-10">{{ item.title }}</span>
                    <UIcon name="i-lucide-arrow-up-right" class="overview-card-arrow size-4 shrink-0 text-gray-5" />
                  </div>

                  <!-- 信息行：英文名（标题已含英文名时改显分类）+ 可用端圆点 -->
                  <div class="mt-2 flex h-5 min-w-0 items-center justify-between gap-2 px-1 text-sm text-gray-6">
                    <span class="truncate">{{ showEnglishName(item) ? item.englishName : item.category }}</span>
                    <span class="flex shrink-0 items-center gap-2.5">
                      <span v-for="badge in PLATFORM_BADGES[item.platform]" :key="badge.label" class="flex items-center gap-1 text-xs">
                        <span class="size-1.5 rounded-full" :class="badge.color === 'primary' ? 'bg-primary' : 'bg-success'" />
                        {{ badge.text }}
                      </span>
                    </span>
                  </div>

                  <!-- Overview 缩略预览（视口懒加载；未补齐时回退几何示意） -->
                  <div class="overview-card-preview absolute overflow-hidden rounded-lg">
                    <ComponentOverviewDemo :demo-name="item.demoName" :category="item.category" />
                    <Icon
                      v-if="item.badgeIcon" :name="item.badgeIcon.icon" :aria-label="item.badgeIcon.label"
                      class="absolute top-2.5 right-2.5 z-10 size-6 text-red-5"
                    />
                  </div>
                </NuxtLink>
              </template>
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
  /* 飞入途中的卡片位于两侧屏外，横向裁掉，避免出现横向滚动条；clip 不建滚动容器，吸顶不受影响 */
  overflow-x: clip;
  --ov-card: var(--ui-bg);
  --ov-line-strong: color-mix(in oklab, var(--ui-text-highlighted) 16%, transparent);
  --ov-shadow: 0 1px 1px #10201608, 0 2px 6px -2px #1020160d;
  --ov-shadow-raised: 0 1px 2px #0000000d;
  --ov-well: color-mix(in oklab, var(--ui-text-highlighted) 2.5%, transparent);
  --ov-well-line: color-mix(in oklab, var(--ui-text-highlighted) 5%, transparent);
  --ov-ink: var(--ui-text-highlighted);
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
}

/* ─── 头图 ─── */
/* 高度随内容：标题 + 一排两张卡片，首屏就能露出下方组件网格 */
.overview-hero {
  padding-bottom: 0.5rem;
}

/*
 * 开场动画只跑一次：标题两行依次落下，说明卡片从左、系列卡片从右带着纵深飞入。
 * 卡片在视频背景上用半透明纸面色加模糊，与下方组件卡片同一套圆角与描边。
 */

/*
 * 描边大标题：沿用首页 REBORN UI 水印的做法（Anton 窄体、只描边不填充、右侧渐隐、左右缓慢漂移）。
 * 水印是背景装饰，这里是正文标题，所以描边用正文高亮色而非 gray-3，右端只淡到 20% 而不是全隐，保证整词可读。
 */
.hero-outline {
  font-family: Anton, "Arial Narrow", sans-serif;
  font-size: clamp(56px, 10vw, 136px);
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
  color: transparent;
  -webkit-text-stroke: 1.5px var(--ui-text-highlighted);
  mask-image: linear-gradient(90deg, #000 45%, rgb(0 0 0 / 0.2) 100%);
  animation: hero-outline-drift 30s ease-in-out infinite alternate;
}

/* 漂移幅度比首页小：标题居中且下方紧跟卡片，±1.5vw 已能看出在动 */
@keyframes hero-outline-drift {
  from { transform: translateX(-1.5vw); }
  to { transform: translateX(1.5vw); }
}

.hero-line {
  animation: hero-drop 0.9s var(--ov-ease) both;
}

.hero-line-b {
  animation-delay: 0.08s;
}

@keyframes hero-drop {
  from { opacity: 0; transform: translateY(-28px); filter: blur(6px); }
  to { opacity: 1; transform: none; filter: none; }
}

.hero-card {
  border: 1px solid var(--ov-well-line);
  border-radius: 12px;
  background: color-mix(in oklab, var(--ov-card) 82%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: 0 18px 50px rgb(15 30 60 / 0.12);
  /* 先飞入，落定后像气泡一样缓慢上下漂浮；三张卡片周期不同，不会同步起伏 */
  animation:
    1s var(--ov-ease) var(--hero-delay, 0.24s) both var(--hero-fly),
    hero-float var(--float-duration, 7s) ease-in-out calc(var(--hero-delay, 0.24s) + 1s) infinite alternate;
}

.hero-card-left {
  --hero-fly: hero-fly-left;
  --float-duration: 7.6s;
}

.hero-card-right {
  --hero-fly: hero-fly-right;
  --hero-delay: 0.38s;
  --float-duration: 6.4s;
}

/* 系列行：悬停铺一层浅底，键盘聚焦用主色描边 */
.hero-series {
  transition: background-color 0.2s;
}

.hero-series:hover {
  background: var(--ov-well);
}

.hero-series:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

@keyframes hero-fly-left {
  from { opacity: 0; transform: perspective(1200px) translate3d(-42vw, 0, -320px) rotateY(28deg); }
  to { opacity: 1; transform: none; }
}

@keyframes hero-float {
  from { translate: 0 0; }
  to { translate: 0 -10px; }
}

@keyframes hero-fly-right {
  from { opacity: 0; transform: perspective(1200px) translate3d(42vw, 0, -320px) rotateY(-28deg); }
  to { opacity: 1; transform: none; }
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

/* ─── 卡片网格 ─── */
.overview-card {
  /*
   * 缩略预览的底边距：卡片内边距 12 + 平台行 20 + 间距 8 + 标题行 24 + 间距 12。
   * 两行都在模板里定高，所以这里能写死；改了任一行的高度或间距要同步这个值。
   */
  --ov-preview-bottom: 76px;
  /*
   * 玻璃卡片：背景视频已经高斯模糊，卡片只需半透明纸面色就有毛玻璃感，
   * 不再给 150+ 张卡片各自加 backdrop-filter（那会让每次滚动都重新模糊整页）。
   * 顶边一道亮线 + 半透明描边勾出玻璃边缘，投影偏柔和，让卡片浮在视频之上。
   */
  border: 1px solid color-mix(in oklab, var(--ui-text-highlighted) 9%, transparent);
  border-radius: 14px;
  background-color: color-mix(in oklab, var(--ov-card) 80%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in oklab, white 70%, transparent),
    0 8px 24px rgb(15 30 60 / 0.1);
  transition:
    box-shadow 0.24s var(--ov-ease),
    translate 0.32s var(--ov-ease),
    scale 0.6s var(--ov-ease);
  transition:
    box-shadow 0.24s var(--ov-ease),
    translate 0.32s var(--ov-ease),
    scale 0.6s var(--ov-spring);
}

/* 卡片右上角的箭头：平时淡，悬停时着主色并向右上推一点 */
.overview-card-arrow {
  opacity: 0.5;
  transition: opacity 0.2s, translate 0.25s var(--ov-ease), color 0.2s;
}

.overview-card:hover .overview-card-arrow {
  opacity: 1;
  translate: 2px -2px;
  color: var(--color-primary);
}

/* 悬停微微上浮；用独立的 translate 属性，不覆盖飞入用的 transform */
.overview-card:hover {
  translate: 0 -4px;
  box-shadow:
    inset 0 1px 0 color-mix(in oklab, white 70%, transparent),
    0 18px 40px rgb(15 30 60 / 0.18);
}

.dark .overview-card {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.06),
    0 8px 24px rgb(0 0 0 / 0.35);
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

/*
 * 预览框：内嵌浅底，与卡片本体分层。
 * 平时绝对定位在卡片内边距之内，上、左、右贴边，底边停在标题与平台两行之上；悬停时四边都收到 0，
 * 去掉内边距、盖住下面两行，贴着卡片描边铺满整张卡片。
 * 底色先铺一层不透明的卡片色再叠浅底，盖住标题时文字不会透出来。
 */
.overview-card-preview {
  inset: 12px 12px var(--ov-preview-bottom);
  border-radius: 10px;
  background-color: color-mix(in oklab, var(--ov-card) 96%, transparent);
  background-image: linear-gradient(var(--ov-well), var(--ov-well));
  box-shadow: inset 0 0 0 1px var(--ov-well-line);
  transition:
    inset 0.32s var(--ov-ease),
    border-radius 0.32s var(--ov-ease),
    box-shadow 0.32s var(--ov-ease);
}

/*
 * 铺满态：圆角取卡片 14px 减去 1px 描边，与卡片内沿严丝合缝；
 * 内描边去掉，否则贴着卡片描边会叠出两道线。
 * 只在精确指针设备上展开：触屏点一下就跳转详情，没有悬停可言；键盘聚焦到卡片时同样展开。
 */
@media (hover: hover) and (pointer: fine) {
  .overview-card:hover .overview-card-preview {
    inset: 0;
    border-radius: 13px;
    box-shadow: none;
  }
}

.overview-card:focus-visible .overview-card-preview {
  inset: 0;
  border-radius: 13px;
  box-shadow: none;
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

/*
 * 分批渲染的占位：与真卡片同尺寸的静态卡片底。
 * 不做掠光动画：150 张占位同时动画会让浏览器每帧重绘整页，分批渲染反而被拖慢。
 */
.overview-card-placeholder {
  pointer-events: none;
}

.overview-skeleton {
  background: var(--ov-well);
}

/*
 * 进入视口飞入（v-fly-in）：初始透明，指令按所在半屏写入 data-fly 方向，
 * 下一帧加 is-flown 回到原位。过渡只挂在 is-flown 上，写方向那一帧不会产生多余动画。
 */
.fly-in {
  opacity: 0;
}

.fly-in[data-fly='left'] {
  transform: perspective(1200px) translate3d(-18vw, 0, -260px) rotateY(18deg);
}

.fly-in[data-fly='right'] {
  transform: perspective(1200px) translate3d(18vw, 0, -260px) rotateY(-18deg);
}

.fly-in-title[data-fly] {
  transform: translate3d(0, 28px, 0);
}

.fly-in.is-flown {
  opacity: 1;
  transform: none;
  transition:
    opacity 0.7s var(--ov-ease) var(--fly-delay, 0ms),
    transform 0.9s var(--ov-ease) var(--fly-delay, 0ms);
}

/* 飞入结束后交还卡片自己的悬停过渡 */
.overview-card.fly-in.is-flown:hover {
  transition-delay: 0ms;
}

@media (prefers-reduced-motion: reduce) {
  .hero-line,
  .hero-card,
  .hero-outline {
    animation: none;
  }

  .fly-in,
  .fly-in[data-fly] {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-light,
  .overview-card,
  .overview-card-preview {
    transition: none;
  }

  .overview-card:active {
    scale: 1;
  }
}
</style>
