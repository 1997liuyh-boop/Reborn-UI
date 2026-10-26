<script setup lang="ts">

const route = useRoute();
const { locale, isEnabled, t } = useDocusI18n();

const isLandingPage = computed(() => {
  return (isEnabled.value ? `/${locale.value}` : "/") === route.path.replace(/\/$/, "");
});

const pageType = computed(() => isLandingPage.value ? "landing" : "docs");

definePageMeta({
  layout: false,
  middleware: (to) => {
    // Match /en or /en/ (with or without trailing slash)
    const localeMatch = to.path.match(/^\/([a-z]{2})\/?$/);
    const isLanding = to.path === "/" || to.path === "//" || localeMatch !== null;

    setPageLayout(isLanding ? "default" : "docs");
  },
});

const collectionName = computed(() => (isEnabled.value ? `${pageType.value}_${locale.value}` : pageType.value));

// 先在组件 setup 中读取导航注入，再进入 Nuxt 的异步上下文。
const pageRequest = useDocsPageData(collectionName);
const { page, surround, headline } = await pageRequest;

const title = computed(() => page.value?.seo?.title || page.value?.title);
const description = computed(() => page.value?.seo?.description || page.value?.description);

useSeoMeta({
  title: isLandingPage.value ? "Reborn UI" : title.value,
  ogTitle: isLandingPage.value ? "Reborn UI" : title.value,
  description: isLandingPage.value ? "Be yourself" : description.value,
  ogDescription: isLandingPage.value ? "Be yourself" : description.value,
});

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
