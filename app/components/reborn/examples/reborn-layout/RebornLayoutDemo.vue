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
  const lines = ["<RebornLayout" + dir + ">"];
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
const boxClass = "border-default rounded-ui-md h-60 w-full overflow-hidden border";
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="layoutCode"
      component-name="RebornLayout"
      title="交互演练场"
      description="勾选区块观察方向自动推断：只有侧边栏与主区域时横向排列，一旦出现顶栏或底栏就转为纵向堆叠；也可显式指定 direction 覆盖推断结果。"
    >
      <div :class="boxClass">
        <RebornLayout
          :direction="playgroundDirection"
          class="h-full"
        >
          <RebornLayoutHeader
            v-if="state.showHeader"
            :height="`${state.headerHeight}px`"
            :class="tone.header"
          >
            Header
          </RebornLayoutHeader>

          <RebornLayoutAside
            v-if="state.showAside"
            :width="`${state.asideWidth}px`"
            :class="tone.aside"
          >
            Aside
          </RebornLayoutAside>

          <RebornLayoutMain :class="tone.main">
            Main
          </RebornLayoutMain>

          <RebornLayoutFooter
            v-if="state.showFooter"
            :height="`${state.headerHeight}px`"
            :class="tone.footer"
          >
            Footer
          </RebornLayoutFooter>
        </RebornLayout>
      </div>
    </Playground>

    <DemoSection
      title="常见布局"
      description="Layout 的直接子元素为 Header / Aside / Main / Footer 中的一个或多个；出现 Header 或 Footer 时自动纵向排列，否则横向。"
    >
      <DemoBlock
        layout="grid"
        align="start"
      >
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
              <RebornLayoutAside
                width="160px"
                :class="tone.aside"
              >
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
                <RebornLayoutAside
                  width="160px"
                  :class="tone.aside"
                >
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
              <RebornLayoutAside
                width="160px"
                :class="tone.aside"
              >
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

    <DemoSection
      title="显式指定方向"
      description="direction 会覆盖自动推断。下面两组子元素完全相同，只是方向不同。"
    >
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>direction="vertical"</code>（含 Header，与自动推断一致）</span>
          <div :class="boxClass">
            <RebornLayout
              direction="vertical"
              class="h-full"
            >
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
            <RebornLayout
              direction="horizontal"
              class="h-full"
            >
              <RebornLayoutHeader
                height="auto"
                :class="[tone.header, 'w-32']"
              >
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

    <DemoSection
      title="尺寸定制"
      description="Header / Footer 用 height，Aside 用 width，接受任意合法 CSS 长度（px、rem、百分比、auto）。"
    >
      <DemoBlock layout="stack">
        <div :class="boxClass">
          <RebornLayout class="h-full">
            <RebornLayoutHeader
              height="80px"
              :class="tone.header"
            >
              Header · 80px
            </RebornLayoutHeader>
            <RebornLayout>
              <RebornLayoutAside
                width="25%"
                :class="tone.aside"
              >
                Aside · 25%
              </RebornLayoutAside>
              <RebornLayoutMain :class="tone.main">
                Main
              </RebornLayoutMain>
            </RebornLayout>
            <RebornLayoutFooter
              height="40px"
              :class="tone.footer"
            >
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
          <RebornLayout
            class="h-full"
            :ui="{ root: 'gap-2 p-2' }"
          >
            <RebornLayoutHeader :ui="{ header: 'rounded-ui-sm bg-primary text-inverted flex items-center justify-center text-xs font-semibold' }">
              自定义顶栏
            </RebornLayoutHeader>
            <RebornLayout>
              <RebornLayoutAside
                width="140px"
                :ui="{ aside: 'rounded-ui-sm bg-elevated text-muted flex items-center justify-center text-xs' }"
              >
                自定义侧边栏
              </RebornLayoutAside>
              <RebornLayoutMain :ui="{ main: 'rounded-ui-sm bg-muted/40 text-muted flex items-center justify-center text-xs' }">
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
