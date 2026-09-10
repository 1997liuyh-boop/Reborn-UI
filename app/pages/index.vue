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
  header: false,
  middleware: (to) => {
    const isLanding = to.path === "/" || to.path === "//";
    setPageLayout(isLanding ? false : "docs");
  },
});

const collectionName = computed(() => pageType);

const [{ data: page, error: pageError }, { data: surround }] =
  await Promise.all([
    useAsyncData(
      `content-${kebabCase(route.path || "index")}`,
      () =>
        queryCollection(collectionName.value as keyof Collections)
          .path(route.path)
          .first() as Promise<DocsCollectionItem>,
    ),
    useAsyncData(`content-${kebabCase(route.path || "index")}-surround`, () => {
      return queryCollectionItemSurroundings(
        collectionName.value as keyof Collections,
        route.path,
        {
          fields: ["description"],
        },
      );
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

// 将页面路径加入预渲染列表。
addPrerenderPath(`/raw${route.path}.md`);

const title = page.value.seo?.title || page.value.title;
const description = page.value.seo?.description || page.value.description;

useSeoMeta({
  title: isLandingPage.value ? "Reborn UI — 跨端 Vue 组件库" : title,
  ogTitle: isLandingPage.value ? "Reborn UI — 跨端 Vue 组件库" : title,
  description: isLandingPage.value
    ? "面向 Web 与 UniApp 的 Vue 组件库，使用 TypeScript 与 Tailwind CSS，支持按需安装组件源码与自由定制。"
    : description,
  ogDescription: isLandingPage.value
    ? "面向 Web 与 UniApp 的 Vue 组件库，使用 TypeScript 与 Tailwind CSS，支持按需安装组件源码与自由定制。"
    : description,
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
  <DocsPage
    v-if="page && !isLandingPage"
    :page="page"
    :surround="surround"
    :headline="headline"
  />
  <!-- 首页全宽渲染，各区块自行用 max-w 约束内容宽度 -->
  <Landing v-else-if="page && isLandingPage" />
</template>
