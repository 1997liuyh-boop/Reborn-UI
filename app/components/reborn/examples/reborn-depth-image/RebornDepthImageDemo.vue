<script setup lang="ts">
import type { DepthImageFallbackReason, DepthImagePosition, DepthImageTrigger } from "~/components/reborn/ui/reborn-depth-image";
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, shallowRef, useTemplateRef } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornDepthImage from "~/components/reborn/ui/reborn-depth-image/RebornDepthImage.vue";

/** 演示素材：由 scripts/depth-image/render-model.mjs 从站内角色模型渲染，说明见 public/images/depth-image/README.md */
const COLOR_SRC = "/images/depth-image/soldier.webp";
const DEPTH_SRC = "/images/depth-image/soldier-depth.webp";

const positionOptions: { label: string; value: DepthImagePosition }[] = [
  { label: "居中 center", value: "center" },
  { label: "顶部 top", value: "top" },
  { label: "底部 bottom", value: "bottom" },
  { label: "左下 bottom-left", value: "bottom-left" },
  { label: "右下 bottom-right", value: "bottom-right" },
];
const triggerOptions: { label: string; value: DepthImageTrigger }[] = [
  { label: "组件自身 self", value: "self" },
  { label: "父元素 parent", value: "parent" },
  { label: "整个窗口 window", value: "window" },
];

/** 回退原因 → 中文说明，事件回显用 */
const FALLBACK_TEXT: Record<DepthImageFallbackReason, string> = {
  unsupported: "浏览器不支持 WebGL",
  "load-error": "素材加载失败",
  "context-lost": "WebGL 上下文丢失",
  "reduced-motion": "系统开启了减少动态效果",
};

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态：除 trigger 外与组件默认值一致；trigger 取 parent，指针在整个预览舞台上都有反应，不必对准人物 */
const defaultState: Record<string, any> = {
  parallax: 12,
  focus: 0.5,
  light: true,
  lightColor: "#ffffff",
  lightIntensity: 0.5,
  position: "center",
  trigger: "parent",
};

const state = shallowRef<Record<string, any>>({ ...defaultState });

/** 演练场实例的事件回显 */
const playgroundStatus = shallowRef("等待进入视口");

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "视差",
    children: [
      {
        label: "最大位移（px）",
        key: "parallax",
        component: "slider" as const,
        defaultValue: 12,
        props: { min: 0, max: 40, step: 1 },
      },
      {
        label: "焦平面（focus）",
        key: "focus",
        component: "slider" as const,
        defaultValue: 0.5,
        props: { min: 0, max: 1, step: 0.05 },
      },
    ],
  },
  {
    title: "补光",
    children: [
      { label: "启用补光", key: "light", component: "checkbox" as const, defaultValue: true },
      { label: "补光颜色", key: "lightColor", component: "color-picker" as const, defaultValue: "#ffffff" },
      {
        label: "补光强度",
        key: "lightIntensity",
        component: "slider" as const,
        defaultValue: 0.5,
        props: { min: 0, max: 1, step: 0.05 },
      },
    ],
  },
  {
    title: "布局",
    children: [
      {
        label: "对齐方式",
        key: "position",
        component: "select" as const,
        defaultValue: "center",
        props: { options: positionOptions },
      },
      {
        label: "触发范围",
        key: "trigger",
        component: "select" as const,
        defaultValue: "parent",
        props: { options: triggerOptions },
      },
    ],
  },
];

/** 滑块步进可能带来浮点误差，0~1 区间的参数统一保留两位小数 */
const round2 = (value: number) => Math.round(value * 100) / 100;

/** 演练场右上角展示的等价代码：完整列出当前全部参数 */
const depthImageCode = computed(() => {
  const s = state.value;
  return [
    "<RebornDepthImage",
    `  src="${COLOR_SRC}"`,
    `  depth-src="${DEPTH_SRC}"`,
    `  :parallax="${s.parallax}"`,
    `  :focus="${round2(s.focus)}"`,
    `  :light="${s.light}"`,
    `  light-color="${s.lightColor}"`,
    `  :light-intensity="${round2(s.lightIntensity)}"`,
    `  position="${s.position}"`,
    `  trigger="${s.trigger}"`,
    '  class="h-80 w-72"',
    "/>",
  ].join("\n");
});

// ─── 场景演示状态 ─────────────────────────────────────────────────

/** 「触发范围与对齐」里的外层卡片：作为 trigger 传给组件 */
const heroCardRef = useTemplateRef<HTMLElement>("heroCardRef");

/** 「回退与事件」两个实例各自的事件回显 */
const okStatus = shallowRef("等待进入视口");
const brokenStatus = shallowRef("等待进入视口");

