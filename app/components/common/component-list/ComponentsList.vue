<script lang="ts" setup>
/**
 * 组件总览：首屏、次屏（组件数与特性卡片）、组件目录（ComponentsOverviewCatalog）
 * 顶部导航是 ComponentsOverviewNav，色调由本页首屏写入 useOverviewNavTone
 */
import type { DocsCollectionItem } from '@nuxt/content'
import type { OverviewBadgeIcon, OverviewItem } from './types'
import { computed } from 'vue'
import { vFlyIn } from '~/lib/flyIn'
import ComponentsOverviewCatalog from './ComponentsOverviewCatalog.vue'
import ComponentsOverviewFeatures from './ComponentsOverviewFeatures.vue'

interface Props {
  routePath?: string
}

const { routePath = '/components' } = defineProps<Props>()

// 懒加载：客户端跳转不等数据，服务端渲染仍会等
const { data: components } = useLazyAsyncData(() => `components-overview:${routePath}`, async () => {
  const prefix = `${routePath.replace(/\/$/, '')}/`
  // 只查组件分区，并裁掉正文，避免 payload 过大
  const docs = await queryCollection('docs').where('path', 'LIKE', `${prefix}%`).all() as DocsCollectionItem[]
  return docs.filter(item => item.path.startsWith(prefix)).map(item => ({
    id: item.id, path: item.path, title: item.title, description: item.description,
    category: item.category, series: item.series, platform: item.platform,
    badge: item.badge, tags: item.tags, demoName: overviewNameFromItem(item),
  }))
})

/** 按当前平台筛选组件 */
const { platform, isVisible } = useDocsPlatform()

/** 平台名 */
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

/** badge → 标记图标（键为小写） */
const BADGE_ICONS: Record<string, OverviewBadgeIcon> = {
  new: { icon: 'lsicon:badge-new-filled', label: '新组件' },
  update: { icon: 'lsicon:refresh-filled', label: '近期更新' },
}

/** 分类内按 slug 排序 */
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

/** 系列 → 分类 → 组件，空系列不出现 */
const seriesSections = computed(() =>
  groupBySeriesAndCategory(overviewItems.value, item => ({ series: item.series, category: item.category })),
)

// 数据未到时显示占位符
const totalCount = computed(() => (components.value ? overviewItems.value.length : '—'))

/** 两个系列的组件数，为 0 的不显示 */
const seriesStats = computed(() =>
  ([
    { id: 'reborn', label: 'Reborn 组件' },
    { id: 'community', label: '社区组件' },
  ] as const)
    .map(series => ({ ...series, count: components.value ? overviewItems.value.filter(item => item.series === series.id).length : '—' as const }))
    .filter(series => series.count !== 0),
)

/** 双端通用数与社区移植数 */
const bothCount = computed(() => (components.value ? overviewItems.value.filter(item => item.platform === 'both').length : '—'))
const communityCount = computed(() => overviewItems.value.filter(item => item.series === 'community').length)

/* ── 顶部导航的色调 ───────────────────────────────────────────────────── */

/** 导航下沿位置（px） */
const NAV_LINE = 68

const navTone = useOverviewNavTone()
const toneEdgeRef = useTemplateRef<HTMLElement>('toneEdge')
let toneObserver: IntersectionObserver | undefined

/* ── 安装命令 ─────────────────────────────────────────────────────────── */

/** 安装命令 */
const INSTALL_COMMAND = 'npx reborn-ui@latest init'
const copied = shallowRef(false)
let copyTimer = 0

async function copyInstall() {
  try {
    await navigator.clipboard.writeText(INSTALL_COMMAND)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => (copied.value = false), 1800)
  }
  catch {
    // 剪贴板不可用时忽略
  }
}

/* ── 组件目录的呈现方式 ───────────────────────────────────────────────── */

