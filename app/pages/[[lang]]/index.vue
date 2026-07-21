<script setup lang="ts">
import type { Collections, ContentNavigationItem, DocsEnCollectionItem } from "@nuxt/content";
import { findPageHeadline } from "@nuxt/content/utils";
import { kebabCase } from "scule";
import { addPrerenderPath } from "@/utils/prerender";

const route = useRoute();
const { locale, isEnabled, t } = useDocusI18n();
const navigation = inject<Ref<ContentNavigationItem[]>>("navigation");

const isLandingPage = computed(() => {
  return (isEnabled.value ? `/${locale.value}` : "/") === route.path.replace(/\/$/, "");
});

const pageType = isLandingPage.value ? "landing" : "docs";

definePageMeta({
  layout: false,
  middleware: (to) => {
    // Match /en or /en/ (with or without trailing slash)
    const localeMatch = to.path.match(/^\/([a-z]{2})\/?$/);
    const isLanding = to.path === "/" || to.path === "//" || localeMatch !== null;

    setPageLayout(isLanding ? "default" : "docs");
  },
});

const collectionName = computed(() => (isEnabled.value ? `${pageType}_${locale.value}` : pageType));

const [{ data: page, error: pageError }, { data: surround, error: surroundError }] = await Promise.all([
  useAsyncData(
    `content-${kebabCase(route.path || "index")}`,
    () =>
      queryCollection(collectionName.value as keyof Collections)
        .path(route.path)
        .first() as Promise<DocsEnCollectionItem>,
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
  <!-- 文档页共享模板：i18n 文案通过 texts 传入 -->
  <DocsPage v-if="page && !isLandingPage" :page="page" :surround="surround" :headline="headline" :texts="{
    edit: t('docs.edit'),
    or: t('common.or'),
    report: t('docs.report'),
    toc: t('docs.toc'),
  }" />
  <UPage v-else-if="page && isLandingPage">
    <UPageBody class="container mx-auto max-w-6xl px-4">
      <Landing />
    </UPageBody>
  </UPage>
</template>
