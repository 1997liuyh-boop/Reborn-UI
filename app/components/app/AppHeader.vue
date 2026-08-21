<script setup lang="ts">
const appConfig = useAppConfig();
const site = useSiteConfig();

// AI 助手开关:由 Docus assistant 模块提供,构建期存在 AI_GATEWAY_API_KEY 时启用
const { isEnabled: isAssistantEnabled } = useAssistant();

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
  <UHeader :ui="{ center: 'flex-1' }" to="/" :title="appConfig.header?.title || site.name" mode="drawer">
    <AppHeaderCenter />

    <template #title>
      <AppHeaderLogo class="h-6 w-auto shrink-0" />
    </template>

    <template #right>
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
      <AppHeaderBody />
    </template>
  </UHeader>
</template>
