<script lang="ts" setup>
import { computed } from "vue";
import type { DocsCollectionItem } from "@nuxt/content";

interface Props {
  routePath?: string;
}

const { routePath = "/components" } = defineProps<Props>();


const { data: components } = await useAsyncData("tools", () => {
  return queryCollection("docs").all() as Promise<DocsCollectionItem[]>;
});

const path = routePath;

components.value = components.value?.filter((c) => c.path.startsWith(path) && c.path !== path);

const selectedCategory = ref<string>("all");

// Compute unique categories
const categories = computed(() => {
  const activeEmojis = [
    "🌈", "🔥", "✨", "💎", "🚀", "🌟", "🍀", "🎨", "🛠️", "⚡",
    "🔮", "🍕", "🎈", "🎁", "🦄", "🍄", "🎸", "🕹️", "🍿", "🧗",
    "🧘", "🏄", "🎭", "🧪", "📡", "🔋", "💾", "🛡️", "🧬", "🧜‍♀️",
    "🦾", "🌪️", "🎨", "🌍", "🗺️", "🛸", "👾", "🦊", "🐶", "🐱"
  ];
  const inactiveEmojis = [
    "☁️", "💨", "🌫️", "🌑", "🛸", "🌙", "🍂", "🖌️", "🔧", "🌩️",
    "🧪", "🍞", "🌫️", "📦", "🦓", "🌿", "🎻", "🎮", "🥣", "🏔️",
    "🪑", "🚣", "🖼️", "🧫", "📻", "🪫", "💿", "🧱", "🔬", "🐚",
    "🦿", "☁️", "🖌️", "🌑", "🌏", "🛸", "👾", "🐭", "🐶", "🐱"
  ];

  if (!components.value) {
    return ["all", "new", "updated"].map((name, index) => ({
      name,
      activeEmoji: activeEmojis[index % activeEmojis.length],
      inactiveEmoji: inactiveEmojis[index % inactiveEmojis.length]
    }));
  }

  const uniqueCategories = Array.from(new Set(
    components.value
      ?.map((component) => component.category)
      .filter((category) => category !== null && category !== undefined)
  ));

  const allNames = ["all", "new", "updated", ...uniqueCategories];

  return allNames.map((name, index) => ({
    name,
    activeEmoji: activeEmojis[index % activeEmojis.length],
    inactiveEmoji: inactiveEmojis[index % inactiveEmojis.length]
  }));
});

// Filter tools by selected category
const filteredComponents = computed(() => {
  if (!components.value) return [];

  let filtered = components.value;

  if (selectedCategory.value === "new") {
    filtered = filtered.filter((component) => component.badge?.toLowerCase() === "new");
  } else if (selectedCategory.value === "updated") {
    filtered = filtered.filter((component) => component.badge?.toLowerCase() === "updated" || component.badge?.toLowerCase() === "update");
  } else if (selectedCategory.value !== "all") {
    filtered = filtered.filter((component) => component.category === selectedCategory.value);
  }

  // ✅ Sort alphabetically by title
  return filtered.slice().sort((a, b) => a.title.localeCompare(b.title));
});

function getCategoryColor(category: string) {
  if (category?.toLowerCase() === "new") {
    return "success";
  }

  if (category?.toLowerCase() === "updated") {
    return "warning";
  }

  return "neutral";
}
</script>

<template>
  <div class="relative flex w-full flex-col items-center justify-center gap-8 p-8 max-lg:p-6">
    <!-- Category Filter -->
    <div
      class="z-10 mt-4 flex w-full justify-center rounded-3xl border border-white/20 bg-amber-100/10 p-4 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-black/20">
      <RebornRadioGroup v-model="selectedCategory" size="lg">
        <RebornRadio v-for="category in categories" :key="category.name" :label="category.name" :value="category.name"
          :ui="{ root: `px-2 shadow-lg rounded-full` }">
          <template #active-icon>
            <div
              class="relative flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden border border-white/40 dark:border-white/20 shadow-xl backdrop-blur-lg transition-all duration-500 animate-zoom bg-linear-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-transparent">
              <div class="absolute inset-0 bg-red-500/10 mix-blend-overlay"></div>
              <span class="relative z-10 text-lg drop-shadow-sm">{{ category.activeEmoji }}</span>
            </div>
          </template>
          <template #inactive-icon>
            <div
              class="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm transition-all duration-300 opacity-80">
              <span class="text-lg">{{ category.inactiveEmoji }}</span>
            </div>
          </template>
          <template #default="{ isChecked }">
            <div class="relative flex flex-col items-center">
              <RadiantText v-if="isChecked" class="inline-flex items-center justify-center transition ease-out hover:text-neutral-600
              hover:duration-300 hover:dark:text-neutral-400" :duration="5">
                <div class="text-sm text-primary font-bold">
                  {{ category.name }}
                </div>
              </RadiantText>
              <div v-else class="text-sm text-gray-8 dark:text-gray-1">
                {{ category.name }}
              </div>
            </div>
          </template>
        </RebornRadio>
      </RebornRadioGroup>
    </div>

    <div v-if="filteredComponents.length" class="text-muted mt-4 w-full text-right">
      <span class="text-default text-lg font-bold">{{ filteredComponents.length }}</span> components
      in
      <span class="text-default text-lg font-bold lowercase">{{ selectedCategory }}</span> category.
    </div>

    <div v-else class="text-default mt-16 flex w-full flex-col gap-1 text-center text-lg">
      <span class="text-xl font-medium">Oops!</span>
      <span>
        No component available in <span class="font-semibold">{{ selectedCategory }}</span> category
        as of now.
      </span>
    </div>

    <div class="mt-2 grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1 md:gap-6">
      <UPageCard v-for="component in filteredComponents" :key="component.id" :title="component.title"
        :description="component.description"
        class="bg-default/15 hover:bg-default/25 relative h-44 w-full cursor-pointer hover:active:scale-[98%] md:h-56"
        :ui="{
          title: 'text-lg',
          description: ' text-ellipsis line-clamp-2',
        }" :to="component.path">
        <UBadge v-if="component.badge" class="absolute top-6 right-6" variant="subtle"
          :color="component.badge?.toLowerCase() === 'new' ? 'success' : 'warning'" :label="component.badge" />
        <div class="flex flex-wrap items-center gap-2">
          <UBadge v-for="tag in component.tags" :key="component.id + tag" :label="tag" variant="soft"
            class="font-normal" />
        </div>
      </UPageCard>
    </div>
  </div>
</template>

<style scoped>
@keyframes zoom-icon {

  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.1));
  }

  50% {
    transform: scale(1.2);
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.15));
  }
}

.animate-zoom {
  animation: zoom-icon 1.5s ease-in-out infinite;
}
</style>
