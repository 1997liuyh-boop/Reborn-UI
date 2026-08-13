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
  <!-- 管理台外壳：二级导航底部保留一条弱化的 hairline，界定头部区与工作区 -->
  <UHeader title="" class="border-default/50 top-16 hidden items-center justify-between border-b lg:flex">
    <UNavigationMenu :items="items" variant="pill" highlight />
  </UHeader>
</template>
