<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { ComponentPublicInstance, CSSProperties, PropType, VNode, VNodeChild } from "vue";
import type {
  CarouselArrowMode,
  CarouselRenderSlide,
  CarouselSlot,
  CarouselSlots,
  CarouselThumbsPosition,
  RebornCarouselBreakpoint,
  RebornCarouselProps,
} from "./types";
import {
  cloneVNode,
  Comment,
  computed,
  defineComponent,
  Fragment,
  h,
  isVNode,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  Text,
  unref,
  watch,
} from "vue";
import { motionPresets, runMotion, stopMotion } from "@/lib/motion";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import RebornProgress from "../reborn-progress/RebornProgress.vue";
import theme from "./reborn-carousel.config";

// 统一应用默认值
const props = withDefaults(defineProps<RebornCarouselProps>(), {
  slidesPerview: 1,
  slidesPerView: undefined,
  spaceBetween: 0,
  centeredSlides: false,
  loop: false,
  autoplay: false,
  pagination: null,
  trigger: "hover",
  indicatorPosition: "inside",
  arrow: "hover",
  motionBlur: false,
  height: "auto",
  type: "default",
  direction: "horizontal",
  initialSlide: 0,
  breakpoints: () => ({}),
  grabCursor: false,
  draggable: undefined,
  keyboard: true,
  autoSize: false,
  indicatorOffset: 8,
  thumbs: null,
  color: "primary",
  ui: () => ({}),
});

// 组件声明的抛出事件
const emit = defineEmits<{
  /** 幻灯片当前活动索引发生实质性改变时触发此事件 */
  (e: "change", value: number): void;
}>();
const slots = defineSlots<CarouselSlots>();

/** 双向绑定外部传入的当前激活索引值 modelValue */
const modelValue = defineModel<number | null>("modelValue", {
  default: null,
});

/** 内部辅助组件：动态挂载和管理单个幻灯片插槽内容的渲染，以规避 Fragment 节点带来的不确定性 */
// eslint-disable-next-line vue/one-component-per-file -- 内部节点桥接用于复用插槽快照，不是公共组件。
const CarouselSlotItem = defineComponent({
  name: "CarouselSlotItem",
  props: { node: { type: Object as PropType<VNode>, default: null } },
  setup: localProps => () => localProps.node ? cloneSlideNode(localProps.node) : null,
});

/** 浅复制会共享动态子节点的 DOM 引用；完整复制子树并退出块优化，避免克隆污染真实片。 */
function cloneSlideNode(node: VNode): VNode {
  const cloned = cloneVNode(node);
  if (Array.isArray(node.children)) cloned.children = node.children.map(cloneSlideChild);
  // -2 是 Vue 的退出优化标记，渲染器会清理内部动态子节点引用并完整比较子树。
  cloned.patchFlag = -2;
  return cloned;
}
function cloneSlideChild(child: VNodeChild): VNodeChild {
  if (Array.isArray(child)) return child.map(cloneSlideChild);
  return isVNode(child) ? cloneSlideNode(child) : child;
}

/**
 * 虚拟节点规范化过滤器：
 * 过滤空节点、清理空文本节点，并展开 Vue 的 Fragment 片段，
 * 从而准确无误地统计出插槽下真实的幻灯片数量和内容节点。
 */
function normalizeNodes(nodes: VNode[] = []): VNode[] {
  const normalized: VNode[] = [];

  for (const node of nodes) {
    // 忽略无效或注释节点
    if (!node || node.type === Comment) {
      continue;
    }

    // 过滤无实质意义的空白纯文本节点
    if (node.type === Text) {
      const content = typeof node.children === "string" ? node.children.trim() : "";
      if (!content) {
        continue;
      }
    }

    // 递归展开嵌套的 Fragment 节点片段
    if (node.type === Fragment && Array.isArray(node.children)) {
      normalized.push(...normalizeNodes(node.children as VNode[]));
      continue;
    }

    normalized.push(node);
  }

  return normalized;
}

/** 默认匿名插槽节点计算属性 */
let slideNodes: VNode[] = [];
const slideCount = ref(0);
let hasRendered = false;
/** 获取基于 Tailwind-Variants 构建的主题样式解析器 */
const b = tv(theme);

/** 视口滚动容器 DOM 引用 */
const viewportRef = ref<HTMLDivElement | null>(null);
/** 缩略图滚动视口容器 DOM 引用 */
const thumbsViewportRef = ref<HTMLDivElement | null>(null);
/** 轮播图主视觉根级 DOM 引用 */
const mainRootRef = ref<HTMLDivElement | null>(null);
const carouselRootRef = ref<HTMLDivElement | null>(null);
/** 存储所有幻灯片 DOM 元素的数组引用 */
const slideRefs = ref<HTMLElement[]>([]);
/** 存储所有缩略图 DOM 元素的数组引用 */
const thumbRefs = ref<HTMLElement[]>([]);

/** 外部逻辑所知的当前激活真实索引值（对应 props 数据量） */
const currentIndex = ref(0);
/** 视口中当前所处的位置索引值（在 loop 复制后包含克隆项的渲染索引） */
const currentRenderIndex = ref(0);
/** 当前设备/窗口视口的实时宽度 */
const viewportWidth = ref(0);
/** 视口在滚动方向（主轴）上的实际像素尺寸 */
const viewportMainSize = ref(0);

/** 鼠标是否正悬浮于轮播图整体容器上方 */
const isHovering = ref(false);
/** 焦点是否聚焦在轮播图区域内 */
const isFocused = ref(false);
/** 用户是否正按住鼠标/手势拖拽当前轨道 */
const isDragging = ref(false);

/** 环形克隆 (loop) 模式下：正处于静默首尾跨越跳转定位中，期间屏蔽并锁死二次滚动同步 */
const isJumping = ref(false);
/** 环形克隆 (loop) 模式下：处于平滑转场动画执行的生命周期中，锁定驱动同步以规避索引闪烁跳跃 */
const isLoopTransitioning = ref(false);
/** 未结束转场的渲染目标；连点从同一克隆区续接，而不是退回真实区。 */
let loopTargetRenderIndex: number | null = null;
/** 连续指令迭代计数器，抛弃掉同帧微任务中积攒的过期 nextTick 响应 */
let loopGoToGeneration = 0;
/** 静默归位代次，用于丢弃被新导航中止的解锁回调。 */
let loopArrowGeneration = 0;

/** 窗口尺寸变化时的 Resize 处理句柄 */
let resizeHandler: (() => void) | null = null;
/** 监听视口容器尺寸变化的观察者实例 */
let resizeObserver: ResizeObserver | null = null;
/** 滚动位置检查的渲染帧句柄 */
let scrollFrame = 0;
/** 自动播放的间隔执行定时器 */
let autoplayTimer: ReturnType<typeof setInterval> | null = null;
const isPlaying = ref(false);
const isPaused = ref(false);
const isPageHidden = ref(false);
let isDisposed = false;
let applyGeneration = 0;
const pendingFrames = new Set<number>();

/** 统一登记动画帧，卸载时清理，防止已失效回调继续改写状态。 */
function scheduleFrame(callback: () => void) {
  const id = requestAnimationFrame(() => {
    pendingFrames.delete(id);
    if (!isDisposed) callback();
  });
  pendingFrames.add(id);
  return id;
}
/** 布局防重入状态锁 */
let isUpdatingLayout = false;
/** 滚动执行中防干扰状态锁 */
let isApplyingIndex = false;
/** 布局批处理更新的 RequestAnimationFrame 帧标记 */
let layoutFrame = 0;
let layoutGeneration = 0;

/** 判断当前是否仍处于一次切换流程中，避免重复点击或自动播放叠加推进 */
function isNavigationLocked() {
  return isUpdatingLayout || isJumping.value || isApplyingIndex || (props.loop && isLoopTransitioning.value);
}

/** 自动高度 (height="auto") 模式下，组件当前依据活动项动态计算的像素高度 */
const currentSlideHeight = ref(0);
let heightGeneration = 0;
/** 主图区域在视口中的物理宽高，用于联动计算并对齐缩略图面板 */
const mainRootSize = ref({ width: 0, height: 0 });
/** 针对主图最外层根节点的尺寸变化观察器 */
let mainRootObserver: ResizeObserver | null = null;

/** 在父组件渲染上下文读取插槽一次，真实片、克隆片和缩略图共享节点快照。 */
function prepareSlides() {
  slideNodes = normalizeNodes(slots.default?.() ?? []);
  slideCount.value = slideNodes.length;
  if (!hasRendered) {
    currentIndex.value = clampIndex(modelValue.value ?? props.initialSlide);
    hasRendered = true;
  }
  return true;
}

