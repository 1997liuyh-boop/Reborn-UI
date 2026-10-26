<script setup lang="ts">

const route = useRoute();

const isLandingPage = computed(() => {
  return route.path === "/";
});

const pageType = computed(() => isLandingPage.value ? "landing" : "docs");

definePageMeta({
  layout: false,
  // 首页自带页脚，不渲染 Docus 的全站页脚（app.vue 按 meta.footer 判断）
  footer: false,
  header: false,
  // 首页是固定白底的设计，锁定亮色：全站默认暗色，暗色下 gray 色阶反转，
  // 走马灯的 bg-gray-10 会变成白色、网格线 gray-2 会变成深灰，在白底上都不对
  colorMode: "light",
  middleware: (to) => {
    const isLanding = to.path === "/" || to.path === "//";
    setPageLayout(isLanding ? false : "docs");
  },
});

const collectionName = computed(() => pageType.value);

// 先在组件 setup 中读取导航注入，再进入 Nuxt 的异步上下文。
const pageRequest = useDocsPageData(collectionName);
const { page, surround, headline } = await pageRequest;

const title = computed(() => page.value?.seo?.title || page.value?.title);
const description = computed(() => page.value?.seo?.description || page.value?.description);

useSeoMeta({
  title: isLandingPage.value ? "Reborn UI — 跨端 Vue 组件库" : title.value,
  ogTitle: isLandingPage.value ? "Reborn UI — 跨端 Vue 组件库" : title.value,
  description: isLandingPage.value
    ? "面向 Web 与 UniApp 的 Vue 组件库，使用 TypeScript 与 Tailwind CSS，支持按需安装组件源码与自由定制。"
    : description.value,
  ogDescription: isLandingPage.value
    ? "面向 Web 与 UniApp 的 Vue 组件库，使用 TypeScript 与 Tailwind CSS，支持按需安装组件源码与自由定制。"
    : description.value,
});

defineOgImageComponent("Docs", {
  headline: headline.value,
});
</script>

<template>
  <!-- 文档页共享模板：布局细节统一收敛在 DocsPage -->
  <DocsPage
    v-if="page && !isLandingPage"
    :page="page"
    :surround="surround"
    :headline="headline"
  />
  <!-- 首页全宽渲染，各区块自行用 max-w 约束内容宽度 -->
  <Landing v-else-if="page && isLandingPage" />
</template>
