<script setup lang="ts">
/**
 * DocsPage —— 文档页共享模板
 *
 * [...slug].vue / [[lang]]/[...slug].vue / index.vue / [[lang]]/index.vue
 * 四个页面的文档分支共用本组件，布局调整只需改这一处。
 *
 * 布局要点：
 * - 本页目录走 UPage 的 #right 槽，由 DocsToc（RebornAnchor）渲染：
 *   lg+ 与正文并排成右栏（UPage 默认 8:2 栅格）并随页面吸顶，<lg 退化为置顶折叠条；
 * - 没有目录的页面不提供 #right 槽，正文占满整行。
 */

import { suggestionContextKey } from '~/components/common/component-viewer/types'
import { demoUsageContextKey } from '~/components/common/demo/types'
import { extractDemoSections } from '~/utils/extractDemoSections'
import { getComponentCode } from '~/utils/getComponentCode'
import { trimComponentDocBody } from '~/utils/trimComponentDocBody'

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

/** 目录链接节点（与 @nuxt/content 的 body.toc.links 结构一致） */
interface TocLinkItem {
    id: string
    text: string
    depth: number
    children?: TocLinkItem[]
    /** 锚点落在 ComponentTabs 的 Preview 面板里（示例卡片标题），目录滚动时要多让出吸顶 Tab 栏 */
    inDemo?: boolean
}

/**
 * 「使用建议」这几节要从正文搬到 ComponentViewer 的 suggestion 面板里。
 *
 * 搬运在数据层做，不在 DOM 层做：这些标题写在 ::ComponentViewer 块之外（块是自闭合的），
 * 渲染出来是 ContentRenderer 的兄弟节点，DOM 层去搬等于跟 ContentRenderer 抢节点所有权。
 * 这里改的是传给 ContentRenderer 的 AST，渲染出来就已经没有这几节了。
 */
const SUGGESTION_HEADING_IDS = ['何时使用', '何时不使用', '注意事项']

/** 正文里的 ::ComponentViewer 节点属性：据此定位 demo 源文件 */
const viewerAttrs = computed(() => {
    const value = props.page?.body?.value
    if (!Array.isArray(value)) return null
    const node = value.find(n => Array.isArray(n) && n[0] === 'component-viewer') as any[] | undefined
    if (!node) return null
    const attrs = node[1] ?? {}
    const demoFile = attrs.demoFile ?? attrs['demo-file']
    const componentId = attrs.componentId ?? attrs['component-id']
    return { demoFile: demoFile ? String(demoFile) : '', componentId: componentId ? String(componentId) : '' }
})

/** 从 demo 源码里取到的、正文裁剪与目录都要用的信息 */
interface DemoMeta {
    /** 所有 DemoSection 的标题 */
    titles: string[]
    /** Playground 的标题（title="…" 字面量），没写演练场时为空 */
    playgroundTitle: string
}

/**
 * demo 里所有 DemoSection 的标题，以及演练场的标题。
 * 走 useAsyncData 而不是等 ComponentTabs 客户端加载源码：正文裁剪要在 SSR 阶段就定下来，
 * 否则首屏先渲染出「用法」各小节、水合后再消失，会有一次明显跳动。只序列化标题，不带源码。
 */
const { data: demoMeta } = useAsyncData(
    () => `demo-meta:${viewerAttrs.value?.componentId || 'none'}`,
    async (): Promise<DemoMeta> => {
        const empty: DemoMeta = { titles: [], playgroundTitle: '' }
        const attrs = viewerAttrs.value
        if (!attrs?.demoFile || !attrs.componentId) return empty
        const load = getComponentCode({ fileName: attrs.demoFile, id: attrs.componentId, type: 'examples' })
        if (!load) return empty
        const raw = await (load as unknown as () => Promise<string>)()
        // 只认字面量 title="…"，与 DemoSection 标题的抽取口径一致（动态绑定拿不到值）
        const playgroundTitle = raw.match(/<Playground\s[^>]*?\stitle="([^"]*)"/)?.[1] ?? ''
        return { titles: Object.keys(extractDemoSections(raw)), playgroundTitle }
    },
    { default: (): DemoMeta => ({ titles: [], playgroundTitle: '' }) },
)

