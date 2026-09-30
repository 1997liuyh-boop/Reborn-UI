<script setup lang="ts">
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornTooltip from "~/components/reborn/ui/reborn-tooltip/RebornTooltip.vue";

/** 12 种基础方位 */
const placements = [
  "top", "top-start", "top-end",
  "bottom", "bottom-start", "bottom-end",
  "left", "left-start", "left-end",
  "right", "right-start", "right-end",
] as const;

const placementOptions = placements.map((p) => ({ label: p, value: p }));
const triggerOptions = [
  { label: "hover（悬停）", value: "hover" },
  { label: "click（点击）", value: "click" },
  { label: "focus（聚焦）", value: "focus" },
  { label: "contextMenu（右键）", value: "contextMenu" },
];

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  title: "这是一个文字提示",
  placement: "top",
  trigger: "hover",
  useColor: false,
  color: "#8358F6",
  arrow: true,
  disabled: false,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "内容与外观",
    children: [
      { label: "提示文字", key: "title", component: "input" as const, defaultValue: "这是一个文字提示" },
      {
        label: "气泡位置",
        key: "placement",
        component: "select" as const,
        defaultValue: "top",
        props: { options: placementOptions },
      },
      { label: "自定义背景色（关闭用主题色）", key: "useColor", component: "checkbox" as const, defaultValue: false },
      {
        label: "背景色",
        key: "color",
        component: "color-picker" as const,
        defaultValue: "#8358F6",
        hide: (_: any, s: Record<string, any>) => !s.useColor,
      },
    ],
  },
  {
    title: "行为",
    children: [
      {
        label: "触发方式",
        key: "trigger",
        component: "select" as const,
        defaultValue: "hover",
        props: { options: triggerOptions },
      },
      { label: "显示箭头", key: "arrow", component: "checkbox" as const, defaultValue: true },
      { label: "禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const tooltipCode = computed(() => {
  const s = state.value;
  const props: string[] = [`title="${s.title}"`];

  if (s.placement !== "bottom") props.push(`placement="${s.placement}"`);
  if (s.useColor && s.color) props.push(`color="${s.color}"`);
  if (s.trigger !== "hover") props.push(`trigger="${s.trigger}"`);
  if (!s.arrow) props.push(':arrow="false"');
  if (s.disabled) props.push("disabled");

  return `<RebornTooltip\n  ${props.join("\n  ")}\n>\n  <RebornButton>触发元素</RebornButton>\n</RebornTooltip>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** title 置空禁用演示 */
const emptyTitle = ref(false);

/** 自定义背景颜色演示色板 */
const colors = ["#8358F6", "#1b6dfa", "#f50", "#2db7f5", "#87d068", "#108ee9"];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="tooltipCode"
      component-name="RebornTooltip"
      title="交互演练场"
      description="组合位置与触发方式；选择 contextMenu 后需右键点击触发元素查看提示。"
    >
      <RebornTooltip
        :title="state.title"
        :placement="state.placement"
        :color="state.useColor ? state.color : undefined"
        :trigger="state.trigger"
        :arrow="state.arrow"
        :disabled="state.disabled"
      >
        <RebornButton>{{ state.trigger === 'contextMenu' ? '右键点击我' : '触发元素' }}</RebornButton>
      </RebornTooltip>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        <code>title</code> 传入提示文字，鼠标移入显示、移出消失，用来代替浏览器原生的 <code>title</code> 提示；长文字在 240px 处自动换行。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornTooltip title="这是一个文字提示">
          <RebornButton>悬停查看提示</RebornButton>
        </RebornTooltip>

        <RebornTooltip title="为保证显示效果，建议输入简洁明了的文字，避免特殊符号与过长内容。">
          <RebornButton>多行文本提示</RebornButton>
        </RebornTooltip>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="方位：12 种 placement">
      <template #description>
        <code>placement</code> 由方向 <code>top</code> / <code>bottom</code> / <code>left</code> / <code>right</code> 与对齐 <code>-start</code> / <code>-end</code> 组合出 12 种方位。
      </template>
      <DemoBlock layout="stack" align="center">
        <div class="grid w-fit grid-cols-5 gap-3">
          <div class="col-start-2">
            <RebornTooltip placement="top-start" title="Top Start">
              <RebornButton size="sm" class="w-24">TL</RebornButton>
            </RebornTooltip>
          </div>
          <div class="col-start-3">
            <RebornTooltip placement="top" title="Top">
              <RebornButton size="sm" class="w-24">Top</RebornButton>
            </RebornTooltip>
          </div>
          <div class="col-start-4">
            <RebornTooltip placement="top-end" title="Top End">
              <RebornButton size="sm" class="w-24">TR</RebornButton>
            </RebornTooltip>
          </div>

          <div class="col-start-1 row-start-2">
            <RebornTooltip placement="left-start" title="Left Start">
              <RebornButton size="sm" class="w-24">LT</RebornButton>
            </RebornTooltip>
          </div>
          <div class="col-start-5 row-start-2">
            <RebornTooltip placement="right-start" title="Right Start">
              <RebornButton size="sm" class="w-24">RT</RebornButton>
            </RebornTooltip>
          </div>

          <div class="col-start-1 row-start-3">
            <RebornTooltip placement="left" title="Left">
              <RebornButton size="sm" class="w-24">Left</RebornButton>
            </RebornTooltip>
          </div>
          <div class="col-start-5 row-start-3">
            <RebornTooltip placement="right" title="Right">
              <RebornButton size="sm" class="w-24">Right</RebornButton>
            </RebornTooltip>
          </div>

          <div class="col-start-1 row-start-4">
            <RebornTooltip placement="left-end" title="Left End">
              <RebornButton size="sm" class="w-24">LB</RebornButton>
            </RebornTooltip>
          </div>
          <div class="col-start-5 row-start-4">
            <RebornTooltip placement="right-end" title="Right End">
              <RebornButton size="sm" class="w-24">RB</RebornButton>
            </RebornTooltip>
          </div>

          <div class="col-start-2 row-start-5">
            <RebornTooltip placement="bottom-start" title="Bottom Start">
              <RebornButton size="sm" class="w-24">BL</RebornButton>
            </RebornTooltip>
          </div>
          <div class="col-start-3 row-start-5">
            <RebornTooltip placement="bottom" title="Bottom">
              <RebornButton size="sm" class="w-24">Bottom</RebornButton>
            </RebornTooltip>
          </div>
          <div class="col-start-4 row-start-5">
            <RebornTooltip placement="bottom-end" title="Bottom End">
              <RebornButton size="sm" class="w-24">BR</RebornButton>
            </RebornTooltip>
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="颜色：自定义背景色">
      <template #description>
        <code>color</code> 直接指定气泡背景色，面板与箭头同步着色，文字固定为白色。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornTooltip v-for="c in colors" :key="c" :title="c" :color="c">
          <RebornButton size="sm" :style="{ backgroundColor: c, borderColor: c }">
            {{ c }}
          </RebornButton>
        </RebornTooltip>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="富内容插槽">
      <template #description>
        <code>content</code> 插槽可承载任意 HTML 结构（多行、快捷键、加粗、链接等），优先级高于 <code>title</code> / <code>content</code> 属性。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornTooltip placement="right">
          <template #content>
            <div class="flex flex-col gap-1">
              <b>快捷键</b>
              <span>按 <kbd class="rounded bg-white/20 px-1">Ctrl</kbd> + <kbd class="rounded bg-white/20 px-1">S</kbd>
                保存</span>
            </div>
          </template>
          <RebornButton>富内容提示</RebornButton>
        </RebornTooltip>

        <RebornTooltip placement="top">
          <template #content>
            <span>支持 <i>斜体</i>、<b>加粗</b> 与 <a class="underline" href="#" @click.prevent>链接</a></span>
          </template>
          <RebornButton>HTML 片段</RebornButton>
        </RebornTooltip>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="触发方式">
      <template #description>
        <code>trigger</code> 支持 <code>hover</code> / <code>focus</code> / <code>click</code> / <code>contextMenu</code>，可传数组组合；<code>click</code> 与 <code>contextMenu</code> 打开后点击外部区域关闭。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornTooltip title="hover 触发（默认）">
          <RebornButton>悬停</RebornButton>
        </RebornTooltip>

        <RebornTooltip title="click 触发，点击外部关闭" trigger="click">
          <RebornButton>点击</RebornButton>
        </RebornTooltip>

        <RebornTooltip title="focus 触发，失焦关闭" trigger="focus">
          <RebornButton>聚焦（Tab 键）</RebornButton>
        </RebornTooltip>

        <RebornTooltip title="contextMenu 触发" trigger="contextMenu">
          <RebornButton>右键点击</RebornButton>
        </RebornTooltip>
      </DemoBlock>

      <DemoNote tone="dimmed">
        「右键点击」按钮仅响应鼠标右键（<code>trigger="contextMenu"</code>），左键点击与悬停均不会触发。
      </DemoNote>
    </DemoSection>

    <DemoSection title="箭头：显隐与指向中心">
      <template #description>
        <code>:arrow="false"</code> 隐藏箭头；<code>-start</code> / <code>-end</code> 方位下箭头默认停在对齐端，<code>:arrow="{ pointAtCenter: true }"</code> 改为指向触发元素中心。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornTooltip title="无箭头文字提示" :arrow="false">
          <RebornButton>无箭头</RebornButton>
        </RebornTooltip>

        <RebornTooltip title="箭头停在对齐端" placement="top-start">
          <RebornButton>top-start</RebornButton>
        </RebornTooltip>

        <RebornTooltip title="箭头指向元素中心" placement="top-start" :arrow="{ pointAtCenter: true }">
          <RebornButton>pointAtCenter</RebornButton>
        </RebornTooltip>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="延时、禁用与初始展示">
      <template #description>
        <code>mouse-enter-delay</code> 以秒为单位设置显示延时；<code>disabled</code> 或把 <code>title</code> 置空都会禁用提示；<code>default-open</code> 让提示挂载后立即展示。
      </template>
      <DemoBlock layout="row" align="center">
        <RebornTooltip title="mouseEnterDelay 1 秒" :mouse-enter-delay="1">
          <RebornButton>延时 1s</RebornButton>
        </RebornTooltip>

        <RebornTooltip title="禁用提示" :disabled="true">
          <RebornButton>禁用</RebornButton>
        </RebornTooltip>

        <RebornTooltip :title="emptyTitle ? '' : '再次点击按钮把 title 置空即禁用'">
          <RebornButton @click="emptyTitle = !emptyTitle">
            {{ emptyTitle ? 'title 已置空（禁用）' : 'title 禁用演示' }}
          </RebornButton>
        </RebornTooltip>

        <RebornTooltip title="defaultOpen 初始展示" placement="bottom" default-open>
          <RebornButton>初始展示</RebornButton>
        </RebornTooltip>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
