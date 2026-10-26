<script setup lang="ts">

definePageMeta({
    layout: "docs",
});



const collectionName = computed(() => "docs");

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
    <!-- 文档页共享模板：布局细节统一收敛在 DocsPage（四个 i18n 页面共用） -->
    <DocsPage v-if="page" :page="page" :surround="surround" :headline="headline" />
</template>