/**
 * 响应式布局自适应计算：
 * 遍历 breakpoints 列表并依据当前 viewportWidth 进行实时匹配，
 * 取得匹配的最新响应式配置参数项。
 */
const responsiveProps = computed(() => {
  const entries = Object.entries(props.breakpoints || {})
    .map(([key, value]) => [Number(key), value] as const)
    .filter(([key]) => !Number.isNaN(key))
    .sort((a, b) => a[0] - b[0]);

  return entries.reduce<RebornCarouselBreakpoint>((result, [key, value]) => {
    if (viewportWidth.value >= key) {
      Object.assign(result, value);
      // 每层先归一拼写，避免低宽断点的新参数压过高宽断点的旧参数。
      const perView = value.slidesPerView ?? value.slidesPerview;
      if (perView !== undefined) result.slidesPerView = perView;
    }
    return result;
  }, {});
});

/** 实时生效的单屏显示幻灯片张数 */
const effectiveSlidesPerView = computed(
  () => {
    const value = responsiveProps.value.slidesPerView ?? responsiveProps.value.slidesPerview ?? props.slidesPerView ?? props.slidesPerview;
    return value === "auto" ? value : Number.isFinite(value) ? Math.max(1, value) : 1;
  },
);
/** 实时生效的居中展示对齐模式 */
const effectiveCenteredSlides = computed(
  () => responsiveProps.value.centeredSlides ?? props.centeredSlides,
);
/** 实时生效的控制箭头显隐交互模式 */
const effectiveArrow = computed(() => responsiveProps.value.arrow ?? props.arrow);
/** 实时生效的分页器展示位置 */
const effectiveIndicatorPosition = computed(
  () => responsiveProps.value.indicatorPosition ?? props.indicatorPosition,
);
/** 实时生效的运动模糊效果 */
const effectiveMotionBlur = computed(() => responsiveProps.value.motionBlur ?? props.motionBlur);
/** 实时生效的轮播容器高度 */
const effectiveHeight = computed(() => {
  const value = responsiveProps.value.height ?? props.height;
  return typeof value === "number" ? `${Number.isFinite(value) ? Math.max(0, value) : 0}px` : value;
});
/** 实时生效的展现风格 */
const effectiveType = computed(() => responsiveProps.value.type ?? props.type);
/** 实时生效的滚动方向线 */
const effectiveDirection = computed(() => responsiveProps.value.direction ?? props.direction);
/** 实时生效的手势拖拽抓取 */
const effectiveGrabCursor = computed(() => responsiveProps.value.grabCursor ?? props.grabCursor);
/** 实时生效的元素自适应尺寸 */
const effectiveAutoSize = computed(() => responsiveProps.value.autoSize ?? props.autoSize);

// ============================
// loop 循环滚动克隆缓冲机制
// ============================

/**
 * 确定在轮播头部和尾部分别需要复制/克隆的节点数量。
 * 原理：若开启 loop 模式，则需要保证两端有足够的克隆缓冲带。
 * 克隆数取 slidesPerView（在 auto 模式下算作 1）或 slideCount 的较小者，
 * 保证拖拽缓冲和首尾跨越对齐拥有足够的可视过渡边界。
 */
const cloneCount = computed(() => {
  if (!props.loop || slideCount.value <= 1) {
    return 0;
  }

  const perView =
    effectiveSlidesPerView.value === "auto" ? 1 : Number(effectiveSlidesPerView.value);
  // 确保两端至少有 slideCount 或是 visibleCount 的两倍以上，确保横向/纵向均不留白
  const minClones = Math.max(Math.ceil(perView) * 2, 4);
  return Math.min(slideCount.value, minClones);
});

/**
 * 构建包含了前置克隆集、真实节点集、后置克隆集的混合渲染幻灯片列表。
 * 输出每个项携带 { realIndex, renderIndex, isClone } 以便 v-for 准确映射。
 */
const renderSlides = computed(() => {
  const count = slideCount.value;

  if (count === 0) {
    return [];
  }

  const clones = cloneCount.value;

  // 未开启无限循环，真实节点即为渲染列表
  if (clones === 0) {
    return Array.from({ length: count }, (_, i) => ({
      realIndex: i,
      renderIndex: i,
      isClone: false,
    }));
  }

  const result: CarouselRenderSlide[] = [];

  // 1. 前置克隆区：将尾部的 clones 个真实节点复制并放置到最前端
  for (let i = 0; i < clones; i++) {
    const realIdx = ((count - clones + i) % count + count) % count;
    result.push({
      realIndex: realIdx,
      renderIndex: result.length,
      isClone: true,
    });
  }

  // 2. 中间真实节点区：原样输出所有商品或图片幻灯片
  for (let i = 0; i < count; i++) {
    result.push({
      realIndex: i,
      renderIndex: result.length,
      isClone: false,
    });
  }

  // 3. 后置克隆区：将最头部的 clones 个真实节点复制并放置到最尾端
  for (let i = 0; i < clones; i++) {
    const realIdx = i % count;
    result.push({
      realIndex: realIdx,
      renderIndex: result.length,
      isClone: true,
    });
  }

  return result;
});

/**
 * 转换算法：将组件所知的商品真实物理索引转换为包含克隆项在内的真实 DOM 渲染索引。
 */
function realToRenderIndex(realIndex: number): number {
  return cloneCount.value + realIndex;
}

/** 当前运行是否为垂直单轴滚动 */
const isVertical = computed(() => effectiveDirection.value === "vertical");
/** 是否使用商品内容原生尺寸（卡片展现、自适应 auto 尺寸或自定尺寸等） */
const usesIntrinsicSlideSize = computed(
  () => effectiveType.value === "card" || effectiveSlidesPerView.value === "auto" || effectiveAutoSize.value,
);
/** 实时生效的项目间距 */
const effectiveSpaceBetween = computed(() => {
  // 单项占满视口时不露出相邻页间隙；卡片、自动尺寸和多项显示仍保留配置间距。
  if (!usesIntrinsicSlideSize.value && effectiveSlidesPerView.value === 1) return 0;
  const value = responsiveProps.value.spaceBetween ?? props.spaceBetween;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
});
/** 分页指示小点是否允许点击 */
const isIndicatorClickable = computed(() => props.pagination?.clickable !== false);
/** 是否应该在视口中绘制分页指示器组件 */
const showIndicators = computed(
  () =>
    props.pagination !== null &&
    props.pagination?.display !== "never" &&
    effectiveIndicatorPosition.value !== "none" &&
    slideCount.value > 1,
);
/** 是否需要激活并输出上一张/下一张切换控制按钮 */
const showArrows = computed(() => effectiveArrow.value !== "never" && slideCount.value > 1);
/** 是否配置并准许展示缩略图导航面板 */
const showThumbs = computed(() => !!props.thumbs && slideCount.value >= 1);
/** 缩略图面板的物理就绪判定（确保主图区域已在客户端成功测量并渲染） */
const isThumbsReady = computed(() => {
  if (!showThumbs.value) return false;
  /** 只要主图区域的宽或高任一维度已测量到，即视为就绪；
   *  避免 thumbsPosition 在 left/bottom 之间切换时，
   *  因判断维度从 width 变为 height（或反之）导致短暂为 false，
   *  从而引起缩略图面板被 v-if 移除再重建的闪烁问题 */
  return mainRootSize.value.width > 0 || mainRootSize.value.height > 0;
});
const thumbsPosition = computed<CarouselThumbsPosition>(() => {
  const t = unref(props.thumbs);
  if (!t) return "bottom";
  return unref(t.position) ?? "bottom";
});
/** 联动缩略图面板箭头的显隐交互形式 */
const thumbsArrow = computed<CarouselArrowMode>(() => unref(props.thumbs?.arrow) ?? "never");
/** 缩略图栏本身是否开启循环无尽轮转 */
const thumbsLoop = computed(() => unref(props.thumbs?.loop) ?? false);
/** 缩略图当前是否属于侧边纵向摆放模式 */
const isThumbsVertical = computed(
  () => thumbsPosition.value === "left" || thumbsPosition.value === "right",
);
/** 是否在缩略图栏上显式绘制小箭头操作按钮 */
const showThumbArrows = computed(
  () => showThumbs.value && thumbsArrow.value !== "never" && slideCount.value > 1,
);
/** 缩略图是否在视觉主图之前展示（如放置在 top 或 left） */
const isThumbsBeforeMain = computed(
  () => thumbsPosition.value === "top" || thumbsPosition.value === "left",
);

