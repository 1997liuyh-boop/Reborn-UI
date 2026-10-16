<script setup lang="ts">
/**
 * 应用根组件：覆盖 Docus 层的 app.vue
 *
 * 与上游的差异：
 * 1. 查询多带出 `platform` / `category` / `series` 字段（queryCollectionNavigation 的 extraFields）；
 * 2. transform 阶段把组件分区从「目录 → 组件」重组为「系列 → 分类 → 组件」（useComponentsCatalog），
 *    侧栏、移动端抽屉、页头 headline 共用；平台开关的裁剪仍在各消费方按档位进行；
 * 3. AI 助手面板换成基于 RebornDrawer 的 AppAssistantDrawer。抽屉带遮罩盖在页面上方，
 *    上游那层「按面板宽度给正文加 margin-right」的推挤随之去掉，否则遮罩下的整站会被挤窄并重排。
 * 其余（i18n 回退、搜索索引）与 Docus 5.6.1 保持一致，升级 Docus 时需对照同步。
 */
import type { ContentNavigationItem, DocsCollectionItem, PageCollections } from "@nuxt/content";
import * as nuxtUiLocales from "@nuxt/ui/locale";

/** Docus 的 AppConfig 类型增强不在本项目 tsconfig 范围内，这里按其声明手动收窄 */
const { seo } = useAppConfig() as { seo: { titleTemplate?: string; title?: string; description?: string } };
const site = useSiteConfig();
const { locale, locales, isEnabled, switchLocalePath } = useDocusI18n();
const { isEnabled: isAssistantEnabled } = useAssistant();

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

/**
 * 全局回到顶部：右侧 uniapp 手机面板（2xl 起 fixed 贴右缘、420px 宽、z-30）可见时，
 * 按钮跟着左移到面板外侧，否则 z-50 的按钮会压在手机模拟器上。
 */
const { isPanelVisible } = useUniDemoPanel();
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <div>
      <AppHeader v-if="$route.meta.header !== false" />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <AppFooter v-if="$route.meta.footer !== false" />
    </div>

    <!--
      全局回到顶部 + 去底部，40px 方形按钮、24px 图标，带滚动进度（回到顶部顺时针、去底部逆时针）。
      上下两个实例各自显隐、位置固定：回到顶部在上，bottom = 180 + 按钮 40 + 间距 8，
      一个消失时另一个不挪位，指针下的按钮不会突然换成另一个。
      BackTop 自己的文档页不挂：页内 demo 有同位置的实例，按钮会叠在一起。
    -->
    <template v-if="!$route.path.endsWith('/reborn-back-top')">
      <RebornBackTop
        :bottom="228"
        show-progress
        color="info"
        size="md"
        shape="square"
        icon="lucide:arrow-big-up"
        :ui="{ wrapper: ['z-50', isPanelVisible && '2xl:right-[420px]'], icon: 'size-6' }"
      />
      <RebornBackTop
        direction="bottom"
        :bottom="180"
        show-progress
        color="info"
        size="md"
        shape="square"
        icon="lucide:arrow-big-down"
        :ui="{ wrapper: ['z-50', isPanelVisible && '2xl:right-[420px]'], icon: 'size-6' }"
      />
    </template>

    <ClientOnly>
      <LazyUContentSearch :files="files" :navigation="navigation" />
      <template v-if="isAssistantEnabled">
        <LazyAppAssistantDrawer />
        <LazyAssistantFloatingInput />
      </template>
    </ClientOnly>
  </UApp>
</template>
