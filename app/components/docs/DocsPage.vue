<script setup lang="ts">
/**
 * DocsPage —— 文档页共享模板
 *
 * [...slug].vue / [[lang]]/[...slug].vue / index.vue / [[lang]]/index.vue
 * 四个页面的文档分支共用本组件，布局调整只需改这一处。
 *
 * 布局要点：
 * - lg+ 正文占满 UPage 全部栅格（lg:col-span-10），不再为 TOC 保留右列；
 *   目录由 DocsFloatingToc 悬浮在视口右缘。
 * - <lg 保留 #right 槽的原生 UContentToc（移动端置顶折叠条），行为与改版前一致。
 */

import { suggestionContextKey } from '~/components/common/component-viewer/types'

/** 页脚文案（i18n 页面传入 t() 结果，默认英文） */
interface DocsPageTexts {
    edit: string
    or: string
    report: string
    toc: string
}

interface Props {
    /** 文档内容（queryCollection 查询结果） */
    page: Record<string, any>
    /** 上一页 / 下一页数据 */
    surround?: unknown
    /** 页头分类标题 */
    headline?: string
    /** 界面文案覆盖 */
    texts?: Partial<DocsPageTexts>
}

const props = defineProps<Props>()

/**
 * 页头标题的两段：英文名作主标题，中文名紧随其后弱化显示。
 * 各组件 frontmatter 的 title 写法不统一（中英前后次序都有），拆分规则见 useDocTitleParts；
 * 个别推导不准的组件在 frontmatter 写 `titleEn` 覆盖。
 */
const titleParts = useDocTitleParts(() => props.page)

const appConfig = useAppConfig()

/** 合并默认英文文案与外部传入（i18n）文案 */
const mergedTexts = computed<DocsPageTexts>(() => ({
    edit: 'Edit this page',
    or: 'or',
    report: 'Report an issue',
    toc: 'Table of Contents',
    ...props.texts,
}))

/** 右侧移动端 demo 面板是否可见（有 demo 且处于 UniApp 档；决定悬浮目录是否左移避让） */
const { isPanelVisible: hasMobilePanel } = useUniDemoPanel()

/** 目录链接节点（与 @nuxt/content 的 body.toc.links 结构一致） */
interface TocLinkItem {
    id: string
    text: string
    depth: number
    children?: TocLinkItem[]
}

/**
 * 「使用建议」这几节要从正文搬到 ComponentViewer 的 suggestion 面板里。
 *
 * 搬运在数据层做，不在 DOM 层做：这些标题写在 ::ComponentViewer 块之外（块是自闭合的），
 * 渲染出来是 ContentRenderer 的兄弟节点，DOM 层去搬等于跟 ContentRenderer 抢节点所有权。
 * 这里改的是传给 ContentRenderer 的 AST，渲染出来就已经没有这几节了。
 */
const SUGGESTION_HEADING_IDS = ['何时使用', '何时不使用', '注意事项']

/**
 * 按标题把正文 AST 切成「留在正文」与「搬进 suggestion 面板」两份。
 *
 * body.value 是一维数组：标题与它下面的内容是平级兄弟，不存在嵌套结构，
 * 所以只能顺序扫描——遇到目标标题开始收集，遇到同级或更高级的标题收尾。
 * 返回 null 表示不切分，正文原样渲染。
 */
const splitBody = computed(() => {
    const value = props.page?.body?.value
    if (!Array.isArray(value)) return null
    // 只有组件文档才搬。普通文档同样可能写「注意事项」，但没有承接它的面板，搬走就是内容丢失
    if (!value.some(node => Array.isArray(node) && node[0] === 'component-viewer')) return null

    const main: unknown[] = []
    const suggestion: unknown[] = []
    /** 正在收集的那节的标题层级；0 表示当前不在收集中 */
    let capturing = 0

    for (const node of value) {
        const tag = Array.isArray(node) ? node[0] : null
        const level = typeof tag === 'string' && /^h[1-6]$/.test(tag) ? Number(tag.slice(1)) : 0
        if (level) {
            const id = (node as any[])[1]?.id
            if (SUGGESTION_HEADING_IDS.includes(id)) {
                capturing = level
                suggestion.push(node)
                continue
            }
            if (capturing && level <= capturing) capturing = 0
        }
        ;(capturing ? suggestion : main).push(node)
    }

    return suggestion.length ? { main, suggestion } : null
})

/** 去掉已搬走的标题，否则悬浮目录会指向隐藏面板里的锚点，点了没反应 */
function pruneTocLinks(links: TocLinkItem[]): TocLinkItem[] {
    return links
        .filter(link => !SUGGESTION_HEADING_IDS.includes(link.id))
        .map((link) => {
            if (!link.children?.length) return link
            const { children: _original, ...rest } = link
            const children = pruneTocLinks(link.children)
            return children.length ? { ...rest, children } : rest
        })
}

