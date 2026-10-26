<script lang="ts" setup>
import ComponentTabs from "./ComponentTabs.vue";

interface Props {
  devDependencies?: string;
  dependencies?: string;
  componentId: string;
  showInstallation?: boolean;
  demoFile: string;
  componentFiles?: string[];
  config: string;
  uniappFiles?: string[];
}

const {
  devDependencies = undefined,
  dependencies = undefined,
  showInstallation = true,
  componentId,
  componentFiles = [],
  demoFile,
  config,
  uniappFiles,
} = defineProps<Props>();
</script>

<template>
  <ClientOnly>
    <ComponentTabs
      :dev-dependencies="devDependencies" :dependencies="dependencies"
      :show-installation="showInstallation" :component-id="componentId" :component-files="componentFiles"
      :demo-file="demoFile" :config="config" :uniapp-files="uniappFiles"
    >
      <template v-if="$slots.api" #api>
        <slot name="api" />
      </template>

      <template v-if="$slots.credits" #credits>
        <slot name="credits" />
      </template>

      <template v-if="$slots.instructions" #instructions>
        <slot name="instructions" />
      </template>
    </ComponentTabs>
    <template #fallback>
      <div class="flex min-h-[420px] items-center justify-center gap-3 rounded-lg bg-muted/20 text-lg" role="status">
        <UIcon name="line-md:loading-twotone-loop" size="28" />
        <span>正在加载组件预览</span>
      </div>
    </template>
  </ClientOnly>
</template>
