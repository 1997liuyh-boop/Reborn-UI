<script setup lang="ts">
import type { PlaygroundControlGroup } from "~/components/common/play-ground/Playground.vue";
import type { CarouselArrowMode, CarouselColor, CarouselDirection, CarouselExpose, CarouselIndicatorDisplayMode, CarouselIndicatorPosition, CarouselPagination, CarouselThumbsPosition, CarouselTrigger, CarouselType } from "~/components/reborn/ui/reborn-carousel/types";
import { DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, ref } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { carouselArrowModes, carouselColors, carouselDirections, carouselIndicatorDisplayModes, carouselIndicatorPositions, carouselIndicatorTypes, carouselTriggers, carouselTypes } from "~/components/reborn/ui/reborn-carousel/reborn-carousel.config";
import RebornCarousel from "~/components/reborn/ui/reborn-carousel/RebornCarousel.vue";
import HeroBanner from "./components/HeroBanner.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────
/** 演练场默认状态，与组件的独立参数轴对应。 */
const defaultState = {
  slidesPerView: 1 as number | "auto", spaceBetween: 16, direction: "horizontal" as CarouselDirection,
  type: "default" as CarouselType, arrow: "hover" as CarouselArrowMode,
  indicatorPosition: "inside" as CarouselIndicatorPosition,
  paginationType: "line" as NonNullable<CarouselPagination["type"]>, trigger: "hover" as CarouselTrigger,
  indicatorBackground: true, paginationDisplay: "always" as CarouselIndicatorDisplayMode, paginationClickable: true,
  color: "primary" as CarouselColor, autoplay: false, delay: 3000, pauseOnHover: true, pauseOnFocus: true,
  loop: true, centeredSlides: false, motionBlur: false, autoSize: false,
  grabCursor: true, draggable: true, keyboard: true, indicatorOffset: 8,
  showThumbs: false, thumbsPosition: "bottom" as CarouselThumbsPosition,
  thumbsArrow: "hover" as CarouselArrowMode, thumbsLoop: false,
};
const state = ref({ ...defaultState });
/** 当前索引和事件回显。 */
const activeIndex = ref(0);
const lastEvent = ref("尚未切换");
const changeCount = ref(0);
const previewController = ref<CarouselExpose>();
/** 仅统计真实切换事件，外部重置模型不冒充组件事件。 */
function onChange(index: number) { changeCount.value++; lastEvent.value = `change：第 ${index + 1} 项（索引 ${index}）`; }
/** 重置参数、索引和交互反馈。 */
function resetState() { state.value = { ...defaultState }; activeIndex.value = 0; lastEvent.value = "尚未切换"; changeCount.value = 0; }
/** 预设均从默认配置开始，避免先前场景的参数混入。 */
const presets: { label: string; props: Partial<typeof defaultState> }[] = [
  { label: "基础轮播", props: {} },
  { label: "悬停指示", props: { paginationDisplay: "hover", paginationType: "dot", trigger: "click", indicatorPosition: "outside" } },
  { label: "纵向浏览", props: { direction: "vertical", paginationType: "button", arrow: "always", trigger: "click" } },
  { label: "多项卡片", props: { slidesPerView: 2, type: "card", centeredSlides: true, paginationType: "fraction", indicatorPosition: "outside", arrow: "always" } },
];
/** 应用快捷预设并回到首项。 */
function applyPreset(preset: (typeof presets)[number]) { resetState(); state.value = { ...defaultState, ...preset.props }; lastEvent.value = `已应用：${preset.label}`; }
/** 不显示分页时收起无效控件，保留配置值以便再次开启。 */
function isPaginationHidden(config: Record<string, unknown>) { return config.indicatorPosition === "none" || config.paginationDisplay === "never"; }
/** 配置枚举同时供组件类型和演练场选项使用。 */
const options = (values: readonly string[]) => values.map(value => ({ label: value, value }));
const controls: PlaygroundControlGroup[] = [
  {
    title: "布局", children: [
      { label: "每屏数量", key: "slidesPerView", component: "select" as const, defaultValue: 1, props: { options: [1, 2, 3, "auto"].map(value => ({ label: String(value), value })) } },
      { label: "多项 / 卡片间距（px）", key: "spaceBetween", component: "slider" as const, defaultValue: 16, props: { min: 0, max: 48, step: 4 }, hide: (_value, config) => config.slidesPerView === 1 && config.type === "default" && !config.autoSize },
      { label: "方向", key: "direction", component: "select" as const, defaultValue: "horizontal", props: { options: options(carouselDirections) } },
      { label: "模式", key: "type", component: "select" as const, defaultValue: "default", props: { options: options(carouselTypes) } },
      { label: "居中", key: "centeredSlides", component: "checkbox" as const, defaultValue: false },
      { label: "内容决定尺寸", key: "autoSize", component: "checkbox" as const, defaultValue: false },
      { label: "动态模糊", key: "motionBlur", component: "checkbox" as const, defaultValue: false },
    ]
  },
  {
    title: "指示器", children: [
      { label: "指示器位置", key: "indicatorPosition", component: "select" as const, defaultValue: "inside", props: { options: options(carouselIndicatorPositions) } },
      { label: "显示模式", key: "paginationDisplay", component: "select", defaultValue: "always", props: { options: options(carouselIndicatorDisplayModes) }, hide: (_value, config) => config.indicatorPosition === "none" },
      { label: "指示器类型", key: "paginationType", component: "select" as const, defaultValue: "line", props: { options: options(carouselIndicatorTypes) }, hide: (_value, config) => isPaginationHidden(config) },
      { label: "指示器背景", key: "indicatorBackground", component: "checkbox" as const, defaultValue: true, hide: (_value, config) => isPaginationHidden(config) || config.paginationType === "progress" },
      { label: "允许指示器切换", key: "paginationClickable", component: "checkbox", defaultValue: true, hide: (_value, config) => isPaginationHidden(config) || ["progress", "fraction"].includes(config.paginationType) },
      { label: "指示器触发", key: "trigger", component: "select" as const, defaultValue: "hover", props: { options: options(carouselTriggers) }, hide: (_value, config) => isPaginationHidden(config) || !config.paginationClickable || ["progress", "fraction"].includes(config.paginationType) },
      { label: "指示器偏移（px）", key: "indicatorOffset", component: "slider" as const, defaultValue: 8, props: { min: 0, max: 48, step: 4 }, hide: (_value, config) => isPaginationHidden(config) || config.paginationType === "progress" },
      { label: "配色", key: "color", component: "select" as const, defaultValue: "primary", props: { options: options(carouselColors) }, hide: (_value, config) => isPaginationHidden(config) },
    ]
  },
  {
    title: "操作", children: [
      { label: "箭头", key: "arrow", component: "select" as const, defaultValue: "hover", props: { options: options(carouselArrowModes) } },
      { label: "循环", key: "loop", component: "checkbox" as const, defaultValue: true },
      { label: "鼠标拖动", key: "draggable", component: "checkbox" as const, defaultValue: true },
      { label: "抓取光标", key: "grabCursor", component: "checkbox" as const, defaultValue: true },
      { label: "键盘导航", key: "keyboard", component: "checkbox" as const, defaultValue: true },
    ]
  },
  {
    title: "自动播放", children: [
      { label: "自动播放", key: "autoplay", component: "checkbox" as const, defaultValue: false },
      { label: "间隔（ms）", key: "delay", component: "slider" as const, defaultValue: 3000, props: { min: 800, max: 6000, step: 200 }, hide: (_value, config) => !config.autoplay },
      { label: "悬停暂停", key: "pauseOnHover", component: "checkbox" as const, defaultValue: true, hide: (_value, config) => !config.autoplay },
      { label: "键盘聚焦暂停", key: "pauseOnFocus", component: "checkbox" as const, defaultValue: true, hide: (_value, config) => !config.autoplay },
    ]
  },
  {
    title: "缩略图", children: [
      { label: "显示缩略图", key: "showThumbs", component: "checkbox" as const, defaultValue: false },
      { label: "缩略图位置", key: "thumbsPosition", component: "select" as const, defaultValue: "bottom", props: { options: options(["top", "bottom", "left", "right"]) }, hide: (_value, config) => !config.showThumbs },
      { label: "缩略图箭头", key: "thumbsArrow", component: "select" as const, defaultValue: "hover", props: { options: options(carouselArrowModes) }, hide: (_value, config) => !config.showThumbs },
      { label: "缩略图循环", key: "thumbsLoop", component: "checkbox" as const, defaultValue: false, hide: (_value, config) => !config.showThumbs },
    ]
  },
];
/** 全量参数绑定与代码展示共用一份配置，避免预览与复制代码不一致。 */
const previewProps = computed(() => {
  const { paginationType, paginationDisplay, paginationClickable, indicatorBackground, showThumbs, thumbsPosition, thumbsArrow, thumbsLoop, delay, pauseOnHover, pauseOnFocus, ...rest } = state.value;
  return {
    ...rest, height: 280, pagination: { type: paginationType, display: paginationDisplay, clickable: paginationClickable, indicatorBackground },
    autoplay: rest.autoplay ? { delay, pauseOnHover, pauseOnFocus } : false,
    thumbs: showThumbs ? { position: thumbsPosition, arrow: thumbsArrow, loop: thumbsLoop } : null
  };
});
const carouselCode = computed(() => `<RebornCarousel\n  v-model="activeIndex"\n${Object.entries(previewProps.value).map(([key, value]) => `  :${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}='${JSON.stringify(value)}'`).join("\n")}\n  @change="onChange"\n>\n  <div v-for="item in items" :key="item.id">{{ item.title }}</div>\n</RebornCarousel>`);

