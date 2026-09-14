<script setup lang="ts">
import type { AnchorItem } from "~/components/reborn/ui/reborn-anchor/reborn-anchor.config";
import { computed, ref } from "vue";
import {
  anchorColors,
  anchorDirections,
  anchorMarkers,
  anchorTypes,
} from "~/components/reborn/ui/reborn-anchor/reborn-anchor.config";
import RebornAnchor from "~/components/reborn/ui/reborn-anchor/RebornAnchor.vue";
import RebornAnchorLink from "~/components/reborn/ui/reborn-anchor/RebornAnchorLink.vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";

// ─── 演示内容 ─────────────────────────────────────────

/** 各演示共用的章节文案；每个演示用自己的前缀生成 id，避免同一页面上 id 重名 */
const chapters = [
  { key: "install", title: "安装", text: "组件随 Reborn UI 一起安装，不需要单独引入依赖。" },
  { key: "usage", title: "基础用法", text: "把链接的 href 指向容器里某个元素的 id，滚动时链接会跟着高亮。" },
  { key: "spy", title: "滚动判定", text: "组件取最后一个越过触发线的目标作为选中项，链接顺序要和区块顺序一致。" },
  { key: "faq", title: "常见问题", text: "点了没反应，多半是 href 指向的 id 不在 container 里，或者页面上没有这个 id。" },
];

/** 演练场的章节节点：比 AnchorItem 多一个 text，用来渲染右侧区块的正文 */
interface PlaygroundChapter {
  key: string;
  title: string;
  text: string;
  children?: PlaygroundChapter[];
}

/**
 * 演练场单独用一棵四级章节树，不复用上面的 chapters：
 * chapters 被另外九节共用，在它上面挂 children 会把那九节一起改掉
 */
const playgroundChapters: PlaygroundChapter[] = [
  {
    key: "install",
    title: "安装",
    text: "组件随 Reborn UI 一起安装，不需要单独引入依赖。",
    children: [
      {
        key: "pm",
        title: "包管理器",
        text: "仓库用 pnpm，换成别的包管理器也能装，只是锁文件对不上。",
        children: [
          {
            key: "pnpm",
            title: "pnpm",
            text: "pnpm add reborn-ui，装完由 Nuxt 自动注册，页面里不用手写 import。",
            children: [
              {
                key: "workspace",
                title: "工作区依赖",
                text: "monorepo 里要装进具体的子包，只装在根目录时子包解析不到。",
              },
            ],
          },
          { key: "npm", title: "npm", text: "npm i reborn-ui，与 pnpm 的差别只在依赖提升方式。" },
        ],
      },
    ],
  },
  {
    key: "usage",
    title: "基础用法",
    text: "把链接的 href 指向容器里某个元素的 id，滚动时链接会跟着高亮。",
    children: [
      {
        key: "container",
        title: "容器与 id",
        text: "container 指到真正发生滚动的那一层，href 对应的 id 必须落在这层内部。",
      },
    ],
  },
  {
    key: "spy",
    title: "滚动判定",
    text: "组件取最后一个越过触发线的目标作为选中项，链接顺序要和区块顺序一致。",
  },
  {
    key: "faq",
    title: "常见问题",
    text: "点了没反应，多半是 href 指向的 id 不在 container 里，或者页面上没有这个 id。",
  },
];

/** 「子链接嵌套」用的两级章节 */
const nestedChapters = [
  {
    key: "start",
    title: "开始使用",
    children: [
      { key: "install", title: "安装" },
      { key: "import", title: "引入" },
    ],
  },
  {
    key: "api",
    title: "API",
    children: [
      { key: "props", title: "属性" },
      { key: "events", title: "事件" },
    ],
  },
];

/** 「items 数据化配置」直接把这份数据交给组件，链接由组件递归渲染，页面上不再逐个写 RebornAnchorLink */
const anchorItems: AnchorItem[] = [
  {
    key: "guide",
    href: "#anchor-items-guide",
    title: "指南",
    children: [
      { key: "install", href: "#anchor-items-install", title: "安装" },
      { key: "import", href: "#anchor-items-import", title: "引入" },
    ],
  },
  {
    key: "api",
    href: "#anchor-items-api",
    title: "API",
    children: [
      { key: "props", href: "#anchor-items-props", title: "属性" },
      // 单独给这一项设偏移量，点它时目标会停在距顶 72px 处，其余项仍按组件的 offset 走
      { key: "events", href: "#anchor-items-events", title: "事件", offset: 72 },
    ],
  },
];