/** 桌面端且未减弱动效时启用目录场景模式；挂载后才判断，保证水合一致 */
const SCENE_QUERY = '(min-width: 901px) and (min-height: 620px)'
const MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const sceneLive = shallowRef(false)
let sceneMedia: MediaQueryList | undefined
let motionMedia: MediaQueryList | undefined

function syncSceneLive() {
  sceneLive.value = !!sceneMedia?.matches && !motionMedia?.matches
}

onMounted(() => {
  sceneMedia = window.matchMedia(SCENE_QUERY)
  motionMedia = window.matchMedia(MOTION_QUERY)
  sceneMedia.addEventListener('change', syncSceneLive)
  motionMedia.addEventListener('change', syncSceneLive)
  syncSceneLive()

  // 首屏分界线滚过导航后，导航换浅色调
  const edge = toneEdgeRef.value
  if (!edge || typeof IntersectionObserver === 'undefined') return
  toneObserver = new IntersectionObserver(([entry]) => {
    if (!entry) return
    navTone.value = !entry.isIntersecting && entry.boundingClientRect.top < NAV_LINE ? 'light' : 'dark'
  }, { rootMargin: `-${NAV_LINE}px 0px 0px 0px` })
  toneObserver.observe(edge)
})

onBeforeUnmount(() => {
  clearTimeout(copyTimer)
  toneObserver?.disconnect()
  sceneMedia?.removeEventListener('change', syncSceneLive)
  motionMedia?.removeEventListener('change', syncSceneLive)
  // 离开时复位色调
  navTone.value = 'dark'
})

// 禁用脚本时直接显示入场元素
useHead({
  noscript: [{ textContent: '<style>.fly-in{opacity:1!important;transform:none!important}</style>' }],
})

/* ── 样式类 ─────────────────────────────────────────────────────────── */

/** 首屏标题，逐词升起 */
const HERO_WORDS = ['Atomic', 'Components'] as const

/** 按钮按下反馈 */
const PRESS = 'active:[transform:translateY(1px)_scale(0.985)]'

/** 正文版心 */
const WRAP = 'mx-auto w-[min(var(--ov-w),100%_-_var(--ov-gutter)_*_2)]'

/** 分节标题区 */
const SECTION_HEAD = 'mx-auto mb-10 max-w-(--ov-w) text-center max-[701px]:mb-7'
const EYEBROW = 'mb-3.5 inline-flex items-center gap-[7px] text-[15px] font-semibold tracking-[-0.01em] text-(--ov-label) [&_svg]:size-[18px]'
const SECTION_TITLE = 'text-[clamp(30px,3.8vw,44px)] leading-[1.2] font-semibold tracking-[-0.02em] text-balance text-(--ov-text)'
</script>

