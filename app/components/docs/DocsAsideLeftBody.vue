<script setup lang="ts">
/**
 * DocsAsideLeftBody —— 文档页左侧导航（覆盖 Docus 层同名组件）
 *
 * 展开态是拨轮（DocsWheel）：把导航树拍平成页面列表，在顶部显示当前条目的分类。
 * 在侧栏上滚动滚轮只转拨轮，点中线卡片、箭头或任意页面才跳转；路由变化后拨轮转到当前页。
 *
 * 折叠态（useDocsAside，按钮在 layouts/docs.vue）是 RebornMenu 的 64px 窄轨：每个分区只剩一枚图标，
 * 点击弹出浮层，浮层里按分类分组列出全部页面；一个分区可能有上百个页面，浮层限高并可滚动。
 * 窄轨菜单始终渲染、展开态用 v-show 藏起来，原因见模板里 #icon 插槽的说明。
 *
 * 适用端 / New 等徽标不出现：适用端由顶栏的 Web / UniApp 开关统一筛选
 * （useNavigation 已按档位裁剪），组件分区顶部只留一行当前菜单分类与平台的说明。
 */
import type { ContentNavigationItem } from "@nuxt/content";
import type { DocsWheelRow } from "./DocsWheel.vue";
import type { MenuUI } from "~/components/reborn/ui/reborn-menu/reborn-menu.config";
import VariableLetterText from "~/components/reborn/ui/variable-letter-text/VariableLetterText.vue";
import { navigationKey } from "~/utils/docsNavigation";

const navigation = inject(navigationKey, undefined);
const { nav } = useNavigation(navigation);
const { platform } = useDocsPlatform();
const route = useRoute();
/** 侧栏折叠状态：按钮与栅格切换都在 layouts/docs.vue，这里只把它交给菜单 */
const { collapsed } = useDocsAside();

/** 当前是否在组件分区：平台说明行只在这里出现 */
const isComponentsSection = computed(() => route.path.startsWith("/components"));

/** 平台说明行文案 */
const platformCaption = computed(() =>
  platform.value === "uniapp" ? "UniApp 端组件" : "Web 端组件",
);

/** 虚拟分组节点（分类小标题）：不对应页面，只渲染标题与其子项 */
function isVirtualGroup(item: ContentNavigationItem): boolean {
  return item.page === false && !!item.children?.length;
}

/**
 * 分区的菜单 key。
 * 扁平分区（如入门指南）会被 useNavigation 包成 { title: 'Overview', path: 首页路径 }，
 * path 与它第一个页面的路径相同，直接当 key 会与那个页面的 key 撞上，所以加前缀区分。
 */
function sectionKey(section: ContentNavigationItem): string {
  return `section:${section.path}`;
}