const fallbackLabel = (reason: DepthImageFallbackReason) => `fallback('${reason}')：${FALLBACK_TEXT[reason]}`;
/** 三个固定焦平面，避免每次渲染重新创建列表。 */
const focusPlanes = [0.2, 0.5, 0.8];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="depthImageCode"
      component-name="RebornDepthImage"
      title="交互演练场"
      description="调节上方参数，把指针移进预览区，查看位移幅度、焦平面与补光的变化。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-4">
        <!-- 预览舞台：trigger 取 parent 时，指针在整块舞台上都有反应 -->
        <div class="flex h-[360px] w-full items-center justify-center rounded-xl">
          <RebornDepthImage
            :src="COLOR_SRC"
            :depth-src="DEPTH_SRC"
            alt="行走中的装甲士兵"
            :parallax="state.parallax"
            :focus="state.focus"
            :light="state.light"
            :light-color="state.lightColor"
            :light-intensity="state.lightIntensity"
            :position="state.position"
            :trigger="state.trigger"
            class="h-80 w-72"
            @ready="playgroundStatus = 'ready：画布已接管显示'"
            @fallback="(reason) => (playgroundStatus = fallbackLabel(reason))"
          />
        </div>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          {{ playgroundStatus }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        传入彩色图
        <code>src</code>
        与深度图
        <code>depthSrc</code>，尺寸写在
        <code>class</code>
        上；进入视口附近才加载素材，之前显示静态图。
      </template>
      <DemoBlock layout="row">
        <RebornDepthImage :src="COLOR_SRC" :depth-src="DEPTH_SRC" alt="行走中的装甲士兵" class="h-[280px] w-60" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="深度图的要求">
      <template #description>
        右图就是左图的
        <code>depthSrc</code>：白近黑远、宽高比相同，主体外的背景取中灰（等于默认
        <code>focus</code>），轮廓向外延展并模糊过。
      </template>
      <DemoBlock layout="row" align="start">
        <figure class="flex flex-col items-center gap-2">
          <img :src="COLOR_SRC" alt="彩色图" class="h-[224px] w-48 object-contain">
          <figcaption class="text-muted text-xs">src：720×840，透明背景</figcaption>
        </figure>
        <figure class="flex flex-col items-center gap-2">
          <img :src="DEPTH_SRC" alt="深度图" class="h-[224px] w-48 object-contain">
          <figcaption class="text-muted text-xs">depthSrc：240×280，原图的 1/3</figcaption>
        </figure>
      </DemoBlock>
      <DemoNote tone="dimmed">
        背景若取纯黑（最远），视差时背景会反向位移、采到人物本身，轮廓旁出现残影；轮廓不向外延展，人物朝外移动的部分会被裁掉。
      </DemoNote>
    </DemoSection>

    <DemoSection title="视差与焦平面">
      <template #description>
        三张图的
        <code>parallax</code>
        都是 20px，只改
        <code>focus</code>：它决定哪一层原地不动，比它近的朝指针移，比它远的反向移。
      </template>
      <DemoBlock layout="grid" :columns="3">
        <div v-for="focus in focusPlanes" :key="focus" class="flex flex-col items-center gap-2 py-2">
          <RebornDepthImage
            :src="COLOR_SRC"
            :depth-src="DEPTH_SRC"
            :parallax="20"
            :focus="focus"
            trigger="parent"
            class="h-[224px] w-48"
          />
          <span class="text-muted font-mono text-xs">:focus="{{ focus }}"</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="指针补光">
      <template #description>
        <code>lightColor</code>
        接受任意 CSS 颜色，包括 CSS 变量；右图用
        <code>var(--color-primary)</code>，切换主题色后指针下一次移入即变色。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <div class="flex flex-col items-center gap-2 py-2">
          <RebornDepthImage
            :src="COLOR_SRC"
            :depth-src="DEPTH_SRC"
            :light="false"
            trigger="parent"
            class="h-[224px] w-48"
          />
          <span class="text-muted font-mono text-xs">:light="false"</span>
        </div>
        <div class="flex flex-col items-center gap-2 py-2">
          <RebornDepthImage
            :src="COLOR_SRC"
            :depth-src="DEPTH_SRC"
            light-color="var(--color-primary)"
            :light-intensity="0.7"
            trigger="parent"
            class="h-[224px] w-48"
          />
          <span class="text-muted font-mono text-xs">light-color="var(--color-primary)"</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="触发范围与对齐">
      <template #description>
        把外层卡片的模板 ref 传给
        <code>trigger</code>，指针在整张卡片上移动都驱动视差；<code>position="bottom-right"</code>
        让人物贴着右下角站立。
      </template>
      <DemoBlock layout="stack">
        <section
          ref="heroCardRef"
          class="border-default bg-elevated/40 relative flex h-64 w-full items-center overflow-hidden rounded-2xl border px-8"
        >
          <div class="relative z-10 max-w-[50%]">
            <p class="text-highlighted text-xl font-semibold">整张卡片都是触发区</p>
            <p class="text-muted mt-2 text-sm">指针在文字上方移动，右侧人物同样会跟随。</p>
          </div>
          <RebornDepthImage
            :src="COLOR_SRC"
            :depth-src="DEPTH_SRC"
            position="bottom-right"
            :trigger="heroCardRef"
            class="pointer-events-none absolute inset-y-0 right-6 w-[45%]"
          />
        </section>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="回退与事件">
      <template #description>
        画布接管时派发
        <code>ready</code>；无法启用时派发
        <code>fallback</code>
        并保留静态图。右图故意写错了
        <code>depthSrc</code>。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <div class="flex flex-col items-center gap-2 py-2">
          <RebornDepthImage
            :src="COLOR_SRC"
            :depth-src="DEPTH_SRC"
            trigger="parent"
            class="h-[224px] w-48"
            @ready="okStatus = 'ready：画布已接管显示'"
            @fallback="(reason) => (okStatus = fallbackLabel(reason))"
          />
          <DemoNote tone="dimmed" class="font-mono text-xs">
            {{ okStatus }}
          </DemoNote>
        </div>
        <div class="flex flex-col items-center gap-2 py-2">
          <RebornDepthImage
            :src="COLOR_SRC"
            depth-src="/images/depth-image/not-exist.webp"
            trigger="parent"
            class="h-[224px] w-48"
            @ready="brokenStatus = 'ready：画布已接管显示'"
            @fallback="(reason) => (brokenStatus = fallbackLabel(reason))"
          />
          <DemoNote tone="dimmed" class="font-mono text-xs">
            {{ brokenStatus }}
          </DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