<template>
  <!-- 配色变量 --ov-* 定义在下方 <style scoped>；断点写成 max-[N+1]，与原 max-width: N 等价 -->
  <div class="components-overview relative isolate bg-[linear-gradient(var(--ov-paper)_calc(100%_-_240px),var(--color-gray-1))] pb-[120px] text-(--ov-text)">
    <!-- ─── 首屏 ─── -->
    <section class="relative isolate" aria-labelledby="components-hero-title">
      <!-- 首屏渐变 + 颗粒 -->
      <div
        class="relative isolate overflow-hidden bg-(image:--ov-hero-bg) px-(--ov-gutter) pt-[clamp(140px,22vh,208px)] pb-[220px]
          after:pointer-events-none after:absolute after:inset-0 after:-z-1 after:bg-(image:--ov-grain) after:opacity-22 after:mix-blend-overlay after:content-['']
          max-[701px]:pt-[124px] max-[701px]:pb-[170px]"
      >
        <!-- 光晕 -->
        <div class="pointer-events-none absolute inset-0 -z-2 [mask-image:linear-gradient(#000_70%,transparent_88%)]" aria-hidden="true">
          <div class="absolute top-[44%] -left-[10%] h-[72%] w-[120%] motion-safe:animate-[ov-sunrise_1.4s_var(--ov-ease-expo)_backwards]">
            <div class="absolute inset-0 bg-(image:--ov-hero-sun) motion-safe:animate-[ov-breathe_16s_ease-in-out_1.4s_infinite_alternate]" />
          </div>
        </div>
        <!-- 明暗分界线，供导航切换色调 -->
        <i ref="toneEdge" class="pointer-events-none absolute top-[82%] left-0 size-px" aria-hidden="true" />

        <div class="flex flex-col items-center text-center">
          <a
            href="#catalog"
            class="group/pill mb-7 inline-flex min-h-[34px] max-w-full items-center gap-[9px] rounded-[999px] bg-white/10 px-3 py-1 text-left text-[14px] tracking-[-0.01em] text-white/82
              shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] backdrop-blur-[10px] [transition:background-color_0.2s_var(--ov-ease)]
              hover:bg-white/16 hover:duration-[140ms] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white/70
              motion-safe:animate-[ov-rise-small_0.7s_var(--ov-ease-expo)_40ms_backwards] max-[701px]:mb-[22px] max-[701px]:text-[13px]"
          >
            <span class="size-[7px] flex-none rounded-[999px] bg-(--ov-hot) shadow-[0_0_0_3px_color-mix(in_srgb,var(--ov-hot)_28%,transparent)]" aria-hidden="true" />
            <span><b class="font-semibold text-white">Reborn UI</b> 组件总览<span class="max-[401px]:hidden">：{{ platformLabel }} 端共 {{ totalCount }} 个组件</span></span>
            <Icon name="lucide:arrow-down" class="size-3.5 flex-none transition-transform duration-200 ease-(--ov-ease) group-hover/pill:translate-y-0.5 motion-reduce:transition-none" />
          </a>

          <!-- 外层裁切，内层升起 -->
          <h1
            id="components-hero-title"
            class="font-(family-name:--ov-display) text-[clamp(40px,6vw,84px)] leading-[1.02] font-semibold tracking-[-0.042em] text-balance
              text-[color-mix(in_oklab,var(--ov-p)_5%,white)]"
          >
            <span v-for="(word, index) in HERO_WORDS" :key="word" class="block">
              <span class="-mx-[0.08em] -mt-[0.12em] -mb-[0.18em] inline-block overflow-clip px-[0.08em] pt-[0.12em] pb-[0.18em] align-top">
                <span
                  class="inline-block origin-bottom-left motion-safe:animate-[ov-word_0.95s_var(--ov-ease-expo)_calc(0.13s_+_var(--w)_*_90ms)_backwards]"
                  :style="{ '--w': index }"
                >{{ word }}</span>
              </span>
            </span>
          </h1>

          <p
            class="mt-6 max-w-[36rem] text-[clamp(16px,1.45vw,19px)] leading-[1.7] text-pretty
              text-[color-mix(in_srgb,color-mix(in_oklab,var(--ov-p)_8%,white)_92%,transparent)]
              motion-safe:animate-[ov-rise_0.8s_var(--ov-ease-expo)_0.43s_backwards]"
          >
            Web / UniApp 双端基础与扩展组件，覆盖按钮、表单、导航、反馈与特效；设计与实现持续迭代，欢迎在文档页反馈问题。
          </p>

          <div class="mt-9 flex max-w-full flex-wrap justify-center gap-2.5 max-[701px]:w-full max-[701px]:flex-col max-[701px]:items-stretch">
            <!-- 安装命令，点击复制 -->
            <button
              type="button" :data-copied="copied" :aria-label="`复制安装命令：${INSTALL_COMMAND}`"
              class="group/install inline-flex h-12 max-w-full cursor-pointer items-center gap-[18px] rounded-[11px] border border-white/12
                bg-[color-mix(in_srgb,var(--ov-ink-deep)_90%,transparent)] py-0 pr-1.5 pl-[18px] text-left text-white
                [transition:border-color_0.2s_var(--ov-ease),transform_90ms_var(--ov-ease)] hover:border-white/26 hover:duration-[140ms]
                focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white/70
                motion-safe:animate-[ov-rise_0.8s_var(--ov-ease-expo)_0.53s_backwards]
                max-[701px]:justify-between max-[701px]:gap-2 max-[701px]:pl-3.5"
              :class="PRESS"
              @click="copyInstall"
            >
              <code class="min-w-0 overflow-hidden font-(family-name:--ov-mono) text-[14px] font-medium tracking-[-0.01em] text-ellipsis whitespace-nowrap max-[701px]:text-[12.5px]">
                <span class="mr-[9px] opacity-45 select-none">$</span>{{ INSTALL_COMMAND }}
              </code>
              <span
                class="grid size-9 flex-none place-items-center rounded-[7px] bg-white/8 [transition:background-color_0.2s_var(--ov-ease)] group-hover/install:bg-white/15"
                aria-hidden="true"
              >
                <Icon
                  name="lucide:copy"
                  class="size-4 [grid-area:1/1] [transition:opacity_0.15s,transform_0.15s]
                    group-data-[copied=true]/install:[transform:scale(0.6)] group-data-[copied=true]/install:opacity-0"
                />
                <Icon
                  name="lucide:check"
                  class="size-4 [grid-area:1/1] [transform:scale(0.6)] opacity-0 [transition:opacity_0.15s,transform_0.15s]
                    group-data-[copied=true]/install:[transform:none] group-data-[copied=true]/install:opacity-100"
                />
              </span>
              <span class="sr-only" aria-live="polite">{{ copied ? '已复制' : '' }}</span>
            </button>
            <!-- 入门指南按钮 -->
            <NuxtLink
              to="/getting-started"
              class="group/btn inline-flex h-12 items-center justify-center gap-2 rounded-[11px] bg-white px-[18px] text-[15px] font-medium tracking-[-0.01em] whitespace-nowrap text-[#12141a]
                shadow-[0_0_0_1px_rgb(8_10_16/0.05),0_4px_12px_-6px_color-mix(in_srgb,var(--ov-shade)_30%,transparent)]
                [transition:background-color_0.2s_var(--ov-ease),transform_90ms_var(--ov-ease)] hover:bg-[color-mix(in_oklab,var(--ov-p)_6%,white)] hover:duration-[140ms]
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12141a]
                motion-safe:animate-[ov-rise_0.8s_var(--ov-ease-expo)_0.6s_backwards]"
              :class="PRESS"
            >
              先读入门指南
              <Icon name="lucide:arrow-right" class="size-4 flex-none transition-transform duration-200 ease-(--ov-ease) group-hover/btn:translate-x-[3px] group-hover/btn:duration-[140ms] motion-reduce:transition-none" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── 次屏：标题、组件数与三张特性卡片 ─── -->
    <!-- 分节标题不带 id，避免文档页生成右侧目录 -->
    <section id="about" class="relative pt-6 max-[701px]:pt-2" aria-label="双端基础与扩展组件">
      <div :class="WRAP">
        <div :class="SECTION_HEAD">
          <span v-fly-in class="fly-in" :class="EYEBROW">
            <!-- 2×2 网格标记 -->
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <rect x="2" y="2" width="7" height="7" rx="1.6" />
              <rect x="11" y="2" width="7" height="7" rx="1.6" opacity="0.45" />
              <rect x="2" y="11" width="7" height="7" rx="1.6" opacity="0.45" />
              <rect x="11" y="11" width="7" height="7" rx="1.6" />
            </svg>
            Reborn UI
          </span>
          <h2 v-fly-in="70" class="fly-in" :class="SECTION_TITLE">
            双端基础与扩展组件
          </h2>
          <!-- 两个系列的组件数，点击跳到对应系列 -->
          <div v-fly-in="140" class="fly-in mt-7 flex justify-center">
            <a
              v-for="series in seriesStats" :key="series.id" :href="`#series-${series.id}`"
              class="ov-stat group/stat flex min-w-[152px] flex-col items-center gap-1 px-8 py-0.5 [transition:color_0.2s_var(--ov-ease)] [&+&]:shadow-[-1px_0_var(--ov-hair)]
                focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary max-[701px]:min-w-0 max-[701px]:px-[22px]"
            >
              <b
                class="font-(family-name:--ov-display) text-[clamp(40px,4.6vw,56px)] leading-[1.05] font-semibold tracking-[-0.04em] tabular-nums text-(--ov-text)
                  [transition:color_0.2s_var(--ov-ease)] group-hover/stat:text-(--ov-label)"
              >{{ series.count }}</b>
              <span class="text-[15px] text-(--ov-text-2)">{{ series.label }}</span>
            </a>
          </div>
        </div>
      </div>

      <div class="mx-auto w-[min(var(--ov-w-wide),100%_-_var(--ov-gutter)_*_2)]">
        <ComponentsOverviewFeatures :both-count="bothCount" :community-count="communityCount" />
      </div>
    </section>

    <!-- ─── 组件目录 ─── -->
    <section id="catalog" class="relative pt-36 max-[701px]:pt-[104px]" aria-label="组件目录">
      <div :class="WRAP">
        <div :class="SECTION_HEAD">
          <span v-fly-in class="fly-in" :class="EYEBROW">
            <Icon name="lucide:layout-grid" class="size-5" />
            组件目录
          </span>
          <h2 v-fly-in="70" class="fly-in" :class="SECTION_TITLE">
            按分类找到要用的组件
          </h2>
          <p v-fly-in="140" class="fly-in mx-auto mt-4 mb-0 max-w-[34rem] text-[17px] leading-[1.7] text-pretty text-(--ov-text-2) max-[701px]:text-[16px]">
            左侧是分类，右侧是该分类下的全部组件，往下滚动逐个分类翻看；点小卡片进入对应的文档页。
          </p>
          <!-- 平台开关 -->
          <div v-fly-in="210" class="ov-platform fly-in mt-6 flex flex-wrap items-center justify-center gap-3 text-[14px] text-(--ov-text-3)">
            <DocsPlatformSwitch />
            <span>{{ platformLabel }} 端共 {{ totalCount }} 个组件</span>
          </div>
        </div>
      </div>

      <!-- 每个系列一栏 -->
      <ComponentsOverviewCatalog v-if="!components" />
      <template v-else>
        <ComponentsOverviewCatalog v-for="series in seriesSections" :key="series.id" :series="series" :live="sceneLive" />
      </template>
    </section>
  </div>
