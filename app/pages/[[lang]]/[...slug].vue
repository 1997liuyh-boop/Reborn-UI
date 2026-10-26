<script setup lang="ts">

definePageMeta({
  layout: "docs",
});


const { locale, isEnabled, t } = useDocusI18n();

const collectionName = computed(() => (isEnabled.value ? `docs_${locale.value}` : "docs"));

// 先在组件 setup 中读取导航注入，再进入 Nuxt 的异步上下文。
const pageRequest = useDocsPageData(collectionName);
const { page, surround, headline } = await pageRequest;

const title = computed(() => page.value?.seo?.title || page.value?.title);
const description = computed(() => page.value?.seo?.description || page.value?.description);

useSeoMeta({
  title,
  ogTitle: title.value,
  description,
  ogDescription: description.value,
});

defineOgImageComponent("Docs", {
  headline: headline.value,
});
</script>

<template>
  <!-- 文档页共享模板：i18n 文案通过 texts 传入 -->
  <DocsPage v-if="page" :page="page" :surround="surround" :headline="headline" :texts="{
    edit: t('docs.edit'),
    or: t('common.or'),
    report: t('docs.report'),
    toc: t('docs.toc'),
  }" />
</template>