/** 分页指示器类型是否属于数字分式 */
const isFractionPagination = computed(() => props.pagination?.type === "fraction");
/** 进度按当前真实页 / 总页数计算，与自动播放倒计时无关。 */
const isProgressPagination = computed(() => props.pagination?.type === "progress");

/** 动态指示器浮层容器样式，支持用户配置偏移量 */
const indicatorWrapperStyle = computed(() => {
  if (isProgressPagination.value) return {};
  const offset = props.indicatorOffset;

  if (isVertical.value) {
    if (effectiveIndicatorPosition.value === "inside") {
      return { right: `${offset}px` };
    }
    if (effectiveIndicatorPosition.value === "outside") {
      return { marginLeft: `${offset}px` };
    }
    return {};
  }

  if (effectiveIndicatorPosition.value === "inside") {
    return { bottom: `${offset}px` };
  }

  if (effectiveIndicatorPosition.value === "outside") {
    return { marginTop: `${offset}px` };
  }

  return {};
});

/** 自动播放间隔沿用 800ms 下限，对非有限值回退到默认值。 */
const autoplayDelay = computed(() => {
  if (!props.autoplay) return 0;
  const delay = typeof props.autoplay === "object" ? props.autoplay.delay ?? 3000 : 3000;
  return Number.isFinite(delay) ? Math.max(800, delay) : 3000;
});
const autoplayOptions = computed(() => typeof props.autoplay === "object" ? props.autoplay : {});
const shouldPauseAutoplay = computed(() =>
  isPaused.value || isPageHidden.value || isDragging.value ||
  (isHovering.value && autoplayOptions.value.pauseOnHover !== false) ||
  (isFocused.value && autoplayOptions.value.pauseOnFocus !== false),
);

/** 主根容器的动态样式，包含自动高度的平滑缓动渐变效果 */
const rootStyle = computed(() => {
  const isAuto = effectiveHeight.value === "auto";
  return {
    height: isAuto ? (currentSlideHeight.value ? `${currentSlideHeight.value}px` : "auto") : effectiveHeight.value,
  };
});

/** 固定高度接管时立即结束自动高度动画，避免旧动画继续覆盖外部配置。 */
watch(effectiveHeight, () => {
  heightGeneration++;
  stopMotion(mainRootRef.value);
}, { flush: 'sync' });

/** 视口容器的核心滚动样式控制 */
const viewportStyle = computed<CSSProperties>(() => ({
  height: effectiveHeight.value === "auto" ? "auto" : "100%",
  // 程序转场也暂停吸附，避免克隆区等价平移时被浏览器强行吸附到整张。
  scrollSnapType: isDragging.value || isLoopTransitioning.value ? "none" : isVertical.value ? "y mandatory" : "x mandatory",
  scrollBehavior: "auto",
}));

/** 轨道容器的核心样式 */
const trackStyle = computed(() => ({
  gap: `${effectiveSpaceBetween.value}px`,
  height: effectiveHeight.value === "auto" ? "auto" : "100%",
}));

/** 自定义每屏多图展示下，依据间距和显示张数计算出的每张幻灯片的主轴伸缩尺寸样式 */
const slideSizeStyle = computed(() => {
  if (usesIntrinsicSlideSize.value) {
    return {};
  }

  if (viewportMainSize.value <= 0) {
    return {};
  }

  const visibleCount = Math.max(1, Number(effectiveSlidesPerView.value));
  const mainSize =
    (viewportMainSize.value - (visibleCount - 1) * effectiveSpaceBetween.value) / visibleCount;
  const safeSize = `${Math.max(mainSize, 0)}px`;

  return isVertical.value
    ? {
      flexBasis: safeSize,
      minHeight: safeSize,
    }
    : {
      flexBasis: safeSize,
    };
});

/** 所有样式键统一合并，状态交由配置变体处理，保留既有 ui 覆盖优先级。 */
interface StyleOptions { class?: ClassValue; active?: boolean }
const ui = computed(() => {
  const styles = b({
    direction: effectiveDirection.value, type: effectiveType.value, arrow: effectiveArrow.value,
    indicatorPosition: effectiveIndicatorPosition.value, motionBlur: effectiveMotionBlur.value,
    color: props.color, indicatorType: props.pagination?.type || "line",
    indicatorBackground: props.pagination?.indicatorBackground ?? true,
    indicatorDisplay: props.pagination?.display ?? "always",
    thumbsPosition: thumbsPosition.value, thumbsArrow: thumbsArrow.value,
    autoHeight: effectiveHeight.value === "auto", autoSize: effectiveAutoSize.value,
    grabCursor: effectiveGrabCursor.value, dragging: isDragging.value, thumbsVertical: isThumbsVertical.value,
  });
  const result = {} as Record<CarouselSlot, (options?: StyleOptions) => string>;
  for (const key of Object.keys(theme.slots) as CarouselSlot[]) {
    result[key] = (options = {}) => {
      const classes: ClassValue[] = [options.class, props.ui[key]];
      if (options.active !== undefined) {
        if (key === "slide" || key === "thumb") {
          const stateKey = `${key}${options.active ? "Active" : "Inactive"}` as CarouselSlot;
          classes.push(styles[stateKey]({ class: cn(props.ui[stateKey]) }));
        } else if (key === "thumbPreview") {
          classes.push(options.active ? "scale-100" : "scale-[0.96]");
        }
      }
      return styles[key]({ class: cn(classes) });
    };
  }
  return result;
});

/** 内外分页复用同一渲染逻辑，分数分页同样接受 ui.indicators 覆盖。 */
// eslint-disable-next-line vue/one-component-per-file -- 内外分页共用内部渲染器，避免公开额外组件。
const CarouselIndicators = defineComponent({
  name: "CarouselIndicators",
  setup: () => () => {
    if (isProgressPagination.value) {
      return h("div", { class: ui.value.indicators() }, [h(RebornProgress, {
        percent: slideCount.value ? (currentIndex.value + 1) / slideCount.value * 100 : 0,
        showText: false,
        ariaLabel: "轮播页数进度",
        format: () => `${currentIndex.value + 1} / ${slideCount.value}`,
        ui: { root: ui.value.progress(), step: ui.value.progressTrack(), fill: ui.value.progressFill() },
      })]);
    }
    const children = isFractionPagination.value
      ? [h("span", { class: ui.value.indicatorCurrent() }, currentIndex.value + 1), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: ui.value.indicatorTotal() }, slideCount.value)]
      : Array.from({ length: slideCount.value }, (_, index) => h("button", {
          type: "button", "aria-label": `切换到第 ${index + 1} 项`,
          "aria-current": index === currentIndex.value ? "true" : undefined,
          disabled: !isIndicatorClickable.value,
          class: ui.value.indicator({ class: index === currentIndex.value ? ui.value.indicatorActive() : ui.value.indicatorInactive() }),
          onMouseenter: () => handleIndicatorEnter(index), onClick: () => handleIndicatorClick(index),
        }, props.pagination?.type === "button" ? index + 1 : undefined));
    return h("div", { class: ui.value.indicators() }, children);
  },
});

/**
 * 动态高度自适应计算：
 * 在自动高度配置下，提取当前幻灯片真实的 scrollHeight 并更新，
 * Motion 从当前可见高度续接，连续切页不会回退到上一次目标高度。
 */
function updateAutoHeight() {
  if (effectiveHeight.value !== "auto" || !import.meta.client) {
    return;
  }

  const renderIdx = realToRenderIndex(currentIndex.value);
  const slide = slideRefs.value[renderIdx];

  if (slide) {
    // 读取内部首个子元素的实际滚动高度
    const slideInner = slide.firstElementChild as HTMLElement;
    if (slideInner) {
      const nextHeight = slideInner.scrollHeight;
      if (nextHeight === currentSlideHeight.value) return;
      const root = mainRootRef.value;
      const previousHeight = root?.getBoundingClientRect().height ?? 0;
      const generation = ++heightGeneration;
      stopMotion(root);
      currentSlideHeight.value = nextHeight;
      if (root && previousHeight > 0 && nextHeight > 0) nextTick(() => {
        if (isDisposed || generation !== heightGeneration || effectiveHeight.value !== 'auto') return;
        runMotion(root, { height: [`${previousHeight}px`, `${nextHeight}px`] }, motionPresets.slow);
      });
    }
  }
}

/** 缩略图宿主框的 Class 集合 */
const thumbsShellClass = computed(() => {
  if (!showThumbs.value) {
    return "w-full";
  }

  return ui.value.thumbsShell({
    class: cn(
      isThumbsVertical.value && "items-start",
    ),
  });
});

