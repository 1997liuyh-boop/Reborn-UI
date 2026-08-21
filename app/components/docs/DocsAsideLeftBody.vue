<script setup lang="ts">
import type { ContentNavigationItem } from "@nuxt/content";

const navigation = inject<Ref<ContentNavigationItem[]>>("navigation");
const { nav } = useNavigation(navigation);
const route = useRoute();
const navContainer = ref<HTMLElement | null>(null);

interface NavItemWithBadges extends ContentNavigationItem {
  "data-nav-path"?: string;
  badges?: Array<{ label: string; color?: string }>;
  chip?: { label: string; color?: string };
  tags?: string[];
  children?: NavItemWithBadges[];
}

// Add data-nav-path and process badges
function enrichNavItems(items: ContentNavigationItem[] = []): NavItemWithBadges[] {
  return items?.map((item) => {
    const enrichedItem: NavItemWithBadges = {
      ...item,
      "data-nav-path": item.path,
      children: item.children ? enrichNavItems(item.children) : item.children,
    };

    // If no badges array but has tags with 'uniapp', create badges
    if (!enrichedItem.badges && enrichedItem.tags?.includes('uniapp')) {
      enrichedItem.badges = [
        { label: 'New', color: 'primary' },
        { label: 'UniApp', color: 'success' }
      ];
    } else if (!enrichedItem.badges && item.badge) {
      // Convert single badge to array
      enrichedItem.badges = [{ label: item.badge, color: 'primary' }];
    }

    return enrichedItem;
  });
}

const navWithData = computed(() => enrichNavItems(nav.value));

// Check if item is active
function isActive(item: NavItemWithBadges): boolean {
  return route.path === item.path || route.path === `${item.path}/`;
}

// Check if item has active children
function hasActiveChild(item: NavItemWithBadges): boolean {
  if (!item.children) return false;
  return item.children.some(child =>
    isActive(child) || hasActiveChild(child)
  );
}

// Collapsible sections state
const collapsedSections = ref<Set<string>>(new Set());

// Toggle section collapse
function toggleSection(sectionPath: string) {
  if (collapsedSections.value.has(sectionPath)) {
    collapsedSections.value.delete(sectionPath);
  } else {
    collapsedSections.value.add(sectionPath);
  }
}

// Check if section is collapsed
function isSectionCollapsed(sectionPath: string): boolean {
  return collapsedSections.value.has(sectionPath);
}

// Scroll active link into view
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

function getScrollParent(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element.parentElement;
  while (current) {
    const style = getComputedStyle(current);
    const overflowY = style.overflowY;
    const canScrollY = (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      current.scrollHeight > current.clientHeight;
    if (canScrollY) return current;
    current = current.parentElement;
  }
  return null;
}

// Transition hooks for smooth height animation
function onEnter(el: Element) {
  const element = el as HTMLElement;
  const height = element.scrollHeight;

  element.style.height = '0';
  element.style.opacity = '0';
  element.style.overflow = 'hidden';

  // Force reflow
  element.offsetHeight;

  // Set target height for smooth transition
  requestAnimationFrame(() => {
    element.style.height = `${height}px`;
    element.style.opacity = '1';
  });
}

function onAfterEnter(el: Element) {
  const element = el as HTMLElement;
  element.style.height = '';
  element.style.opacity = '';
  element.style.overflow = '';
}

function onLeave(el: Element) {
  const element = el as HTMLElement;
  const height = element.scrollHeight;
  element.style.height = `${height}px`;
  element.style.overflow = 'hidden';

  // Force reflow to ensure the height is set before transition
  requestAnimationFrame(() => {
    element.style.height = '0';
    element.style.opacity = '0';
  });
}

function onAfterLeave(el: Element) {
  const element = el as HTMLElement;
  element.style.height = '';
  element.style.opacity = '';
  element.style.overflow = '';
}

onMounted(scrollActiveLinkIntoView);
watch(() => route.path, scrollActiveLinkIntoView);
watch(navWithData, scrollActiveLinkIntoView, { deep: true });
</script>

<template>
  <!-- Arco 气质侧栏：分组标题克制、激活态用左侧细条 + 浅底，去掉 Sparkles/HyperText 花哨动效 -->
  <div ref="navContainer" class="space-y-5 py-1">
    <template v-for="section in navWithData" :key="section.path">
      <div>
        <button
          v-if="section.title"
          type="button"
          class="mb-1.5 flex w-full cursor-pointer items-center justify-between px-3 text-left text-[13px] font-semibold tracking-wide text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          @click="toggleSection(section.path)"
        >
          <span>{{ section.title }}</span>
          <UIcon
            :name="isSectionCollapsed(section.path) ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
            class="h-3.5 w-3.5 opacity-70 transition-transform duration-200"
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
              <NuxtLink
                :to="item.path"
                :data-nav-path="item.path"
                class="group relative flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors duration-150"
                :class="[
                  isActive(item) || hasActiveChild(item)
                    ? 'bg-primary/8 font-medium text-primary before:absolute before:inset-y-1 before:left-0 before:w-[2px] before:rounded-full before:bg-primary before:content-[\'\']'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100',
                ]"
              >
                <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>

                <div v-if="item.badges?.length" class="flex shrink-0 items-center gap-1">
                  <UBadge
                    v-for="(badge, index) in item.badges"
                    :key="index"
                    :label="badge.label"
                    :color="(badge.color as any) || 'primary'"
                    variant="subtle"
                    size="xs"
                  />
                </div>
              </NuxtLink>

              <div
                v-if="item.children?.length"
                class="ml-3 space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-700/60"
              >
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.path"
                  :to="child.path"
                  :data-nav-path="child.path"
                  class="group relative flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors duration-150"
                  :class="[
                    isActive(child)
                      ? 'bg-primary/6 font-medium text-primary'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200',
                  ]"
                >
                  <span class="min-w-0 flex-1 truncate">{{ child.title }}</span>

                  <div v-if="child.badges?.length" class="flex shrink-0 items-center gap-1">
                    <UBadge
                      v-for="(badge, index) in child.badges"
                      :key="index"
                      :label="badge.label"
                      :color="(badge.color as any) || 'primary'"
                      variant="subtle"
                      size="xs"
                    />
                  </div>
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
/* Collapse transition animations - using global styles for Vue transitions */
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
