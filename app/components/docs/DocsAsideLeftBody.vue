<script setup lang="ts">
/**
 * DocsAsideLeftBody —— 文档页左侧导航（覆盖 Docus 层同名组件）
 *
 * - 只渲染分组标题与页面名称，不再有适用端 / New 等徽标：
 *   适用端由顶栏的 Web / UniApp 开关统一筛选（useNavigation 已按档位裁剪），
 *   侧栏里出现的组件即当前平台可用的组件；
 * - 组件分区顶部给出一行当前平台与数量的说明，让「列表随开关变化」有迹可循；
 * - 组件分区是三级结构：系列（Reborn 组件 / 社区移植，可折叠）→ 分类小标题（虚拟节点，
 *   `page: false`，不是链接）→ 组件页；其它分区仍是「分组 → 页面」两级；
 * - 字号与颜色：一级 18px `text-gray-9`，二级分类标题 12px `text-gray-7` + 右侧组件数 10px
 *   `text-gray-5`，组件链接 14px（设计稿指定，这几档都不在 7 级字号令牌内，所以写成任意值）；
 * - 分组可折叠，激活项用左侧细条 + 浅底标记，路由切换后自动滚到可视区中部。
 */
import type { ContentNavigationItem } from "@nuxt/content";

const navigation = inject<Ref<ContentNavigationItem[]>>("navigation");
const { nav } = useNavigation(navigation);
const { platform } = useDocsPlatform();
const route = useRoute();
const navContainer = ref<HTMLElement | null>(null);

/** 当前是否在组件分区：平台说明行只在这里出现 */
const isComponentsSection = computed(() => route.path.startsWith("/components"));

/** 当前平台下侧栏列出的组件数（穿透分类节点数叶子） */
const componentCount = computed(() => countNavigationLeaves(nav.value));

/** 虚拟分组节点（分类小标题）：不对应页面，只渲染标题与其子项 */
function isVirtualGroup(item: ContentNavigationItem): boolean {
  return item.page === false && !!item.children?.length;
}

/** 平台说明行文案 */
const platformCaption = computed(() =>
  platform.value === "uniapp" ? "UniApp 端组件" : "Web 端组件",
);

/** 当前项是否激活（兼容带尾斜杠的路径） */
function isActive(item: ContentNavigationItem): boolean {
  return route.path === item.path || route.path === `${item.path}/`;
}

/** 子项中是否存在激活项（父级同步高亮） */
function hasActiveChild(item: ContentNavigationItem): boolean {
  if (!item.children) return false;
  return item.children.some((child) => isActive(child) || hasActiveChild(child));
}

// ---- 分组折叠 ----

const collapsedSections = ref<Set<string>>(new Set());

function toggleSection(sectionPath: string) {
  if (collapsedSections.value.has(sectionPath)) {
    collapsedSections.value.delete(sectionPath);
  }
  else {
    collapsedSections.value.add(sectionPath);
  }
}

function isSectionCollapsed(sectionPath: string): boolean {
  return collapsedSections.value.has(sectionPath);
}

// ---- 激活项滚入可视区 ----

async function scrollActiveLinkIntoView() {
  await nextTick();

  const escapedPath = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(route.path) : route.path;
  const activeItem = navContainer.value?.querySelector<HTMLElement>(
    `[data-nav-path="${escapedPath}"], [data-nav-path="${escapedPath}/"]`,
  );

  if (!activeItem) return;

  const scrollParent = getScrollParent(activeItem);
  if (!scrollParent) {
    activeItem.scrollIntoView({ block: "center", inline: "nearest" });
    return;
  }

  const parentRect = scrollParent.getBoundingClientRect();
  const itemRect = activeItem.getBoundingClientRect();
  const itemOffsetTop = itemRect.top - parentRect.top;
  const itemCenterOffset = itemOffsetTop + itemRect.height / 2;
  const desiredCenter = Math.max(scrollParent.clientHeight / 2, scrollParent.clientHeight * 0.35);
  const targetScrollTop = scrollParent.scrollTop + (itemCenterOffset - desiredCenter);
  const maxScrollTop = scrollParent.scrollHeight - scrollParent.clientHeight;
  const clampedScrollTop = Math.min(Math.max(0, targetScrollTop), Math.max(0, maxScrollTop));

  scrollParent.scrollTo({ top: clampedScrollTop, behavior: "auto" });
}

