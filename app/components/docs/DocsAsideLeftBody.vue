<script setup lang="ts">
import type { ContentNavigationItem } from "@nuxt/content";

const navigation = inject<Ref<ContentNavigationItem[]>>("navigation");
const { nav } = useNavigation(navigation);
const route = useRoute();
const navContainer = ref<HTMLElement | null>(null);

interface NavItemWithBadges extends ContentNavigationItem {
  "data-nav-path"?: string;
  badges?: Array<{ label: string; color?: string }>;
  tags?: string[];
  children?: NavItemWithBadges[];
}

// Add data-nav-path and process badges
function enrichNavItems(items: ContentNavigationItem[] = []): NavItemWithBadges[] {
  return items.map((item) => {
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
  <div ref="navContainer" class="space-y-2">
    <template v-for="section in navWithData" :key="section.path">
      <div v-if="section.title" @click="toggleSection(section.path)"
        class="cursor-pointer w-full px-3 text-30 font-semibold text-gray-8 dark:text-gray-1 uppercase tracking-wider flex items-center justify-between group hover:text-gray-900 dark:hover:text-white transition-colors">
        <ClientOnly>
          <HyperText :text="section.title" class="font-bold py-0.5!" :duration="800" :animate-on-load="true" />
          <template #fallback>
            <span>{{ section.title }}</span>
          </template>
        </ClientOnly>
        <UIcon :name="isSectionCollapsed(section.path) ? 'i-lucide-chevron-left' : 'i-lucide-chevron-down'"
          class="w-4 h-4 transition-all duration-400 ease-in-out"
          :class="{ 'rotate-0': !isSectionCollapsed(section.path), '-rotate-90': isSectionCollapsed(section.path) }" />
      </div>

      <!-- Section Items (Collapsible Content with Transition) -->
      <Transition name="collapse" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave"
        @after-leave="onAfterLeave">
        <div v-show="!isSectionCollapsed(section.path)" class="space-y-1 pl-3 overflow-hidden">
          <template v-for="item in section.children" :key="item.path">
            <!-- Primary Menu Item -->
            <NuxtLink :to="item.path" :data-nav-path="item.path"
              class="group relative flex items-center justify-between gap-2 px-3 py-1.5 rounded-md text-26 transition-all duration-200 border-l-2"
              :class="[
                isActive(item) || hasActiveChild(item)
                  ? 'font-semibold shadow-sm border-l-primary text-primary bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] dark:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100 border-transparent'
              ]">
              <ClientOnly>
                <SparklesText v-if="isActive(item)" :text="item.title" :colors="{ first: '#9E7AFF', second: '#FE8BBB' }"
                  :sparkles-count="5" class="text-26 flex-1" />
                <span v-else class="flex-1 truncate">{{ item.title }}</span>
                <template #fallback>
                  <span class="flex-1 truncate">{{ item.title }}</span>
                </template>
              </ClientOnly>

              <!-- Badges -->
              <div v-if="item.badges && item.badges.length > 0" class="flex items-center gap-1 shrink-0">
                <UBadge v-for="(badge, index) in item.badges" :key="index" :label="badge.label"
                  :color="(badge.color as any) || 'primary'" variant="subtle" size="xs" />
              </div>
            </NuxtLink>

            <!-- Nested Children (Secondary Menu) -->
            <div v-if="item.children && item.children.length > 0"
              class="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700/50 pl-4">
              <NuxtLink v-for="child in item.children" :key="child.path" :to="child.path" :data-nav-path="child.path"
                class="group relative flex items-center justify-between gap-2 px-3 py-1.5 rounded-md text-26 transition-all duration-200"
                :class="[
                  isActive(child)
                    ? 'font-medium text-primary bg-[color-mix(in_srgb,var(--color-primary)_3%,transparent)] dark:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] before:content-[\'\'] before:absolute before:left-[-1rem] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[60%] before:bg-[var(--color-primary)] before:rounded-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                ]">
                <span class="flex-1 truncate">{{ child.title }}</span>

                <!-- Child Badges -->
                <div v-if="child.badges && child.badges.length > 0" class="flex items-center gap-1 shrink-0">
                  <UBadge v-for="(badge, index) in child.badges" :key="index" :label="badge.label"
                    :color="(badge.color as any) || 'primary'" variant="subtle" size="xs" />
                </div>
              </NuxtLink>
            </div>
          </template>
        </div>
      </Transition>
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