/** 主播放区的 CSS 布局类名 */
const mainPaneClass = computed(() =>
  cn("min-w-0", showThumbs.value && isThumbsVertical.value ? "flex-1" : "w-full"),
);

/** 联动缩略图面板背景盒的 CSS 类名 */
const thumbsPanelClass = computed(() =>
  ui.value.thumbsPanel({
    class: cn(
      isThumbsBeforeMain.value ? "order-first" : "order-last",
      /** 布局方向和尺寸由 tv variant 的 thumbsPosition 变体控制，
       *  此处仅补充 flex-col 以确保面板内部纵向排列缩略图 */
      "flex-col",
    ),
  }),
);

/** 联动缩略图面板的动态自适应 CSS 高度/宽度样式 */
const thumbsPanelStyle = computed(() => {
  if (!showThumbs.value) {
    return undefined;
  }

  if (isThumbsVertical.value) {
    // 侧边定位：缩略图容器高度必须精确锁定为主轮播图测量的实时高度
    const h = mainRootSize.value.height;
    return h > 0 ? { height: `${h}px` } : { minHeight: '100px' };
  }

  // 底部/顶部定位：缩略图容器宽度必须精确锁定为主轮播图测量的实时宽度
  const w = mainRootSize.value.width;
  return w > 0 ? { width: `${w}px` } : { minWidth: '100px' };
});

/** 缩略图可视窗口的可滚动区域 CSS 控制类名 */
const thumbsViewportClass = computed(() =>
  ui.value.thumbsViewport({
    class: cn(
      isThumbsVertical.value ? "flex-1 overflow-y-auto overflow-x-hidden" : "overflow-x-auto overflow-y-hidden",
      "overflow-hidden",
    ),
  }),
);

/** 缩略图内部横向/纵向排布轨道的 CSS 类名 */
const thumbsTrackClass = computed(() =>
  ui.value.thumbsTrack({
    class: cn(
      isThumbsVertical.value ? "flex-col w-full" : "flex-row",
    ),
  }),
);

/** 缩略图栏操作箭头按键组的 CSS 类名 */
const thumbsArrowGroupClass = computed(() =>
  ui.value.thumbsArrowGroup(),
);

/** 是否可以跳转到上一页 */
const canGoPrev = computed(() => props.loop || currentIndex.value > 0);
/** 是否可以跳转到下一页 */
const canGoNext = computed(() => {
  if (props.loop) {
    return true;
  }

  // 非 loop 模式：检查是否已经显示了最后一项
  const perView = effectiveSlidesPerView.value === "auto" ? 1 : Number(effectiveSlidesPerView.value);
  const lastVisibleIndex = currentIndex.value + perView - 1;

  // 如果最后一项已经显示，则不能继续切换
  return lastVisibleIndex < slideCount.value - 1;
});
const canGoPrevThumb = computed(() => thumbsLoop.value || currentIndex.value > 0);
const canGoNextThumb = computed(() => thumbsLoop.value || currentIndex.value < slideCount.value - 1);

/**
 * 索引安全约束：
 * 保证计算出来的活动项索引严格落在 [0, slideCount - 1] 的真实合法有效范围内。
 * 在无限循环模式下对超出区域取模运算以保持平顺。
 */
function clampIndex(index: number, count = slideCount.value) {
  index = Number.isFinite(index) ? Math.trunc(index) : 0;
  if (count <= 0) {
    return 0;
  }

  if (props.loop) {
    return ((index % count) + count) % count;
  }

  return Math.min(Math.max(index, 0), count - 1);
}

/**
 * 更新响应式参考宽度（当前浏览器真实的 window 宽度）
 */
function updateViewportWidth() {
  if (!import.meta.client) {
    return;
  }

  viewportWidth.value = window.innerWidth;
}

/**
 * 更新滚动轴视口物理尺寸（水平模式为 width，垂直模式为 height）
 */
function updateViewportMainSize() {
  const viewport = viewportRef.value;

  if (!viewport) {
    viewportMainSize.value = 0;
    return;
  }

  viewportMainSize.value = isVertical.value ? viewport.offsetHeight : viewport.offsetWidth;
}

/**
 * 幻灯片渲染回调句柄，用于提取并缓存所有真实的幻灯片原生 DOM 对象引用
 */
function setSlideRef(el: Element | ComponentPublicInstance | null, index: number) {
  if (!el) {
    return;
  }

  const element = ("$el" in el ? el.$el : el) as HTMLElement;
  slideRefs.value[index] = element;
}

/**
 * 缩略图渲染回调句柄，用于提取并缓存所有联动缩略图原生 DOM 对象引用
 */
function setThumbRef(el: Element | ComponentPublicInstance | null, index: number) {
  if (!el) {
    return;
  }

  const element = ("$el" in el ? el.$el : el) as HTMLElement;
  thumbRefs.value[index] = element;
}

/**
 * 重新规划并安全批量触发一次轨道排版布局计算。
 * 运用 RequestAnimationFrame 对布局回调防反洗和防抖，
 * 规避因频繁高度测量造成的重绘排版损耗。
 */
function scheduleLayoutUpdate(force = false) {
  if (isDisposed || !import.meta.client) return;
  if (!force && (isJumping.value || isApplyingIndex || isLoopTransitioning.value || isDragging.value)) {
    updateViewportMainSize();
    return;
  }
  if (force) abortLoopTransition();
  // 方向切换会先重置浏览器滚动轴。布局完成前屏蔽这些旧位置事件，避免误同步索引。
  isUpdatingLayout = true;
  const generation = ++layoutGeneration;
  if (layoutFrame) {
    cancelAnimationFrame(layoutFrame);
  }

  layoutFrame = scheduleFrame(() => {
    layoutFrame = 0;
    updateViewportMainSize();
    nextTick(() => {
      if (isDisposed || generation !== layoutGeneration) return;
      scrollToRenderIndex(realToRenderIndex(currentIndex.value), "instant");
      updateAutoHeight();
      scheduleFrame(() => {
        if (generation === layoutGeneration) isUpdatingLayout = false;
      });
    });
  });
}

/**
 * 定位计算核心算法：
 * 计算渲染列表中指定 renderIdx 幻灯片在当前视口下最理想的滚动偏移值（支持活动项居中对齐）。
 * @param renderIdx 目标项在渲染列表中的索引位置（包含克隆部分）
 */
function getSlideTarget(renderIdx: number) {
  const viewport = viewportRef.value;
  const slide = slideRefs.value[renderIdx];

  if (!viewport || !slide) {
    return 0;
  }

  const viewportSize = isVertical.value ? viewport.clientHeight : viewport.clientWidth;
  const slideSize = isVertical.value ? slide.offsetHeight : slide.offsetWidth;
  const slideStart = isVertical.value ? slide.offsetTop : slide.offsetLeft;
  const maxScroll = isVertical.value
    ? Math.max(0, viewport.scrollHeight - viewport.clientHeight)
    : Math.max(0, viewport.scrollWidth - viewport.clientWidth);

  // 核心：若 centeredSlides 开启，则将活动项放置在视口最中央；否则采用标准的左对齐/上对齐
  const rawTarget = effectiveCenteredSlides.value
    ? slideStart - (viewportSize - slideSize) / 2
    : slideStart;

  return Math.min(Math.max(rawTarget, 0), maxScroll);
}

/**
 * 更新活动索引，并按需触发 change 事件和 v-model 更新
 */
function setActiveIndex(
  index: number,
  options: {
    emitChange?: boolean;
    syncModel?: boolean;
  } = {},
) {
  const nextIndex = clampIndex(index);
  if (options.syncModel && modelValue.value !== nextIndex) modelValue.value = nextIndex;

  if (nextIndex !== currentIndex.value) {
    currentIndex.value = nextIndex;
    if (options.emitChange ?? false) {
      emit("change", nextIndex);
    }
  }

  return nextIndex;
}

/**
 * 从滚动位置同步当前索引（非 loop 模式使用）。
 */
