<script setup lang="ts">
import type { ClQrcodeMode } from "~/components/reborn/ui/reborn-qrcode";
import { eccLevel } from "~/components/reborn/ui/reborn-qrcode";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 码点渲染模式 */
const modeOptions: { label: string; value: ClQrcodeMode }[] = [
  { label: "圆点 circular", value: "circular" },
  { label: "直角 rect", value: "rect" },
  { label: "小直角 rectSmall", value: "rectSmall" },
  { label: "条纹 line", value: "line" },
];

/** 定位点（三个大眼睛）的外框与内点样式 */
const cornerOptions = [
  { label: "默认", value: "none" },
  { label: "直角 rect", value: "rect" },
  { label: "极圆 extra-rounded", value: "extra-rounded" },
  { label: "圆点 dot", value: "dot" },
];

const eccOptions = [
  { label: "L · 7% 容错", value: eccLevel.L },
  { label: "M · 15% 容错", value: eccLevel.M },
  { label: "Q · 25% 容错", value: eccLevel.Q },
  { label: "H · 30% 容错", value: eccLevel.H },
];

const state = ref<Record<string, any>>({
  text: "https://www.leyifan.com/",
  ecc: eccLevel.H,
  mode: "circular",
  padding: 5,
  foreground: "#131313",
  background: "#FFFFFF",
  backgroundTransparent: false,
  cornersSquareType: "extra-rounded",
  cornersDotType: "dot",
  logo: "https://cms-image.leyifan.cn/img_reborn/index/icon-calculator.png",
  logoSize: 40,
  logoMargin: 4,
  logoHideBackgroundDots: true,
  logoShadow: false,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "内容与容错",
    children: [
      {
        label: "二维码内容",
        key: "text",
        component: "input" as const,
        defaultValue: "https://www.leyifan.com/",
      },
      {
        label: "纠错级别",
        key: "ecc",
        component: "select" as const,
        defaultValue: eccLevel.H,
        props: { options: eccOptions },
      },
      {
        label: "内边距（px）",
        key: "padding",
        component: "slider" as const,
        defaultValue: 5,
        props: { min: 0, max: 30, step: 1 },
      },
    ],
  },
  {
    title: "形状与配色",
    children: [
      {
        label: "码点形状",
        key: "mode",
        component: "select" as const,
        defaultValue: "circular",
        props: { options: modeOptions },
      },
      {
        label: "定位点外框",
        key: "cornersSquareType",
        component: "select" as const,
        defaultValue: "extra-rounded",
        props: { options: cornerOptions },
      },
      {
        label: "定位点内点",
        key: "cornersDotType",
        component: "select" as const,
        defaultValue: "dot",
        props: { options: cornerOptions },
      },
      { label: "前景色", key: "foreground", component: "color-picker" as const, defaultValue: "#131313" },
      { label: "背景色", key: "background", component: "color-picker" as const, defaultValue: "#FFFFFF" },
      {
        label: "背景透明",
        key: "backgroundTransparent",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
  {
    title: "Logo 嵌入",
    children: [
      {
        label: "Logo 图片地址",
        key: "logo",
        component: "input" as const,
        defaultValue: "https://cms-image.leyifan.cn/img_reborn/index/icon-calculator.png",
      },
      {
        label: "Logo 尺寸（px）",
        key: "logoSize",
        component: "slider" as const,
        defaultValue: 40,
        props: { min: 20, max: 80, step: 4 },
      },
      {
        label: "Logo 留白（px）",
        key: "logoMargin",
        component: "slider" as const,
        defaultValue: 4,
        props: { min: 0, max: 20, step: 1 },
      },
      {
        label: "隐藏 Logo 下方码点",
        key: "logoHideBackgroundDots",
        component: "checkbox" as const,
        defaultValue: true,
      },
      { label: "Logo 投影", key: "logoShadow", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const qrcodeCode = computed(() => {
  const s = state.value;
  const props: string[] = [`text="${s.text}"`, `mode="${s.mode}"`];

  if (s.ecc !== eccLevel.H) props.push(`ecc="${s.ecc}"`);
  if (s.padding !== 5) props.push(`:padding="${s.padding}"`);
  if (s.foreground !== "#131313") props.push(`foreground="${s.foreground}"`);
  if (s.backgroundTransparent) props.push("background-transparent");
  else if (s.background !== "#FFFFFF") props.push(`background="${s.background}"`);
  if (s.cornersSquareType !== "none") props.push(`corners-square-type="${s.cornersSquareType}"`);
  if (s.cornersDotType !== "none") props.push(`corners-dot-type="${s.cornersDotType}"`);
  if (s.logo) props.push(`logo="${s.logo}"`, `:logo-size="${s.logoSize}"`);
  if (s.logoHideBackgroundDots) props.push("logo-hide-background-dots");
  if (s.logoShadow) props.push("logo-shadow");

  return `<RebornQrcode\n  ${props.join("\n  ")}\n/>`;
});

// ─── 场景演示数据 ───────────────────────────────────────────────

/** 定位点外框样式对照 */
const cornerShowcase = [
  { square: "rect", dot: "rect", label: "全直角" },
  { square: "extra-rounded", dot: "dot", label: "圆角外框 + 圆点" },
  { square: "dot", dot: "dot", label: "全圆" },
] as const;

/** 点阵线性渐变 */
const sunsetGradient = {
  type: "linear",
  direction: "diagonal",
  colorStops: [
    { offset: 0, color: "#f59e0b" },
    { offset: 1, color: "#ef4444" },
  ],
};

/** 背景纵向渐变 */
const skyGradient = {
  type: "linear",
  direction: "vertical",
  colorStops: [
    { offset: 0, color: "#eff6ff" },
    { offset: 1, color: "#bfdbfe" },
  ],
};

/** 点阵图片纹理地址 */
const textureImage =
  "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1000&auto=format&fit=crop";

/** 预设风格：点击后直接写回演练场状态 */
const presets = [
  {
    name: "极简黑白",
    config: {
      foreground: "#000000",
      background: "#FFFFFF",
      mode: "rect",
      cornersSquareType: "rect",
      cornersDotType: "rect",
    },
  },
  {
    name: "圆润天蓝",
    config: {
      foreground: "#3b82f6",
      background: "#eff6ff",
      mode: "circular",
      cornersSquareType: "extra-rounded",
      cornersDotType: "dot",
    },
  },
  {
    name: "优雅暗红",
    config: {
      foreground: "#991b1b",
      background: "#fef2f2",
      mode: "line",
      cornersSquareType: "extra-rounded",
      cornersDotType: "rect",
    },
  },
  {
    name: "深邃墨绿",
    config: {
      foreground: "#065f46",
      background: "#ecfdf5",
      mode: "rectSmall",
      cornersSquareType: "dot",
      cornersDotType: "dot",
    },
  },
];

/** 应用预设到演练场 */
function applyPreset(config: Record<string, any>) {
  Object.assign(state.value, config);
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="qrcodeCode"
      component-name="RebornQrcode"
      title="交互演练场"
      description="二维码由 Canvas 实时绘制；纠错级别越高，可被 Logo 遮挡的面积越大。"
    >
      <div class="flex w-full flex-col items-center gap-4">
        <RebornQrcode
          :text="state.text"
          :ecc="state.ecc"
          :mode="state.mode"
          :padding="state.padding"
          :foreground="state.foreground"
          :background="state.background"
          :background-transparent="state.backgroundTransparent"
          :corners-square-type="state.cornersSquareType"
          :corners-dot-type="state.cornersDotType"
          :logo="state.logo"
          :logo-size="state.logoSize"
          :logo-margin="state.logoMargin"
          :logo-hide-background-dots="state.logoHideBackgroundDots"
          :logo-shadow="state.logoShadow"
        />

        <DemoNote tone="dimmed">
          <span class="font-mono break-all">{{ state.text }}</span>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection
      title="码点形状"
      description="mode 决定每个码点的绘制方式；line 会把纵向相邻的码点连成条纹，扫码识别率与容错级别相关。"
    >
      <DemoBlock
        layout="row"
        align="start"
      >
        <div
          v-for="item in modeOptions"
          :key="item.value"
          class="flex flex-col items-center gap-2"
        >
          <RebornQrcode
            :text="state.text"
            :mode="item.value"
            :size="120"
            :padding="4"
          />
          <span class="text-dimmed text-xs font-medium">{{ item.label }}</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="定位点样式"
      description="corners-square-type 与 corners-dot-type 分别控制三个定位点的外框与中心内点。"
    >
      <DemoBlock
        layout="row"
        align="start"
      >
        <div
          v-for="item in cornerShowcase"
          :key="item.label"
          class="flex flex-col items-center gap-2"
        >
          <RebornQrcode
            :text="state.text"
            :size="120"
            :padding="4"
            :corners-square-type="item.square"
            :corners-dot-type="item.dot"
          />
          <span class="text-dimmed text-xs font-medium">{{ item.label }}</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="渐变与图片纹理"
      description="dots-gradient / background-gradient 接受 colorStops 配置；dots-image 会以图片填充码点，优先级高于颜色与渐变。"
    >
      <DemoBlock
        layout="row"
        align="start"
      >
        <div class="flex flex-col items-center gap-2">
          <RebornQrcode
            :text="state.text"
            :size="120"
            :padding="4"
            :dots-gradient="sunsetGradient"
          />
          <span class="text-dimmed text-xs font-medium">码点渐变 · <code>dots-gradient</code></span>
        </div>

        <div class="flex flex-col items-center gap-2">
          <RebornQrcode
            :text="state.text"
            :size="120"
            :padding="4"
            :background-gradient="skyGradient"
          />
          <span class="text-dimmed text-xs font-medium">
            背景渐变 · <code>background-gradient</code>
          </span>
        </div>

        <div class="flex flex-col items-center gap-2">
          <RebornQrcode
            :text="state.text"
            :size="120"
            :padding="4"
            :dots-image="textureImage"
            background="#000000"
            mode="rectSmall"
          />
          <span class="text-dimmed text-xs font-medium">图片纹理 · <code>dots-image</code></span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="预设风格"
      description="点击任意预设即可把整套配色与形状写回上方演练场，便于快速比较。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornButton
          v-for="preset in presets"
          :key="preset.name"
          variant="outlined"
          size="sm"
          :label="preset.name"
          @click="applyPreset(preset.config)"
        />
      </DemoBlock>
    </DemoSection>
  </div>
</template>