/** 真正交给 ContentRenderer 的文档：切分过则用删减版正文，否则原样透传 */
const renderedPage = computed<Record<string, any>>(() => {
    const split = splitBody.value
    if (!split) return props.page
    const body = props.page.body
    return {
        ...props.page,
        body: {
            ...body,
            value: split.main,
            toc: { ...body?.toc, links: pruneTocLinks(body?.toc?.links ?? []) },
        },
    }
})

/** 搬出来的那几节，包成一份只含正文的文档片段给 ComponentTabs 渲染 */
const suggestionPage = computed<Record<string, any> | null>(() => {
    const split = splitBody.value
    if (!split) return null
    const body = props.page.body
    return {
        ...props.page,
        body: { ...body, value: split.suggestion, toc: { ...body?.toc, links: [] } },
    }
})

provide(suggestionContextKey, { value: suggestionPage })

/**
 * DOM 兜底目录：部分文档构建期拿不到 body.toc.links（如标题写在 MDC 组件插槽里），
 * 这类页面渲染完成后从正文 DOM 扫描 h2/h3 重建目录（仅客户端，SSR 时为空不影响水合）。
 * 组件文档的标题都在 ::ComponentViewer 块之外，构建期 TOC 是全的，走不到这条兜底。
 */
const bodyEl = ref<HTMLElement | null>(null)
const domTocLinks = ref<TocLinkItem[]>([])

function collectDomToc() {
    if (!bodyEl.value) return
    const links: TocLinkItem[] = []
    for (const el of bodyEl.value.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]')) {
        const id = el.id
        const text = el.textContent?.trim() ?? ''
        // 排除空 id / 空文本，以及隐藏区域（如未激活的代码 Tab 面板）内的标题——锚点滚动无法到达
        if (!id || !text || !el.offsetParent) continue
        const parent = links[links.length - 1]
        if (el.tagName === 'H3' && parent) {
            parent.children = parent.children ?? []
            parent.children.push({ id, text, depth: 3 })
        }
        else {
            links.push({ id, text, depth: el.tagName === 'H2' ? 2 : 3 })
        }
    }
    // 等值守卫：动画型 demo 会持续触发 MutationObserver，目录没变就不动响应式状态
    if (JSON.stringify(links) !== JSON.stringify(domTocLinks.value)) {
        domTocLinks.value = links
    }
}

/**
 * 正文标题是渐进渲染的：ComponentViewer 走 ClientOnly + 异步组件，
 * 首访时标题晚于本组件挂载；切换外层 Preview/Code Tab 也会改变标题可见性
 * （RebornTabs 的 destroyOnHidden 与 lazyLoad 都是 false，隐藏面板始终在 DOM 里，
 * 但它们的标题不应出现在目录里——collectDomToc 靠 offsetParent 把它们滤掉）。
 * 因此挂载后用 MutationObserver 持续跟踪正文变化重扫（300ms 去抖），
 * 而非只在挂载时扫一次。
 */
let tocObserver: MutationObserver | null = null
let tocRescanTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => nextTick(() => {
    collectDomToc()
    if (!bodyEl.value) return
    tocObserver = new MutationObserver(() => {
        if (tocRescanTimer) clearTimeout(tocRescanTimer)
        tocRescanTimer = setTimeout(collectDomToc, 300)
    })
    // data-tab-active 是 RebornTabs 打在每个标签按钮上的选中标记。RebornTabPane 用 v-show 藏面板，
    // 改的是内联 style，MutationObserver 按属性名过滤时根本收不到；而 destroyOnHidden/lazyLoad 双 false
    // 又意味着切 Tab 不产生 childList 变动，不盯这个属性的话目录切完 Tab 就停在旧值上。
    // 不直接盯 "style"：胶囊滑块的形变与 useResizeObserver 触发的重排都在逐帧写内联 style，
    // 每次都会把 300ms 去抖重新推后，collectDomToc 可能永远轮不上。
    // "hidden" / "data-state" 保留——正文里其他 Nuxt UI 控件仍靠这两个属性表达显隐。
    tocObserver.observe(bodyEl.value, {
        childList: true,
        subtree: true,
        attributeFilter: ["hidden", "data-state", "data-tab-active"],
    })
}))

onUnmounted(() => {
    tocObserver?.disconnect()
    if (tocRescanTimer) clearTimeout(tocRescanTimer)
})

// 布局层 UPage 以 route.path 为 key，路由切换会整体重挂载；watch 仅兜底同路径内容热替换
watch(() => props.page?.path, () => nextTick(collectDomToc))