function syncCurrentFromScroll(emitChange = false) {
  if (isJumping.value) {
    return;
  }

  const viewport = viewportRef.value;

  if (!viewport || slideCount.value === 0) {
    return;
  }

  const currentOffset = isVertical.value ? viewport.scrollTop : viewport.scrollLeft;
  let nearestIndex = 0;
  let nearestRenderIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  if (props.loop) {
    // loop 模式：在渲染列表中找最近的 slide，同时记录渲染索引用于吸附
    renderSlides.value.forEach((item, renderIdx) => {
      const target = getSlideTarget(renderIdx);
      const distance = Math.abs(target - currentOffset);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = item.realIndex;
        nearestRenderIndex = renderIdx;
      }
    });
  } else {
    // 非 loop 模式：直接在 slideRefs 中查找
    slideRefs.value.forEach((_, index) => {
      const distance = Math.abs(getSlideTarget(index) - currentOffset);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
        nearestRenderIndex = index;
      }
    });
  }

  currentRenderIndex.value = nearestRenderIndex;

  if (nearestIndex !== currentIndex.value) {
    setActiveIndex(nearestIndex, {
      emitChange,
      syncModel: true,
    });
  }
}

/**
 * 滚动到渲染列表中的指定位置。
 */
function scrollToRenderIndex(renderIdx: number, behavior: ScrollBehavior = "smooth") {
  const viewport = viewportRef.value;

  if (!viewport || renderSlides.value.length === 0) {
    return;
  }

  const target = getSlideTarget(renderIdx);

  viewport.scrollTo({
    left: isVertical.value ? 0 : target,
    top: isVertical.value ? target : 0,
    behavior,
  });
}

/**
 * 静默跳转到真实位置（无动画），用于 loop 模式的首尾衔接。
 */
function jumpToRealPosition(realIndex: number) {
  const viewport = viewportRef.value;

  if (!viewport) {
    return;
  }

  isJumping.value = true;
  // 记录本次跳转所属的转场代次：若期间被手动连点中止（abortLoopTransition 会自增该代次），
  // 则本次挂起的解锁回调必须失效，避免误把「新转场」的锁清掉
  const jumpGeneration = loopArrowGeneration;
  const renderIdx = realToRenderIndex(realIndex);
  const target = getSlideTarget(renderIdx);

  // 使用 "instant" 而非 "auto"：前者强制瞬时，不受 CSS scroll-behavior: smooth 影响
  viewport.scrollTo({
    left: isVertical.value ? 0 : target,
    top: isVertical.value ? target : 0,
    behavior: "instant",
  });

  // 同步渲染索引到真实位置，防止下次拖拽使用过期的克隆索引
  currentRenderIndex.value = renderIdx;

  // 等待浏览器完成滚动后解除锁定
  scheduleFrame(() => {
    scheduleFrame(() => {
      // 期间发生了中止或新转场，交由新流程管理状态，不再回写，避免误清锁
      if (jumpGeneration !== loopArrowGeneration) {
        return;
      }
      isJumping.value = false;
      if (props.loop) {
        isLoopTransitioning.value = false;
      }
    });
  });
}

function applyIndex(
  index: number,
  options: {
    behavior?: ScrollBehavior;
    emitChange?: boolean;
    syncModel?: boolean;
  } = {},
) {
  if (isDisposed) return;
  abortLoopTransition();
  const generation = ++applyGeneration;
  isApplyingIndex = true;
  const nextIndex = setActiveIndex(index, {
    emitChange: options.emitChange,
    syncModel: options.syncModel,
  });

  nextTick(() => {
    if (isDisposed || generation !== applyGeneration) return;
    const renderIdx = realToRenderIndex(nextIndex);
    scrollToRenderIndex(renderIdx, options.behavior ?? "smooth");

    // 针对平滑滚动，在滚动结束或一定时间后解除锁定
    if ((options.behavior ?? "smooth") === "smooth") {
      waitForScrollEnd(() => {
        if (generation === applyGeneration) isApplyingIndex = false;
      });
    } else {
      isApplyingIndex = false;
    }
  });
}

function goTo(index: number) {
  const target = clampIndex(index);
  if (props.loop) loopGoTo(target);
  else applyIndex(target, { behavior: "smooth", emitChange: true, syncModel: true });
  // 手动跳转重置自动播放计时
  startAutoplay();
}

function navigateToSlide(index: number, allowWrap = false) {
  if (slideCount.value <= 1) {
    return;
  }

  if (!props.loop && isNavigationLocked()) {
    return;
  }

  const targetIndex = allowWrap
    ? ((index % slideCount.value) + slideCount.value) % slideCount.value
    : Math.min(Math.max(index, 0), slideCount.value - 1);

  if (targetIndex === currentIndex.value) {
    return;
  }

  if (props.loop) {
    loopGoTo(targetIndex);
  } else {
    goTo(targetIndex);
  }
}

/** 双向步进共享锁与首尾接缝处理，手动连点中止旧代次后续接。 */
function navigateByStep(step: 1 | -1, isManual = true) {
  if (slideCount.value <= 1 || isDisposed) return;
  if (!props.loop && (step === 1 ? !canGoNext.value : !canGoPrev.value)) return;
  if (!isLoopTransitioning.value && (isJumping.value || isApplyingIndex)) return;
  if (!props.loop) {
    goTo(currentIndex.value + step);
    return;
  }
  loopGoTo(clampIndex(currentIndex.value + step), { step, isManual });
}
function next(isManual = true) { navigateByStep(1, isManual); }
function prev() { navigateByStep(-1); }

/**
 * loop 模式下的 goTo（指示器点击/悬停等场景）。
 * - 取最短路径：在直接路径与通过克隆区的反向路径之间取绝对值更小的一侧，
 *   避免诸如"从尾页点回首页要反向滚多张"的体验问题。
 * - 转场进行中：保留渲染目标所在的克隆区，平滑续接新指令，不退回旧起点。
 */
function loopGoTo(targetReal: number, options: {
  step?: 1 | -1;
  isManual?: boolean;
  emitChange?: boolean;
  syncModel?: boolean;
} = {}) {
  targetReal = clampIndex(targetReal);
  if (isDisposed || slideCount.value <= 1 || targetReal === currentIndex.value) return;

  const originIndex = currentIndex.value;
  const originRenderIdx = loopTargetRenderIndex ?? realToRenderIndex(originIndex);
  const total = slideCount.value;
  const directDiff = targetReal - originIndex;
  // 通过克隆区绕行的差值（与直接路径方向相反）
  const altDiff = directDiff > 0 ? directDiff - total : directDiff + total;
  // 选择可达的最短路径；箭头保留指定方向，不因首尾索引回绕而反转。
  const alternateRenderIdx = originRenderIdx + altDiff;
  const canUseAlternate = alternateRenderIdx >= 0 && alternateRenderIdx < renderSlides.value.length;
  // 单步接缝即使位于缓冲末端也保持相邻方向，先平移周期，而不是倒滚整个真实区。
  const useAlternate = (canUseAlternate || Math.abs(altDiff) === 1) && Math.abs(altDiff) < Math.abs(directDiff);
  const diff = options.step ?? (useAlternate ? altDiff : directDiff);
  let targetRenderIdx = originRenderIdx + diff;

  abortLoopTransition();
  if (options.isManual !== false) startAutoplay();
  isLoopTransitioning.value = true;
  loopTargetRenderIndex = targetRenderIdx;
  const generation = ++loopGoToGeneration;
  setActiveIndex(targetReal, { emitChange: options.emitChange ?? true, syncModel: options.syncModel ?? true });

  function runTransition() {
    if (isDisposed || generation !== loopGoToGeneration || !viewportRef.value) return;
    const viewport = viewportRef.value;
    const maxScroll = isVertical.value ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth;
    const first = slideRefs.value[cloneCount.value];
    const next = slideRefs.value[cloneCount.value + total];
    // 同一内容在真实区和后置克隆区的原始起点差才是完整周期，不能使用裁剪过的滚动目标。
    const period = first && next ? (isVertical.value ? next.offsetTop - first.offsetTop : next.offsetLeft - first.offsetLeft) : 0;

    while (true) {
      const slide = slideRefs.value[targetRenderIdx];
      const viewportSize = isVertical.value ? viewport.clientHeight : viewport.clientWidth;
      const rawTarget = slide
        ? (isVertical.value ? slide.offsetTop : slide.offsetLeft) - (effectiveCenteredSlides.value ? (viewportSize - (isVertical.value ? slide.offsetHeight : slide.offsetWidth)) / 2 : 0)
        : targetRenderIdx < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
      const shift = rawTarget < 0 ? 1 : rawTarget > maxScroll ? -1 : 0;
      if (shift === 0) break;
      if (period <= 0 || maxScroll < period) {
        // 内容不足以容纳一个周期时没有滚动空间，只同步真实区，避免无限重试。
        loopTargetRenderIndex = null;
        jumpToRealPosition(targetReal);
        return;
      }
      const offset = (isVertical.value ? viewport.scrollTop : viewport.scrollLeft) + shift * period;
      if (offset < 0 || offset > maxScroll) {
        // 动画可能远落后于逻辑索引；先沿原方向抵达安全边界，不能让浏览器裁剪越界平移。
        const anchor = shift < 0 ? renderSlides.value.length - 1 : 0;
        scrollToRenderIndex(anchor, "smooth");
        waitForScrollEnd(runTransition, anchor);
        return;
      }
      viewport.scrollTo({ left: isVertical.value ? 0 : offset, top: isVertical.value ? offset : 0, behavior: "instant" });
      targetRenderIdx += shift * total;
      // 仅在物理平移已经执行后更新坐标系；同帧新指令不会丢失未执行的周期平移。
      loopTargetRenderIndex = targetRenderIdx;
    }
    scrollToRenderIndex(targetRenderIdx, "smooth");

    waitForScrollEnd(() => {
      if (generation !== loopGoToGeneration) {
        return;
      }
      loopTargetRenderIndex = null;
      jumpToRealPosition(targetReal);
    }, targetRenderIdx);
  }
  nextTick(runTransition);
}

