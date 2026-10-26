<script setup lang="ts">
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, ref, shallowRef } from "vue";
import { backTopColors, backTopSizes } from "~/components/reborn/ui/reborn-back-top/reborn-back-top.config";
import RebornBackTop from "~/components/reborn/ui/reborn-back-top/RebornBackTop.vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";

const directionOptions = [
  { label: "回到顶部 top", value: "top" },
  { label: "去底部 bottom", value: "bottom" },
];
const shapeOptions = [
  { label: "圆形 circle", value: "circle" },
  { label: "圆角方形 square", value: "square" },
];
/** 图标选项：none 表示不传 icon，显示默认的文字箭头 */
const iconOptions = [
  { label: "默认文字箭头", value: "none" },
  { label: "lucide:arrow-big-up", value: "lucide:arrow-big-up" },
  { label: "lucide:arrow-big-down", value: "lucide:arrow-big-down" },
  { label: "lucide:chevrons-up", value: "lucide:chevrons-up" },
  { label: "lucide:chevrons-down", value: "lucide:chevrons-down" },
];

/** 各尺寸的边长（px），用于说明文字 */
const SIZE_PX: Record<string, number> = { xs: 24, sm: 32, md: 40, lg: 48 };

/**
 * 页内静态展示用的 ui：按钮默认固定在视口右下角，这里改成 static 排进示例块。
 * 显示时按钮主体自带 -translate-x-3（离视口右缘 12px），外层补 translate-x-3 抵消，按钮才居中。
 */
