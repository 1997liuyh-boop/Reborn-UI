<script setup lang="ts">
import type { BreadcrumbRoute } from "~/components/reborn/ui/reborn-breadcrumb/reborn-breadcrumb.config";
import RebornBreadcrumb from "~/components/reborn/ui/reborn-breadcrumb/RebornBreadcrumb.vue";
import RebornBreadcrumbItem from "~/components/reborn/ui/reborn-breadcrumb/RebornBreadcrumbItem.vue";
import RebornDropdownItem from "~/components/reborn/ui/reborn-dropdown/RebornDropdownItem.vue";

/** 演练场默认状态 */
const defaultState = {
  separator: "/",
  separatorIcon: "",
  maxCount: 0,
};

/** 演练场状态 */
const state = ref({ ...defaultState });

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
}

/** 演练场控制面板配置 */
const controls = [
  {
    title: "分隔符",
    children: [
      {
        label: "文本分隔符",
        key: "separator",
        component: "input" as const,
        defaultValue: "/",
      },
      {
        label: "图标分隔符（覆盖文本）",
        key: "separatorIcon",
        component: "input" as const,
        props: { placeholder: "如：lucide:chevron-right" },
        defaultValue: "",
      },
    ],
  },
  {
    title: "折叠",
    children: [
      {
        label: "最多展示数量（0 不限制）",
        key: "maxCount",
        component: "slider" as const,
        props: { min: 0, max: 6, step: 1 },
        defaultValue: 0,
      },
    ],
  },
];

/**
 * 演练场右上角展示的传参明细。
 * 面包屑没有 v-model，条目由默认插槽给出，因此不走 Playground 的自动生成，手工拼装完整片段。
 */
const breadcrumbCode = computed(() => {
  const s = state.value;
  const props = [`separator="${s.separator}"`, `separator-icon="${s.separatorIcon}"`, `:max-count="${Number(s.maxCount)}"`];
  const items = [
    '  <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>',
    '  <RebornBreadcrumbItem to="/components">组件库</RebornBreadcrumbItem>',
    '  <RebornBreadcrumbItem to="/components/navigation">导航组件</RebornBreadcrumbItem>',
    '  <RebornBreadcrumbItem to="/components/navigation/reborn-breadcrumb">面包屑</RebornBreadcrumbItem>',
    "  <RebornBreadcrumbItem>基础用法</RebornBreadcrumbItem>",
  ];

  return `<RebornBreadcrumb\n  ${props.join("\n  ")}\n>\n${items.join("\n")}\n</RebornBreadcrumb>`;
});

/** routes 模式的数据源，children 会渲染成条目上的下拉菜单 */
const routes: BreadcrumbRoute[] = [
  { label: "首页", path: "/" },
  {
    label: "组件库",
    path: "/components",
    children: [
      { label: "按钮 Button", path: "/components/button/reborn-button" },
      { label: "标签 Badge", path: "/components/data/reborn-badge" },
      { label: "下拉菜单 Dropdown", path: "/components/navigation/reborn-dropdown" },
    ],
  },
  { label: "导航组件", path: "/components/navigation" },
  { label: "面包屑", path: "/components/navigation/reborn-breadcrumb" },
];

/** 长路径，用于演示 max-count 折叠 */
const longRoutes: BreadcrumbRoute[] = [
  { label: "首页", path: "/" },
  { label: "商品中心", path: "/goods" },
  { label: "家用电器", path: "/goods/appliance" },
  { label: "厨房电器", path: "/goods/appliance/kitchen" },
  { label: "微波炉", path: "/goods/appliance/kitchen/microwave" },
  { label: "商品详情", path: "/goods/appliance/kitchen/microwave/detail" },
];

/** 下拉菜单数据，配合 breadcrumb-item 的 droplist 属性使用 */
const droplist = [
  { label: "活动列表", path: "/promotion/list" },
  { label: "活动模板", path: "/promotion/template" },
  { label: "活动数据", path: "/promotion/analysis" },
];