/** 当前未触发的 waitForScrollEnd 等待句柄，用于在中止转场时清理 */
let pendingScrollEndCleanup: (() => void) | null = null;

/**
 * 等待滚动结束后执行回调。
 * 使用 scrollend 事件（现代浏览器支持），降级为 setTimeout。
 * 同时记录清理函数，避免被 abortLoopTransition 中断后回调仍然触发，
 * 否则会导致后续手动切换被误重置。
 */
function waitForScrollEnd(callback: () => void, targetRenderIdx?: number) {
  // 进入新一轮等待前，先清掉前一次尚未触发的等待，避免叠加触发
  pendingScrollEndCleanup?.();
  pendingScrollEndCleanup = null;

  const viewport = viewportRef.value;

  if (!viewport) {
    callback();
    return;
  }

  const targetOffset = targetRenderIdx === undefined ? undefined : getSlideTarget(targetRenderIdx);
  // 克隆区重定位可能留下旧 scrollend；只允许已抵达本次目标的事件完成循环转场。
  function hasReachedTarget() {
    return targetOffset === undefined || Math.abs((isVertical.value ? viewport!.scrollTop : viewport!.scrollLeft) - targetOffset) <= 1;
  }
  // 根因：目标偏移不变时浏览器不派发 scrollend，仍保留有界超时兜底。
  let timeoutId: ReturnType<typeof setTimeout>;
  let remainingChecks = 12;
  function cleanup() {
    clearTimeout(timeoutId);
    viewport?.removeEventListener("scrollend", handleEnd);
  };
  function finish() {
    cleanup();
    pendingScrollEndCleanup = null;
    if (!isDisposed) callback();
  };
  function handleEnd() {
    if (hasReachedTarget()) finish();
  }
  function checkTimeout() {
    // 较长动画不能在固定 600ms 时被截断；最多续查约 1.4s，异常时也不会永久锁定。
    if (hasReachedTarget() || remainingChecks-- <= 0) finish();
    else timeoutId = setTimeout(checkTimeout, 120);
  }
  timeoutId = setTimeout(checkTimeout, 600);
  viewport.addEventListener("scrollend", handleEnd);
  pendingScrollEndCleanup = cleanup;
}

/**
 * 中止当前正在进行的 loop 转场。
 * 仅由"手动切换在转场进行中再次触发"的场景调用：
 * 取消挂起的 scrollend 等待并解锁状态机，让新一次切换能立即开始；
 * 当前浏览器原生 smooth scroll 会被随后的 scrollTo 平滑接续，无需手动归位。
 */
function abortLoopTransition() {
  loopArrowGeneration++;
  loopGoToGeneration++;
  applyGeneration++;
  pendingScrollEndCleanup?.();
  pendingScrollEndCleanup = null;
  isLoopTransitioning.value = false;
  isJumping.value = false;
  isApplyingIndex = false;
  loopTargetRenderIndex = null;
}

/**
 * 拖拽开始时统一中止未完成的 loop 转场，避免遗留 scrollend 回调继续改写索引
 */
function handleDragStart() {
  isDragging.value = true;
  abortLoopTransition();
}

/** 鼠标拖动使用指针捕获；触屏不拦截浏览器原生滚动。 */
let dragPointerId: number | null = null;
let dragStartPosition = 0;
let dragStartOffset = 0;
let hasDragged = false;
function handlePointerDown(event: PointerEvent) {
  hasDragged = false;
  if (event.pointerType !== "mouse" || event.button !== 0 || !(props.draggable ?? effectiveGrabCursor.value)) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest("button, a, input, textarea, select, [contenteditable]:not([contenteditable=false])")) return;
  handleDragStart();
  dragPointerId = event.pointerId;
  dragStartPosition = isVertical.value ? event.clientY : event.clientX;
  dragStartOffset = isVertical.value ? viewportRef.value?.scrollTop ?? 0 : viewportRef.value?.scrollLeft ?? 0;
  hasDragged = false;
  viewportRef.value?.setPointerCapture(event.pointerId);
}
function handlePointerMove(event: PointerEvent) {
  const viewport = viewportRef.value;
  if (dragPointerId !== event.pointerId || !viewport) return;
  const distance = (isVertical.value ? event.clientY : event.clientX) - dragStartPosition;
  if (Math.abs(distance) > 4) hasDragged = true;
  if (!hasDragged) return;
  event.preventDefault();
  if (isVertical.value) viewport.scrollTop = dragStartOffset - distance;
  else viewport.scrollLeft = dragStartOffset - distance;
}
function handlePointerUp(event: PointerEvent) {
  if (dragPointerId !== event.pointerId) return;
  dragPointerId = null;
  viewportRef.value?.releasePointerCapture(event.pointerId);
  isDragging.value = false;
  if (hasDragged) {
    syncCurrentFromScroll(true);
    const renderIndex = currentRenderIndex.value;
    const realIndex = currentIndex.value;
    // 松手后只吸附一次，循环归位必须等待本次目标，不能被拖拽遗留的 scrollend 提前完成。
    if (props.loop) {
      isLoopTransitioning.value = true;
      loopTargetRenderIndex = renderIndex;
    }
    scrollToRenderIndex(renderIndex);
    if (props.loop) waitForScrollEnd(() => {
      loopTargetRenderIndex = null;
      jumpToRealPosition(realIndex);
    }, renderIndex);
  }
}
/** 触屏停在边界时松手不会再触发滚动，主动同步一次；后续惯性与吸附仍由浏览器处理。 */
function handleTouchEnd() {
  isDragging.value = false;
  // 外部切页可能仍在转场，不能用中途位置覆盖其目标索引。
  if (!isNavigationLocked()) syncCurrentFromScroll(true);
}
function handleDragClick(event: MouseEvent) {
  if (!hasDragged) return;
  event.preventDefault();
  event.stopPropagation();
  hasDragged = false;
}

function handlePointerEnter(event: PointerEvent) {
  // 仅真实鼠标悬停才暂停自动播放。
  // 触屏轻点（tap）会派发合成的 mouseenter 且触屏上永远不会再来 mouseleave，
  // 若直接监听 mouse 事件，点一下箭头 isHovering 就永久为 true，自动播放从此停摆。
  // pointer 事件带 pointerType，可精确区分：mouse=悬停暂停，touch/pen=忽略。
  if (event.pointerType === "mouse") isHovering.value = true;
}

function handlePointerLeave(event: PointerEvent) {
  if (event.pointerType === "mouse") isHovering.value = false;
}

function handleFocusIn(event: FocusEvent) {
  // 仅「键盘可见焦点」（:focus-visible）才视为聚焦暂停自动播放。
  // 鼠标点击箭头/指示点同样会给按钮设置焦点，且点击后焦点会一直留在按钮上不自动移出；
  // 若不区分来源，点一次切换按钮 isFocused 就永久为 true，自动播放从此停摆。
  // 键盘 Tab 进入时 :focus-visible 为 true，保留无障碍场景的暂停行为。
  const target = event.target as HTMLElement | null;
  try {
    isFocused.value = !!target?.matches(":focus-visible");
  } catch {
    // 极旧浏览器不支持 :focus-visible 选择器时回退为原有行为（聚焦即暂停）
    isFocused.value = true;
  }
}

function handleFocusOut(event: FocusEvent) {
  const nextTarget = event.relatedTarget as Node | null;

  if (nextTarget && carouselRootRef.value?.contains(nextTarget)) {
    return;
  }

  isFocused.value = false;
}

/**
 * 处理自动播放的主步进逻辑
 */
