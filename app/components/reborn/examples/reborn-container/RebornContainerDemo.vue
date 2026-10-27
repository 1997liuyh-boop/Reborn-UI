<script setup lang="ts">
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, shallowRef } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornContainer from "~/components/reborn/ui/reborn-container/RebornContainer.vue";

/**
 * 容器边界的描边样式：只描边不填充。
 * Container 自身不带任何视觉样式，用虚线勾出它的实际宽度，
 * 内部内容块再垫一层浅色，两者之间的空隙就是响应式水平内边距。
 */
const boundaryClass = "border-x border-dashed border-primary/60";

/** 演练场可选的渲染标签 */
const tagOptions = ["div", "section", "article", "main"].map((t) => ({ label: `<${t}>`, value: t }));

/** 演练场可选的最大宽度：空字符串表示不覆盖，沿用 --ui-container */
const maxWidthOptions = [
  { label: "默认（--ui-container）", value: "" },
  { label: "max-w-3xl（768px）", value: "max-w-3xl" },
  { label: "max-w-xl（576px）", value: "max-w-xl" },
  { label: "max-w-sm（384px）", value: "max-w-sm" },
];

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  as: "div",
  maxWidth: "max-w-xl",
};

const state = shallowRef<Record<string, any>>({ ...defaultState });

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      {
        label: "渲染标签（as）",
        key: "as",
        component: "select" as const,
        defaultValue: "div",
        props: { options: tagOptions },
      },
      {
        label: "最大宽度（经 ui.root 覆盖）",
        key: "maxWidth",
        component: "select" as const,
        defaultValue: "max-w-xl",
        props: { options: maxWidthOptions },
      },
    ],
  },
];

/** 预览区传给 ui 的覆盖配置：不覆盖时不传，保持默认最大宽度 */
const playgroundUi = computed(() => (state.value.maxWidth ? { root: state.value.maxWidth } : undefined));

/** 传参明细：maxWidth 不是组件 prop，需手动拼成 :ui 写法 */
const containerCode = computed(() => {
  const attrs: string[] = [];
  if (state.value.as !== "div") attrs.push(`as="${state.value.as}"`);
  if (state.value.maxWidth) attrs.push(`:ui="{ root: '${state.value.maxWidth}' }"`);
  const open = attrs.length ? `<RebornContainer\n  ${attrs.join("\n  ")}\n>` : "<RebornContainer>";
  return `${open}\n  <!-- 页面内容 -->\n</RebornContainer>`;
});
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="containerCode"
      component-name="RebornContainer"
      title="交互演练场"
      description="调节上方参数，实时查看容器的渲染标签与最大宽度；虚线是容器边界，浅色块与虚线之间的空隙是水平内边距。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col gap-3">
        <RebornContainer :as="state.as" :ui="playgroundUi" :class="boundaryClass">
          <div class="bg-primary/10 text-default flex flex-col gap-2 rounded-lg p-4">
            <h4 class="text-sm font-semibold">页面标题</h4>
            <p class="text-muted text-sm leading-relaxed">
              正文保持在最大宽度内水平居中，宽屏下两侧留白自动增大。
            </p>
          </div>
        </RebornContainer>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          渲染为 &lt;{{ state.as }}&gt; · 最大宽度：{{ state.maxWidth || "var(--ui-container)" }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        直接包裹内容即可获得居中、限宽与响应式留边：最大宽度取 CSS 变量
        <code>--ui-container</code>，水平内边距随断点为
        <code>px-4 / sm:px-6 / lg:px-8</code>。
      </template>
      <DemoBlock layout="stack">
        <RebornContainer :class="boundaryClass">
          <div class="bg-primary/10 text-default flex flex-col gap-2 rounded-lg p-4">
            <h4 class="text-base font-semibold">页面标题</h4>
            <p class="text-muted text-sm">正文内容会保持在最大宽度内水平居中。</p>
          </div>
        </RebornContainer>
        <DemoNote tone="dimmed">
          演示区比 <code>--ui-container</code> 窄，因此这里看到的是撑满整行；缩放浏览器窗口跨过 sm / lg 断点时，
          虚线与浅色块之间的留白会依次变为 16 / 24 / 32px。
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="更换渲染标签">
      <template #description>
        <code>as</code>
        指定根节点渲染的 HTML 元素或组件，默认
        <code>div</code>；样式不变，只换语义，便于输出
        <code>section</code>、<code>article</code> 等结构。
      </template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornContainer as="section" :class="boundaryClass">
          <div class="bg-primary/10 text-default rounded-lg p-4 text-sm">
            <span class="font-mono text-xs">&lt;section&gt;</span> 特性介绍
          </div>
        </RebornContainer>
        <RebornContainer as="article" :class="boundaryClass">
          <div class="bg-primary/10 text-default rounded-lg p-4 text-sm">
            <span class="font-mono text-xs">&lt;article&gt;</span> 正文排版
          </div>
        </RebornContainer>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义样式">
      <template #description>
        <code>class</code>
        追加到根节点，<code>ui.root</code>
        覆盖根节点类名；两者冲突时
        <code>class</code>
        生效，因为它在合并顺序的最后。
      </template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex w-full flex-col gap-1">
          <span class="text-dimmed font-mono text-xs">:ui="{ root: 'max-w-xl' }"</span>
          <RebornContainer :ui="{ root: 'max-w-xl' }" :class="boundaryClass">
            <div class="bg-primary/10 text-default rounded-lg p-4 text-sm">窄版正文，最大宽度 576px</div>
          </RebornContainer>
        </div>
        <div class="flex w-full flex-col gap-1">
          <span class="text-dimmed font-mono text-xs">:ui="{ root: 'max-w-xl' }" class="max-w-sm"</span>
          <RebornContainer :ui="{ root: 'max-w-xl' }" class="max-w-sm" :class="boundaryClass">
            <div class="bg-primary/10 text-default rounded-lg p-4 text-sm">class 胜出，最大宽度 384px</div>
          </RebornContainer>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