const lastSelected = ref("");
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground v-model="state" :controls="controls" :code="breadcrumbCode" component-name="RebornBreadcrumb"
      title="交互演练场"
      description="切换分隔符样式、填入 Iconify 图标名替代文本分隔符，或调整最多展示数量观察折叠效果。">
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <RebornBreadcrumb :separator="state.separator" :separator-icon="state.separatorIcon"
        :max-count="Number(state.maxCount)">
        <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
        <RebornBreadcrumbItem to="/components">组件库</RebornBreadcrumbItem>
        <RebornBreadcrumbItem to="/components/navigation">导航组件</RebornBreadcrumbItem>
        <RebornBreadcrumbItem to="/components/navigation/reborn-breadcrumb">面包屑</RebornBreadcrumbItem>
        <RebornBreadcrumbItem>基础用法</RebornBreadcrumbItem>
      </RebornBreadcrumb>
    </Playground>

    <DemoSection title="基础用法" description="条目用 RebornBreadcrumbItem 包裹，末项自动识别为当前页，渲染为不可点击的文本。">
      <DemoBlock layout="stack">
        <RebornBreadcrumb>
          <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
          <RebornBreadcrumbItem to="/channel">频道</RebornBreadcrumbItem>
          <RebornBreadcrumbItem>新闻</RebornBreadcrumbItem>
        </RebornBreadcrumb>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="分隔符定制" description="separator 传文本、separator-icon 传图标；条目上的同名属性与 #separator 插槽优先级更高。">
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem>
          <template #label>
            容器文本 · <code>separator</code>
          </template>
          <RebornBreadcrumb separator=">">
            <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
            <RebornBreadcrumbItem to="/promotion">活动管理</RebornBreadcrumbItem>
            <RebornBreadcrumbItem>活动详情</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </DemoItem>

        <DemoItem>
          <template #label>
            容器图标 · <code>separator-icon</code>
          </template>
          <RebornBreadcrumb separator-icon="lucide:arrow-right">
            <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
            <RebornBreadcrumbItem to="/user">用户中心</RebornBreadcrumbItem>
            <RebornBreadcrumbItem>设置</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </DemoItem>

        <DemoItem>
          <template #label>
            条目属性 · <code>separator</code>
          </template>
          <RebornBreadcrumb separator="/">
            <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
            <RebornBreadcrumbItem to="/shop" separator="→">商城</RebornBreadcrumbItem>
            <RebornBreadcrumbItem>购物车</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </DemoItem>

        <DemoItem>
          <template #label>
            条目插槽 · <code>#separator</code>
          </template>
          <RebornBreadcrumb>
            <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
            <RebornBreadcrumbItem to="/shop">
              商城
              <template #separator>
                <span class="text-primary mx-1">~</span>
              </template>
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>购物车</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="尺寸与配色" description="通过 ui 传入细粒度类名覆盖根节点与条目样式，父级 ui 会级联到所有子条目。">
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="缩小字号" mono>
          <RebornBreadcrumb :ui="{ root: 'text-xs', separator: 'text-2xs' }">
            <RebornBreadcrumbItem to="/">小号</RebornBreadcrumbItem>
            <RebornBreadcrumbItem to="/components">组件库</RebornBreadcrumbItem>
            <RebornBreadcrumbItem>面包屑</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </DemoItem>

        <DemoItem label="放大字号 + 主色链接" mono>
          <RebornBreadcrumb :ui="{ root: 'text-base', link: 'text-primary/80', separator: 'text-primary/40' }">
            <RebornBreadcrumbItem to="/">大号主色</RebornBreadcrumbItem>
            <RebornBreadcrumbItem to="/components">组件库</RebornBreadcrumbItem>
            <RebornBreadcrumbItem>面包屑</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="routes 数据驱动" description="传入 routes 后由组件渲染条目；item-render 插槽可接管单项内容，custom-url 可改写跳转地址。">
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="routes（默认渲染）" mono>
          <RebornBreadcrumb :routes="routes" />
        </DemoItem>

        <DemoItem>
          <template #label>
            <code>#item-render</code> 接管单项
          </template>
          <template #note>
            作用域参数包含 <code>route</code>、<code>routes</code> 与 <code>paths</code>。
          </template>
          <RebornBreadcrumb :routes="routes">
            <template #item-render="{ route, paths }">
              <span class="inline-flex items-center gap-1">
                <Icon name="lucide:folder" class="size-3.5 opacity-60" />
                {{ route.label }}
                <span class="text-dimmed text-2xs">({{ paths.length }})</span>
              </span>
            </template>
          </RebornBreadcrumb>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="下拉菜单" description="routes 项的 children 或条目的 droplist 属性都会渲染成下拉菜单，也可用 #droplist 插槽完全自定义。">
      <DemoBlock layout="stack" align="start">
        <DemoItem>
          <template #label>
            routes 项的 <code>children</code>
          </template>
          <RebornBreadcrumb :routes="routes" @select="item => (lastSelected = item.label)" />
        </DemoItem>

        <DemoItem>
          <template #label>
            条目的 <code>droplist</code> 属性
          </template>
          <RebornBreadcrumb>
            <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
            <RebornBreadcrumbItem :droplist="droplist" @select="item => (lastSelected = item.label)">
              活动管理
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>活动详情</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </DemoItem>

        <DemoItem>
          <template #label>
            <code>#droplist</code> 插槽完全自定义
          </template>
          <RebornBreadcrumb>
            <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
            <RebornBreadcrumbItem>
              频道
              <template #droplist>
                <RebornDropdownItem command="a">自定义项 1</RebornDropdownItem>
                <RebornDropdownItem command="b">自定义项 2</RebornDropdownItem>
                <RebornDropdownItem command="c" divided>自定义项 3</RebornDropdownItem>
              </template>
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>新闻</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </DemoItem>

        <DemoNote tone="dimmed">最近选择：{{ lastSelected || "（尚未选择）" }}</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="超出折叠" description="max-count 指定最多展示的条目数量，超出部分折叠为省略号，始终保留首项与末尾若干项。">
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="max-count = 3" mono note="原始 6 项，折叠后只留首项与末两项。">
          <RebornBreadcrumb :routes="longRoutes" :max-count="3" />
        </DemoItem>

        <DemoItem>
          <template #label>
            max-count = 4 · <code>#more-icon</code>
          </template>
          <template #note>
            用 <code>#more-icon</code> 替换了默认的省略号图标。
          </template>
          <RebornBreadcrumb :routes="longRoutes" :max-count="4">
            <template #more-icon>
              <span class="text-primary text-xs font-semibold">···</span>
            </template>
          </RebornBreadcrumb>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="链接与跳转方式" description="每一项通过 to 指定跳转地址，replace 控制以 push / replace / blank 三种方式打开。">
      <DemoBlock layout="stack">
        <RebornBreadcrumb separator="/">
          <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
          <RebornBreadcrumbItem to="/components" replace="replace">组件库（替换历史记录）</RebornBreadcrumbItem>
          <RebornBreadcrumbItem to="https://github.com" replace="blank">GitHub（新窗口）</RebornBreadcrumbItem>
          <RebornBreadcrumbItem>项目详情</RebornBreadcrumbItem>
        </RebornBreadcrumb>
        <DemoNote tone="dimmed">末项即使传了 <code>to</code> 也会渲染为纯文本，表示当前所在页，不可点击。</DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>