/** 目录链接：优先构建期 TOC（取删减后的那份），为空时回退 DOM 扫描结果 */
const tocLinks = computed<TocLinkItem[]>(() => {
    const server = renderedPage.value?.body?.toc?.links ?? []
    return server.length ? server : domTocLinks.value
})

/** 目录标题：优先 app.config 配置，其次 i18n 文案 */
const tocTitle = computed(() => appConfig.toc?.title || mergedTexts.value.toc)

const github = computed(() => (appConfig.github ? appConfig.github : null))

/** 「编辑此页」的 GitHub 链接（由内容文件 stem/extension 推导） */
const editLink = computed(() => {
    if (!github.value) {
        return undefined
    }

    return [
        github.value.url,
        'edit',
        github.value.branch,
        github.value.rootDir,
        'content',
        `${props.page?.stem}.${props.page?.extension}`,
    ]
        .filter(Boolean)
        .join('/')
})
</script>

<template>
  <UPage :ui="{ right: 'lg:hidden', center: 'lg:col-span-10' }">
    <!-- hideHeader：组件总览等自带 Hero 的页面跳过默认页头，避免双标题 -->
    <UPageHeader
      v-if="!page.hideHeader"
      :description="page.description" :headline="headline" :ui="{
        wrapper: 'flex-row items-center flex-wrap justify-between',
      }"
    >
      <!--
        标题拆两段：英文名作主标题，中文名紧随其后弱化一档字色字重。
        走 #title 插槽而不是把两段拼成一个字符串传 :title，否则无法分别设样式；
        UPageHeader 的 h1 对 title prop 与 title 插槽二选一即渲染，所以不再传 :title。
        插槽上的 v-if 不能省：个别内容文件是空的（如 content/3.changelogs/all/index.md），
        标题为空时插槽必须整个不提供，否则 h1 判到「有插槽」照样渲染，落下一个空标题。
        gray 色阶自带明暗反转，不要加 dark: 变体。
      -->
      <template v-if="titleParts.en || titleParts.zh" #title>
        <span>{{ titleParts.en }}</span>
        <span v-if="titleParts.zh" class="ml-2 font-normal text-gray-7">{{ titleParts.zh }}</span>
      </template>

      <!-- 技术栈徽章：间距写在 ui.base 上而非 class —— RebornBadge 把 class 同时并进 root 与 base，写 class 会得到双份内边距；高度由 h-badge-md 固定，不需要 py -->
      <div v-if="page.tags?.length" class="mt-4 flex flex-wrap items-center gap-2">
        <RebornBadge
          v-for="tag in page.tags" :key="page.path + tag" :label="tag" variant="soft"
          :ui="{ base: 'px-3 font-normal' }"
        />
      </div>
      <template #links>
        <UButton v-for="(link, index) in page.links" :key="index" size="sm" v-bind="link" />

        <DocsPageHeaderLinks />
      </template>
    </UPageHeader>

    <UPageBody :class="page.hideHeader ? 'mt-0 space-y-8' : 'mt-2 space-y-8'">
      <!-- 正文容器 ref：DOM 兜底目录的扫描范围（避免收进页脚 / 周边区块的标题） -->
      <div ref="bodyEl" class="docs-prose min-w-0">
        <ContentRenderer :value="renderedPage" />
      </div>

      <USeparator>
        <div v-if="github" class="text-muted flex items-center gap-2 text-sm">
          <UButton
            variant="link" color="neutral" :to="editLink" target="_blank" icon="i-lucide-pen"
            :ui="{ leadingIcon: 'size-4' }"
          >
            {{ mergedTexts.edit }}
          </UButton>
          <span>{{ mergedTexts.or }}</span>
          <UButton
            variant="link" color="neutral" :to="`${github.url}/issues/new/choose`" target="_blank"
            icon="i-lucide-alert-circle" :ui="{ leadingIcon: 'size-4' }"
          >
            {{ mergedTexts.report }}
          </UButton>
        </div>
      </USeparator>
      <UContentSurround :surround="(surround as any)" />
    </UPageBody>

    <!-- <lg：保留原生 TOC 折叠条（UContentToc 自带移动端 sticky 折叠行为）；lg+ 该栅格列整体隐藏 -->
    <template v-if="tocLinks.length" #right>
      <UContentToc highlight :title="tocTitle" :links="(tocLinks as any)" />
    </template>

    <!-- lg+：右缘悬浮目录（刻度条 + 展开卡片，含社区链接）；有移动端面板时左移避让 -->
    <DocsFloatingToc :links="tocLinks" :title="tocTitle" :inset="hasMobilePanel" />
  </UPage>
</template>
