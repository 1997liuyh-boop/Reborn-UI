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

const appConfig = useAppConfig()

/** 合并默认英文文案与外部传入（i18n）文案 */
const mergedTexts = computed<DocsPageTexts>(() => ({
    edit: 'Edit this page',
    or: 'or',
    report: 'Report an issue',
    toc: 'Table of Contents',
    ...props.texts,
}))

/** 当前页是否有右侧移动端 demo 面板（决定悬浮目录是否左移避让） */
const { hasDemos: hasMobilePanel } = useUniDemoPanel()

/** 目录链接节点（与 @nuxt/content 的 body.toc.links 结构一致） */
interface TocLinkItem {
    id: string
    text: string
    depth: number
    children?: TocLinkItem[]
}

/**
 * DOM 兜底目录：组件文档页的标题（## API 等）都写在 ::ComponentViewer 的
 * MDC 插槽内，Nuxt Content 构建期不会把插槽内标题收进 body.toc.links，
 * 因此渲染完成后从正文 DOM 扫描 h2/h3 重建目录（仅客户端，SSR 时为空不影响水合）。
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
 * （unmount-on-hide=false，隐藏面板内的锚点不应出现在目录里）。
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
    tocObserver.observe(bodyEl.value, {
        childList: true,
        subtree: true,
        attributeFilter: ["hidden", "data-state"],
    })
}))

onUnmounted(() => {
    tocObserver?.disconnect()
    if (tocRescanTimer) clearTimeout(tocRescanTimer)
})

// 布局层 UPage 以 route.path 为 key，路由切换会整体重挂载；watch 仅兜底同路径内容热替换
watch(() => props.page?.path, () => nextTick(collectDomToc))

/** 目录链接：优先构建期 TOC，为空时回退 DOM 扫描结果 */
const tocLinks = computed<TocLinkItem[]>(() => {
    const server = props.page?.body?.toc?.links ?? []
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
    <UPageHeader
      :title="page.title" :description="page.description" :headline="headline" :ui="{
        wrapper: 'flex-row items-center flex-wrap justify-between',
      }"
    >
      <div v-if="page.tags?.length" class="mt-4 flex flex-wrap items-center gap-2">
        <UBadge
          v-for="tag in page.tags" :key="page.path + tag" :label="tag" variant="soft"
          class="px-3 py-1 font-normal"
        />
      </div>
      <template #links>
        <UButton v-for="(link, index) in page.links" :key="index" size="sm" v-bind="link" />

        <DocsPageHeaderLinks />
      </template>
    </UPageHeader>

    <UPageBody>
      <!-- 正文容器 ref：DOM 兜底目录的扫描范围（避免收进页脚 / 周边区块的标题） -->
      <div ref="bodyEl">
        <ContentRenderer :value="page" />
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