function handleAutoplayStep() {
  if (slideCount.value <= 1 || autoplayDelay.value <= 0) {
    return;
  }

  if (shouldPauseAutoplay.value || isNavigationLocked()) {
    return;
  }

  if (!props.loop && !canGoNext.value) {
    stopAutoplay();
    return;
  }

  next(false);
}

/**
 * 停止自动播放计时器
 */
function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  isPlaying.value = false;
}

/**
 * 启动自动播放计时器
 */
function startAutoplay() {
  stopAutoplay();

  if (!import.meta.client || isDisposed || autoplayDelay.value <= 0 || slideCount.value <= 1 || shouldPauseAutoplay.value) {
    return;
  }

  autoplayTimer = setInterval(handleAutoplayStep, autoplayDelay.value);
  isPlaying.value = true;
}
/** 手动暂停保持生效，导航和属性更新不会自动恢复。 */
function pause() { isPaused.value = true; stopAutoplay(); }
/** 恢复自动播放；仍遵循悬停、焦点及页面可见性约束。 */
function resume() { isPaused.value = false; startAutoplay(); }
function handleVisibilityChange() {
  isPageHidden.value = document.hidden;
  startAutoplay();
}

/**
 * 处理滚动事件触发的索引同步
 */
function handleScroll() {
  if (isDragging.value || isNavigationLocked()) {
    return;
  }

  if (scrollFrame) {
    cancelAnimationFrame(scrollFrame);
  }

  scrollFrame = scheduleFrame(() => {
    if (isDragging.value || isNavigationLocked()) return;
    syncCurrentFromScroll(true);

    // 仅在手势结束后处理循环边界，拖拽期间由指针独占滚动位置。
    if (props.loop && !isJumping.value) {
      const viewport = viewportRef.value;
      if (viewport) {
        const scrollPos = isVertical.value ? viewport.scrollTop : viewport.scrollLeft;
        const firstTarget = getSlideTarget(1);
        const lastTarget = getSlideTarget(renderSlides.value.length - 2);

        if (scrollPos < firstTarget || scrollPos > lastTarget) {
          jumpToRealPosition(currentIndex.value);
        }
      }
    }
  });
}

/**
 * 处理滚动结束 (原生事件) — loop 模式下检测是否停在了克隆位置，若是则静默跳转到真实位置
 */
function handleScrollEnd() {
  // 根因：按住拖拽时的瞬时滚动也会派发 scrollend；提前归位会与固定拖拽起点反复拉扯。
  if (isDragging.value || isNavigationLocked()) {
    return;
  }

  if (props.loop) {
    syncCurrentFromScroll(true);
    const item = renderSlides.value[currentRenderIndex.value];
    if (item?.isClone) {
      jumpToRealPosition(item.realIndex);
    }
  }
}

/**
 * 处理键盘导航
 */
function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (!props.keyboard || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || target?.closest("input, textarea, select, [contenteditable]:not([contenteditable=false])")) return;
  const prevKeys = isVertical.value ? ["ArrowUp"] : ["ArrowLeft"];
  const nextKeys = isVertical.value ? ["ArrowDown"] : ["ArrowRight"];

  if (prevKeys.includes(event.key)) {
    event.preventDefault();
    prev();
  }

  if (nextKeys.includes(event.key)) {
    event.preventDefault();
    next();
  }

  if (event.key === "Home") {
    event.preventDefault();
    goTo(0);
  }

  if (event.key === "End") {
    event.preventDefault();
    goTo(slideCount.value - 1);
  }
}

/**
 * 指示器悬停事件处理器
 */
function handleIndicatorEnter(index: number) {
  if (props.trigger === "hover" && isIndicatorClickable.value) {
    if (props.loop) {
      loopGoTo(index);
    } else {
      goTo(index);
    }
  }
}

/**
 * 指示器点击事件处理器
 */
function handleIndicatorClick(index: number) {
  if (isIndicatorClickable.value) {
    if (props.loop) {
      loopGoTo(index);
    } else {
      goTo(index);
    }
  }
}

function handleThumbClick(index: number) {
  navigateToSlide(index);
}

function handleThumbKeydown(index: number, event: KeyboardEvent) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  handleThumbClick(index);
}

function prevThumb() {
  navigateToSlide(currentIndex.value - 1, thumbsLoop.value);
}

function nextThumb() {
  navigateToSlide(currentIndex.value + 1, thumbsLoop.value);
}

function scrollThumbIntoView(index: number, behavior: ScrollBehavior = "smooth") {
  const viewport = thumbsViewportRef.value;
  const thumb = thumbRefs.value[index];

  if (!viewport || !thumb) {
    return;
  }

  // 手动计算滚动位置，避免使用 scrollIntoView 导致页面滚动
  if (isThumbsVertical.value) {
    const viewportHeight = viewport.clientHeight;
    const thumbTop = thumb.offsetTop;
    const thumbHeight = thumb.offsetHeight;
    const scrollTop = thumbTop - (viewportHeight - thumbHeight) / 2;

    viewport.scrollTo({
      top: Math.max(0, scrollTop),
      behavior,
    });
  } else {
    const viewportWidth = viewport.clientWidth;
    const thumbLeft = thumb.offsetLeft;
    const thumbWidth = thumb.offsetWidth;
    const scrollLeft = thumbLeft - (viewportWidth - thumbWidth) / 2;

    viewport.scrollTo({
      left: Math.max(0, scrollLeft),
      behavior,
    });
  }
}

// ============================
// 监听器 (Watchers)
// ============================

/** 响应外部 v-model 值的变化 */
watch(
  () => modelValue.value,
  (value) => {
    if (value !== null && value !== currentIndex.value) {
      if (props.loop && viewportRef.value && slideCount.value > 1) {
        // 外部模型复用接缝导航，但不把外部更新再次作为组件事件回写。
        loopGoTo(value, { emitChange: false, syncModel: false, isManual: false });
      } else applyIndex(value, {
        behavior: "smooth",
        emitChange: false,
        syncModel: false,
      });
    }
  },
  { immediate: true },
);

/** 当未通过 v-model 控制时，响应 initialSlide 属性的变化 */
watch(
  () => props.initialSlide,
  (value) => {
    if (modelValue.value === null) {
      applyIndex(value, {
        behavior: "auto",
        emitChange: false,
        syncModel: false,
      });
    }
  },
);

/** 幻灯片内容（数量）变化时，同步 DOM 引用并重新修正滚动位置 */
watch(slideCount, (_count, previousCount) => {
  abortLoopTransition();
  slideRefs.value = slideRefs.value.slice(0, renderSlides.value.length);
  thumbRefs.value = thumbRefs.value.slice(0, slideCount.value);
  nextTick(() => {
    updateViewportMainSize();
    updateAutoHeight();
    applyIndex(currentIndex.value, {
      behavior: "auto",
      emitChange: false,
      syncModel: previousCount > 0 || slideCount.value === 0,
    });
  });
});

watch(
  () => [showThumbs.value, isThumbsReady.value, currentIndex.value, thumbsPosition.value],
  ([show, ready]) => {
    if (!show || !ready) {
      return;
    }

    nextTick(() => {
      scrollThumbIntoView(currentIndex.value, "smooth");
    });
  },
  { immediate: true },
);

/** 监听所有影响布局计算的响应式属性，发生变化时排期更新布局 */
watch(
  [
    effectiveDirection,
    effectiveSlidesPerView,
    effectiveSpaceBetween,
    effectiveHeight,
    effectiveType,
    effectiveCenteredSlides,
    effectiveAutoSize,
    () => props.loop,
  ],
  () => {
    scheduleLayoutUpdate(true);
  },
);

/** 监听缩略图位置变化，重新测量主图区域尺寸并排期布局更新 */
watch(
  thumbsPosition,
  () => {
    nextTick(() => {
      /** 位置切换后主图区域尺寸可能变化（如从底部全宽变为左侧固定宽度），
       *  需要重新测量以正确计算缩略图面板的尺寸约束 */
      if (mainRootRef.value) {
        const { width, height } = mainRootRef.value.getBoundingClientRect();
        mainRootSize.value = { width, height };
      }
      scheduleLayoutUpdate();
    });
  },
);

/** 当前索引变化时，同步更新自动高度 */
watch(
  () => currentIndex.value,
  () => {
    nextTick(() => {
      updateAutoHeight();
    });
  },
);

/** 监听自动播放相关依赖，动态启动或停止计时器 */
watch(
  () => [autoplayDelay.value, slideCount.value, shouldPauseAutoplay.value],
  () => {
    startAutoplay();
  },
  { immediate: true },
);

