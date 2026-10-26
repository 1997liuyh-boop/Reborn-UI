<script setup lang="ts">
import type { PageHeaderUI } from "~/components/reborn/ui/reborn-page-header/reborn-page-header.config";
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, ref, shallowRef } from 'vue';
import RebornBadge from "~/components/reborn/ui/reborn-badge/RebornBadge.vue";
import RebornBreadcrumb from "~/components/reborn/ui/reborn-breadcrumb/RebornBreadcrumb.vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornPageHeader from "~/components/reborn/ui/reborn-page-header/RebornPageHeader.vue";

/** 演示用的面包屑路径 */
const routes = [
  { label: "首页", path: "#" },
  { label: "组件", path: "#" },
  { label: "页头" },
];

/** 图标选项：none 表示传空字符串，不显示图标 */
const iconOptions = [
  { label: "lucide:arrow-left（默认）", value: "lucide:arrow-left" },
  { label: "lucide:chevron-left", value: "lucide:chevron-left" },
  { label: "lucide:house", value: "lucide:house" },
  { label: "不显示（空字符串）", value: "none" },
];

/** 组合示例用的面包屑路径 */
const detailRoutes = [
  { label: "订单管理", path: "#" },
  { label: "订单列表", path: "#" },
  { label: "订单详情" },
];
/** 组合示例：去掉左右与顶部边框，只保留底边，与下方内容区衔接 */
const bottomBorderUi: PageHeaderUI = { root: 'border-x-0 border-t-0' };

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态：取设计稿「标准页头」的文案 */
const defaultState: Record<string, any> = {
  title: "重塑控件库",
  content: "PC端企业级控件库V1.0",
  icon: "lucide:arrow-left",
  breadcrumb: false,
  extra: false,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 返回区被触发的次数 */
const backCount = shallowRef(0);

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  backCount.value = 0;
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      { label: "主标题", key: "title", component: "input" as const, defaultValue: defaultState.title },
      { label: "内容", key: "content", component: "input" as const, defaultValue: defaultState.content },
      { label: "图标", key: "icon", component: "select" as const, defaultValue: "lucide:arrow-left", props: { options: iconOptions } },
    ],
  },
  {
    title: "插槽",
    children: [
      { label: "面包屑（#breadcrumb）", key: "breadcrumb", component: "checkbox" as const, defaultValue: false },
      { label: "扩展操作（#extra）", key: "extra", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码：完整列出当前全部参数 */
const pageHeaderCode = computed(() => {
  const s = state.value;
  const slotLines = [
    ...(s.breadcrumb ? ["  <template #breadcrumb>", "    <RebornBreadcrumb :routes=\"routes\" />", "  </template>"] : []),
    ...(s.extra ? ["  <template #extra>", "    <RebornButton>编辑</RebornButton>", "  </template>"] : []),
  ];
  return [
    "<RebornPageHeader",
    `  title="${s.title}"`,
    `  content="${s.content}"`,
    `  icon="${s.icon === "none" ? "" : s.icon}"`,
    `  @back="onBack"${slotLines.length ? "" : "\n/>"}`,
    ...(slotLines.length ? [">", ...slotLines, "</RebornPageHeader>"] : []),
  ].join("\n");
});

// ─── 场景演示状态 ─────────────────────────────────────────────────

/** 「返回事件」一节的回显 */
const lastBack = shallowRef("尚未触发");

function onBack(event: MouseEvent | KeyboardEvent) {
  lastBack.value = event instanceof KeyboardEvent ? `键盘触发（${event.key === " " ? "空格" : event.key}）` : "鼠标点击触发";
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="pageHeaderCode" component-name="RebornPageHeader"
      title="交互演练场" description="调节上方参数，查看标题、内容、图标与面包屑、扩展操作两个插槽在页头里的排布。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col gap-4">
        <RebornPageHeader
          :title="state.title" :content="state.content" :icon="state.icon === 'none' ? '' : state.icon" class="w-full"
          @back="backCount++"
        >
          <template v-if="state.breadcrumb" #breadcrumb>
            <RebornBreadcrumb :routes="routes" />
          </template>
          <template v-if="state.extra" #extra>
            <RebornButton>编辑</RebornButton>
          </template>
        </RebornPageHeader>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          back 已触发 {{ backCount }} 次；点击图标或标题都算，Tab 聚焦后按 Enter / 空格同样触发。
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="标准页头">
      <template #description>
        <code>title</code> 是主标题，<code>content</code> 是右侧的补充说明，两者之间自动加一条竖线；适合没有层级路径的详情页。
      </template>
      <DemoBlock layout="stack">
        <RebornPageHeader title="重塑控件库" content="PC端企业级控件库V1.0" class="w-full" />
        <RebornPageHeader title="重塑控件库" class="w-full" />
      </DemoBlock>
      <DemoNote tone="dimmed">
        第二个没有传 content：分割线随之不渲染，标题后面不会留一条孤零零的竖线。
      </DemoNote>
    </DemoSection>

    <DemoSection title="带面包屑页头">
      <template #description>
        <code>#breadcrumb</code> 插槽放在标题行上方，间隔 24px，同时交代层级路径与当前页面。
      </template>
      <DemoBlock layout="stack">
        <RebornPageHeader title="重塑控件库" content="PC端企业级控件库V1.0" class="w-full">
          <template #breadcrumb>
            <RebornBreadcrumb :routes="routes" />
          </template>
        </RebornPageHeader>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="组合示例">
      <template #description>
        面包屑 + 标题 + 状态标签 + 操作按钮的完整页头；标签放进 <code>#title</code> 插槽，按钮放进 <code>#extra</code>，用 <code>ui.root</code> 只保留底边，下方接内容区。
      </template>
      <DemoBlock layout="stack">
        <div class="flex w-full flex-col gap-4">
          <RebornPageHeader content="下单时间 2026-10-16 10:24" :ui="bottomBorderUi">
            <template #breadcrumb>
              <RebornBreadcrumb :routes="detailRoutes" />
            </template>
            <template #title>
              <span class="flex items-center gap-2">
                订单 #20261016001
                <RebornBadge label="待发货" color="warning" variant="soft" />
              </span>
            </template>
            <template #extra>
              <RebornButton variant="outlined" color="neutral">
                打印
              </RebornButton>
              <RebornButton>发货</RebornButton>
            </template>
          </RebornPageHeader>
          <div class="text-gray-8 flex h-60 items-center justify-center border border-dashed border-gray-4 bg-gray-2 px-6 text-base">
            这里是内容区域。内容区域可以是文字、图片、表单、表格等形式的信息内容。
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="图标与插槽">
      <template #description>
        <code>icon</code> 接受 Iconify 图标名或组件，传空字符串不显示图标；<code>#icon</code> / <code>#title</code> / <code>#content</code> 插槽分别替换对应节点的内容，样式容器保留。
      </template>
      <DemoBlock layout="stack">
        <RebornPageHeader icon="lucide:chevron-left" title="chevron-left 图标" content="icon 换成任意 Iconify 图标" class="w-full" />
        <RebornPageHeader icon="" title="不显示图标" content="icon 传空字符串" class="w-full" />
        <RebornPageHeader class="w-full">
          <template #icon>
            <Icon name="lucide:circle-arrow-left" class="text-primary size-6" />
          </template>
          <template #content>
            <span class="text-primary">#content 插槽</span>可以放任意内容
          </template>
        </RebornPageHeader>
      </DemoBlock>
      <DemoNote tone="dimmed">
        第三个没有传 title，标题显示默认的「返回」。
      </DemoNote>
    </DemoSection>

    <DemoSection title="返回事件">
      <template #description>
        点击返回区（图标 + 标题）派发 <code>back</code>，组件不做任何跳转；返回上一页、关闭抽屉等行为由回调决定。
      </template>
      <DemoBlock layout="stack">
        <RebornPageHeader title="返回列表" content="点击左侧或 Tab 聚焦后按 Enter" class="w-full" @back="onBack" />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          最近一次：{{ lastBack }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
