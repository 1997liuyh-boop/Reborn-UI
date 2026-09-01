<script lang="ts" setup>
import type { TabsItem } from "@nuxt/ui";
import { demoContextKey } from "../demo/types";

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

const uniapp = computed(() => !!uniappFiles && uniappFiles.length > 0);

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

if (uniapp.value) {
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

// Platform tabs for manual installation (Web/UniApp)
const platformItems = computed<TabsItem[]>(() => {
  const items: TabsItem[] = [
    {
      label: "Web",
      icon: "tabler:world",
      slot: "web",
    },
  ];

  if (uniapp.value) {
    items.push({
      label: "UniApp",
      icon: "tabler:brand-wechat",
      slot: "uniapp-platform",
    });
  }

  return items;
});

// Use the composable for both component and demo code loading
const {
  componentCode,
  demoCode,
  uniappCode,
  uniappComponentCode,
  demoRawCode,
} = useComponentCode({
  componentId,
  componentFiles,
  demoFile,
  type: 'ui',
  uniapp: uniapp.value,
  uniappFiles,
  uniappComponentId: componentId
});

/**
 * 把 demo 源文件按 <DemoSection title="..."> 切成「标题 -> 源码」映射，向下提供给各张分组卡片。
 * 分组里的内容既是示例也是代码，同源抽取，不需要在文档或分组上再写一遍。
 */
const demoSectionSources = computed(() => extractDemoSections(demoRawCode.value));

/** 可独立运行版本：按模板依赖抽取 script 声明并补全 <template> 包裹，供「在 Playground 运行」 */
const demoRunnableSources = computed(() => buildRunnableDemoSections(demoRawCode.value));

provide(demoContextKey, {
  sources: demoSectionSources,
  runnableSources: demoRunnableSources,
  componentId,
  demoFile,
  demoName: demoFile.replace(".vue", ""),
});

</script>

<template>
  <!--
    Tab 栏吸顶：分类导航已并入主顶栏，各断点均按单层 header（64px）补偿。
    z-index 约定：header z-50 > 悬浮目录 z-40 > 吸顶 Tab 栏 z-20 > 内容
  -->
  <UTabs
    size="lg" variant="pill" :items="items" class="w-full" :ui="{
      list: 'sticky top-16 z-20 w-fit max-sm:w-full bg-default/75 backdrop-blur-xl rounded-xl gap-4 self-start overflow-auto',
      trigger: 'w-fit min-w-fit outline outline-neutral-200 dark:outline-neutral-800',
      content: 'py-4',
    }" :unmount-on-hide="false"
  >
    <template #preview>
      <!-- 统一展示容器：分组各自成卡，动作与源码都在卡片头上 -->
      <DemoStage :demo-name="demoFile.replace('.vue', '')">
        <ClientOnly>
          <component :is="config" />
        </ClientOnly>
      </DemoStage>

      <slot name="api" class="my-4" />
    </template>

    <template #code>
      <MdcProse :key="demoCode" :value="demoCode" class="-mt-12" />
    </template>

    <template v-if="uniapp" #uniapp>
      <MdcProse :key="uniappCode" :value="uniappCode" class="-mt-12" />
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

          <UTabs :items="platformItems">
            <template #web>
              <MdcProse v-if="componentCode" :key="componentCode" :value="componentCode" />
            </template>

            <template v-if="uniapp" #uniapp-platform>
              <MdcProse v-if="uniappComponentCode" :key="uniappComponentCode" :value="uniappComponentCode" />
            </template>
          </UTabs>
        </template>
      </UTabs>
    </template>
  </UTabs>
</template>
