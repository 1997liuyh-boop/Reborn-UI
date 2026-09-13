<script setup lang="ts">
/**
 * AppHeaderBody —— 移动端抽屉里的内容树（覆盖 Docus 层同名组件）
 *
 * 与上游唯一差异：导航树先按顶栏平台开关裁剪，
 * 保证抽屉里的组件列表与桌面端侧栏看到的一致。
 */
import type { ContentNavigationItem } from "@nuxt/content";

const navigation = inject<Ref<ContentNavigationItem[]>>("navigation");
const { filterNavigation } = useDocsPlatform();

const filteredNavigation = computed(() => filterNavigation(navigation?.value));
</script>

<template>
  <UContentNavigation highlight variant="link" :navigation="filteredNavigation" />
</template>
