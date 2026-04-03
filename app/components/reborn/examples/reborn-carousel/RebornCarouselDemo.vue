<script setup lang="ts">
const slidesPerView = ref<1 | 2 | 3 | "auto">(2);
const spaceBetween = ref(20);
const arrow = ref<"hover" | "always" | "never">("hover");
const indicatorPosition = ref<"inside" | "outside" | "none">("inside");
const autoplay = ref(true);
const motionBlur = ref(true);
const activeIndex = ref(0);
const loop = ref(true);
const centeredSlides = ref(false);
const direction = ref<"horizontal" | "vertical">("horizontal");
const carouselType = ref<"default" | "card">("default");
const grabCursor = ref(true);
const color = ref<"primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral">("primary");
const paginationType = ref<"line" | "dot" | "fraction" | "button">("line");
const indicatorOffset = ref<number>(16);

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

const carouselCode = computed(() => {
  const props = [];
  if (carouselType.value !== "default") props.push(`type="${carouselType.value}"`);
  if (slidesPerView.value !== 1)
    props.push(`:slides-perview="${typeof slidesPerView.value === "string" ? `'${slidesPerView.value}'` : slidesPerView.value}"`);
  if (spaceBetween.value !== 0) props.push(`:space-between="${spaceBetween.value}"`);
  if (autoplay.value) props.push(':autoplay="{ delay: 2600 }"');
  if (!motionBlur.value) props.push(':motion-blur="false"');
  if (arrow.value !== "hover") props.push(`arrow="${arrow.value}"`);
  if (indicatorPosition.value !== "inside") props.push(`indicator-position="${indicatorPosition.value}"`);
  if (direction.value !== "horizontal") props.push(`direction="${direction.value}"`);
  if (centeredSlides.value) props.push(":centered-slides=\"true\"");
  if (loop.value) props.push("loop");
  if (grabCursor.value) props.push("grab-cursor");
  if (color.value !== "primary") props.push(`color="${color.value}"`);
  if (paginationType.value !== "line") props.push(`:pagination="{ clickable: true, type: '${paginationType.value}' }"`);
  if (indicatorOffset.value !== 16) props.push(`:indicator-offset="${indicatorOffset.value}"`);

  const propsStr = props.length > 0 ? "\n  " + props.join("\n  ") : "";
  return `<RebornCarousel v-model="activeIndex"${propsStr}\n>\n  <!-- slides content -->\n</RebornCarousel>`;
});

const copyToClipboard = () => {
  if (import.meta.client) {
    navigator.clipboard.writeText(carouselCode.value);
  }
};
</script>

