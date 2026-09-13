<script setup lang="ts">
/**
 * 应用根组件：覆盖 Docus 层的 app.vue
 *
 * 与上游的差异只在导航树：
 * 1. 查询多带出 `platform` / `category` / `series` 字段（queryCollectionNavigation 的 extraFields）；
 * 2. transform 阶段把组件分区从「目录 → 组件」重组为「系列 → 分类 → 组件」（useComponentsCatalog），
 *    侧栏、移动端抽屉、页头 headline 共用；平台开关的裁剪仍在各消费方按档位进行。
 * 其余（i18n 回退、搜索索引、AI 助手面板推移正文）与 Docus 5.6.1 保持一致，升级 Docus 时需对照同步。
 */
import type { ContentNavigationItem, DocsCollectionItem, PageCollections } from "@nuxt/content";
import * as nuxtUiLocales from "@nuxt/ui/locale";

/** Docus 的 AppConfig 类型增强不在本项目 tsconfig 范围内，这里按其声明手动收窄 */
const { seo } = useAppConfig() as { seo: { titleTemplate?: string; title?: string; description?: string } };
const site = useSiteConfig();
const { locale, locales, isEnabled, switchLocalePath } = useDocusI18n();
const { isEnabled: isAssistantEnabled, panelWidth: assistantPanelWidth, shouldPushContent } = useAssistant();

const nuxtUiLocale = computed(() => nuxtUiLocales[locale.value as keyof typeof nuxtUiLocales] || nuxtUiLocales.en);
const lang = computed(() => nuxtUiLocale.value.code);
const dir = computed(() => nuxtUiLocale.value.dir);
const collectionName = computed(() => (isEnabled.value ? `docs_${locale.value}` : "docs"));

useHead({
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: {
    lang,
    dir,
  },
});

useSeoMeta({
  titleTemplate: seo.titleTemplate,
  title: seo.title,
  description: seo.description,
  ogSiteName: site.name,
  twitterCard: "summary_large_image",
});

if (isEnabled.value) {
  const route = useRoute();
  const defaultLocale = useRuntimeConfig().public.i18n.defaultLocale!;
  onMounted(() => {
    const currentLocale = route.path.split("/")[1];
    if (!locales.some((locale) => locale.code === currentLocale)) {
      return navigateTo(switchLocalePath(defaultLocale) as string);
    }
  });
}

/**
 * 导航树额外带出的 frontmatter 字段：platform 供平台开关筛选组件，
 * category / series 供组件分区按「系列 → 分类」重组。
 * 集合名按 docs 字面量收窄：fields 参数的类型取自集合 schema，
 * 用 keyof PageCollections 的联合会退化成各集合公共字段而丢掉这些字段。
 */
const NAVIGATION_EXTRA_FIELDS: Array<keyof DocsCollectionItem> = ["platform", "category", "series"];

// 组件分区在这里一次性重组为「系列 → 分类 → 组件」，侧栏、移动端抽屉、页头 headline 共用同一棵树
const { data: navigation } = await useAsyncData(
  () => `navigation_${collectionName.value}`,
  () => queryCollectionNavigation(collectionName.value as "docs", NAVIGATION_EXTRA_FIELDS),
  {
    transform: (data: ContentNavigationItem[]) =>
      regroupNavigationTree(transformNavigation(data, isEnabled.value, locale.value)),
    watch: [locale],
  },
);
const { data: files } = useLazyAsyncData(
  `search_${collectionName.value}`,
  () => queryCollectionSearchSections(collectionName.value as keyof PageCollections),
  {
    server: false,
    watch: [locale],
  },
);

provide("navigation", navigation);
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <div
      class="transition-[margin-right] duration-200 ease-linear will-change-[margin-right]"
      :style="{ marginRight: shouldPushContent ? `${assistantPanelWidth}px` : '0' }"
    >
      <AppHeader v-if="$route.meta.header !== false" />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <AppFooter v-if="$route.meta.footer !== false" />
    </div>

    <ClientOnly>
      <LazyUContentSearch :files="files" :navigation="navigation" />
      <template v-if="isAssistantEnabled">
        <LazyAssistantPanel />
        <LazyAssistantFloatingInput />
      </template>
    </ClientOnly>
  </UApp>
</template>