/**
 * 按标题把正文 AST 切成「留在正文」与「搬进 suggestion 面板」两份，
 * 再把留在正文里、已由示例卡片承担的部分裁掉（见 utils/trimComponentDocBody）。
 *
 * body.value 是一维数组：标题与它下面的内容是平级兄弟，不存在嵌套结构，
 * 所以只能顺序扫描——遇到目标标题开始收集，遇到同级或更高级的标题收尾。
 * 必须先搬再裁：何时使用 / 何时不使用是 `## 简介` 下的三级标题，先裁简介就把它们一起丢了。
 * 返回 null 表示非组件文档，正文原样渲染。
 */
const splitBody = computed(() => {
    const value = props.page?.body?.value
    if (!Array.isArray(value)) return null
    // 只有组件文档才处理。普通文档同样可能写「注意事项」，但没有承接它的面板，搬走就是内容丢失
    if (!viewerAttrs.value) return null

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

    const trimmed = trimComponentDocBody(main, demoMeta.value?.titles ?? [])
    return { main: trimmed.value, suggestion, removedH2: trimmed.removedH2, usage: trimmed.usage }
})

/**
 * 目录裁剪：
 * - 去掉已搬进 suggestion 面板的标题，否则目录会指向隐藏面板里的锚点，点了没反应；
 * - 去掉已裁掉的二级标题（简介 / 用法）。用法的子项原样提到顶层：
 *   示例卡片标题沿用了这些小节的锚点 id，链接仍然有效。这些锚点落在 Preview 面板里、
 *   上方压着吸顶 Tab 栏，打上 inDemo 让 DocsToc 滚过去时多让出这条栏的高度。
 */
function pruneTocLinks(links: TocLinkItem[], removedH2: Set<string>): TocLinkItem[] {
    return links.flatMap((link): TocLinkItem[] => {
        if (SUGGESTION_HEADING_IDS.includes(link.id)) return []
        if (removedH2.has(link.id)) {
            return link.id === '用法'
                ? (link.children ?? []).map(child => ({ ...child, depth: 2, inDemo: true }))
                : []
        }
        if (!link.children?.length) return [link]
        const { children: _original, ...rest } = link
        const children = pruneTocLinks(link.children, removedH2)
        return [children.length ? { ...rest, children } : rest]
    })
}

/** 真正交给 ContentRenderer 的文档：处理过则用删减版正文，否则原样透传 */
const renderedPage = computed<Record<string, any>>(() => {
    const split = splitBody.value
    if (!split) return props.page
    const body = props.page.body
    return {
        ...props.page,
        body: {
            ...body,
            value: split.main,
            toc: { ...body?.toc, links: pruneTocLinks(body?.toc?.links ?? [], split.removedH2) },
        },
    }
})

/** 搬出来的那几节，包成一份只含正文的文档片段给 ComponentTabs 渲染 */
const suggestionPage = computed<Record<string, any> | null>(() => {
    const split = splitBody.value
    if (!split?.suggestion.length) return null
    const body = props.page.body
    return {
        ...props.page,
        body: { ...body, value: split.suggestion, toc: { ...body?.toc, links: [] } },
    }
})

provide(demoUsageContextKey, computed(() => splitBody.value?.usage ?? {}))
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

/**
 * 目录链接：优先构建期 TOC（取删减后的那份），为空时回退 DOM 扫描结果。
 * 组件文档再把演练场排在最前：它不是 md 标题，构建期目录里没有它，
 * 但 Playground 把标题渲染成带 id 的 h2（id 就是标题文本），锚点是现成的。
 * 它同样在 Preview 面板里、上方压着吸顶 Tab 栏，所以也打 inDemo。
 */
const tocLinks = computed<TocLinkItem[]>(() => {
    const server = renderedPage.value?.body?.toc?.links ?? []
    const links = server.length ? server : domTocLinks.value
    const playground = viewerAttrs.value ? demoMeta.value?.playgroundTitle : ''
    // DOM 兜底目录扫的是 h2[id]，走到那条路时演练场已经在列表里，不再重复加
    if (!playground || links.some(link => link.id === playground)) return links
    return [{ id: playground, text: playground, depth: 2, inDemo: true }, ...links]
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
  <!-- 右栏目录：lg+ 与正文并排（UPage 默认 8:2 栅格），<lg 由同一组件退化为置顶折叠条 -->
  <UPage>
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

    <!-- 本页目录（RebornAnchor 滚动跟随 + 社区链接）；槽内只能有这一个根节点，栅格类由 UPage 合并到它身上 -->
    <template v-if="tocLinks.length" #right>
      <DocsToc :links="tocLinks" :title="tocTitle" />
    </template>
  </UPage>
</template>
