<script lang="ts" setup>
import type { TabsItem } from "@nuxt/ui";

interface Props {
  devDependencies?: string;
  dependencies?: string;
  componentId: string;
  showInstallation?: boolean;
  demoFile: string;
  componentFiles?: string[];
  config: string;
  uniapp?: boolean;
}

const {
  devDependencies = undefined,
  dependencies = undefined,
  showInstallation = true,
  componentId,
  componentFiles = [],
  demoFile,
  config,
  uniapp = false,
} = defineProps<Props>();

const items = ref<TabsItem[]>([
  {
    label: "Preview",
    icon: "tabler:eye",
    slot: "preview",
  },
  {
    label: "Code",
    icon: "tabler:code",
    slot: "code",
  },
]);

if (uniapp) {
  items.value.push({
    label: "UniApp Code",
    icon: "tabler:code-asterisk",
    slot: "uniapp",
  });
}

if (showInstallation) {
  items.value.push({
    label: "Installation",
    icon: "si:lightning-line",
    slot: "installation",
  });
}

const installationItems = ref<TabsItem[]>([
  {
    label: "CLI",
    icon: "tabler:terminal",
    slot: "cli",
  },
  {
    label: "Manually",
    icon: "tabler:notes",
    slot: "manual",
  },
]);

// Use the composable for both component and demo code loading
const { componentCode, demoCode } = useComponentCode({
  componentId,
  componentFiles,
  demoFile,
  type: 'ui'
});
</script>

<template>
  <UTabs size="lg" variant="pill" :items="items" class="min-h-[60vh] w-full" :ui="{
    list: 'w-fit max-sm:w-full bg-transparent gap-4 self-start overflow-auto',
    trigger: 'w-fit min-w-fit outline outline-neutral-200 dark:outline-neutral-800',
    content: 'py-4',
  }" :unmount-on-hide="false">
    <template #preview>
      <ClientOnly>
        <component :is="config" />
      </ClientOnly>

      <slot name="api" class="my-4" />
    </template>

    <template #code>
      <MDC :key="demoCode" :value="demoCode" class="-mt-12" />
    </template>

    <template v-if="showInstallation" #installation>
      <div class="mb-4 text-lg italic">
        Install component by either CLI or Manually copy-pasting.
      </div>
      <UTabs :items="installationItems">
        <template #cli>
          <RegistryTabs :component-id="componentId" />
        </template>

        <template #manual>
          <div v-if="devDependencies || dependencies" class="my-4 text-base">
            This component requires following dependencies to be installed.
          </div>
          <PmTabs v-if="devDependencies" :is-dev="true" :package-name="devDependencies" />

          <PmTabs v-if="dependencies" :package-name="dependencies" />

          <slot name="instructions" />

          <div class="mt-8 mb-4 text-base">
            Copy and paste the following code in your project. Update imports according to your
            project.
          </div>

          <MDC v-if="componentCode" :key="componentCode" :value="componentCode" />
        </template>
      </UTabs>
    </template>
  </UTabs>
</template>