/** 把嵌套的 items 拍平成区块列表，右侧演示区照着它渲染出对应的锚点目标 */
function flattenItems(list: AnchorItem[], depth = 0): { id: string; title: string; depth: number }[] {
  return list.flatMap(item => [
    { id: (item.href ?? "").slice(1), title: item.title ?? "", depth },
    ...flattenItems(item.children ?? [], depth + 1),
  ]);
}

const itemsBlocks = flattenItems(anchorItems);

/** 按演示前缀拼出区块 id */
function blockId(prefix: string, key: string) {
  return `${prefix}-${key}`;
}

/** 按演示前缀拼出链接 href */
function blockHref(prefix: string, key: string) {
  return `#${prefix}-${key}`;
}

// ─── 交互演练场 ─────────────────────────────────────────

/** 章节树转成组件要的 items：href 按演练场前缀生成，text 只给右侧区块用，不传给组件 */
function toAnchorItems(list: PlaygroundChapter[]): AnchorItem[] {
  return list.map(item => ({
    key: item.key,
    href: blockHref("anchor-playground", item.key),
    title: item.title,
    children: item.children && toAnchorItems(item.children),
  }));
}

/** 拍平成区块列表，depth 用来给右侧区块做与左侧同层级的缩进 */
function flattenChapters(list: PlaygroundChapter[], depth = 0): (PlaygroundChapter & { depth: number })[] {
  return list.flatMap(item => [
    { ...item, depth },
    ...flattenChapters(item.children ?? [], depth + 1),
  ]);
}

const playgroundItems = toAnchorItems(playgroundChapters);
const playgroundBlocks = flattenChapters(playgroundChapters);