<template>
  <section class="max-w-full overflow-hidden space-y-6">
    <div
      class="relative z-10 flex flex-col gap-8 rounded-[32px] border border-slate-200/50 bg-white/60 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40 dark:shadow-none">

      <!-- Layout Settings -->
      <div class="space-y-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-slate-900 dark:text-white">
            <div class="flex size-8 items-center justify-center rounded-xl bg-slate-900/5 dark:bg-white/5">
              <Icon name="lucide:layout-template" class="size-4.5 opacity-70" />
            </div>
            <h4 class="text-xs font-bold uppercase tracking-[0.2em] opacity-80">布局配置</h4>
          </div>

          <RebornPopover :content="{ side: 'left' }" arrow portal>
            <template #default="{ open }">
              <RebornButton>
                <Icon name="lucide:code-2" class="size-4" />
                <span>实时代码</span>
              </RebornButton>
            </template>
            <template #content>
              <div class="w-[420px] p-1">
                <div
                  class="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-50/50 p-6 dark:border-white/5 dark:bg-black/20 backdrop-blur-sm">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                      <div class="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      <span class="text-caption-sm font-bold uppercase tracking-[0.2em] text-slate-400">实时代码演示</span>
                    </div>
                    <button @click="copyToClipboard"
                      class="text-caption-sm font-bold uppercase tracking-wider text-blue-500 hover:text-blue-600 transition-colors">
                      复制代码
                    </button>
                  </div>
                  <pre
                    class="overflow-x-auto text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-mono"><code>{{ carouselCode }}</code></pre>
                </div>
              </div>
            </template>
          </RebornPopover>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">显示项目</span>
            <RebornSelect v-model="slidesPerView" :options="[
              { label: '1 项 / 屏', value: 1 },
              { label: '2 项 / 屏', value: 2 },
              { label: '3 项 / 屏', value: 3 },
              { label: '自动宽度', value: 'auto' }
            ]" size="md" />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">项目间距</span>
            <RebornInputNumber v-model="spaceBetween" :min="0" :max="100" :step="4" size="md" />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">容器方向</span>
            <RebornSelect v-model="direction" :options="[
              { label: '水平滚动', value: 'horizontal' },
              { label: '垂直滚动', value: 'vertical' }
            ]" size="md" />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">展示模式</span>
            <RebornSelect v-model="carouselType" :options="[
              { label: '默认模式', value: 'default' },
              { label: '卡片聚焦', value: 'card' }
            ]" size="md" />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">箭头显示</span>
            <RebornSelect v-model="arrow" :options="[
              { label: '悬停时显示', value: 'hover' },
              { label: '始终显示', value: 'always' },
              { label: '隐藏箭头', value: 'never' }
            ]" size="md" />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">指示器位置</span>
            <RebornSelect v-model="indicatorPosition" :options="[
              { label: '内置 (Inside)', value: 'inside' },
              { label: '外置 (Outside)', value: 'outside' },
              { label: '隐藏指示器', value: 'none' }
            ]" size="md" />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">指示器偏移 (px)</span>
            <RebornInputNumber v-model="indicatorOffset" :min="0" :max="100" :step="4" size="md" />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">指示器类型</span>
            <RebornSelect v-model="paginationType" :options="[
              { label: '线条 (Line)', value: 'line' },
              { label: '圆点 (Dot)', value: 'dot' },
              { label: '分数 (Fraction)', value: 'fraction' },
              { label: '按钮 (Button)', value: 'button' }
            ]" size="md" />
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">主题颜色</span>
            <RebornSelect v-model="color" :options="[
              { label: 'Primary', value: 'primary' },
              { label: 'Secondary', value: 'secondary' },
              { label: 'Success', value: 'success' },
              { label: 'Info', value: 'info' },
              { label: 'Warning', value: 'warning' },
              { label: 'Error', value: 'error' },
              { label: 'Neutral', value: 'neutral' }
            ]" size="md" />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">居中模式</span>
            <RebornSwitch v-model="centeredSlides" active-label="开启" inactive-label="关闭" size="md" />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">自动播放 (2.6s)</span>
            <RebornSwitch v-model="autoplay" size="md" />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">动态模糊</span>
            <RebornSwitch v-model="motionBlur" size="md" />
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-caption-md font-semibold text-slate-400 uppercase tracking-wider">无限循环</span>
            <RebornSwitch v-model="loop" size="md" />
          </div>


        </div>
      </div>
    </div>

    <RebornCarousel v-model="activeIndex" :type="carouselType" :slides-perview="slidesPerView"
      :space-between="spaceBetween" :autoplay="autoplay ? { delay: 2600 } : false" :motion-blur="motionBlur"
      :pagination="{ clickable: true, type: paginationType }" :arrow="arrow" :indicator-position="indicatorPosition"
      :direction="direction" :centered-slides="centeredSlides" :loop="loop" :grab-cursor="grabCursor" :color="color"
      :indicator-offset="indicatorOffset">
      <div v-for="slide in featureSlides" :key="slide.title"
        :class="`flex h-full flex-col justify-between bg-linear-to-br ${slide.tone} p-7 text-white`">
        <div class="space-y-3">
          <p class="text-xs font-medium tracking-[0.28em] text-white/70 uppercase">
            {{ slide.eyebrow }}
          </p>
          <h3 class="max-w-[14ch] text-2xl leading-tight font-semibold md:text-[2rem]">
            {{ slide.title }}
          </h3>
        </div>

        <p class="max-w-[36ch] text-sm leading-6 text-white/80 md:text-base">
          {{ slide.description }}
        </p>
      </div>

    </RebornCarousel>
  </section>

  <section class="max-w-full overflow-hidden space-y-4">
    <div class="space-y-2">
      <p class="text-sm font-medium tracking-[0.28em] text-slate-400 uppercase">基础卡片模式</p>
      <h3 class="text-2xl font-semibold text-slate-900 dark:text-white">
        中心项更强，边缘项保留预览
      </h3>
    </div>

    <RebornCarousel type="card" :slides-perview="'auto'" :space-between="20"
      :pagination="{ clickable: true, type: 'dot' }" arrow="always" indicator-position="outside" :motion-blur="true"
      :centered-slides="true" :autoplay="false" height="26rem" loop color="secondary">
      <div v-for="card in cardSlides" :key="card.title"
        :class="`flex h-full w-full max-w-[18rem] flex-col justify-between rounded-[32px] bg-linear-to-br ${card.tone} p-7 text-white md:max-w-88`">
        <div class="space-y-3">
          <span class="inline-flex w-fit rounded-full border border-white/20 px-3 py-1 text-xs text-white/80">
            {{ card.label }}
          </span>
          <h4 class="text-3xl font-semibold">
            {{ card.title }}
          </h4>
        </div>
        <p class="text-sm leading-6 text-white/80 md:text-base">
          {{ card.copy }}
        </p>
      </div>
    </RebornCarousel>
  </section>

  <section class="max-w-full overflow-hidden space-y-4">
    <div class="space-y-2">
      <p class="text-sm font-medium tracking-[0.28em] text-slate-400 uppercase">纵向布局</p>
      <h3 class="text-2xl font-semibold text-slate-900 dark:text-white">也可以做时间线式轮播</h3>
    </div>

    <RebornCarousel direction="vertical" :slides-perview="1" :space-between="18"
      :pagination="{ clickable: true, type: 'button' }" arrow="always" indicator-position="inside" height="22rem"
      color="info" :ui="{ arrowGroup: 'px-10' }">
      <div v-for="(item, index) in timelineSlides" :key="item.title"
        class="flex h-full flex-col justify-between rounded-[28px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_34%),linear-gradient(135deg,#ffffff,#f8fafc)] p-7 text-slate-900 shadow-sm dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.98))] dark:text-white">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-400 dark:text-slate-500">0{{ index + 1 }}</span>
          <span class="rounded-full bg-slate-900 px-3 py-1 text-xs text-white dark:bg-white dark:text-slate-900">
            {{ item.title }}
          </span>
        </div>
        <p class="max-w-[34ch] text-lg leading-8 text-slate-700 dark:text-slate-200">
          {{ item.copy }}
        </p>
      </div>
    </RebornCarousel>
  </section>

  <section class="max-w-full overflow-hidden space-y-4">
    <div class="space-y-2">
      <p class="text-sm font-medium tracking-[0.28em] text-slate-400 uppercase">插槽自定义</p>
      <h3 class="text-2xl font-semibold text-slate-900 dark:text-white">你可以自由控制导航 UI</h3>
    </div>

    <RebornCarousel slides-per-view="auto" :space-between="20" loop>
      <div v-for="slide in featureSlides.slice(0, 3)" :key="slide.title"
        :class="`flex flex-col justify-center items-center rounded-3xl bg-linear-to-br ${slide.tone} p-12 text-white text-center`">
        <h4 class="text-4xl font-bold mb-4">{{ slide.title }}</h4>
        <p class="opacity-80">{{ slide.description }}</p>
      </div>

      <!-- 自定义箭头 -->
      <template #prev="{ prev }">
        <button @click="prev"
          class="pointer-events-auto size-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95">
          <Icon name="tabler:chevrons-left" class="size-6" />
        </button>
      </template>
      <template #next="{ next }">
        <button @click="next"
          class="pointer-events-auto size-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95">
          <Icon name="tabler:chevrons-right" class="size-6" />
        </button>
      </template>

      <!-- 自定义指示器 -->
      <template #indicators="{ activeIndex, count, goTo }">
        <div
          class="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-3 p-1.5 rounded-2xl bg-black/20 backdrop-blur-md">
          <button v-for="i in count" :key="i" @click="goTo(i - 1)" class="h-1 transition-all duration-500 rounded-full"
            :class="[activeIndex === i - 1 ? 'w-8 bg-white' : 'w-2 bg-white/30']" />
        </div>
      </template>
    </RebornCarousel>
  </section>
</template>