const inlineUi = { wrapper: "static translate-x-3" };

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态：除 showProgress 外与组件默认值一致 */
const defaultState: Record<string, any> = {
  direction: "top",
  shape: "circle",
  color: "primary",
  size: "md",
  icon: "none",
  showProgress: true,
  threshold: 300,
  bottom: 20,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 演练场实例的点击计数 */
const clickCount = shallowRef(0);

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  clickCount.value = 0;
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "方向与外观",
    children: [
      { label: "方向", key: "direction", component: "select" as const, defaultValue: "top", props: { options: directionOptions } },
      { label: "形状", key: "shape", component: "select" as const, defaultValue: "circle", props: { options: shapeOptions } },
      { label: "颜色", key: "color", component: "select" as const, defaultValue: "primary", props: { options: backTopColors.map(c => ({ label: c, value: c })) } },
      { label: "尺寸", key: "size", component: "select" as const, defaultValue: "md", props: { options: backTopSizes.map(s => ({ label: `${s}（${SIZE_PX[s]}px）`, value: s })) } },
      { label: "图标", key: "icon", component: "select" as const, defaultValue: "none", props: { options: iconOptions } },
      { label: "展示滚动进度环", key: "showProgress", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "位置与时机",
    children: [
      { label: "显示阈值 (px)", key: "threshold", component: "slider" as const, defaultValue: 300, props: { min: 0, max: 1000, step: 50 } },
      { label: "距底部 (px)", key: "bottom", component: "slider" as const, defaultValue: 20, props: { min: 20, max: 200, step: 10 } },
    ],
  },
];

/** 演练场右上角展示的等价代码：完整列出当前全部参数 */
const backTopCode = computed(() => {
  const s = state.value;
  return [
    "<RebornBackTop",
    `  direction="${s.direction}"`,
    `  shape="${s.shape}"`,
    `  color="${s.color}"`,
    `  size="${s.size}"`,
    ...(s.icon === "none" ? [] : [`  icon="${s.icon}"`]),
    `  :show-progress="${s.showProgress}"`,
    `  :threshold="${s.threshold}"`,
    `  :bottom="${s.bottom}"`,
    "/>",
  ].join("\n");
});

/** 用于把页面撑高的占位行，便于触发滚动 */
const rows = Array.from({ length: 12 }, (_, i) => `占位内容 ${i + 1}`);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="backTopCode" component-name="RebornBackTop"
      title="交互演练场" description="调节上方参数后向下滚动本页，查看按钮在视口右下角的显隐、形状与进度环走向。"
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
        <!-- 组件本身是固定定位的浮层，这里只用描边标出占位区域，避免再叠一层背景 -->
        <div class="border-default w-full rounded-xl border">
          <div class="divide-default divide-y">
            <p v-for="row in rows" :key="row" class="text-muted px-4 py-3 text-sm">
              {{ row }}
            </p>
          </div>
        </div>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          已点击 {{ clickCount }} 次；去底部在页首就会出现，回到顶部要滚过 {{ state.threshold }}px 才出现。
        </DemoNote>
      </div>

      <RebornBackTop
        :direction="state.direction" :shape="state.shape" :color="state.color" :size="state.size"
        :icon="state.icon === 'none' ? undefined : state.icon" :show-progress="state.showProgress"
        :threshold="state.threshold" :bottom="state.bottom" @click="clickCount++"
      />
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        滚动超过 <code>threshold</code> 后按钮出现，点击平滑回到顶部；Web 端不传 <code>scrollTop</code> 时自动监听 <code>window</code>。
      </template>
      <DemoBlock layout="row">
        <RebornBackTop :threshold="-1" :scroll-top="1" :ui="inlineUi" />
      </DemoBlock>
      <DemoNote tone="dimmed">
        本节及以下的静态示例都把定位改成了 static 排进页面；点击它们会真实滚动本页。
      </DemoNote>
    </DemoSection>

    <DemoSection title="回到顶部与去底部">
      <template #description>
        <code>direction="bottom"</code> 点击后滚到页尾，离页尾的剩余距离超过 <code>threshold</code> 时显示。成对使用时放两个实例，用 <code>bottom</code> 上下错开。
      </template>
      <DemoBlock layout="stack">
        <DemoNote>
          视口右下角、演练场按钮上方的两个小方块就是这一对：去底部 <code>bottom=100</code>，回到顶部 <code>bottom=132</code>（100 + 边长 24 + 间距 8）。滚到页首只剩去底部，滚到页尾只剩回到顶部，另一个不挪位。
        </DemoNote>
      </DemoBlock>

      <RebornBackTop
        :bottom="132" size="xs" shape="square" color="info" icon="lucide:arrow-big-up" show-progress
        :ui="{ wrapper: 'z-50' }"
      />
      <RebornBackTop
        direction="bottom" :bottom="100" size="xs" shape="square" color="info" icon="lucide:arrow-big-down"
        show-progress :ui="{ wrapper: 'z-50' }"
      />
    </DemoSection>

    <DemoSection title="形状与尺寸">
      <template #description>
        <code>shape</code> 决定外形，进度环跟着变成圆环或贴边的圆角方框；<code>size</code> 四档边长 24 / 32 / 40 / 48px，越小的按钮进度线在 viewBox 里画得越粗。
      </template>
      <DemoBlock layout="grid" :columns="4">
        <div v-for="size in backTopSizes" :key="size" class="flex flex-col items-center gap-3 py-2">
          <div class="flex items-center gap-4">
            <RebornBackTop :size="size" show-progress :threshold="-1" :scroll-top="40" :scroll-range="100" :ui="inlineUi" />
            <RebornBackTop
              :size="size" shape="square" show-progress :threshold="-1" :scroll-top="40" :scroll-range="100"
              :ui="inlineUi"
            />
          </div>
          <span class="text-muted font-mono text-xs">size="{{ size }}"（{{ SIZE_PX[size] }}px）</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="滚动进度环">
      <template #description>
        <code>show-progress</code> 从 12 点方向出发画进度：回到顶部顺时针、去底部逆时针，两者表达同一个进度，上下并排时左右对称。下面用 <code>scroll-top</code> + <code>scroll-range</code> 固定进度展示。
      </template>
      <DemoBlock layout="grid" :columns="3">
        <div v-for="percent in [25, 50, 75]" :key="percent" class="flex flex-col items-center gap-3 py-2">
          <RebornBackTop
            size="lg" shape="square" color="info" show-progress :threshold="-1" :scroll-top="percent"
            :scroll-range="100" :ui="inlineUi"
          />
          <RebornBackTop
            direction="bottom" size="lg" shape="square" color="info" show-progress :threshold="-1"
            :scroll-top="percent" :scroll-range="100" :ui="inlineUi"
          />
          <span class="text-muted font-mono text-xs">进度 {{ percent }}%</span>
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        进度 = 已滚动距离 / 可滚动总距离；不传 scroll-range 时按文档高度实测，用 scroll-top 接管滚动时要一并传入，否则百分比和去底部的显隐都会算错。
      </DemoNote>
    </DemoSection>

    <DemoSection title="图标与自定义内容">
      <template #description>
        <code>icon</code> 接受 Iconify 图标名，替换默认的文字箭头，形状与进度环都保留；默认插槽则整体替换按钮主体，<code>color</code> / <code>size</code> / <code>shape</code> / <code>icon</code> / 进度环都不再生效。
      </template>
      <DemoBlock layout="row" class="gap-8">
        <div class="flex flex-col items-center gap-3">
          <div class="flex items-center gap-3">
            <RebornBackTop
              size="sm" shape="square" icon="lucide:arrow-big-up" show-progress :threshold="-1" :scroll-top="60"
              :scroll-range="100" :ui="inlineUi"
            />
            <RebornBackTop
              direction="bottom" size="sm" shape="square" icon="lucide:arrow-big-down" show-progress
              :threshold="-1" :scroll-top="60" :scroll-range="100" :ui="inlineUi"
            />
          </div>
          <span class="text-muted font-mono text-xs">icon</span>
        </div>
        <div class="flex flex-col items-center gap-3">
          <RebornBackTop :threshold="-1" :scroll-top="1" :ui="{ wrapper: 'static' }">
            <div class="bg-success flex size-12 cursor-pointer items-center justify-center rounded-lg text-xs font-bold text-white">
              TOP
            </div>
          </RebornBackTop>
          <span class="text-muted font-mono text-xs">默认插槽</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="TabBar 页面与安全区">
      <template #description>
        <code>is-tab</code> 让按钮额外抬高 50px 避开 TabBar；最终距底部 = <code>bottom</code> + 安全区 + TabBar。下面两个框模拟视口，右框底部是 50px 高的 TabBar。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <div v-for="tab in [false, true]" :key="String(tab)" class="flex flex-col gap-2">
          <div class="border-default relative h-48 w-full overflow-hidden rounded-xl border">
            <div
              v-if="tab"
              class="border-default text-muted absolute inset-x-0 bottom-0 flex h-[50px] items-center justify-around border-t text-xs"
            >
              <span>首页</span><span>分类</span><span>我的</span>
            </div>
            <RebornBackTop :is-tab="tab" :threshold="-1" :scroll-top="1" :ui="{ wrapper: 'absolute z-1' }" />
          </div>
          <span class="text-muted font-mono text-xs">{{ tab ? ':is-tab="true"，距底部 70px' : '默认，距底部 20px' }}</span>
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        UniApp 端的安全区取自 uni.getWindowInfo().safeAreaInsets.bottom，Web 端视为 0；TabBar 页的完整效果见右侧手机预览。
      </DemoNote>
    </DemoSection>
  </div>
</template>