/** 向上查找最近的纵向滚动容器 */
function getScrollParent(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element.parentElement;
  while (current) {
    const style = getComputedStyle(current);
    const overflowY = style.overflowY;
    const canScrollY = (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay")
      && current.scrollHeight > current.clientHeight;
    if (canScrollY) return current;
    current = current.parentElement;
  }
  return null;
}

// ---- 折叠高度过渡钩子 ----

function onEnter(el: Element) {
  const element = el as HTMLElement;
  const height = element.scrollHeight;

  element.style.height = "0";
  element.style.opacity = "0";
  element.style.overflow = "hidden";

  // 强制回流，保证起始高度先落地再过渡
  void element.offsetHeight;

  requestAnimationFrame(() => {
    element.style.height = `${height}px`;
    element.style.opacity = "1";
  });
}

function onAfterEnter(el: Element) {
  const element = el as HTMLElement;
  element.style.height = "";
  element.style.opacity = "";
  element.style.overflow = "";
}

function onLeave(el: Element) {
  const element = el as HTMLElement;
  const height = element.scrollHeight;
  element.style.height = `${height}px`;
  element.style.overflow = "hidden";

  requestAnimationFrame(() => {
    element.style.height = "0";
    element.style.opacity = "0";
  });
}

function onAfterLeave(el: Element) {
  const element = el as HTMLElement;
  element.style.height = "";
  element.style.opacity = "";
  element.style.overflow = "";
}

onMounted(scrollActiveLinkIntoView);
watch(() => route.path, scrollActiveLinkIntoView);
watch(nav, scrollActiveLinkIntoView, { deep: true });
</script>

<template>
  <!-- Arco 气质侧栏：分组标题克制、激活态用左侧细条 + 浅底 -->
  <div ref="navContainer" class="space-y-5 py-1">
    <!-- 平台说明行：告知当前列出的是哪一端的组件（由顶栏开关切换） -->
    <div
      v-if="isComponentsSection"
      class="flex items-center justify-between px-3 text-xs text-zinc-400 dark:text-zinc-500"
    >
      <span>{{ platformCaption }}</span>
      <span class="tabular-nums">{{ componentCount }}</span>
    </div>

    <template v-for="section in nav" :key="section.path">
      <div>
        <button
          v-if="section.title"
          type="button"
          class="mb-2 flex w-full cursor-pointer items-center justify-between px-3 text-left text-[18px] leading-[26px] font-semibold text-gray-9 transition-opacity hover:opacity-80"
          @click="toggleSection(section.path)"
        >
          <span>{{ section.title }}</span>
          <UIcon
            :name="isSectionCollapsed(section.path) ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
            class="h-4 w-4 opacity-70 transition-transform duration-200"
          />
        </button>

        <Transition
          name="collapse"
          @enter="onEnter"
          @after-enter="onAfterEnter"
          @leave="onLeave"
          @after-leave="onAfterLeave"
        >
          <div v-show="!isSectionCollapsed(section.path)" class="space-y-0.5 overflow-hidden">
            <template v-for="item in section.children" :key="item.path">
              <!-- 组件分区的分类小标题（二级菜单）：虚拟节点，不可点击，下面直接列组件页 -->
              <div v-if="isVirtualGroup(item)" class="pt-[14px] first:pt-0">
                <div class="mb-1 flex items-center justify-between gap-2 px-3">
                  <span class="text-[12px] leading-[18px] font-medium text-gray-7">
                    {{ item.title }}
                  </span>
                  <!-- 该分类下的组件数：穿透子树数叶子，与顶部总数同一套口径 -->
                  <span class="shrink-0 text-[10px] leading-none tabular-nums text-gray-5">
                    {{ countNavigationLeaves(item.children) }}
                  </span>
                </div>
                <div class="space-y-0.5">
                  <NuxtLink
                    v-for="child in item.children"
                    :key="child.path"
                    :to="child.path"
                    :data-nav-path="child.path"
                    class="relative block truncate rounded-md px-3 py-2 text-[14px] transition-colors duration-150"
                    :class="[
                      isActive(child)
                        ? 'bg-primary/8 font-medium text-primary before:absolute before:inset-y-1 before:left-0 before:w-[2px] before:rounded-full before:bg-primary before:content-[\'\']'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100',
                    ]"
                  >
                    {{ child.title }}
                  </NuxtLink>
                </div>
              </div>

              <NuxtLink
                v-else
                :to="item.path"
                :data-nav-path="item.path"
                class="relative block truncate rounded-md px-3 py-2 text-[14px] transition-colors duration-150"
                :class="[
                  isActive(item) || hasActiveChild(item)
                    ? 'bg-primary/8 font-medium text-primary before:absolute before:inset-y-1 before:left-0 before:w-[2px] before:rounded-full before:bg-primary before:content-[\'\']'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100',
                ]"
              >
                {{ item.title }}
              </NuxtLink>

              <!-- 真实目录节点（有页面）的下级页面：缩进并加左侧竖线 -->
              <div
                v-if="!isVirtualGroup(item) && item.children?.length"
                class="ml-3 space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-700/60"
              >
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.path"
                  :to="child.path"
                  :data-nav-path="child.path"
                  class="block truncate rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors duration-150"
                  :class="[
                    isActive(child)
                      ? 'bg-primary/6 font-medium text-primary'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200',
                  ]"
                >
                  {{ child.title }}
                </NuxtLink>
              </div>
            </template>
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>

<style>
/* 分组折叠过渡：Vue transition 类名需全局生效 */
.collapse-enter-active {
  @apply transition-all duration-[350ms] overflow-hidden;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-leave-active {
  @apply transition-all duration-300 overflow-hidden;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-enter-from {
  @apply opacity-0;
}

.collapse-enter-to {
  @apply opacity-100;
}

.collapse-leave-from {
  @apply opacity-100;
}

.collapse-leave-to {
  @apply opacity-0;
}
</style>
