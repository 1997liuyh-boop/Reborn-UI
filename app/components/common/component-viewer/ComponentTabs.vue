<script lang="ts" setup>
import type { TabKey } from "~/components/reborn/ui/reborn-tabs/reborn-tabs.config";
import type { ComponentThemeGroup } from "~/utils/getComponentTheme";
import { loadComponentThemeGroups } from "~/utils/getComponentTheme";
import { demoContextKey } from "../demo/types";
import { sandboxContextKey, suggestionContextKey } from "./types";

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

/** 锚点滚动的落点偏移：主顶栏 64px + 吸顶 Tab 栏 64px，再留一点余量，免得标题贴着吸顶条 */
const ANCHOR_OFFSET = 140;

/**
 * 「使用建议」面板的内容，由 DocsPage 从正文 AST 里切出来后经 provide 下发。
 * 取不到（不是组件文档，或文档没写这几节）时整张 Tab 不出现，而不是摆一张空面板。
 */
const suggestion = inject(suggestionContextKey, null);
const suggestionPage = computed(() => suggestion?.value.value ?? null);

/**
 * Sandbox 面板承载 ComponentPlayground 的参数调节区。
 *
 * 面板要不要出现，取决于组件的 config 里有没有写 #config 插槽——这件事只有
 * ComponentPlayground 自己知道，所以由它挂载时调 register() 反向通知。
 * ready 得等目标节点真的挂上去再置 true：Teleport 的 to 解析不到元素会直接报错。
 */
const sandboxTargetId = `reborn-sandbox-${componentId}`;
const hasSandbox = ref(false);
const sandboxReady = ref(false);

provide(sandboxContextKey, {
  targetId: sandboxTargetId,
  ready: sandboxReady,
  register: () => {
    hasSandbox.value = true;
  },
});

watch(hasSandbox, (has) => {
  if (has) nextTick(() => (sandboxReady.value = true));
});

/**
 * API 这张不是面板，是个滚动锚点——`## API` 的正文写在 ::ComponentViewer 块之外，
 * 内容本来就在页面上，再复制一份进面板只会让同一段文字出现两次。
 *
 * 点击后在同一个 tick 内把 activeKey 改回原值：受控绑定下 RebornTabs 只发事件、
 * 不改自己的 currentKey，值还回去它的 prop 就从头到尾没变过，胶囊滑块也不会闪一下。
 */
const activeTab = ref<TabKey>("preview");
/** 点击发生前停在哪张，供 API 那张还原用；只在两个事件之间传值，不需要响应式 */
let tabBeforeClick: TabKey = "preview";

function handleTabClick() {
  tabBeforeClick = activeTab.value;
}

function handleTabChange(key: TabKey) {
  if (key !== "api") return;
  activeTab.value = tabBeforeClick;
  // 落点优先 Props 小节；文档没写 Props 时退到 API 这一节的标题
  const target = document.querySelector("#props") ?? document.querySelector("#api");
  if (!target) return;
  window.scrollTo({
    top: target.getBoundingClientRect().top + window.scrollY - ANCHOR_OFFSET,
    behavior: "smooth",
  });
}

// 组件源码与 demo 源码都由这个组合式函数加载
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

/**
 * 组件主题的 slot 结构：整页读一次，下发给每张示例卡片各自的 Theme slots 面板。
 * 面板已下沉到 DemoSection（每个示例单独开关、单独作用域），这里只负责取数据。
 */
const themeGroups = ref<ComponentThemeGroup[]>([]);

watch(() => componentId, async (id) => {
  themeGroups.value = await loadComponentThemeGroups(id);
}, { immediate: true });

provide(demoContextKey, {
  sources: demoSectionSources,
  runnableSources: demoRunnableSources,
  componentId,
  demoFile,
  demoName: demoFile.replace(".vue", ""),
  themeGroups,
});
</script>

