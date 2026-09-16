<script setup lang="ts">
import type { LayoutDirection } from "~/components/reborn/ui/reborn-layout/reborn-layout.config";

/** 演练场绑定值 */
const state = ref<Record<string, any>>({
  direction: "auto",
  headerHeight: 60,
  asideWidth: 200,
  showHeader: true,
  showAside: true,
  showFooter: true,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "排列",
    children: [
      {
        label: "方向（auto 由子元素推断）",
        key: "direction",
        component: "select" as const,
        defaultValue: "auto",
        props: {
          options: [
            { label: "auto", value: "auto" },
            { label: "horizontal", value: "horizontal" },
            { label: "vertical", value: "vertical" },
          ],
        },
      },
    ],
  },
  {
    title: "区块",
    children: [
      { label: "显示顶栏", key: "showHeader", component: "checkbox" as const, defaultValue: true },
      { label: "显示侧边栏", key: "showAside", component: "checkbox" as const, defaultValue: true },
      { label: "显示底栏", key: "showFooter", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "尺寸",
    children: [
      {
        label: "顶栏 / 底栏高度 (px)",
        key: "headerHeight",
        component: "slider" as const,
        defaultValue: 60,
        props: { min: 40, max: 120, step: 4 },
      },
      {
        label: "侧边栏宽度 (px)",
        key: "asideWidth",
        component: "slider" as const,
        defaultValue: 200,
        props: { min: 100, max: 320, step: 10 },
      },
    ],
  },
];

/** auto 时不传 direction，交给组件扫描子节点推断 */
const playgroundDirection = computed<LayoutDirection | undefined>(() =>
  state.value.direction === "auto" ? undefined : (state.value.direction as LayoutDirection),
);

/** 演练场右上角展示的等价代码 */
const layoutCode = computed(() => {
  const dir = state.value.direction === "auto" ? "" : ` direction="${state.value.direction}"`;
  const lines = [`<RebornLayout${dir}>`];
  if (state.value.showHeader) lines.push(`  <RebornLayoutHeader height="${state.value.headerHeight}px">顶栏</RebornLayoutHeader>`);
  if (state.value.showAside) lines.push(`  <RebornLayoutAside width="${state.value.asideWidth}px">侧边栏</RebornLayoutAside>`);
  lines.push("  <RebornLayoutMain>主区域</RebornLayoutMain>");
  if (state.value.showFooter) lines.push(`  <RebornLayoutFooter height="${state.value.headerHeight}px">底栏</RebornLayoutFooter>`);
  lines.push("</RebornLayout>");
  return lines.join("\n");
});

/** 各区块的示意配色，仅用于演示，实际业务请自行传 class */
const tone = {
  header: "bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold",
  aside: "bg-elevated text-muted flex items-center justify-center text-xs font-semibold",
  main: "bg-muted/40 text-muted flex items-center justify-center text-xs font-semibold",
  footer: "bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold",
};

/** 示例容器统一高度，避免 Main 撑不开看不出效果 */
const boxClass = "border-default h-60 w-full overflow-hidden border";

// ─── 组合布局与可收起侧边栏（Sider） ─────────────────────────────

/** 组合示例统一用更高的容器，给菜单展开留出空间 */
const tallBoxClass = "border-default h-96 w-full overflow-hidden border";

/** 顶部导航备用数据源；顶栏当前演示 SubMenu 形态，切回普通水平菜单时可直接使用 */
// eslint-disable-next-line unused-imports/no-unused-vars
const topNavs = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const sideNavs = [
  { key: "sub1", icon: "lucide:user" },
  { key: "sub2", icon: "lucide:laptop" },
  { key: "sub3", icon: "lucide:bell" },
  { key: "sub4", icon: "lucide:user" },
  { key: "sub5", icon: "lucide:alarm-clock" },
  { key: "sub6", icon: "lucide:alarm-smoke" },
  { key: "sub7", icon: "lucide:anchor" },
  { key: "sub8", icon: "lucide:antenna" },
  { key: "sub9", icon: "lucide:apple" },
  { key: "sub10", icon: "lucide:armchair" },
];

/** 顶部-侧边布局-通栏的菜单激活态 */
const bannerTopActive = ref(["1"]);
const bannerSideActive = ref(["1"]);
/** 侧边布局（暗色 Sider）的激活态与收起状态 */
const darkSideActive = ref(["1"]);
const darkCollapsed = ref(false);
/** 自定义触发器的两种形态（激活态各自独立） */
const customCollapsed = ref(false);
const customSideActive = ref(["1"]);
const noTriggerCollapsed = ref(false);
const noTriggerSideActive = ref(["1"]);
/** 折叠覆盖布局（零宽收起）的收起状态与激活态 */
const zeroCollapsed = ref(true);
const zeroSideActive = ref(["1"]);
const rightZeroCollapsed = ref(true);
const rightZeroSideActive = ref(["1"]);
/** 事件回显 */
const lastSiderEvent = ref("等待操作");

function onSiderCollapse(collapsed: boolean, type: "clickTrigger" | "responsive") {
  lastSiderEvent.value = `collapse：collapsed=${collapsed}，type=${type}`;
}

/** 与 antd 顶部导航一致的深色底 */
const darkTone = "bg-[#001529]";
/** 深色侧边栏的折叠触发器配色，侧边布局 / 自定义触发器 / 折叠覆盖布局共用同一套视觉 */
const darkAsideUi = { trigger: "border-white/10 text-white/65 hover:text-white" };
/** 深色区域上的菜单：去掉菜单自带的卡片视觉，交给布局区块着色 */
const flatMenuUi = { root: "rounded-none p-0 shadow-none bg-transparent dark:bg-transparent" };
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="layoutCode" component-name="RebornLayout" title="交互演练场"
      description="勾选区块观察方向自动推断：只有侧边栏与主区域时横向排列，一旦出现顶栏或底栏就转为纵向堆叠；也可显式指定 direction 覆盖推断结果。"
    >
      <div :class="boxClass">
        <RebornLayout :direction="playgroundDirection" class="h-full">
          <RebornLayoutHeader v-if="state.showHeader" :height="`${state.headerHeight}px`" :class="tone.header">
            Header
          </RebornLayoutHeader>

          <RebornLayoutAside v-if="state.showAside" :width="`${state.asideWidth}px`" :class="tone.aside">
            Aside
          </RebornLayoutAside>

          <RebornLayoutMain :class="tone.main">
            Main
          </RebornLayoutMain>

          <RebornLayoutFooter v-if="state.showFooter" :height="`${state.headerHeight}px`" :class="tone.footer">
            Footer
          </RebornLayoutFooter>
        </RebornLayout>
      </div>
    </Playground>

    <DemoSection
      title="常见布局"
      description="Layout 的直接子元素为 Header / Aside / Main / Footer 中的一个或多个；出现 Header 或 Footer 时自动纵向排列，否则横向。"
    >
      <DemoBlock layout="stack">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">上中下</span>
          <div :class="boxClass">
            <RebornLayout class="h-full">
              <RebornLayoutHeader :class="tone.header">
                Header
              </RebornLayoutHeader>
              <RebornLayoutMain :class="tone.main">
                Main
              </RebornLayoutMain>
              <RebornLayoutFooter :class="tone.footer">
                Footer
              </RebornLayoutFooter>
            </RebornLayout>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">左右</span>
          <div :class="boxClass">
            <RebornLayout class="h-full">
              <RebornLayoutAside width="160px" :class="tone.aside">
                Aside
              </RebornLayoutAside>
              <RebornLayoutMain :class="tone.main">
                Main
              </RebornLayoutMain>
            </RebornLayout>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">上 + 左右</span>
          <div :class="boxClass">
            <RebornLayout class="h-full">
              <RebornLayoutHeader :class="tone.header">
                Header
              </RebornLayoutHeader>
              <RebornLayout>
                <RebornLayoutAside width="160px" :class="tone.aside">
                  Aside
                </RebornLayoutAside>
                <RebornLayoutMain :class="tone.main">
                  Main
                </RebornLayoutMain>
              </RebornLayout>
            </RebornLayout>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">左 + 上下</span>
          <div :class="boxClass">
            <RebornLayout class="h-full">
              <RebornLayoutAside width="160px" :class="tone.aside">
                Aside
              </RebornLayoutAside>
              <RebornLayout>
                <RebornLayoutHeader :class="tone.header">
                  Header
                </RebornLayoutHeader>
                <RebornLayoutMain :class="tone.main">
                  Main
                </RebornLayoutMain>
              </RebornLayout>
            </RebornLayout>
          </div>
        </div>
      </DemoBlock>

      <DemoNote tone="dimmed">
        「上 + 左右」与「左 + 上下」都是把一个 <code>RebornLayout</code> 嵌套进外层 Layout。嵌套的 Layout 自带
        <code>flex-auto</code>，会自动占满父级剩余空间。
      </DemoNote>
    </DemoSection>

    <DemoSection title="顶部-侧边布局-通栏" description="顶部是通栏的深色导航（水平菜单），下方左侧为子导航菜单、右侧为内容区。适合顶级导航 + 二级导航的经典后台骨架。">
      <DemoBlock layout="stack">
        <div :class="tallBoxClass">
          <RebornLayout class="h-full">
            <RebornLayoutHeader height="56px" class="flex items-center gap-6" :class="[darkTone]">
              <div class="h-6 w-24 shrink-0 rounded bg-white/20" aria-hidden="true" />
              <RebornMenu
                v-model:selected-keys="bannerTopActive" mode="horizontal" text-color="rgba(255,255,255,0.65)"
                active-text-color="#ffffff" :ui="flatMenuUi" menu-trigger="hover" :collapse="false"
                :unique-opened="false" expand-type="normal" :expand-mutex="false" background-color="#1f2937"
              >
                <RebornSubMenu
                  v-for="(nav, index) in sideNavs" :key="nav.key" :index="nav.key"
                  background-color="#1B6DFA"
                >
                  <template #icon>
                    <Icon :name="nav.icon" class="size-4" />
                  </template>
                  <template #title>subnav {{ index + 1 }}</template>
                  <RebornMenuItem v-for="j in 4" :key="j" :index="String(index * 4 + j)">
                    option{{ index * 4 + j }}
                  </RebornMenuItem>
                </RebornSubMenu>
              </RebornMenu>
            </RebornLayoutHeader>

            <RebornLayout has-sider>
              <RebornLayoutAside :width="220" class="border-gray-2 border-r">
                <RebornMenu
                  v-model:selected-keys="bannerSideActive" mode="vertical" :default-openeds="['sub1']"
                  :ui="flatMenuUi" menu-trigger="click" :collapse="false" :unique-opened="false" expand-type="normal"
                  :expand-mutex="false"
                >
                  <RebornSubMenu v-for="(nav, index) in sideNavs" :key="nav.key" :index="nav.key">
                    <template #icon>
                      <Icon :name="nav.icon" class="size-4" />
                    </template>
                    <template #title>subnav {{ index + 1 }}</template>
                    <RebornMenuItem v-for="j in 4" :key="j" :index="String(index * 4 + j)">
                      option{{ index * 4 + j }}
                    </RebornMenuItem>
                  </RebornSubMenu>
                </RebornMenu>
              </RebornLayoutAside>
              <RebornLayoutMain :class="tone.main">
                Content
              </RebornLayoutMain>
            </RebornLayout>
          </RebornLayout>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="侧边布局" description="深色侧边栏通高、可收起（collapsible），右侧为顶栏 + 内容 + 底栏。收起后菜单进入折叠态，只显示图标。">
      <DemoBlock layout="stack">
        <div :class="tallBoxClass">
          <RebornLayout has-sider class="h-full">
            <RebornLayoutAside v-model:collapsed="darkCollapsed" collapsible :class="darkTone" :ui="darkAsideUi">
              <div class="m-4 h-8 rounded bg-white/20" aria-hidden="true" />
              <RebornMenu
                v-model:selected-keys="darkSideActive" mode="vertical" :collapse="darkCollapsed"
                background-color="transparent" text-color="rgba(255,255,255,0.65)" active-text-color="#ffffff"
                :ui="flatMenuUi"
              >
                <RebornMenuItem v-for="(nav, index) in sideNavs" :key="nav.key" :index="String(index + 1)">
                  <template #icon>
                    <Icon :name="nav.icon" class="size-4" />
                  </template>
                  nav {{ index + 1 }}
                </RebornMenuItem>
              </RebornMenu>
            </RebornLayoutAside>

            <RebornLayout>
              <RebornLayoutHeader :class="tone.header">
                Header
              </RebornLayoutHeader>
              <RebornLayoutMain :class="tone.main">
                Content
              </RebornLayoutMain>
              <RebornLayoutFooter height="40px" :class="tone.footer">
                Reborn UI ©2026
              </RebornLayoutFooter>
            </RebornLayout>
          </RebornLayout>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="自定义触发器"
      description="trigger 插槽（参数 collapsed）替换默认箭头；prop trigger 设为 null 隐藏触发器，改由外部按钮通过 v-model:collapsed 控制。collapse 事件区分 clickTrigger 与 responsive 两种来源。"
    >
      <DemoBlock layout="grid" align="start">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>#trigger</code> 插槽自定义内容</span>
          <div :class="boxClass">
            <RebornLayout has-sider class="h-full">
              <RebornLayoutAside
                v-model:collapsed="customCollapsed" collapsible :class="darkTone" :ui="darkAsideUi"
                @collapse="onSiderCollapse"
              >
                <div class="m-4 h-8 rounded bg-white/20" aria-hidden="true" />
                <RebornMenu
                  v-model:selected-keys="customSideActive" mode="vertical" :collapse="customCollapsed"
                  background-color="transparent" text-color="rgba(255,255,255,0.65)" active-text-color="#ffffff"
                  :ui="flatMenuUi"
                >
                  <RebornMenuItem
                    v-for="(nav, index) in sideNavs.slice(0, 3)" :key="nav.key"
                    :index="String(index + 1)"
                  >
                    <template #icon>
                      <Icon :name="nav.icon" class="size-4" />
                    </template>
                    nav {{ index + 1 }}
                  </RebornMenuItem>
                </RebornMenu>
                <template #trigger="{ collapsed }">
                  <span class="flex items-center gap-2 text-xs">
                    <Icon :name="collapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'" class="size-4" />
                    <template v-if="!collapsed">收起菜单</template>
                  </span>
                </template>
              </RebornLayoutAside>
              <RebornLayoutMain :class="tone.main">
                Content
              </RebornLayoutMain>
            </RebornLayout>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>:trigger="null"</code> + 外部控制</span>
          <div :class="boxClass">
            <RebornLayout direction="vertical" class="h-full">
              <RebornLayoutHeader height="48px" class="justify-start!" :class="[tone.header]">
                <RebornButton
                  size="sm" variant="text" color="neutral"
                  @click="noTriggerCollapsed = !noTriggerCollapsed"
                >
                  <Icon :name="noTriggerCollapsed ? 'lucide:menu' : 'lucide:x'" class="size-4" />
                </RebornButton>
              </RebornLayoutHeader>
              <RebornLayout has-sider>
                <RebornLayoutAside v-model:collapsed="noTriggerCollapsed" collapsible :trigger="null" :class="darkTone">
                  <div class="m-4 h-8 rounded bg-white/20" aria-hidden="true" />
                  <RebornMenu
                    v-model:selected-keys="noTriggerSideActive" mode="vertical" :collapse="noTriggerCollapsed"
                    background-color="transparent" text-color="rgba(255,255,255,0.65)" active-text-color="#ffffff"
                    :ui="flatMenuUi"
                  >
                    <RebornMenuItem
                      v-for="(nav, index) in sideNavs.slice(0, 3)" :key="nav.key"
                      :index="String(index + 1)"
                    >
                      <template #icon>
                        <Icon :name="nav.icon" class="size-4" />
                      </template>
                      nav {{ index + 1 }}
                    </RebornMenuItem>
                  </RebornMenu>
                </RebornLayoutAside>
                <RebornLayoutMain :class="tone.main">
                  Content
                </RebornLayoutMain>
              </RebornLayout>
            </RebornLayout>
          </div>
        </div>
      </DemoBlock>

      <DemoNote tone="dimmed" class="font-mono text-xs">
        {{ lastSiderEvent }}
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="折叠覆盖布局"
      description="collapsedWidth 为 0 时侧边栏完全收起，特殊触发器悬浮覆盖在内容区上（样式可用 zero-width-trigger-style 定制）；侧边栏在右侧时用 reverse-arrow 让触发器贴左外缘。"
    >
      <DemoBlock layout="grid" align="start">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>collapsed-width="0"</code>（触发器覆盖在内容上）</span>
          <div :class="boxClass">
            <RebornLayout has-sider class="h-full">
              <RebornLayoutAside v-model:collapsed="zeroCollapsed" collapsible :collapsed-width="0" :class="darkTone">
                <div class="m-4 h-8 rounded bg-white/20" aria-hidden="true" />
                <RebornMenu
                  v-model:selected-keys="zeroSideActive" mode="vertical" background-color="transparent"
                  text-color="rgba(255,255,255,0.65)" active-text-color="#ffffff" :ui="flatMenuUi"
                >
                  <RebornMenuItem
                    v-for="(nav, index) in sideNavs.slice(0, 3)" :key="nav.key"
                    :index="String(index + 1)"
                  >
                    <template #icon>
                      <Icon :name="nav.icon" class="size-4" />
                    </template>
                    nav {{ index + 1 }}
                  </RebornMenuItem>
                </RebornMenu>
              </RebornLayoutAside>
              <RebornLayoutMain :class="tone.main">
                Content
              </RebornLayoutMain>
            </RebornLayout>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>reverse-arrow</code>（侧边栏在右，触发器贴左）</span>
          <div :class="boxClass">
            <RebornLayout has-sider class="h-full">
              <RebornLayoutMain :class="tone.main">
                Content
              </RebornLayoutMain>
              <RebornLayoutAside
                v-model:collapsed="rightZeroCollapsed" collapsible reverse-arrow :collapsed-width="0"
                :class="darkTone"
              >
                <div class="m-4 h-8 rounded bg-white/20" aria-hidden="true" />
                <RebornMenu
                  v-model:selected-keys="rightZeroSideActive" mode="vertical" background-color="transparent"
                  text-color="rgba(255,255,255,0.65)" active-text-color="#ffffff" :ui="flatMenuUi"
                >
                  <RebornMenuItem
                    v-for="(nav, index) in sideNavs.slice(0, 3)" :key="nav.key"
                    :index="String(index + 1)"
                  >
                    <template #icon>
                      <Icon :name="nav.icon" class="size-4" />
                    </template>
                    nav {{ index + 1 }}
                  </RebornMenuItem>
                </RebornMenu>
              </RebornLayoutAside>
            </RebornLayout>
          </div>
        </div>
      </DemoBlock>

      <DemoNote tone="dimmed">
        配置 <code>breakpoint</code>（xs–xxl）后，视口跨过断点会自动收起/展开并触发 <code>breakpoint</code> 事件——它监听的是浏览器视口宽度，请缩放窗口体验。
      </DemoNote>
    </DemoSection>

    <DemoSection title="固定头部 + 固定侧边栏" description="Main 自带独立滚动（overflow-auto），因此顶栏与侧边栏天然固定：长内容只在内容区内滚动，头部与菜单保持原位。">
      <DemoBlock layout="stack">
        <div :class="tallBoxClass">
          <RebornLayout class="h-full">
            <RebornLayoutHeader height="56px" class="flex items-center gap-6" :class="[darkTone]">
              <div class="h-6 w-24 shrink-0 rounded bg-white/20" aria-hidden="true" />
              <span class="text-sm text-white/90">固定头部</span>
            </RebornLayoutHeader>
            <RebornLayout has-sider>
              <RebornLayoutAside :width="180" class="border-gray-2 border-r">
                <div class="flex flex-col gap-1 p-3 text-xs">
                  <div
                    v-for="k in 12" :key="k" class="text-muted rounded px-3 py-2"
                    :class="k === 1 ? 'bg-primary/10 text-primary' : ''"
                  >
                    菜单项 {{ k }}
                  </div>
                </div>
              </RebornLayoutAside>
              <RebornLayoutMain>
                <div class="flex flex-col gap-4">
                  <p v-for="k in 20" :key="k" class="text-muted bg-muted/40 rounded p-4 text-xs">
                    长内容 {{ k }}：只有这块内容区在滚动，头部与侧边栏保持固定。
                  </p>
                </div>
              </RebornLayoutMain>
            </RebornLayout>
          </RebornLayout>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="显式指定方向" description="direction 会覆盖自动推断。下面两组子元素完全相同，只是方向不同。">
      <DemoBlock layout="grid" align="start">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>direction="vertical"</code>（含 Header，与自动推断一致）</span>
          <div :class="boxClass">
            <RebornLayout direction="vertical" class="h-full">
              <RebornLayoutHeader :class="tone.header">
                Header
              </RebornLayoutHeader>
              <RebornLayoutMain :class="tone.main">
                Main
              </RebornLayoutMain>
            </RebornLayout>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>direction="horizontal"</code>（含 Header，强制横向）</span>
          <div :class="boxClass">
            <RebornLayout direction="horizontal" class="h-full">
              <RebornLayoutHeader height="auto" class="w-32" :class="[tone.header]">
                Header
              </RebornLayoutHeader>
              <RebornLayoutMain :class="tone.main">
                Main
              </RebornLayoutMain>
            </RebornLayout>
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="尺寸定制" description="Header / Footer 用 height，Aside 用 width，接受任意合法 CSS 长度（px、rem、百分比、auto）。">
      <DemoBlock layout="stack">
        <div :class="boxClass">
          <RebornLayout class="h-full">
            <RebornLayoutHeader height="80px" :class="tone.header">
              Header · 80px
            </RebornLayoutHeader>
            <RebornLayout>
              <RebornLayoutAside width="25%" :class="tone.aside">
                Aside · 25%
              </RebornLayoutAside>
              <RebornLayoutMain :class="tone.main">
                Main
              </RebornLayoutMain>
            </RebornLayout>
            <RebornLayoutFooter height="40px" :class="tone.footer">
              Footer · 40px
            </RebornLayoutFooter>
          </RebornLayout>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="样式覆盖"
      description="每个组件都支持 class 与 ui；ui 的键名与内部 slot 同名（root / header / aside / main / footer）。"
    >
      <DemoBlock layout="stack">
        <div :class="boxClass">
          <RebornLayout class="h-full" :ui="{ root: 'gap-2 p-2' }">
            <RebornLayoutHeader
              :ui="{ header: 'rounded-lg bg-primary text-inverted flex items-center justify-center text-xs font-semibold' }"
            >
              自定义顶栏
            </RebornLayoutHeader>
            <RebornLayout>
              <RebornLayoutAside
                width="140px"
                :ui="{ aside: 'rounded-lg bg-elevated text-muted flex items-center justify-center text-xs' }"
              >
                自定义侧边栏
              </RebornLayoutAside>
              <RebornLayoutMain
                :ui="{ main: 'rounded-lg bg-muted/40 text-muted flex items-center justify-center text-xs' }"
              >
                自定义主区域
              </RebornLayoutMain>
            </RebornLayout>
          </RebornLayout>
        </div>
      </DemoBlock>

      <DemoNote tone="dimmed">
        <code>RebornLayout</code> 与站内已有的 <code>RebornContainer</code>（限宽居中容器）、
        <code>RebornHeader</code>（站点导航头）语义不同，请勿混用。
      </DemoNote>
    </DemoSection>
  </div>
</template>