const defaultState: Record<string, any> = {
  type: "default",
  direction: "vertical",
  color: "primary",
  marker: "bar",
  offset: 0,
  bound: 15,
  duration: 300,
  selectScrollTop: false,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 演练场最近一次 change 的载荷，给预览区一个可见的回应 */
const lastChange = ref("（尚未触发）");
/** 演练场链接被点击的次数 */
const clickCount = ref(0);
/** 演练场的滚动容器，重置时一并滚回顶部 */
const playgroundBox = ref<HTMLElement | null>(null);

function onPlaygroundChange(href: string | undefined) {
  lastChange.value = href ?? "（未选中）";
}

function onPlaygroundClick() {
  clickCount.value++;
}

function resetState() {
  state.value = { ...defaultState };
  lastChange.value = "（尚未触发）";
  clickCount.value = 0;
  playgroundBox.value?.scrollTo({ top: 0, behavior: "instant" });
}

const typeOptions = anchorTypes.map(value => ({
  label: value === "default" ? "default 轨道线" : "underline 下划线",
  value,
}));

const directionOptions = anchorDirections.map(value => ({
  label: value === "vertical" ? "vertical 竖排" : "horizontal 横排",
  value,
}));

const colorOptions = anchorColors.map(value => ({ label: value, value }));

/** 「强调色」一节展示的色值；七档全列出来会把演示挤成一排窄条，挑四档有代表性的 */
const colorShowcase = ["primary", "success", "warning", "error"] as const;

const markerLabels: Record<string, string> = {
  bar: "bar 竖条",
  dot: "dot 实心圆",
  hollow: "hollow 空心圆",
  none: "none 不显示",
};

const markerOptions = anchorMarkers.map(value => ({ label: markerLabels[value] ?? value, value }));

const controls: any = [
  {
    title: "基础属性",
    children: [
      {
        label: "锚点类型",
        key: "type",
        component: "select" as const,
        defaultValue: "default",
        props: { options: typeOptions },
      },
      {
        label: "锚点方向",
        key: "direction",
        component: "select" as const,
        defaultValue: "vertical",
        props: { options: directionOptions },
      },
      {
        label: "强调色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: colorOptions },
      },
    ],
  },
  {
    title: "状态",
    children: [
      {
        label: "标记形态",
        key: "marker",
        component: "select" as const,
        defaultValue: "bar",
        props: { options: markerOptions },
      },
      {
        label: "选中顶部链接",
        key: "selectScrollTop",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
  {
    title: "行为",
    children: [
      {
        label: "滚动偏移量 offset",
        key: "offset",
        component: "slider" as const,
        defaultValue: 0,
        props: { min: 0, max: 120, step: 4 },
      },
      {
        label: "触发线偏移 bound",
        key: "bound",
        component: "slider" as const,
        defaultValue: 15,
        props: { min: 0, max: 120, step: 5 },
      },
      {
        label: "滚动时长 duration（毫秒）",
        key: "duration",
        component: "slider" as const,
        defaultValue: 300,
        props: { min: 0, max: 1200, step: 50 },
      },
    ],
  },
];

/** 把章节树写成 items 字面量，跟着上面的演示数据走，不用手动同步 */
function stringifyItems(list: PlaygroundChapter[], indent = 2): string {
  const pad = " ".repeat(indent);
  return list
    .map((item) => {
      const head = `${pad}{ key: "${item.key}", href: "#${item.key}", title: "${item.title}"`;
      if (!item.children?.length) return `${head} },`;
      return `${head}, children: [\n${stringifyItems(item.children, indent + 2)}\n${pad}] },`;
    })
    .join("\n");
}

/** 完整列出当前所有参数（含默认值），连同 items 一起复制即可运行 */
const anchorCode = computed(() => {
  const current = state.value;
  const attrs = [
    `:items="items"`,
    `container="#scroll-box"`,
    `type="${current.type}"`,
    `direction="${current.direction}"`,
    `color="${current.color}"`,
    `marker="${current.marker}"`,
    `:offset="${current.offset}"`,
    `:bound="${current.bound}"`,
    `:duration="${current.duration}"`,
    `:select-scroll-top="${current.selectScrollTop}"`,
    `@change="onChange"`,
    `@click="onClick"`,
  ];
  const items = `const items = [\n${stringifyItems(playgroundChapters)}\n];`;
  return `${items}\n\n<RebornAnchor\n  ${attrs.join("\n  ")}\n/>`;
});

// ─── 场景演示状态 ─────────────────────────────────────────

/** 「指定滚动容器」里以元素引用形式传给 container 的那个容器 */
const containerEl = ref<HTMLElement | null>(null);

/** 「手动滚动」里被实例方法驱动的锚点 */
const manualAnchorRef = ref<InstanceType<typeof RebornAnchor> | null>(null);

/** 调用实例暴露的 scrollTo，不点链接也能滚到指定区块 */
function scrollToBlock(key: string) {
  manualAnchorRef.value?.scrollTo(blockHref("anchor-manual", key));
}
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground
      v-model="state" :controls="controls" :code="anchorCode" component-name="RebornAnchor" title="交互演练场"
      description="调节左侧参数，再滚动右侧容器，观察选中项与标记怎么跟着变；链接由 items 递归渲染，最深四级"
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
        <div :class="state.direction === 'horizontal' ? 'flex flex-col gap-4' : 'flex gap-6'">
          <!-- 每嵌一级子链接多缩进 14px，w-32 装不下第四级的文字，这里给到 w-44 -->
          <RebornAnchor
            :items="playgroundItems" container="#anchor-playground-box" :type="state.type"
            :direction="state.direction" :color="state.color" :marker="state.marker" :offset="state.offset"
            :bound="state.bound" :duration="state.duration" :select-scroll-top="state.selectScrollTop"
            :class="state.direction === 'horizontal' ? 'w-full' : 'w-44 shrink-0'" @change="onPlaygroundChange"
            @click="onPlaygroundClick"
          />

          <!-- 横排时外层是纵向 flex，flex-1 会顺着纵轴把高度撑到内容全高、h-64 失效，容器就不滚了 -->
          <div
            id="anchor-playground-box" ref="playgroundBox"
            class="border-default rounded-ui-sm h-64 min-w-0 overflow-y-auto border px-4"
            :class="state.direction === 'horizontal' ? 'w-full' : 'flex-1'"
          >
            <!--
              缩进量按层级算出来，Tailwind 的类名不能在运行时拼，只能写成行内样式。
              区块必然比容器高（末尾项要能常规越线，需 min-h ≥ 容器高 + bound），文字只占顶部一小截，
              剩下都是撑高度的空白。画条虚线把区块边界标出来，否则滚到空白处看不出选中项为什么还没换
            -->
            <section
              v-for="item in playgroundBlocks" :id="blockId('anchor-playground', item.key)" :key="item.key"
              class="border-default flex min-h-[280px] flex-col gap-2 border-b border-dashed py-4 last:border-b-0"
              :style="{ paddingLeft: `${item.depth * 16}px` }"
            >
              <h4 class="text-highlighted text-sm font-medium">
                {{ item.title }}
              </h4>
              <DemoNote tone="dimmed" class="text-xs">
                {{ item.text }}
              </DemoNote>
            </section>
          </div>
        </div>

        <DemoNote v-if="state.direction === 'horizontal'" tone="dimmed" class="text-xs">
          横向锚点只渲染第一级：嵌套层会打乱标记的横向测量基准，组件在这个方向下不展开 children。
        </DemoNote>

        <DemoNote tone="dimmed" class="font-mono text-xs">
          change: {{ lastChange }} · 点击次数: {{ clickCount }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        链接的 <code>href</code> 指向容器里某个元素的 <code>id</code>，<code>container</code> 指到真正发生滚动的那一层，滚动时链接自动高亮。
      </template>

      <DemoBlock layout="row" tone="inset" align="start" class="gap-6">
        <RebornAnchor container="#anchor-basic-box" class="w-32 shrink-0">
          <RebornAnchorLink
            v-for="item in chapters" :key="item.key" :href="blockHref('anchor-basic', item.key)"
            :title="item.title"
          />
        </RebornAnchor>

        <div id="anchor-basic-box" class="h-64 min-w-0 flex-1 overflow-y-auto pr-2">
          <section
            v-for="item in chapters" :id="blockId('anchor-basic', item.key)" :key="item.key"
            class="flex min-h-[280px] flex-col gap-2 py-2"
          >
            <h4 class="text-highlighted text-sm font-medium">
              {{ item.title }}
            </h4>
            <DemoNote tone="dimmed" class="text-xs">
              {{ item.text }}
            </DemoNote>
          </section>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="items 数据化配置">
      <template #description>
        链接来自接口或路由表时，逐个写 <code>RebornAnchorLink</code> 就得自己套一层 <code>v-for</code>，嵌套还要再套一层。把数组交给
        <code>items</code>，组件按 <code>children</code> 递归渲染出同样的结构。传了 <code>items</code> 默认插槽就不再生效，两种写法择一使用。
        条目上的 <code>offset</code> 覆盖组件的同名属性——下面「事件」单独设了 72，点它和点别的项停的位置不一样。
      </template>

      <DemoBlock layout="row" tone="inset" align="start" class="gap-6">
        <RebornAnchor :items="anchorItems" container="#anchor-items-box" class="w-36 shrink-0" />

        <div id="anchor-items-box" class="h-64 min-w-0 flex-1 overflow-y-auto pr-2">
          <section
            v-for="block in itemsBlocks" :id="block.id" :key="block.id"
            class="flex min-h-[280px] flex-col gap-2 py-2" :class="block.depth > 0 && 'pl-4'"
          >
            <h4 class="text-highlighted text-sm font-medium">
              {{ block.title }}
            </h4>
            <DemoNote tone="dimmed" class="text-xs">
              这一段的 id 是 <code>{{ block.id }}</code>，对应 items 里那条数据的 href。
            </DemoNote>
          </section>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="水平锚点">
      <template #description>
        <code>direction="horizontal"</code> 把链接横排、标记移到底部，适合压在内容区正上方。它只改链接的排布，滚动判定始终是纵向的。横向下标记只有贴底的滑块一种形态，传
        <code>dot</code> / <code>hollow</code> 会按 <code>bar</code> 渲染。
      </template>

      <DemoBlock layout="stack" tone="inset" class="gap-4">
        <RebornAnchor direction="horizontal" container="#anchor-horizontal-box">
          <RebornAnchorLink
            v-for="item in chapters" :key="item.key" :href="blockHref('anchor-horizontal', item.key)"
            :title="item.title"
          />
        </RebornAnchor>

        <div id="anchor-horizontal-box" class="h-64 overflow-y-auto">
          <section
            v-for="item in chapters" :id="blockId('anchor-horizontal', item.key)" :key="item.key"
            class="flex min-h-[280px] flex-col gap-2 py-2"
          >
            <h4 class="text-highlighted text-sm font-medium">
              {{ item.title }}
            </h4>
            <DemoNote tone="dimmed" class="text-xs">
              {{ item.text }}
            </DemoNote>
          </section>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="标记样式">
      <template #description>
        <code>marker</code> 决定跟随选中项滑动的那个标记长什么样：<code>bar</code> 竖条、<code>dot</code> 实心圆、<code>hollow</code>
        空心圆、<code>none</code> 不显示。布尔值仍然可用，<code>true</code> 等价于 <code>bar</code>、<code>false</code> 等价于
        <code>none</code>。四个锚点盯的是同一个容器，滚动时可以直接对比。
      </template>

      <DemoBlock layout="row" tone="inset" align="start" class="gap-6">
        <DemoItem label="marker: bar" mono note="2×21 的竖条，压在轨道线上" class="w-28 shrink-0">
          <RebornAnchor marker="bar" container="#anchor-marker-box">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-marker', item.key)"
              :title="item.title"
            />
          </RebornAnchor>
        </DemoItem>

        <DemoItem label="marker: dot" mono note="6px 实心圆，骑在轨道中线上" class="w-28 shrink-0">
          <RebornAnchor marker="dot" container="#anchor-marker-box">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-marker', item.key)"
              :title="item.title"
            />
          </RebornAnchor>
        </DemoItem>

        <DemoItem label="marker: hollow" mono note="同尺寸但中间挖空，比实心圆轻" class="w-28 shrink-0">
          <RebornAnchor marker="hollow" container="#anchor-marker-box">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-marker', item.key)"
              :title="item.title"
            />
          </RebornAnchor>
        </DemoItem>

        <DemoItem label="marker: none" mono note="标记不渲染，只靠文字颜色区分" class="w-28 shrink-0">
          <RebornAnchor marker="none" container="#anchor-marker-box">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-marker', item.key)"
              :title="item.title"
            />
          </RebornAnchor>
        </DemoItem>

        <div id="anchor-marker-box" class="h-64 min-w-0 flex-1 overflow-y-auto pr-2">
          <section
            v-for="item in chapters" :id="blockId('anchor-marker', item.key)" :key="item.key"
            class="flex min-h-[280px] flex-col gap-2 py-2"
          >
            <h4 class="text-highlighted text-sm font-medium">
              {{ item.title }}
            </h4>
            <DemoNote tone="dimmed" class="text-xs">
              {{ item.text }}
            </DemoNote>
          </section>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="轨道线类型">
      <template #description>
        <code>type</code> 只管画不画那条贯穿的灰色轨道线：<code>default</code> 画，标记像是轨道被逐段点亮；<code>underline</code> 不画，只剩标记本身。
      </template>

      <DemoBlock layout="row" tone="inset" align="start" class="gap-6">
        <DemoItem label="type: default" mono note="轨道线常驻" class="w-28 shrink-0">
          <RebornAnchor type="default" container="#anchor-track-box">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-track', item.key)"
              :title="item.title"
            />
          </RebornAnchor>
        </DemoItem>

        <DemoItem label="type: underline" mono note="不画轨道，只有标记" class="w-28 shrink-0">
          <RebornAnchor type="underline" container="#anchor-track-box">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-track', item.key)"
              :title="item.title"
            />
          </RebornAnchor>
        </DemoItem>

        <div id="anchor-track-box" class="h-64 min-w-0 flex-1 overflow-y-auto pr-2">
          <section
            v-for="item in chapters" :id="blockId('anchor-track', item.key)" :key="item.key"
            class="flex min-h-[280px] flex-col gap-2 py-2"
          >
            <h4 class="text-highlighted text-sm font-medium">
              {{ item.title }}
            </h4>
            <DemoNote tone="dimmed" class="text-xs">
              {{ item.text }}
            </DemoNote>
          </section>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="强调色">
      <template #description>
        <code>color</code> 同时改选中文字与标记的颜色，轨道线不跟着变（它是背景而非强调色）。下面四个锚点盯的是同一个容器。
      </template>

      <DemoBlock layout="row" tone="inset" align="start" class="gap-6">
        <DemoItem v-for="color in colorShowcase" :key="color" :label="`color: ${color}`" mono class="w-28 shrink-0">
          <RebornAnchor :color="color" marker="dot" container="#anchor-color-box">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-color', item.key)"
              :title="item.title"
            />
          </RebornAnchor>
        </DemoItem>

        <div id="anchor-color-box" class="h-64 min-w-0 flex-1 overflow-y-auto pr-2">
          <section
            v-for="item in chapters" :id="blockId('anchor-color', item.key)" :key="item.key"
            class="flex min-h-[280px] flex-col gap-2 py-2"
          >
            <h4 class="text-highlighted text-sm font-medium">
              {{ item.title }}
            </h4>
            <DemoNote tone="dimmed" class="text-xs">
              {{ item.text }}
            </DemoNote>
          </section>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="指定滚动容器">
      <template #description>
        <code>container</code> 收选择器字符串、<code>HTMLElement</code> 或
        <code>Window</code>。锚点不必放在容器里面，指得到就能联动——下面两个锚点盯的是中间同一个容器。
      </template>

      <DemoBlock layout="row" tone="inset" align="start" class="gap-6">
        <DemoItem label="container: 选择器字符串" mono class="w-36 shrink-0">
          <RebornAnchor container="#anchor-container-box">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-container', item.key)"
              :title="item.title"
            />
          </RebornAnchor>
        </DemoItem>

        <div id="anchor-container-box" ref="containerEl" class="h-64 min-w-0 flex-1 overflow-y-auto px-2">
          <section
            v-for="item in chapters" :id="blockId('anchor-container', item.key)" :key="item.key"
            class="flex min-h-[280px] flex-col gap-2 py-2"
          >
            <h4 class="text-highlighted text-sm font-medium">
              {{ item.title }}
            </h4>
            <DemoNote tone="dimmed" class="text-xs">
              {{ item.text }}
            </DemoNote>
          </section>
        </div>

        <DemoItem label="container: 元素引用" mono class="w-36 shrink-0">
          <!-- 传元素得等它真的挂上：v-if 让锚点首帧拿到的就是元素本身，否则这一帧的 container 是 undefined，会先当成整窗滚动 -->
          <RebornAnchor v-if="containerEl" :container="containerEl">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-container', item.key)"
              :title="item.title"
            />
          </RebornAnchor>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="偏移量与触发线">
      <template #description>
        <code>offset</code> 决定滚完之后目标停在距顶多远，<code>bound</code> 决定目标顶部进到哪条线以内才算选中。开了 <code>select-scroll-top</code> 触发线压到
        0，此时 <code>bound</code> 不再参与判定，两者不叠加。
      </template>

      <DemoBlock layout="row" tone="inset" align="start" class="gap-6">
        <DemoItem label="offset: 0" mono note="点击后区块贴着容器顶部" class="w-28 shrink-0">
          <RebornAnchor :offset="0" container="#anchor-offset-box">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-offset', item.key)"
              :title="item.title"
            />
          </RebornAnchor>
        </DemoItem>

        <DemoItem label="offset: 64" mono note="点击后区块停在距顶 64px 处" class="w-28 shrink-0">
          <RebornAnchor :offset="64" container="#anchor-offset-box">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-offset', item.key)"
              :title="item.title"
            />
          </RebornAnchor>
        </DemoItem>

        <DemoItem label="selectScrollTop: true" mono note="触发线压到 0，目标顶部越线才换选中" class="w-28 shrink-0">
          <RebornAnchor select-scroll-top container="#anchor-offset-box">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-offset', item.key)"
              :title="item.title"
            />
          </RebornAnchor>
        </DemoItem>

        <div id="anchor-offset-box" class="h-64 min-w-0 flex-1 overflow-y-auto pr-2">
          <section
            v-for="item in chapters" :id="blockId('anchor-offset', item.key)" :key="item.key"
            class="flex min-h-[280px] flex-col gap-2 py-2"
          >
            <h4 class="text-highlighted text-sm font-medium">
              {{ item.title }}
            </h4>
            <DemoNote tone="dimmed" class="text-xs">
              {{ item.text }}
            </DemoNote>
          </section>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="子链接嵌套">
      <template #description>
        往 <code>sub-link</code> 插槽里再放 <code>RebornAnchorLink</code> 就是下一级链接，缩进一层，但和上级共用同一套滚动判定。子链接始终竖排，横向锚点下不适用。同样的结构用
        <code>items</code> 的 <code>children</code> 也能写出来，区别只在链接由谁渲染。
      </template>

      <DemoBlock layout="row" tone="inset" align="start" class="gap-6">
        <RebornAnchor container="#anchor-nested-box" class="w-36 shrink-0">
          <RebornAnchorLink
            v-for="group in nestedChapters" :key="group.key"
            :href="blockHref('anchor-nested', group.key)" :title="group.title"
          >
            <template #sub-link>
              <RebornAnchorLink
                v-for="child in group.children" :key="child.key"
                :href="blockHref('anchor-nested', `${group.key}-${child.key}`)" :title="child.title"
              />
            </template>
          </RebornAnchorLink>
        </RebornAnchor>

        <div id="anchor-nested-box" class="h-64 min-w-0 flex-1 overflow-y-auto pr-2">
          <template v-for="group in nestedChapters" :key="group.key">
            <section :id="blockId('anchor-nested', group.key)" class="flex min-h-[280px] flex-col gap-2 py-2">
              <h4 class="text-highlighted text-sm font-medium">
                {{ group.title }}
              </h4>
              <DemoNote tone="dimmed" class="text-xs">
                这是「{{ group.title }}」的正文，下面还有两个子小节。
              </DemoNote>
            </section>

            <section
              v-for="child in group.children" :id="blockId('anchor-nested', `${group.key}-${child.key}`)"
              :key="child.key" class="flex min-h-[280px] flex-col gap-2 py-2 pl-4"
            >
              <h5 class="text-highlighted text-xs font-medium">
                {{ group.title }} / {{ child.title }}
              </h5>
              <DemoNote tone="dimmed" class="text-xs">
                子小节的正文，滚到这里时上级链接和它自己会一起亮起来。
              </DemoNote>
            </section>
          </template>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="手动滚动">
      <template #description>
        组件实例暴露 <code>scrollTo(href)</code>，不点链接也能滚到指定区块，选中态同步跟上。适合从页面别处触发跳转，比如目录按钮或搜索结果。
      </template>

      <DemoBlock layout="stack" tone="inset" class="gap-4">
        <div class="flex flex-wrap gap-2">
          <RebornButton
            v-for="item in chapters" :key="item.key" size="sm" variant="soft" color="neutral"
            @click="scrollToBlock(item.key)"
          >
            滚到「{{ item.title }}」
          </RebornButton>
        </div>

        <div class="flex gap-6">
          <RebornAnchor ref="manualAnchorRef" container="#anchor-manual-box" class="w-32 shrink-0">
            <RebornAnchorLink
              v-for="item in chapters" :key="item.key" :href="blockHref('anchor-manual', item.key)"
              :title="item.title"
            />
          </RebornAnchor>

          <div id="anchor-manual-box" class="h-64 min-w-0 flex-1 overflow-y-auto pr-2">
            <section
              v-for="item in chapters" :id="blockId('anchor-manual', item.key)" :key="item.key"
              class="flex min-h-[280px] flex-col gap-2 py-2"
            >
              <h4 class="text-highlighted text-sm font-medium">
                {{ item.title }}
              </h4>
              <DemoNote tone="dimmed" class="text-xs">
                {{ item.text }}
              </DemoNote>
            </section>
          </div>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