<template>
  <div class="w-full min-w-0">
    <!--
      Tab 栏吸顶：分类导航已并入主顶栏，各断点均按单层 header（64px）补偿。
      吸顶写在 nav 而不是 list：capsule 形态下 list 自身就是那条 bg-gray-2 + rounded-full 的胶囊底轨，
      再往上叠一层半透明底色会和它撞在同一个 bg-* 上（tailwind-merge 只会留一个）。
      z-index 约定：header z-50 > 悬浮目录 z-40 > 吸顶 Tab 栏 z-20 > 内容
    -->
    <RebornTabs v-model:active-key="activeTab" type="capsule" size="md" position="top" color="primary" :editable="false"
      :show-add-button="false" :animation="false" :hide-content="false" :destroy-on-hidden="false" :lazy-load="false"
      :ui="{
        nav: 'sticky top-16 z-40 bg-gray-1/75 py-2 backdrop-blur-xl',
      }" @tab-click="handleTabClick" @change="handleTabChange">
      <RebornTabPane key="preview">
        <template #title>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="tabler:eye" class="size-4" />
            Preview
          </span>
        </template>

        <template #default>
          <!-- 统一展示容器：分组各自成卡，动作、源码与 Theme slots 都在各自卡片上 -->
          <DemoStage :demo-name="demoFile.replace('.vue', '')">
            <ClientOnly>
              <component :is="config" />
            </ClientOnly>
          </DemoStage>

          <slot name="api" />
        </template>
      </RebornTabPane>

      <!-- 只在 Tab 栏占个位：点它是滚到正文的 API 一节，这张面板永远不会被激活，所以不给内容 -->
      <RebornTabPane key="api">
        <template #title>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="tabler:api" class="size-4" />
            API
          </span>
        </template>
      </RebornTabPane>

      <RebornTabPane v-if="suggestionPage" key="suggestion">
        <template #title>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="tabler:bulb" class="size-4" />
            Suggestion
          </span>
        </template>

        <template #default>
          <!-- 正文里的「何时使用 / 何时不使用 / 注意事项」由 DocsPage 切出来送到这里；排版样式由外层 UPageBody 的 prose 提供 -->
          <ContentRenderer :value="suggestionPage" />
        </template>
      </RebornTabPane>

      <RebornTabPane v-if="hasSandbox" key="sandbox">
        <template #title>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="tabler:adjustments" class="size-4" />
            Sandbox
          </span>
        </template>

        <template #default>
          <div class="flex flex-col gap-1">
            <span class="text-highlighted text-base font-semibold tracking-tight">交互演练场</span>
            <span class="text-muted text-sm">调节下列参数后切回 Preview，可以看到组件的实时表现。</span>
          </div>

          <!-- 参数控件由 ComponentPlayground 传送进来：它挂在 Preview 面板里，跨不过 Tab 边界，只能靠 Teleport -->
          <div :id="sandboxTargetId" class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" />
        </template>
      </RebornTabPane>

      <RebornTabPane key="code">
        <template #title>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="tabler:code" class="size-4" />
            Code
          </span>
        </template>

        <template #default>
          <MdcProse :key="demoCode" :value="demoCode" />
        </template>
      </RebornTabPane>

      <RebornTabPane v-if="uniapp" key="uniapp">
        <template #title>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="tabler:code-asterisk" class="size-4" />
            UniApp Code
          </span>
        </template>

        <template #default>
          <MdcProse :key="uniappCode" :value="uniappCode" />
        </template>
      </RebornTabPane>

      <RebornTabPane v-if="showInstallation" key="installation">
        <template #title>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="si:lightning-line" class="size-4" />
            Installation
          </span>
        </template>

        <template #default>
          <div class="mb-4 text-lg italic">
            用 CLI 安装，或者手动复制粘贴源码。
          </div>

          <!-- 内层同样是 capsule，但收到 small（32px），与外层 40px 的主 Tab 栏拉开层级 -->
          <RebornTabs type="capsule" size="sm">
            <RebornTabPane key="cli">
              <template #title>
                <span class="inline-flex items-center gap-1.5">
                  <Icon name="tabler:terminal" class="size-4" />
                  CLI
                </span>
              </template>

              <template #default>
                <RegistryTabs :component-id="componentId" />
              </template>
            </RebornTabPane>

            <RebornTabPane key="manual">
              <template #title>
                <span class="inline-flex items-center gap-1.5">
                  <Icon name="tabler:notes" class="size-4" />
                  Manually
                </span>
              </template>

              <template #default>
                <div v-if="devDependencies || dependencies" class="my-4 text-base">
                  这个组件依赖下列包，需要先装上。
                </div>
                <PmTabs v-if="devDependencies" :is-dev="true" :package-name="devDependencies" />

                <PmTabs v-if="dependencies" :package-name="dependencies" />

                <slot name="instructions" />

                <div class="mt-8 mb-4 text-base">
                  把下面的代码复制到项目里，再按自己的目录结构改一下 import 路径。
                </div>

                <RebornTabs type="capsule" size="sm">
                  <RebornTabPane key="web">
                    <template #title>
                      <span class="inline-flex items-center gap-1.5">
                        <Icon name="tabler:world" class="size-4" />
                        Web
                      </span>
                    </template>

                    <template #default>
                      <MdcProse v-if="componentCode" :key="componentCode" :value="componentCode" />
                    </template>
                  </RebornTabPane>

                  <RebornTabPane v-if="uniapp" key="uniapp-platform">
                    <template #title>
                      <span class="inline-flex items-center gap-1.5">
                        <Icon name="tabler:brand-wechat" class="size-4" />
                        UniApp
                      </span>
                    </template>

                    <template #default>
                      <MdcProse v-if="uniappComponentCode" :key="uniappComponentCode" :value="uniappComponentCode" />
                    </template>
                  </RebornTabPane>
                </RebornTabs>
              </template>
            </RebornTabPane>
          </RebornTabs>
        </template>
      </RebornTabPane>
    </RebornTabs>
  </div>
</template>
