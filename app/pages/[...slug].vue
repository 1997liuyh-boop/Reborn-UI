<script setup lang="ts">
import type { Collections, ContentNavigationItem, DocsCollectionItem } from "@nuxt/content";
import { findPageHeadline } from "@nuxt/content/utils";
import { kebabCase } from "scule";
import { addPrerenderPath } from "../utils/prerender";

definePageMeta({
    layout: "docs",
});

const route = useRoute();
const navigation = inject<Ref<ContentNavigationItem[]>>("navigation");

const collectionName = computed(() => "docs");

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
    title,
    ogTitle: title,
    description,
    ogDescription: description,
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
    <!-- 文档页共享模板：布局细节统一收敛在 DocsPage（四个 i18n 页面共用） -->
    <DocsPage v-if="page" :page="page" :surround="surround" :headline="headline" />
</template>