// ─── 场景演示状态 ───────────────────────────────────────────────
/** 场景内容只承载轮播展示，不额外堆叠外围装饰。 */
const slides = [
  { id: 1, title: "城市漫步", description: "街区路线与沿途记录", tone: "bg-primary/15" },
  { id: 2, title: "山间步道", description: "步道路线与出行准备", tone: "bg-success/15" },
  { id: 3, title: "海边日落", description: "海岸路线与拍摄时间", tone: "bg-warning/15" },
  { id: 4, title: "夜间观察", description: "观测地点与天气条件", tone: "bg-info/15" },
];
/** 与组件的末个可视组边界一致，非循环多项显示不留下无效的下一张按钮。 */
const canPreviewNext = computed(() => state.value.loop || activeIndex.value + (state.value.slidesPerView === "auto" ? 1 : state.value.slidesPerView) < slides.length);
const controller = ref<CarouselExpose>();
const controlledIndex = ref(0);
const paginationBackground = ref(true);
const paginationDisplay = ref<CarouselIndicatorDisplayMode>("always");
const paginationPositions = ["inside", "outside"] as const;
const paginationLabels: Record<NonNullable<CarouselPagination["type"]>, string> = {
  line: "线性", dot: "圆点", progress: "进度条", fraction: "文字", button: "按钮",
};
const dynamicSlides = ref([...slides]);
const dynamicIndex = ref(0);
/** 数据增删演示，删除当前末项后由组件同步合法索引。 */
function addSlide() { const id = Math.max(0, ...dynamicSlides.value.map(slide => slide.id)) + 1; dynamicSlides.value.push({ id, title: `新增内容 ${id}`, description: "运行时插槽更新", tone: "bg-secondary/15" }); }
function removeSlide() { dynamicSlides.value.pop(); }
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="carouselCode" component-name="RebornCarousel" title="交互演练场"
      description="按布局、指示器、操作、自动播放和缩略图分组调节参数，或应用预设，查看页码和切换事件。"
    >
      <template #tag>
        <RebornButton size="sm" color="neutral" variant="text" @click="resetState">重置</RebornButton>
      </template>
      <!-- 回显独占一行，避免文字更新挤压轮播宽度、移动指示器并打断切换动画。 -->
      <div class="flex w-full min-w-0 flex-col gap-4">
        <div class="flex flex-wrap items-center gap-2" role="group" aria-label="快捷预设">
          <span class="text-sm text-gray-7">快捷预设</span>
          <RebornButton v-for="preset in presets" :key="preset.label" size="sm" variant="outlined" color="neutral" @click="applyPreset(preset)">
            {{ preset.label }}
          </RebornButton>
        </div>
        <RebornCarousel ref="previewController" v-model="activeIndex" v-bind="previewProps" @change="onChange">
          <div
            v-for="slide in slides" :key="slide.id"
            class="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-gray-9" :class="slide.tone"
          >
            <h3 class="text-xl font-medium">{{ slide.title }}</h3>
            <p class="text-base">{{ slide.description }}</p>
          </div>
        </RebornCarousel>
        <div class="flex flex-wrap items-center gap-2" role="group" aria-label="轮播操作">
          <RebornButton size="sm" variant="outlined" :disabled="!state.loop && activeIndex === 0" @click="previewController?.prev()">上一张</RebornButton>
          <RebornButton size="sm" variant="outlined" :disabled="!canPreviewNext" @click="previewController?.next()">下一张</RebornButton>
          <span class="text-sm text-gray-7 tabular-nums">第 {{ activeIndex + 1 }} / {{ slides.length }} 项</span>
        </div>
        <DemoNote tone="dimmed" aria-live="polite">{{ lastEvent }}；当前索引 {{ activeIndex }}；已切换 {{ changeCount }} 次。</DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        <code>initialSlide</code> 设置首张；<code>loop</code> 开启循环，未传 <code>v-model</code>
        时也生效。
      </template>
      <RebornCarousel :initial-slide="1" :height="240" loop arrow="always" :pagination="{ type: 'dot' }">
        <div
          v-for="slide in slides" :key="slide.id" class="flex h-full items-center justify-center text-xl text-gray-9"
          :class="slide.tone"
        >
          {{ slide.title }}
        </div>
      </RebornCarousel>
      <DemoNote tone="dimmed">单项占满视口时相邻内容无间距；多项显示、卡片或自动尺寸仍使用 <code>spaceBetween</code>。</DemoNote>
    </DemoSection>

    <DemoSection title="分页指示器">
      <template #description>
        <code>pagination.type</code> 选择五种内置分页；<code>pagination.indicatorBackground</code>
        控制半透明底色、毛玻璃与阴影；<code>pagination.display</code> 独立控制显示模式，进度条也遵循该模式。
      </template>
      <div class="mb-4 flex flex-wrap gap-4">
        <div class="flex gap-2" role="group" aria-label="指示器背景">
          <RebornButton
            size="sm" :variant="paginationBackground ? 'filled' : 'outlined'" :aria-pressed="paginationBackground"
            @click="paginationBackground = true"
          >
            显示背景
          </RebornButton>
          <RebornButton
            size="sm" :variant="paginationBackground ? 'outlined' : 'filled'" :aria-pressed="!paginationBackground"
            @click="paginationBackground = false"
          >
            隐藏背景
          </RebornButton>
        </div>
        <div class="flex flex-wrap gap-2" role="group" aria-label="指示器显示模式">
          <RebornButton v-for="display in carouselIndicatorDisplayModes" :key="display" size="sm" :variant="paginationDisplay === display ? 'filled' : 'outlined'" :aria-pressed="paginationDisplay === display" @click="paginationDisplay = display">
            {{ display === 'hover' ? '悬停 / 聚焦显示' : display === 'always' ? '始终显示' : '不显示' }}
          </RebornButton>
        </div>
      </div>
      <div class="flex flex-col gap-6">
        <div v-for="paginationType in carouselIndicatorTypes" :key="paginationType" class="flex min-w-0 flex-col gap-3">
          <p class="text-base font-medium text-gray-9">{{ paginationLabels[paginationType] }} <code>{{ paginationType }}</code></p>
          <div class="grid gap-4 md:grid-cols-2">
            <div v-for="position in paginationPositions" :key="position" class="flex min-w-0 flex-col gap-2">
              <p class="text-sm text-gray-7">{{ position === 'inside' ? '内部 inside' : '外部 outside' }}</p>
              <RebornCarousel
                :height="180" loop arrow="always" trigger="click" :indicator-position="position"
                :pagination="{ type: paginationType, display: paginationDisplay, indicatorBackground: paginationBackground }"
              >
                <div
                  v-for="slide in slides" :key="slide.id"
                  class="flex h-full items-center justify-center text-lg text-gray-9" :class="slide.tone"
                >
                  {{ slide.title }}
                </div>
              </RebornCarousel>
            </div>
          </div>
        </div>
      </div>
      <DemoNote tone="dimmed">
        <code>indicatorOffset</code> 默认 8px；外层保留溢出以显示 outside 分页的背景投影，轮播内容仍独立裁剪。<code>line</code> 为 24×2px；<code>dot</code> 普通项 6×6px、激活项 10×6px 描边；<code>progress</code>
        高 2px，表示当前第几张 / 总张数，不是自动播放倒计时。<code>color</code> 使用对应色板第 6 阶：<code>line</code> / <code>dot</code> 可点击的激活项悬停时变色，<code>button</code> 激活项与 <code>progress</code> 填充直接着色；<code>fraction</code> 仅当前页文字自身悬停时变色，容器悬停时总数加粗，宽度由文字撑开。
        <code>display="hover"</code> 在悬停或键盘聚焦轮播时显示，无悬停能力的触屏设备保持显示；隐藏时不拦截点击，也不收起外部分页占位。
      </DemoNote>
    </DemoSection>

    <DemoSection title="多项显示与响应式">
      <template #description><code>slidesPerView</code> 控制每屏数量，<code>breakpoints</code> 按窗口最小宽度覆盖布局。</template>
      <RebornCarousel
        :slides-per-view="1" :space-between="16"
        :breakpoints="{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }" :height="200" arrow="always"
        :pagination="{ type: 'button' }" indicator-position="outside"
      >
        <div
          v-for="slide in slides" :key="slide.id" class="flex h-full items-center justify-center text-lg text-gray-9"
          :class="slide.tone"
        >
          {{ slide.title }}
        </div>
      </RebornCarousel>
      <DemoNote tone="dimmed">
        未到 640px 显示 1 项，640px 起显示 2 项，1024px 起显示 3 项；旧参数 <code>slidesPerview</code> 仍兼容。
      </DemoNote>
    </DemoSection>

    <DemoSection title="卡片与自动尺寸">
      <template #description>
        <code>type="card"</code> 配合 <code>slidesPerView="auto"</code> 和
        <code>centeredSlides</code>，内容宽度决定卡片尺寸。
      </template>
      <RebornCarousel
        type="card" slides-per-view="auto" :space-between="16" :height="260" centered-slides loop
        arrow="always" :pagination="{ type: 'line' }" indicator-position="outside"
      >
        <div
          v-for="slide in slides" :key="slide.id"
          class="flex h-full w-72 flex-col items-center justify-center gap-3 rounded-xl p-6 text-gray-9"
          :class="slide.tone"
        >
          <h3 class="text-xl">{{ slide.title }}</h3>
          <p class="text-base">{{ slide.description }}</p>
        </div>
      </RebornCarousel>
    </DemoSection>

    <DemoSection title="纵向轮播">
      <template #description><code>direction="vertical"</code> 需要明确高度；方向键改为上下，箭头与指示器同步纵向排列。</template>
      <RebornCarousel direction="vertical" :height="240" arrow="always" :pagination="{ type: 'button' }" color="info">
        <div
          v-for="slide in slides" :key="slide.id" class="flex h-full items-center justify-center text-xl text-gray-9"
          :class="slide.tone"
        >
          {{ slide.title }}
        </div>
      </RebornCarousel>
    </DemoSection>

    <DemoSection title="缩略图导航">
      <template #description><code>thumbs</code> 支持四个方向；缩略图和主图共用索引，不会把页面滚动到主图位置。</template>
      <HeroBanner />
    </DemoSection>

    <DemoSection title="自动播放与实例控制">
      <template #description>
        <code>autoplay</code> 可设置暂停策略，<code>pause()</code> 的暂停状态保持到调用
        <code>resume()</code>。
      </template>
      <div class="mb-4 flex flex-wrap gap-2">
        <RebornButton size="sm" variant="outlined" @click="controller?.prev()">上一项</RebornButton>
        <RebornButton size="sm" variant="outlined" @click="controller?.next()">下一项</RebornButton>
        <RebornButton size="sm" variant="text" @click="controller?.goTo(0)">回到首项</RebornButton>
        <RebornButton size="sm" variant="text" @click="controlledIndex = slides.length - 1">模型切到末项</RebornButton>
        <RebornButton size="sm" variant="text" @click="controller?.pause()">暂停</RebornButton>
        <RebornButton size="sm" @click="controller?.resume()">继续</RebornButton>
      </div>
      <RebornCarousel
        ref="controller" v-model="controlledIndex" loop
        :autoplay="{ delay: 3000, pauseOnHover: true, pauseOnFocus: true }" :height="240"
        :pagination="{ type: 'fraction' }" indicator-position="outside"
      >
        <div
          v-for="slide in slides" :key="slide.id" class="flex h-full items-center justify-center text-xl text-gray-9"
          :class="slide.tone"
        >
          {{ slide.title }}
        </div>
      </RebornCarousel>
      <DemoNote tone="dimmed">
        当前索引 {{ controlledIndex }}；{{ controller?.isPlaying ? '正在计时' : '已暂停' }}。页面隐藏时暂停，恢复可见后重新计时。
      </DemoNote>
    </DemoSection>

    <DemoSection title="动态内容与交互">
      <template #description><code>draggable</code> 启用鼠标拖动，<code>keyboard</code> 控制键盘导航；动态删项后自动修正索引。</template>
      <div class="mb-4 flex gap-2">
        <RebornButton size="sm" @click="addSlide">增加内容</RebornButton>
        <RebornButton size="sm" variant="outlined" :disabled="!dynamicSlides.length" @click="removeSlide">
          删除末项
        </RebornButton>
      </div>
      <RebornCarousel
        v-model="dynamicIndex" loop draggable grab-cursor :height="240" :pagination="{ type: 'button' }"
        arrow="always"
      >
        <div
          v-for="slide in dynamicSlides" :key="slide.id"
          class="flex h-full flex-col items-center justify-center gap-3 text-gray-9" :class="slide.tone"
        >
          <h3 class="text-xl">{{ slide.title }}</h3><input
            class="rounded-md border border-gray-3 bg-gray-1 px-3 py-2 text-base" aria-label="轮播内输入框"
            placeholder="方向键在输入框内不切换轮播"
          >
        </div>
      </RebornCarousel>
      <DemoNote tone="dimmed">{{ dynamicSlides.length }} 项，当前索引 {{ dynamicIndex }}；按住拖拽时保持跟手，松手后吸附到最近项；输入框保留原生编辑行为。</DemoNote>
    </DemoSection>

    <DemoSection title="自定义导航与样式">
      <template #description>
        <code>prev</code> / <code>next</code> 提供禁用状态，<code>indicators</code> 提供
        <code>goTo</code>；<code>ui</code> 覆盖对应样式键。
      </template>
      <RebornCarousel
        :height="240" arrow="always" :pagination="{ type: 'dot' }" indicator-position="outside" :indicator-offset="12"
        :ui="{ root: 'rounded-xl' }"
      >
        <div
          v-for="slide in slides" :key="slide.id" class="flex h-full items-center justify-center text-xl text-gray-9"
          :class="slide.tone"
        >
          {{ slide.title }}
        </div>
        <template #prev="{ prev, disabled }">
          <RebornButton
            circle size="sm" class="pointer-events-auto" :disabled="disabled" aria-label="上一项"
            @click="prev"
          >
            <Icon name="lucide:chevron-left" />
          </RebornButton>
        </template>
        <template #next="{ next, disabled }">
          <RebornButton
            circle size="sm" class="pointer-events-auto" :disabled="disabled" aria-label="下一项"
            @click="next"
          >
            <Icon name="lucide:chevron-right" />
          </RebornButton>
        </template>
        <template #indicators="{ activeIndex: current, count, goTo }">
          <div class="flex gap-2">
            <RebornButton
              v-for="index in count" :key="index" size="sm"
              :variant="current === index - 1 ? 'filled' : 'text'"
              :aria-current="current === index - 1 ? 'true' : undefined" @click="goTo(index - 1)"
            >
              {{ index }}
            </RebornButton>
          </div>
        </template>
      </RebornCarousel>
    </DemoSection>
  </div>
</template>
