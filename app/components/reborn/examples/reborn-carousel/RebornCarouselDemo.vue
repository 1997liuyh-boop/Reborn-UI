<script setup lang="ts">
import HeroBanner from "./components/HeroBanner.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  slidesPerview: 2,
  spaceBetween: 20,
  direction: "horizontal",
  carouselType: "default",
  arrow: "hover",
  indicatorPosition: "inside",
  paginationType: "line",
  indicatorOffset: 16,
  color: "primary",
  autoplay: true,
  motionBlur: true,
  loop: true,
  centeredSlides: false,
  grabCursor: true,
  thumbsPosition: "bottom",
  thumbsArrow: "always",
  thumbsLoop: true,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "布局",
    children: [
      {
        label: "每屏显示",
        key: "slidesPerview",
        component: "select" as const,
        defaultValue: 2,
        props: {
          options: [
            { label: "1 项 / 屏", value: 1 },
            { label: "2 项 / 屏", value: 2 },
            { label: "3 项 / 屏", value: 3 },
            { label: "自动宽度", value: "auto" },
          ],
        },
      },
      {
        label: "项目间距",
        key: "spaceBetween",
        component: "slider" as const,
        defaultValue: 20,
        props: { min: 0, max: 100, step: 4 },
      },
      {
        label: "容器方向",
        key: "direction",
        component: "select" as const,
        defaultValue: "horizontal",
        props: {
          options: [
            { label: "水平滚动", value: "horizontal" },
            { label: "垂直滚动", value: "vertical" },
          ],
        },
      },
      {
        label: "展示模式",
        key: "carouselType",
        component: "select" as const,
        defaultValue: "default",
        props: {
          options: [
            { label: "默认模式", value: "default" },
            { label: "卡片聚焦", value: "card" },
          ],
        },
      },
    ],
  },
  {
    title: "导航与指示器",
    children: [
      {
        label: "箭头显示",
        key: "arrow",
        component: "select" as const,
        defaultValue: "hover",
        props: {
          options: [
            { label: "悬停时显示", value: "hover" },
            { label: "始终显示", value: "always" },
            { label: "隐藏箭头", value: "never" },
          ],
        },
      },
      {
        label: "指示器位置",
        key: "indicatorPosition",
        component: "select" as const,
        defaultValue: "inside",
        props: {
          options: [
            { label: "内置 (inside)", value: "inside" },
            { label: "外置 (outside)", value: "outside" },
            { label: "隐藏 (none)", value: "none" },
          ],
        },
      },
      {
        label: "指示器类型",
        key: "paginationType",
        component: "select" as const,
        defaultValue: "line",
        props: {
          options: [
            { label: "线条 (line)", value: "line" },
            { label: "圆点 (dot)", value: "dot" },
            { label: "分数 (fraction)", value: "fraction" },
            { label: "按钮 (button)", value: "button" },
          ],
        },
      },
      {
        label: "指示器偏移 (px)",
        key: "indicatorOffset",
        component: "slider" as const,
        defaultValue: 16,
        props: { min: 0, max: 100, step: 4 },
      },
    ],
  },
  {
    title: "交互与外观",
    children: [
      {
        label: "主题颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: {
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" },
            { label: "Success", value: "success" },
            { label: "Info", value: "info" },
            { label: "Warning", value: "warning" },
            { label: "Error", value: "error" },
            { label: "Neutral", value: "neutral" },
          ],
        },
      },
      { label: "自动播放 (2.6s)", key: "autoplay", component: "checkbox" as const, defaultValue: true },
      { label: "动态模糊", key: "motionBlur", component: "checkbox" as const, defaultValue: true },
      { label: "无限循环", key: "loop", component: "checkbox" as const, defaultValue: true },
      { label: "居中模式", key: "centeredSlides", component: "checkbox" as const, defaultValue: false },
      { label: "抓取光标", key: "grabCursor", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "缩略图",
    children: [
      {
        label: "缩略图位置",
        key: "thumbsPosition",
        component: "select" as const,
        defaultValue: "bottom",
        props: {
          options: [
            { label: "底部 (bottom)", value: "bottom" },
            { label: "顶部 (top)", value: "top" },
            { label: "左侧 (left)", value: "left" },
            { label: "右侧 (right)", value: "right" },
          ],
        },
      },
      {
        label: "缩略图箭头",
        key: "thumbsArrow",
        component: "select" as const,
        defaultValue: "always",
        props: {
          options: [
            { label: "始终显示", value: "always" },
            { label: "悬停时显示", value: "hover" },
            { label: "隐藏", value: "never" },
          ],
        },
      },
      { label: "缩略图循环", key: "thumbsLoop", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 演练场当前激活的滑块索引 */
const activeIndex = ref(0);

/** 由演练场状态拼装的缩略图配置 */
const thumbsConfig = computed(() => ({
  position: state.value.thumbsPosition,
  loop: state.value.thumbsLoop,
  arrow: state.value.thumbsArrow,
}));

/** 演练场右上角展示的等价代码 */
const carouselCode = computed(() => {
  const s = state.value;
  const props: string[] = [];

  if (s.carouselType !== "default") props.push(`type="${s.carouselType}"`);
  if (s.slidesPerview !== 1)
    props.push(`:slides-perview="${typeof s.slidesPerview === "string" ? `'${s.slidesPerview}'` : s.slidesPerview}"`);
  if (s.spaceBetween !== 0) props.push(`:space-between="${s.spaceBetween}"`);
  if (s.autoplay) props.push(':autoplay="{ delay: 2600 }"');
  if (!s.motionBlur) props.push(':motion-blur="false"');
  if (s.arrow !== "hover") props.push(`arrow="${s.arrow}"`);
  if (s.indicatorPosition !== "inside") props.push(`indicator-position="${s.indicatorPosition}"`);
  if (s.direction !== "horizontal") props.push(`direction="${s.direction}"`);
  if (s.centeredSlides) props.push(':centered-slides="true"');
  if (s.loop) props.push("loop");
  if (s.grabCursor) props.push("grab-cursor");
  if (s.color !== "primary") props.push(`color="${s.color}"`);
  if (s.paginationType !== "line") props.push(`:pagination="{ clickable: true, type: '${s.paginationType}' }"`);
  if (s.indicatorOffset !== 16) props.push(`:indicator-offset="${s.indicatorOffset}"`);
  props.push(`:thumbs="{ position: '${s.thumbsPosition}', loop: ${s.thumbsLoop}, arrow: '${s.thumbsArrow}' }"`);

  const propsStr = props.length > 0 ? "\n  " + props.join("\n  ") : "";
  return `<RebornCarousel v-model="activeIndex"${propsStr}\n>\n  <!-- slides content -->\n</RebornCarousel>`;
});

// ─── 场景演示数据 ───────────────────────────────────────────────

const thumbsShowcaseIndex = ref(0);

const featureSlides = [
  {
    eyebrow: "智能体验",
    title: "把轮播做成展示层，而不是简单的图片切页。",
    description:
      "支持多项显示、自动播放、居中展示和响应式布局，适合首页头图、专题入口和推荐内容位。",
    tone: "from-[#0f172a] via-[#1d4ed8] to-[#38bdf8]",
  },
  {
    eyebrow: "卡片焦点",
    title: "用卡片模式突出当前内容，顺带保留两侧预览。",
    description: "更适合精选内容、活动推荐、封面流和需要「中心舞台感」的展示区块。",
    tone: "from-[#1f2937] via-[#7c3aed] to-[#ec4899]",
  },
  {
    eyebrow: "自研能力",
    title: "不依赖第三方轮播库，交互和 API 都按业务语义设计。",
    description: "内部基于原生滚动与状态控制构建，便于后续扩展手势、虚拟化和平台差异策略。",
    tone: "from-[#052e16] via-[#0f766e] to-[#34d399]",
  },
  {
    eyebrow: "团队效率",
    title: "把箭头、指示器、动态模糊和纵向布局直接做成组件能力。",
    description: "使用者只需要关注内容本身，不必每次都重复拼装交互和动画细节。",
    tone: "from-[#431407] via-[#ea580c] to-[#fbbf24]",
  },
];

const cardSlides = [
  {
    label: "精选专题",
    title: "Midnight Archive",
    copy: "用更强的视觉层次组织长内容入口，让推荐区块不再像普通列表。",
    tone: "from-[#111827] via-[#1d4ed8] to-[#60a5fa]",
  },
  {
    label: "限时活动",
    title: "Spring Drop",
    copy: "卡片模式适合承接主题活动、限时专题和品牌故事页的视觉入口。",
    tone: "from-[#3b0764] via-[#c026d3] to-[#f9a8d4]",
  },
  {
    label: "内容推荐",
    title: "Editor Pick",
    copy: "两侧预览会自然强化「还有更多内容」的感知，减少轮播常见的死板感。",
    tone: "from-[#082f49] via-[#0891b2] to-[#67e8f9]",
  },
  {
    label: "视觉实验",
    title: "Liquid Frames",
    copy: "配合动态模糊和柔和阴影，可以做出更偏杂志化、封面化的展示效果。",
    tone: "from-[#312e81] via-[#7c3aed] to-[#c4b5fd]",
  },
];

const timelineSlides = [
  {
    title: "阶段一",
    copy: "先确定轮播容器尺寸和内容节奏，再决定是一屏多卡还是卡片居中。",
  },
  {
    title: "阶段二",
    copy: "根据场景选择箭头、分页器和自动播放，不要默认全开。",
  },
  {
    title: "阶段三",
    copy: "只有在展示型场景里再加动态模糊，避免信息密集页面过度花哨。",
  },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="carouselCode"
      component-name="RebornCarousel"
      title="交互演练场"
      description="调节布局、导航与缩略图配置，实时预览轮播的滚动与切换效果。"
    >
      <RebornCarousel
        v-model="activeIndex"
        class="w-full"
        :type="state.carouselType"
        :slides-perview="state.slidesPerview"
        :space-between="state.spaceBetween"
        :autoplay="state.autoplay ? { delay: 2600 } : false"
        :motion-blur="state.motionBlur"
        :pagination="{ clickable: true, type: state.paginationType }"
        :arrow="state.arrow"
        :indicator-position="state.indicatorPosition"
        :direction="state.direction"
        :centered-slides="state.centeredSlides"
        :loop="state.loop"
        :grab-cursor="state.grabCursor"
        :color="state.color"
        :indicator-offset="state.indicatorOffset"
        :thumbs="thumbsConfig"
      >
        <div
          v-for="slide in featureSlides"
          :key="slide.title"
          :class="`flex h-full flex-col justify-between bg-linear-to-br ${slide.tone} p-7 text-white`"
        >
          <div class="space-y-3">
            <p class="text-xs font-medium tracking-[0.28em] text-white/70 uppercase">{{ slide.eyebrow }}</p>
            <h3 class="max-w-[14ch] text-2xl leading-tight font-semibold md:text-[2rem]">{{ slide.title }}</h3>
          </div>
          <p class="max-w-[36ch] text-sm leading-6 text-white/80 md:text-base">{{ slide.description }}</p>
        </div>
      </RebornCarousel>
    </Playground>

    <DemoSection
      title="缩略图导航"
      description="thumbs 支持 top / bottom / left / right 四个方位，缩略图轨道与主轨道保持同步，适合图库与内容流。"
    >
      <RebornCarousel
        v-model="thumbsShowcaseIndex"
        :slides-perview="1"
        :space-between="24"
        :pagination="{ clickable: true, type: 'fraction' }"
        arrow="always"
        :thumbs="{ position: 'right', loop: true, arrow: 'hover' }"
        height="auto"
        loop
        color="warning"
      >
        <div
          v-for="(slide, index) in featureSlides"
          :key="`${slide.title}-thumbs`"
          :class="`flex h-full flex-col justify-between bg-linear-to-br ${slide.tone} p-8 text-white`"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-3">
              <p class="text-xs font-medium tracking-[0.28em] text-white/70 uppercase">{{ slide.eyebrow }}</p>
              <h3 class="max-w-[14ch] text-3xl leading-tight font-semibold md:text-[2.25rem]">{{ slide.title }}</h3>
            </div>
            <span class="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80">0{{ index + 1 }}</span>
          </div>

          <div class="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <p class="max-w-[38ch] text-sm leading-7 text-white/80 md:text-base">{{ slide.description }}</p>
            <!-- 幻灯片内部只描边不填充，避免在渐变底上再叠一层背景 -->
            <div class="rounded-ui-lg border border-white/25 p-5">
              <p class="text-xs tracking-[0.24em] text-white/60 uppercase">Preview Notes</p>
              <p class="mt-3 text-lg leading-7 text-white/90">
                缩略图轨道始终与主轨道保持同步，因此非常适合媒体图库、活动物料和内容密集的展示页。
              </p>
            </div>
          </div>
        </div>
      </RebornCarousel>
    </DemoSection>

    <DemoSection
      title="卡片聚焦模式"
      description="type=&quot;card&quot; 配合 centered-slides，让中心项更突出，两侧保留预览，适合专题与封面流。"
    >
      <RebornCarousel
        type="card"
        slides-perview="auto"
        :space-between="20"
        :pagination="{ clickable: true, type: 'dot' }"
        arrow="always"
        indicator-position="outside"
        :motion-blur="true"
        :centered-slides="true"
        :autoplay="false"
        height="26rem"
        loop
        color="secondary"
      >
        <div
          v-for="card in cardSlides"
          :key="card.title"
          :class="`flex h-full w-full flex-col justify-between bg-linear-to-br ${card.tone} p-7 text-white`"
        >
          <div class="space-y-3">
            <span class="inline-flex w-fit rounded-full border border-white/20 px-3 py-1 text-xs text-white/80">
              {{ card.label }}
            </span>
            <h4 class="text-3xl font-semibold">{{ card.title }}</h4>
          </div>
          <p class="text-sm leading-6 text-white/80 md:text-base">{{ card.copy }}</p>
        </div>
      </RebornCarousel>
    </DemoSection>

    <DemoSection
      title="商品图廊"
      description="左侧缩略图 + 主图放大镜的组合，通过 ui 覆盖缩略图各插槽类名即可完成电商详情页的图廊布局。"
    >
      <HeroBanner />
    </DemoSection>

    <DemoSection
      title="纵向时间线"
      description="direction=&quot;vertical&quot; 将主轴改为纵向，配合按钮型分页器可用于流程说明与步骤引导。"
    >
      <RebornCarousel
        direction="vertical"
        :slides-perview="1"
        :space-between="18"
        :pagination="{ clickable: true, type: 'button' }"
        arrow="always"
        indicator-position="inside"
        height="22rem"
        color="info"
        :ui="{ arrowGroup: 'px-10' }"
      >
        <!-- 幻灯片本体即被演示对象，允许一层浅填充作为可视载体 -->
        <div
          v-for="(item, index) in timelineSlides"
          :key="item.title"
          class="border-default bg-elevated rounded-ui-lg flex h-full flex-col justify-between border p-7"
        >
          <div class="flex items-center justify-between">
            <span class="text-dimmed text-sm">0{{ index + 1 }}</span>
            <RebornBadge
              :label="item.title"
              size="sm"
              variant="soft"
              color="info"
            />
          </div>
          <p class="text-muted max-w-[34ch] text-lg leading-8">{{ item.copy }}</p>
        </div>
      </RebornCarousel>
    </DemoSection>

    <DemoSection
      title="导航插槽自定义"
      description="prev / next / indicators 三个作用域插槽会透出 prev、next、goTo、activeIndex、count，可完全接管导航 UI。"
    >
      <RebornCarousel
        slides-perview="auto"
        :space-between="20"
        loop
      >
        <div
          v-for="slide in featureSlides.slice(0, 3)"
          :key="slide.title"
          :class="`rounded-ui-lg flex flex-col items-center justify-center bg-linear-to-br ${slide.tone} p-12 text-center text-white`"
        >
          <h4 class="mb-4 text-4xl font-bold">{{ slide.title }}</h4>
          <p class="opacity-80">{{ slide.description }}</p>
        </div>

        <!-- 自定义箭头 -->
        <template #prev="{ prev }">
          <button
            type="button"
            class="rounded-ui-sm border-current/40 hover:border-current pointer-events-auto flex size-12 items-center justify-center border bg-black/30 text-white transition-all active:scale-95"
            @click="prev"
          >
            <Icon
              name="tabler:chevrons-left"
              class="size-6"
            />
          </button>
        </template>
        <template #next="{ next }">
          <button
            type="button"
            class="rounded-ui-sm border-current/40 hover:border-current pointer-events-auto flex size-12 items-center justify-center border bg-black/30 text-white transition-all active:scale-95"
            @click="next"
          >
            <Icon
              name="tabler:chevrons-right"
              class="size-6"
            />
          </button>
        </template>

        <!-- 自定义指示器 -->
        <template #indicators="{ activeIndex: current, count, goTo }">
          <div
            class="rounded-ui-sm pointer-events-auto absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-3 bg-black/30 p-1.5 text-white"
          >
            <button
              v-for="i in count"
              :key="i"
              type="button"
              class="h-1 rounded-full transition-all duration-500"
              :class="[current === i - 1 ? 'w-8 bg-current' : 'w-2 bg-current/40']"
              @click="goTo(i - 1)"
            />
          </div>
        </template>
      </RebornCarousel>
    </DemoSection>
  </div>
</template>