// ============================
// 生命周期 (Lifecycle Hooks)
// ============================

onMounted(() => {
  handleVisibilityChange();
  document.addEventListener("visibilitychange", handleVisibilityChange);
  /** 初始化基础尺寸数据 */
  updateViewportWidth();
  updateViewportMainSize();

  /** 注册窗口 Resize 监听，使用防抖排期更新 */
  resizeHandler = () => {
    updateViewportWidth();
    scheduleLayoutUpdate();
  };
  window.addEventListener("resize", resizeHandler);

  /** 注册对视口容器的 ResizeObserver，以捕捉复杂布局中的尺寸变动 */
  if (import.meta.client && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      scheduleLayoutUpdate();
    });

    if (viewportRef.value) {
      resizeObserver.observe(viewportRef.value);
    }

    // 监听主图根元素尺寸，同步到缩略图面板
    if (mainRootRef.value) {
      mainRootObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          mainRootSize.value = { width, height };
        }
      });
      mainRootObserver.observe(mainRootRef.value);
    }
  }

  /** 执行组件挂载后的首次对齐和高度同步 */
  const initialIndex = modelValue.value ?? props.initialSlide;
  nextTick(() => {
    nextTick(() => {
      updateViewportMainSize();
      updateAutoHeight();
      applyIndex(initialIndex, {
        behavior: "auto",
        emitChange: false,
        syncModel: false,
      });
    });
  });
});

onBeforeUnmount(() => {
  heightGeneration++;
  stopMotion(mainRootRef.value);
  isDisposed = true;
  abortLoopTransition();
  /** 彻底清理所有异步资源：定时器、动画帧、事件监听器和观察者 */
  stopAutoplay();
  // 清理可能挂起的 scrollend 等待回调，避免组件销毁后仍触发逻辑
  pendingScrollEndCleanup?.();
  pendingScrollEndCleanup = null;
  if (scrollFrame) {
    cancelAnimationFrame(scrollFrame);
  }
  if (layoutFrame) {
    cancelAnimationFrame(layoutFrame);
  }
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
  }
  resizeObserver?.disconnect();
  mainRootObserver?.disconnect();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  pendingFrames.forEach(cancelAnimationFrame);
  pendingFrames.clear();
});

/** 暴露给外部调用的方法 */
defineExpose({
  /** 平滑滚动切换到下一张：loop 下可从末张无缝回到首张，非 loop 已在末张时无操作；触发 change 并重置自动播放计时 */
  next,
  /** 平滑滚动切换到上一张：loop 下可从首张无缝回到末张，非 loop 已在首张时无操作；触发 change 并重置自动播放计时 */
  prev,
  /** goTo(index)：带平滑滚动动画跳转到指定索引（从 0 起，loop 下越界自动取模），同步 v-model、触发 change 并重置自动播放计时 */
  goTo,
  /** 暂停自动播放，直到调用 resume。 */
  pause,
  /** 恢复自动播放，仍遵循暂停条件。 */
  resume,
  /** 当前真实索引，只读。 */
  activeIndex: computed(() => currentIndex.value),
  /** 自动播放计时器是否正在运行，只读。 */
  isPlaying: computed(() => isPlaying.value),
});
</script>

<template>
  <div v-if="prepareSlides()" ref="carouselRootRef" :class="ui.wrapper({ class: props.class })" role="region" aria-roledescription="轮播" aria-label="轮播内容" @pointerenter="handlePointerEnter" @pointerleave="handlePointerLeave" @focusin="handleFocusIn" @focusout="handleFocusOut">
    <div :class="thumbsShellClass">
      <div v-if="showThumbs && isThumbsReady" :class="thumbsPanelClass" :style="thumbsPanelStyle">
        <div ref="thumbsViewportRef" :class="thumbsViewportClass">
          <div :class="thumbsTrackClass">
            <div
              v-for="index in slideCount" :key="`thumb-${index - 1}`" :ref="(el) => setThumbRef(el, index - 1)"
              :class="ui.thumb({ active: (index - 1) === currentIndex })"
              :aria-current="(index - 1) === currentIndex ? 'true' : 'false'" role="button" tabindex="0" :aria-label="`切换到第 ${index} 项缩略图`"
              @click="handleThumbClick(index - 1)" @keydown="(event) => handleThumbKeydown(index - 1, event)"
            >
              <div :class="ui.thumbPreview({ active: (index - 1) === currentIndex })" inert aria-hidden="true">
                <CarouselSlotItem :node="slideNodes[index - 1]" />
              </div>
              <div :class="ui.thumbOverlay({ class: (index - 1) === currentIndex ? 'opacity-40' : 'opacity-10' })" />
            </div>
          </div>
        </div>

        <!-- 缩略图箭头使用绝对定位 -->
        <div v-if="showThumbArrows" :class="thumbsArrowGroupClass">
          <button type="button" aria-label="上一项缩略图" :disabled="!canGoPrevThumb" :class="ui.thumbsArrow()" @click="prevThumb">
            <Icon :name="isThumbsVertical ? 'lucide:chevron-up' : 'lucide:chevron-left'" class="size-4.5" />
          </button>
          <button type="button" aria-label="下一项缩略图" :disabled="!canGoNextThumb" :class="ui.thumbsArrow()" @click="nextThumb">
            <Icon :name="isThumbsVertical ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="size-4.5" />
          </button>
        </div>
      </div>

      <div :class="mainPaneClass">
        <div ref="mainRootRef" :class="ui.root()" :style="rootStyle">
          <div
            ref="viewportRef" :class="ui.viewport()" :style="viewportStyle" :data-direction="effectiveDirection" tabindex="0"
            @pointerdown="handlePointerDown" @pointermove="handlePointerMove" @pointerup="handlePointerUp" @pointercancel="handlePointerUp" @lostpointercapture="handlePointerUp" @click.capture="handleDragClick" @dragstart.prevent @touchstart.passive="handleDragStart" @touchend="handleTouchEnd" @touchcancel="handleTouchEnd" @keydown="handleKeydown"
            @scroll="handleScroll" @scrollend="handleScrollEnd" @wheel="(e) => {
              // 防止垂直模式下滚动穿透到父容器
              if (isVertical) {
                e.stopPropagation();
              }
            }"
          >
            <div :class="ui.track()" :style="trackStyle">
              <div
                v-for="(item, renderIdx) in renderSlides"
                :key="item.isClone ? `clone-${item.renderIndex}-${item.realIndex}` : `slide-${item.realIndex}`"
                :ref="(el) => setSlideRef(el, renderIdx)"
                :class="ui.slide({ active: item.realIndex === currentIndex })" :style="[
                  slideSizeStyle,
                  {
                    scrollSnapAlign: effectiveCenteredSlides ? 'center' : 'start',
                    scrollSnapStop: 'always',
                  },
                ]" :aria-hidden="item.isClone ? 'true' : undefined" :inert="item.isClone" role="group" aria-roledescription="幻灯片" :aria-label="`${item.realIndex + 1} / ${slideCount}`"
              >
                <div :class="ui.slideInner()">
                  <CarouselSlotItem :node="slideNodes[item.realIndex]" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="showArrows" :class="ui.arrowGroup()">
            <slot name="prev" :prev="prev" :disabled="!canGoPrev">
              <button type="button" aria-label="上一项" :disabled="!canGoPrev" :class="ui.arrow()" @click="prev">
                <Icon
                  :name="isVertical ? 'lucide:chevron-up' : 'lucide:chevron-left'"
                  class="size-5"
                />
              </button>
            </slot>
            <slot name="next" :next="next" :disabled="!canGoNext">
              <button
                type="button" aria-label="下一项" :disabled="!canGoNext" :class="ui.arrow()"
                @click="() => next(true)"
              >
                <Icon
                  :name="isVertical ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                  class="size-5"
                />
              </button>
            </slot>
          </div>

          <div
            v-if="showIndicators && effectiveIndicatorPosition === 'inside'" :class="ui.indicatorWrapper()"
            :style="indicatorWrapperStyle"
          >
            <slot name="indicators" :active-index="currentIndex" :count="slideCount" :go-to="goTo">
              <CarouselIndicators />
            </slot>
          </div>
        </div>

        <!-- outside 指示器在 mainPane 内部，但在 root 外部，确保不受 flex 影响 -->
        <div
          v-if="showIndicators && effectiveIndicatorPosition === 'outside'" :class="ui.indicatorWrapper()"
          :style="indicatorWrapperStyle"
        >
          <slot name="indicators" :active-index="currentIndex" :count="slideCount" :go-to="goTo">
            <CarouselIndicators />
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>