/** 去掉尾斜杠，路由与导航两边的路径按同一口径比对 */
function normalizePath(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

// ---- 折叠态窄轨里的分区图标 ----

/** 组件分区的两个系列：导航节点是重组出来的虚拟节点，没有自带图标 */
const SERIES_ICONS: Record<string, string> = {
  reborn: "lucide:blocks",
  community: "lucide:package-open",
};

/**
 * 分区图标的取值顺序：导航节点自带的 icon（.navigation.yml 里写的）→ 组件系列 →
 * 所在顶级分区的 icon（入门指南 lucide:rocket、Composables tabler:function……）→ 文件夹兜底。
 * 扁平分区被包成的「Overview」没有自己的图标，走的就是第三档。
 */
function sectionIcon(section: ContentNavigationItem): string {
  if (typeof section.icon === "string" && section.icon) return section.icon;
  const seriesIcon = typeof section.series === "string" ? SERIES_ICONS[section.series] : undefined;
  if (seriesIcon) return seriesIcon;
  const topPath = `/${route.path.split("/").filter(Boolean)[0] ?? ""}`;
  const top = toValue(navigation)?.find((item) => item.path === topPath);
  return typeof top?.icon === "string" && top.icon ? top.icon : "lucide:folder";
}

// ---- 选中项：由路由推导完整路径 ----

/**
 * 页面路径 → 菜单路径（分区 key → 页面 key）。
 * RebornMenu 的 selectedKeys 存的是完整路径而非单个 key，祖先高亮依赖这一点；
 * 分组（RebornMenuItemGroup）不是子菜单、不下发路径，所以分类不出现在路径里。
 */
const pathIndex = computed(() => {
  const map = new Map<string, string[]>();
  for (const section of nav.value) {
    const base = [sectionKey(section)];
    for (const item of section.children ?? []) {
      if (isVirtualGroup(item)) {
        for (const child of item.children ?? []) {
          map.set(normalizePath(child.path), [...base, child.path]);
        }
        continue;
      }
      map.set(normalizePath(item.path), [...base, item.path]);
      // 目录页的下级页面与它平级列出（都是 RebornMenuItem），路径里不含目录页自身
      for (const child of item.children ?? []) {
        map.set(normalizePath(child.path), [...base, child.path]);
      }
    }
  }
  return map;
});

const selectedKeys = shallowRef<string[]>([]);

watch(
  [() => route.path, pathIndex],
  () => {
    selectedKeys.value = pathIndex.value.get(normalizePath(route.path)) ?? [];
  },
  { immediate: true },
);

// ---- 拨轮（展开态）：导航树拍平成一列 ----

const wheelRows = computed<DocsWheelRow[]>(() => {
  const rows: DocsWheelRow[] = [];
  for (const section of nav.value) {
    for (const item of section.children ?? []) {
      if (isVirtualGroup(item)) {
        for (const child of item.children ?? []) {
          rows.push({ key: child.path, label: child.title, category: item.title });
        }
        continue;
      }
      rows.push({ key: item.path, label: item.title, category: section.title });
      // 目录页的下级页面缩进一档
      for (const child of item.children ?? []) {
        rows.push({ key: child.path, label: child.title, depth: 2, category: section.title });
      }
    }
  }
  return rows;
});

/** 当前路由对应的行 key；路由与导航的尾斜杠口径可能不同，按规范化后的路径比对 */
const currentRowKey = computed(() => {
  const current = normalizePath(route.path);
  return wheelRows.value.find((row) => normalizePath(row.key) === current)?.key;
});

function onWheelConfirm(row: DocsWheelRow) {
  navigateTo(row.key);
}

// ---- 窄轨菜单（折叠态）的样式覆盖 ----

/**
 * 根节点去掉卡片投影与底色让菜单融入侧栏，图标行之间留 4px。
 * 分区浮层限高在顶栏以下一屏之内并可滚动——「Reborn 组件」有一百多个页面，不限高的浮层会超出视口。
 * 96px = 顶栏 64px + 浮层贴边定位时留的 8px 安全距离，再留些余量。
 */
const menuUi: MenuUI = {
  root: "shadow-none bg-transparent",
  menu: "gap-y-1",
  subMenuContent: "max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain",
};

/** 分区只剩图标：沿用组件默认的 px-4 让图标框落在 64px 窄轨正中 */
const sectionUi: MenuUI = { menuItem: "rounded-md active:scale-100" };

/** 浮层里的分类分组：标题 14px 主色、不大写不加字距，右侧带组件数徽标 */
const groupUi: MenuUI = {
  menuItemGroupTitle:
    "px-3 pt-0 pb-1 text-[14px] leading-[20px] font-medium normal-case tracking-normal text-primary",
  menuItemGroupContent: "gap-y-0.5",
};

/** 浮层里的页面条目：14px 单行截断，去掉选中态的投影与按压缩放 */
const pageUi: MenuUI = {
  menuItem: "rounded-md px-3 py-2 shadow-none active:scale-100",
  menuItemTitle: "text-[14px] leading-[20px] font-normal",
};

/** 目录页的下级页面：左侧再缩进一档、字号略小 */
const subPageUi: MenuUI = {
  menuItem: "rounded-md py-1.5 pr-3 pl-6 shadow-none active:scale-100",
  menuItemTitle: "text-[12.5px] leading-[18px] font-normal",
};
</script>

<template>
  <div>
    <!-- 展开态：顶部显示拨轮中线所处的分类和当前平台 -->
    <DocsWheel
      v-show="!collapsed" :rows="wheelRows" :current-key="currentRowKey" label="文档导航"
      class="h-dvh"
      @confirm="onWheelConfirm"
    >
      <template v-if="isComponentsSection" #header="{ row }">
        <div class="px-3 py-2 text-lg text-gray-8 xl:pl-10">
          <VariableLetterText
            :label="row?.category ? `${row.category}  ${platformCaption}` : platformCaption"
            class="block font-[family-name:DocsNavVariable,var(--font-sans)]"
          />
        </div>
      </template>
    </DocsWheel>

    <!--
      折叠态：64px 窄轨，分区点开是浮层。
      始终渲染、展开态只是藏起来，而不是 v-if 到折叠时才挂：Nuxt Icon 的 css 模式在图标首次出现时
      往 head 最前面插一个 style，整页样式随之重算（这页六千多个节点，一次一两百毫秒）；
      首屏渲染出来，规则在 SSR 阶段随页面一起下发，折叠时就没有注入。
    -->
    <RebornMenu
      v-show="collapsed"
      v-model:selected-keys="selectedKeys"
      mode="vertical"
      collapse
      :tooltip="true"
      menu-trigger="click"
      :unique-opened="false"
      expand-type="popup"
      :expand-mutex="false"
      :no-indent="true"
      color="primary"
      :show-active-background="true"
      router
      close-on-click-outside
      :ui="menuUi"
    >
      <RebornSubMenu
        v-for="section in nav"
        :key="sectionKey(section)"
        :index="sectionKey(section)"
        :ui="sectionUi"
      >
        <template #icon>
          <Icon :name="sectionIcon(section)" class="size-4" />
        </template>
        <template #title>{{ section.title }}</template>

        <template v-for="item in section.children" :key="item.path">
          <!-- 组件分区的分类小标题：虚拟节点，渲染成分组标签，下面直接列组件页 -->
          <RebornMenuItemGroup v-if="isVirtualGroup(item)" class="pt-2 first:pt-0" :ui="groupUi">
            <template #title>
              <span class="flex min-w-0 items-center justify-between gap-2">
                <span class="min-w-0 truncate">{{ item.title }}</span>
                <!-- 该分类下的组件数：穿透子树数叶子，与顶部总数同一套口径 -->
                <RebornBadge :label="countNavigationLeaves(item.children)" square size="sm" />
              </span>
            </template>

            <RebornMenuItem v-for="child in item.children" :key="child.path" :index="child.path" :ui="pageUi">
              {{ child.title }}
            </RebornMenuItem>
          </RebornMenuItemGroup>

          <template v-else>
            <RebornMenuItem :index="item.path" :ui="pageUi">
              {{ item.title }}
            </RebornMenuItem>

            <!-- 真实目录节点（有页面）的下级页面：缩进一档列在目录页下方 -->
            <RebornMenuItem
              v-for="child in item.children ?? []" :key="child.path" :index="child.path" :ui="subPageUi"
            >
              {{ child.title }}
            </RebornMenuItem>
          </template>
        </template>
      </RebornSubMenu>
    </RebornMenu>
  </div>
</template>

<style scoped>
/* 仅为菜单分类及平台说明加载中文可变字重子集。 */
@font-face {
  font-family: DocsNavVariable;
  src: url('/fonts/noto-sans-sc-docs-nav.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}
</style>
