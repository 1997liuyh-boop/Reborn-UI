<script setup lang="ts">
import { mapContentNavigation } from "@nuxt/ui/utils/content";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import { navigationKey } from "~/utils/docsNavigation";
import AppReadingProgress from "./AppReadingProgress.vue";
import AppToolsFab from "./AppToolsFab.vue";

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

/** 顶级分类：桌面端收进胶囊右侧的快捷菜单，移动端抽屉里平铺 */
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

const quickMenuOptions = computed(() => sectionItems.value.map((item) => ({ label: String(item.label), value: String(item.to) })));

/** 快捷菜单显示当前所在分类；不在任何分类下（首页、演练场）时显示占位文字 */
const currentSection = computed(() => sectionItems.value.find((item) => item.active)?.to ?? null);

function onQuickMenuChange(to: unknown) {
  if (typeof to === "string" && to && !route.path.startsWith(to)) navigateTo(to);
}

/**
 * 平台开关只在组件分区出现：它筛选的是组件列表与组件预览，
 * 入门指南 / 更新日志等页面没有可筛选的对象，不展示以免误导。
 */
const showPlatformSwitch = computed(() => route.path.startsWith("/components"));

const githubUrl = computed(() => appConfig.github && appConfig.github.url ? String(appConfig.github.url) : "");

/** lg 起顶栏是悬浮胶囊，左右边界由侧栏与本页目录实测得到 */
const { vars: boundsVars, settled: boundsSettled } = useFloatingHeaderBounds();

/**
 * lg 起根节点只是一条透明的占位带（仍是 sticky 的 64px，正文的 -mt-16 / pt-16 不用改），
 * 不拦截点击；真正的顶栏是里面的容器：48px 高的毛玻璃胶囊，左右外边距取实测边界。
 */
const headerUi = computed(() => ({
  // 上下留白用根节点的内边距：写成容器的外边距会穿透 sticky 根节点折叠出去，吸顶后胶囊顶到视口上沿
  // app.config 给根节点的点阵纱网（背景图 + 模糊）在 lg 起挪到胶囊上，根节点本身全透明
  root: "lg:bg-none lg:border-b-0 lg:backdrop-blur-none lg:backdrop-saturate-100 lg:pointer-events-none lg:py-2",
  container: [
    "lg:pointer-events-auto lg:h-12 lg:w-auto lg:max-w-none lg:rounded-full lg:border lg:border-default lg:px-3 lg:shadow-lg lg:shadow-black/5",
    "lg:bg-default/40 lg:bg-[radial-gradient(transparent_1px,var(--ui-bg)_1px)] lg:bg-size-[4px_4px] lg:backdrop-blur-[6px] lg:backdrop-saturate-50",
    "lg:ms-(--app-header-left,16px) lg:me-(--app-header-right,16px)",
    boundsSettled.value ? "" : "lg:transition-[margin] lg:duration-300",
  ].join(" "),
  left: "flex-0!",
  center: "flex-1 min-w-0",
  right: "lg:flex-none",
}));
</script>

<template>
  <UHeader :ui="headerUi" :style="boundsVars" to="/" :title="appConfig.header?.title || site.name" mode="drawer">
    <!--
      阅读进度：浪带 + 船。lg 起外层框与胶囊重合并裁成同样的圆角，浪带贴着胶囊底边走；
      <lg 外层框铺满顶栏，与原先一样贴在顶栏底边。两者都不拦截点击。
    -->
    <template #top>
      <div
        class="pointer-events-none absolute inset-0 lg:inset-y-2 lg:right-(--app-header-right,16px) lg:left-(--app-header-left,16px) lg:overflow-hidden lg:rounded-full"
      >
        <AppReadingProgress />
      </div>
    </template>

    <AppHeaderCenter />

    <template #title>
      <!-- 纯色内联 SVG，跟随 text-default / 明暗主题 -->
      <AppHeaderLogo />
    </template>

    <template #right>
      <!-- 桌面端：组件分区的 Web / UniApp 平台开关 -->
      <DocsPlatformSwitch v-if="showPlatformSwitch" class="hidden lg:flex" />

      <!-- 桌面端：顶级分类收进快捷菜单 -->
      <RebornSelect
        v-if="quickMenuOptions.length"
        class="hidden w-36 lg:block"
        size="sm"
        variant="filled"
        placeholder="快捷菜单"
        :options="quickMenuOptions"
        :model-value="currentSection"
        :trigger-ui="{ trigger: 'rounded-full' }"
        aria-label="快捷菜单"
        @update:model-value="onQuickMenuChange"
      />

      <!-- 移动端：搜索与工具按钮留在顶栏；桌面端这组按钮收进左下角的悬浮菜单 -->
      <UContentSearchButton class="lg:hidden" />

      <div class="flex items-center gap-1.5 lg:hidden">
        <AssistantChat v-if="isAssistantEnabled" />
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
        <UButton
          v-if="githubUrl" icon="i-simple-icons-github" :to="githubUrl" target="_blank" aria-label="GitHub"
          color="neutral" variant="ghost"
        />
      </div>

      <!-- 桌面端工具菜单：挂到 body，与顶栏位置无关；颜色模式等状态只在客户端可知 -->
      <ClientOnly>
        <AppToolsFab :github-url="githubUrl" />
      </ClientOnly>
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
        <UButton
          v-for="item in sectionItems" :key="`m-${String(item.to)}`" :to="item.to" :label="item.label"
          color="neutral" variant="soft" size="sm" :class="item.active ? 'text-primary' : undefined"
        />
      </div>
      <AppHeaderBody />
    </template>
  </UHeader>
</template>