</template>

<!-- 不加 scoped：入场规则要作用到子组件内部，关键帧在 scoped 里会被改名 -->
<style>
/* 入场（v-fly-in）：放进 components 层，工具类才能覆盖它 */
@layer components {
  .components-overview .fly-in {
    opacity: 0;
    transform: translate3d(0, 28px, 0);
  }

  .components-overview .fly-in.is-flown {
    opacity: 1;
    transform: none;
    transition:
      opacity 0.9s var(--ov-ease-expo) var(--fly-delay, 0ms),
      transform 0.9s var(--ov-ease-expo) var(--fly-delay, 0ms);
  }

  @media (prefers-reduced-motion: reduce) {
    .components-overview .fly-in,
    .components-overview .fly-in.is-flown {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
}

/* 首屏入场与光晕呼吸 */
@keyframes ov-sunrise {
  from { opacity: 0; transform: translateY(18%); }
}

@keyframes ov-breathe {
  from { opacity: 0.86; transform: scale(1); }
  to { opacity: 1; transform: scale(1.06); }
}

@keyframes ov-rise-small {
  from { opacity: 0; transform: translateY(12px); }
}

@keyframes ov-rise {
  from { opacity: 0; transform: translateY(22px); }
}

@keyframes ov-word {
  from { transform: translateY(110%) rotate(5deg); }
}
</style>

<style scoped>
/* 配色、尺寸与缓动变量，子组件共用；暗色差异见 .dark 段 */
.components-overview {
  --ov-p: var(--color-primary);
  /* 首屏渐变色阶 */
  --ov-ink-deep: color-mix(in oklab, var(--ov-p) 10%, #07080c);
  --ov-ink-2: color-mix(in oklab, var(--ov-p) 28%, #090a10);
  --ov-rust: color-mix(in oklab, var(--ov-p) 64%, #0a0b12);
  --ov-hot: color-mix(in oklab, var(--ov-p) 76%, white);
  --ov-pale: color-mix(in oklab, var(--ov-p) 32%, white);
  /* 纸色（页面底色） */
  --ov-paper: color-mix(in oklab, var(--ov-p) 3.5%, var(--color-gray-1));
  --ov-hero-bg: linear-gradient(
    180deg,
    var(--ov-ink-deep) 0%,
    var(--ov-ink-2) 20%,
    var(--ov-rust) 50%,
    var(--ov-p) 70%,
    var(--ov-hot) 78%,
    var(--ov-pale) 90%,
    var(--ov-paper) 100%
  );
  /* 首屏光晕 */
  --ov-hero-sun: radial-gradient(
    closest-side,
    color-mix(in srgb, var(--ov-hot) 62%, transparent) 0%,
    color-mix(in srgb, var(--ov-hot) 44%, transparent) 26%,
    color-mix(in srgb, var(--ov-hot) 16%, transparent) 52%,
    transparent 74%
  );
  --ov-text: var(--color-gray-10);
  --ov-text-2: var(--color-gray-8);
  --ov-text-3: var(--color-gray-6);
  /* 小字标签色，浅色下取第 7 阶保证对比度 */
  --ov-label: var(--color-primary-active);
  --ov-hair: color-mix(in oklab, var(--color-gray-10) 7%, transparent);
  --ov-surface: var(--color-gray-1);
  --ov-sunk: color-mix(in oklab, var(--color-gray-10) 4.5%, transparent);
  /* 大卡片内屏底色 */
  --ov-screen: color-mix(in oklab, var(--ov-p) 5%, color-mix(in oklab, var(--color-gray-10) 3%, var(--color-gray-1)));
  /* 特性卡片插画面底色与光晕 */
  --ov-art-base: white;
  --ov-art-glow: rgb(255 255 255 / 0.78);
  /* 插画面线条、准星与纸片浓度 */
  --ov-fx-line: rgb(255 255 255 / 0.55);
  --ov-fx-mark: rgb(255 255 255 / 0.95);
  --ov-fx-sheet: 0.55;
  /* 特性卡片插画面的三种底色与两种光晕 */
  --ov-art-soft: linear-gradient(
    color-mix(in oklab, var(--ov-p) 40%, var(--ov-art-base)) 0%,
    color-mix(in oklab, var(--ov-p) 22%, var(--ov-art-base)) 55%,
    color-mix(in oklab, var(--ov-p) 8%, var(--ov-art-base)) 100%
  );
  --ov-art-dawn: linear-gradient(
    color-mix(in oklab, var(--ov-p) 7%, var(--ov-art-base)) 0%,
    color-mix(in oklab, var(--ov-p) 22%, var(--ov-art-base)) 52%,
    color-mix(in oklab, var(--ov-p) 44%, var(--ov-art-base)) 100%
  );
  --ov-art-dark:
    radial-gradient(95% 70% at 50% 112%, color-mix(in srgb, var(--ov-p) 92%, transparent), transparent 72%),
    radial-gradient(60% 45% at 88% -6%, color-mix(in srgb, var(--ov-hot) 20%, transparent), transparent 70%),
    linear-gradient(180deg, var(--ov-ink-2) 0%, var(--ov-ink-deep) 70%);
  --ov-glow-light: radial-gradient(closest-side, var(--ov-art-glow), color-mix(in srgb, var(--ov-art-glow) 36%, transparent) 55%, transparent);
  --ov-glow-dark: radial-gradient(
    closest-side,
    color-mix(in srgb, var(--ov-hot) 42%, transparent),
    color-mix(in srgb, var(--ov-p) 14%, transparent) 55%,
    transparent
  );
  /* 投影色 */
  --ov-shade: color-mix(in oklab, var(--ov-p) 40%, #0a0c14);
  --ov-ring: 0 0 0 1px color-mix(in oklab, var(--color-gray-10) 5%, transparent);
  --ov-shadow-card:
    var(--ov-ring), 0 1px 2px rgb(8 10 16 / 0.04), 0 18px 40px -28px color-mix(in srgb, var(--ov-shade) 26%, transparent);
  --ov-shadow-lift:
    0 0 0 1px color-mix(in oklab, var(--color-gray-10) 8%, transparent), 0 1px 2px rgb(8 10 16 / 0.05),
    0 24px 44px -26px color-mix(in srgb, var(--ov-shade) 36%, transparent);
  --ov-w: 880px;
  --ov-w-wide: 1080px;
  --ov-w-catalog: 1320px;
  --ov-gutter: 16px;
  --ov-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ov-ease-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ov-ease-quart: cubic-bezier(0.25, 1, 0.5, 1);
  /* 回弹曲线，用于小卡片按压 */
  --ov-spring: linear(0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017 19.4%, 1.061 22.1%, 1.072 24.3%, 1.066 27.4%, 1.036 32.8%, 1.009 39.6%, 0.996 46.9%, 0.993 53.8%, 0.998 69.8%, 1);
  /* 标题字体 */
  --ov-display: Geist, var(--font-sans);
  --ov-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --ov-grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  /* 小卡片用的变量 */
  --ov-card: var(--ov-surface);
  --ov-well: color-mix(in oklab, var(--color-gray-10) 2.5%, transparent);
  --ov-well-line: color-mix(in oklab, var(--color-gray-10) 5%, transparent);
}

@media (min-width: 768px) {
  .components-overview {
    --ov-gutter: 24px;
  }
}

/* 暗色模式的变量 */
.dark .components-overview {
  --ov-paper: color-mix(in oklab, var(--ov-p) 3%, var(--color-gray-1));
  --ov-hero-bg: linear-gradient(
    180deg,
    var(--ov-ink-deep) 0%,
    var(--ov-ink-2) 22%,
    var(--ov-rust) 52%,
    color-mix(in oklab, var(--ov-p) 78%, #0a0b12) 70%,
    color-mix(in oklab, var(--ov-p) 30%, var(--ov-paper)) 86%,
    var(--ov-paper) 100%
  );
  --ov-label: var(--color-primary);
  --ov-hair: color-mix(in oklab, white 9%, transparent);
  --ov-surface: color-mix(in oklab, white 4.5%, var(--color-gray-1));
  --ov-sunk: color-mix(in oklab, white 6%, transparent);
  --ov-screen: color-mix(in oklab, var(--ov-p) 4%, color-mix(in oklab, black 22%, var(--color-gray-1)));
  --ov-art-base: #14151b;
  --ov-art-glow: rgb(255 255 255 / 0.1);
  --ov-fx-line: rgb(255 255 255 / 0.13);
  --ov-fx-mark: rgb(255 255 255 / 0.5);
  --ov-fx-sheet: 0.3;
  --ov-ring: 0 0 0 1px color-mix(in oklab, white 9%, transparent);
  --ov-shadow-card: var(--ov-ring), inset 0 1px 0 rgb(255 255 255 / 0.04), 0 18px 40px -28px rgb(0 0 0 / 0.7);
  --ov-shadow-lift: 0 0 0 1px color-mix(in oklab, white 14%, transparent), 0 24px 44px -26px rgb(0 0 0 / 0.8);
  --ov-well: color-mix(in oklab, white 3%, transparent);
  --ov-well-line: color-mix(in oklab, white 6%, transparent);
}
</style>
