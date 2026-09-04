<script setup lang="ts">
import type { Collections, ContentNavigationItem, DocsCollectionItem } from "@nuxt/content";
import { findPageHeadline } from "@nuxt/content/utils";
import { kebabCase } from "scule";
import { addPrerenderPath } from "@/utils/prerender";

const route = useRoute();
const navigation = inject<Ref<ContentNavigationItem[]>>("navigation");

const isLandingPage = computed(() => {
    return route.path === "/";
});

const pageType = isLandingPage.value ? "landing" : "docs";

definePageMeta({
    layout: false,
    // 首页自带页脚，不渲染 Docus 的全站页脚（app.vue 按 meta.footer 判断）
    footer: false,
    middleware: (to) => {
        const isLanding = to.path === "/" || to.path === "//";
        setPageLayout(isLanding ? "default" : "docs");
    },
});

const collectionName = computed(() => pageType);

const [{ data: page, error: pageError }, { data: surround, error: surroundError }] = await Promise.all([
    useAsyncData(
        `content-${kebabCase(route.path || "index")}`,
        () =>
            queryCollection(collectionName.value as keyof Collections)
                .path(route.path)
                .first() as Promise<DocsCollectionItem>,
    ),
    useAsyncData(`content-${kebabCase(route.path || "index")}-surround`, () => {
        return queryCollectionItemSurroundings(collectionName.value as keyof Collections, route.path, {
            fields: ["description"],
        });
    }),
]);

if (pageError.value) {
    throw createError({
        statusCode: 500,
        statusMessage: pageError.value.message || "Internal Server Error",
        fatal: true,
    });
}

if (!page.value) {
    throw createError({
        statusCode: 404,
        statusMessage: `Page not found: ${route.path} in collection ${collectionName.value}`,
        fatal: true,
    });
}

// Add the page path to the prerender list
addPrerenderPath(`/raw${route.path}.md`);

const title = page.value.seo?.title || page.value.title;
const description = page.value.seo?.description || page.value.description;

useSeoMeta({
    title: isLandingPage.value ? "Reborn UI" : title,
    ogTitle: isLandingPage.value ? "Reborn UI" : title,
    description: isLandingPage.value ? "Be yourself" : description,
    ogDescription: isLandingPage.value ? "Be yourself" : description,
});

const headline = ref(findPageHeadline(navigation?.value, page.value?.path));
watch(
    () => navigation?.value,
    () => {
        headline.value = findPageHeadline(navigation?.value, page.value?.path) || headline.value;
    },
);

defineOgImageComponent("Docs", {
    headline: headline.value,
});
</script>

<template>
    <!-- 文档页共享模板：布局细节统一收敛在 DocsPage -->
    <DocsPage v-if="page && !isLandingPage" :page="page" :surround="surround" :headline="headline" />
    <!-- 首页全宽渲染，各区块自行用 max-w 约束内容宽度 -->
    <Landing v-else-if="page && isLandingPage" />
</template>
