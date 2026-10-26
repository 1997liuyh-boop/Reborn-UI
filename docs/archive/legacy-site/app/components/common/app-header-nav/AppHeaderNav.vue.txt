<script setup lang="ts">
import type { ContentNavigationItem } from "@nuxt/content";
import { mapContentNavigation } from "@nuxt/ui/utils/content";

const route = useRoute();

const navigation = inject<Ref<ContentNavigationItem[]>>("navigation");

const items = computed(() =>
  mapContentNavigation(
    navigation?.value?.map((item) => ({ ...item, children: undefined })) ?? [],
  )?.map((item) => ({
    ...item,
    active: route.path.startsWith(item.to as string),
  })),
);
</script>

<template>
  <!-- 二级导航：细底边界定头部区与工作区；去掉过重毛玻璃，贴近 Arco 文档顶栏层次 -->
  <UHeader title="" class="border-default/40 top-16 hidden items-center justify-between border-b bg-default/95 lg:flex">
    <UNavigationMenu :items="items" variant="link" highlight class="gap-1" />
  </UHeader>
</template>
