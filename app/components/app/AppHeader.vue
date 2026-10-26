<script setup lang="ts">
import { mapContentNavigation } from "@nuxt/ui/utils/content";
import { navigationKey } from "~/utils/docsNavigation";
import AppReadingProgress from "./AppReadingProgress.vue";

const appConfig = useAppConfig();
const site = useSiteConfig();
const route = useRoute();

// AI 助手开关:由 Docus assistant 模块提供,构建期存在 AI_GATEWAY_API_KEY 时启用
const { isEnabled: isAssistantEnabled } = useAssistant();

const navigation = inject(navigationKey, undefined);

/**
 * 顶部分类显示文案：保持英文混排
 * 入门指南 / Components / Changelogs / Composables
 */
const SECTION_LABELS: Record<string, string> = {
  "/getting-started": "入门指南",
  "/components": "Components",
  "/changelogs": "Changelogs",
  "/composables": "Composables",
};

/**
 * 顶部分类导航（对齐 Arco header）：
 * 分类链放在右侧工具区左侧；原先独立的 AppHeaderNav 二级栏已取消。
 */
const sectionItems = computed(() =>
  mapContentNavigation(
    navigation?.value?.map((item) => ({ ...item, children: undefined })) ?? [],
  )?.map((item) => {
    const to = String(item.to ?? "");
    return {
      ...item,
      label: SECTION_LABELS[to] ?? item.label,
      active: route.path.startsWith(to),
    };
  }) ?? [],
);

/**
 * 平台开关只在组件分区出现：它筛选的是组件列表与组件预览，
 * 入门指南 / 更新日志等页面没有可筛选的对象，不展示以免误导。
 */
const showPlatformSwitch = computed(() => route.path.startsWith("/components"));

const links = computed(() =>
  appConfig.github && appConfig.github.url
    ? [
      {
        icon: "i-simple-icons-github",
        to: appConfig.github.url,
        target: "_blank",
        "aria-label": "GitHub",
      },
    ]
    : [],
);
</script>

<template>
  <UHeader :ui="{ center: 'flex-1', left: 'flex-0!' }" to="/" :title="appConfig.header?.title || site.name"
    mode="drawer">
    <!--
      阅读进度：浪带 + 船，都挂在顶栏根节点内（根节点 sticky 定位，是它们的包含块；z-50 自成层叠上下文）。
      层级从下到上：导航内容 → 船（z-10）→ 浪带（z-20）。
      浪带盖在船上，半透明的浪罩住船身下沿，船才像吃水浮在浪里，而不是摆在浪尖上；
      浪带只占底部 8px，那里没有按钮，放到内容之上不挡任何东西。
      船的桅杆会伸到按钮所在的高度，所以也放在内容之上，否则会被实心的搜索框挡住一截。两者都不拦截点击。
    -->
    <template #top>
      <AppReadingProgress />
    </template>

    <AppHeaderCenter />

    <template #title>
      <!-- 纯色内联 SVG，跟随 text-default / 明暗主题 -->
      <AppHeaderLogo />
    </template>

    <template #right>
      <!-- 桌面端：组件分区的 Web / UniApp 平台开关，置于分类导航之前 -->
      <template v-if="showPlatformSwitch">
        <DocsPlatformSwitch class="hidden lg:flex" />
        <USeparator orientation="vertical" class="mx-1 hidden h-5 lg:block" />
      </template>

      <!-- 桌面端：分类导航贴近右侧工具区（Ask AI / 主题 / GitHub） -->
      <nav v-if="sectionItems.length" class="mr-1 hidden items-center gap-0.5 lg:flex" aria-label="文档分类">
        <UButton v-for="item in sectionItems" :key="String(item.to)" :to="item.to" :label="item.label" color="neutral"
          variant="ghost" size="sm" class="px-2.5 font-medium" :class="item.active
            ? 'text-primary bg-primary/8 hover:bg-primary/12 hover:text-primary'
            : 'text-muted hover:text-default'" />
      </nav>

      <USeparator v-if="sectionItems.length" orientation="vertical" class="mx-1 hidden h-5 lg:block" />

      <AppHeaderCTA />

      <template v-if="isAssistantEnabled">
        <AssistantChat />
      </template>

      <UContentSearchButton class="lg:hidden" />

      <ClientOnly>
        <AppThemePicker />
        <UColorModeButton />

        <template #fallback>
          <div class="flex items-center gap-2">
            <div class="h-8 w-8 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
            <div class="h-8 w-8 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </template>
      </ClientOnly>

      <template v-if="links?.length">
        <UButton v-for="(link, index) of links" :key="index" v-bind="{ color: 'neutral', variant: 'ghost', ...link }" />
      </template>
    </template>

    <template #toggle="{ open, toggle }">
      <IconMenuToggle :open="open" class="lg:hidden" @click="toggle" />
    </template>

    <template #body>
      <!-- 移动端抽屉：平台开关 + 分类导航置顶，下面是按平台裁剪后的内容树 -->
      <div v-if="showPlatformSwitch" class="mb-4 lg:hidden">
        <DocsPlatformSwitch block />
      </div>
      <div v-if="sectionItems.length" class="mb-4 flex flex-wrap gap-1 border-b border-default/40 pb-4 lg:hidden">
        <UButton v-for="item in sectionItems" :key="`m-${String(item.to)}`" :to="item.to" :label="item.label"
          color="neutral" variant="soft" size="sm" :class="item.active ? 'text-primary' : undefined" />
      </div>
      <AppHeaderBody />
    </template>
  </UHeader>
</template>
