<template>
    <UPage :ui="{ right: 'lg:hidden', center: 'lg:col-span-10' }">
        <UPageHeader :title="page.title" :description="page.description" :headline="headline" :ui="{
            wrapper: 'flex-row items-center flex-wrap justify-between',
        }">
            <div v-if="page.tags?.length" class="mt-4 flex flex-wrap items-center gap-2">
                <UBadge v-for="tag in page.tags" :key="page.path + tag" :label="tag" variant="soft"
                    class="px-3 py-1 font-normal" />
            </div>
            <template #links>
                <UButton v-for="(link, index) in page.links" :key="index" size="sm" v-bind="link" />

                <DocsPageHeaderLinks />
            </template>
        </UPageHeader>

        <UPageBody>
            <ContentRenderer :value="page" />

            <USeparator>
                <div v-if="github" class="text-muted flex items-center gap-2 text-sm">
                    <UButton variant="link" color="neutral" :to="editLink" target="_blank" icon="i-lucide-pen"
                        :ui="{ leadingIcon: 'size-4' }">
                        {{ mergedTexts.edit }}
                    </UButton>
                    <span>{{ mergedTexts.or }}</span>
                    <UButton variant="link" color="neutral" :to="`${github.url}/issues/new/choose`" target="_blank"
                        icon="i-lucide-alert-circle" :ui="{ leadingIcon: 'size-4' }">
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

        <!-- lg+：右缘悬浮目录（刻度条 + 展开卡片，含社区链接） -->
        <DocsFloatingToc :links="tocLinks" :title="tocTitle" />
    </UPage>
</template>

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

/** 目录链接（无 TOC 的页面为空数组） */
const tocLinks = computed(() => props.page?.body?.toc?.links ?? [])

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
