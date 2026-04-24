<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { PropType, VNode } from "vue";
import {
  Comment,
  Fragment,
  Text,
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
  watch,
} from "vue";
import { cn } from "~/lib/utils";
import { tv } from "~/lib/tv";
import theme from "./reborn-carousel.config";

type CarouselArrowMode = "hover" | "always" | "never";
type CarouselDirection = "horizontal" | "vertical";
type CarouselIndicatorPosition = "inside" | "outside" | "none";
type CarouselThumbsPosition = "top" | "bottom" | "left" | "right";
type CarouselTrigger = "hover" | "click";
type CarouselType = "default" | "card";

interface CarouselAutoplay {
  delay?: number;
}

interface CarouselPagination {
  clickable?: boolean;
  type?: "line" | "dot" | "fraction" | "button";
}

interface CarouselThumbs {
  position?: CarouselThumbsPosition;
  loop?: boolean;
  arrow?: CarouselArrowMode;
}

export interface RebornCarouselBreakpoint {
  slidesPerview?: number | "auto";
  spaceBetween?: number;
  centeredSlides?: boolean;
  arrow?: CarouselArrowMode;
  indicatorPosition?: CarouselIndicatorPosition;
  motionBlur?: boolean;
  height?: string;
  /**轮播类型 (默认或卡片) */
  type?: CarouselType;
  /** 滚动方向 */
  direction?: CarouselDirection;
  /** 是否启用抓取手势光标 */
  grabCursor?: boolean;
  /** 是否由元素内容自身决定宽高（禁用强行拉伸） */
  autoSize?: boolean;
}

export interface RebornCarouselProps {
  /** 每屏显示的幻灯片数量，或 'auto' (根据内容宽度) */
  slidesPerview?: number | "auto";
  /** 幻灯片之间的间距 (px) */
  spaceBetween?: number;
  /** 是否居中展示活动项 */
  centeredSlides?: boolean;
  /** 是否无限循环 */
  loop?: boolean;
  /** 自动播放配置，可直接传 boolean 或 { delay: number } */
  autoplay?: boolean | CarouselAutoplay;
  /** 分页器配置 */
  pagination?: CarouselPagination | null;
  /** 指示器触发方式 */
  trigger?: CarouselTrigger;
  /** 指示器位置 */
  indicatorPosition?: CarouselIndicatorPosition;
  /** 箭头显示模式 */
  arrow?: CarouselArrowMode;
  /** 是否启用动态模糊 */
  motionBlur?: boolean;
  /** 容器高度 */
  height?: string;
  /** 轮播类型 (默认或卡片) */
  type?: CarouselType;
  /** 滚动方向 */
  direction?: CarouselDirection;
  /** 初始显示的幻灯片索引 */
  initialSlide?: number;
  /** 响应式断点配置 */
  breakpoints?: Record<number, RebornCarouselBreakpoint>;
  /** 是否启用抓取手势光标 */
  grabCursor?: boolean;
  /** 是否由元素内容自身决定宽高（禁用强行拉伸） */
  autoSize?: boolean;
  /** 指示器偏移量 (px) */
  indicatorOffset?: number;
  thumbs?: CarouselThumbs | null;
  /** 默认主题颜色 */
  color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";
  /** 自定义根节点类名 */
  class?: any;
  /** 内置 UI 部件的类名覆盖 */
  ui?: Partial<{
    wrapper: ClassValue;
    root: ClassValue;
    viewport: ClassValue;
    track: ClassValue;
    slide: ClassValue;
    slideInner: ClassValue;
    slideActive: ClassValue;
    slideInactive: ClassValue;
    arrowGroup: ClassValue;
    arrow: ClassValue;
    indicatorWrapper: ClassValue;
    indicators: ClassValue;
    indicator: ClassValue;
    indicatorActive: ClassValue;
    indicatorInactive: ClassValue;
    thumbsShell: ClassValue;
    thumbsPanel: ClassValue;
    thumbsViewport: ClassValue;
    thumbsTrack: ClassValue;
    thumbsArrowGroup: ClassValue;
    thumbsArrow: ClassValue;
    thumb: ClassValue;
    thumbActive: ClassValue;
    thumbInactive: ClassValue;
    thumbPreview: ClassValue;
    thumbOverlay: ClassValue;
  }>;
}

const props = withDefaults(defineProps<RebornCarouselProps>(), {
  slidesPerview: 1,
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
  autoSize: false,
  indicatorOffset: undefined,
  thumbs: null,
  color: "primary",
  ui: () => ({}),
});

const modelValue = defineModel<number>("modelValue", {
  default: 0,
});

const emit = defineEmits<{
  (e: "change", value: number): void;
}>();

const CarouselSlotItem = defineComponent({
  name: "CarouselSlotItem",
  props: {
    slotFn: {
      type: Function as PropType<() => VNode[]>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },
  setup(localProps) {
    return () => {
      const nodes = normalizeNodes(localProps.slotFn?.() ?? []);
      return nodes[localProps.index] ?? null;
    };
  },
});

function normalizeNodes(nodes: VNode[] = []): VNode[] {
  const normalized: VNode[] = [];

  for (const node of nodes) {
    if (!node || node.type === Comment) {
      continue;
    }

    if (node.type === Text) {
      const content = typeof node.children === "string" ? node.children.trim() : "";
      if (!content) {
        continue;
      }
    }

    if (node.type === Fragment && Array.isArray(node.children)) {
      normalized.push(...normalizeNodes(node.children as VNode[]));
      continue;
    }

    normalized.push(node);
  }

  return normalized;
}

const slots = useSlots();
const defaultSlotFn = computed(() => slots.default ?? (() => []));
const b = tv(theme);
const viewportRef = ref<HTMLDivElement | any>(null);
const trackRef = ref<HTMLDivElement | null>(null);
const thumbsViewportRef = ref<HTMLDivElement | null>(null);
const mainRootRef = ref<HTMLDivElement | null>(null);
const slideRefs = ref<HTMLElement[]>([]);
const thumbRefs = ref<HTMLElement[]>([]);
const currentIndex = ref(0);
const currentRenderIndex = ref(0);
const viewportWidth = ref(0);
const viewportMainSize = ref(0);
const isHovering = ref(false);
const isFocused = ref(false);
const isDragging = ref(false);
// loop 模式：防止滚动事件处理（静默跳转期间使用）
const isJumping = ref(false);
// loop 平滑滚动期间，锁定滚动驱动索引同步，避免 wrap 时出现 4->3->2->1 的快速闪动
const isLoopTransitioning = ref(false);
let resizeHandler: (() => void) | null = null;
let resizeObserver: ResizeObserver | null = null;
let scrollFrame = 0;
let autoplayTimer: any = null;
let isUpdatingLayout = false;
let isApplyingIndex = false;
let layoutFrame = 0;

/** 自动高度模式下的当前像素高度 */
const currentSlideHeight = ref(0);
/** 主图区域实际渲染尺寸，用于同步缩略图面板 */
const mainRootSize = ref({ width: 0, height: 0 });
let mainRootObserver: ResizeObserver | null = null;

/**
 * 更新自动高度：计算当前活动项的实际高度并应用
 */
function updateAutoHeight() {
  if (effectiveHeight.value !== "auto" || !import.meta.client) {
    return;
  }

  const renderIdx = realToRenderIndex(currentIndex.value);
  const slide = slideRefs.value[renderIdx];

  if (slide) {
    // 强制先重设为 auto 以获取内容真实高度
    const slideInner = slide.firstElementChild as HTMLElement;
    if (slideInner) {
      currentSlideHeight.value = slideInner.scrollHeight;
    }
  }
}

/** 规范化后的幻灯片 VNode 列表 */
const slideNodes = computed(() => normalizeNodes(slots.default?.() ?? []));
/** 真实幻灯片总数 */
const slideCount = computed(() => slideNodes.value.length);



// ============================
// loop 克隆逻辑
// ============================

/**
 * 前后需要克隆的幻灯片数量。
 * 取 slidesPerView（数字值）或 slideCount，以较小者为准，保证两端有足够的克隆来实现无缝过渡。
 */
const cloneCount = computed(() => {
  if (!props.loop || slideCount.value <= 1) {
    return 0;
  }

  const perView =
    effectiveSlidesPerView.value === "auto" ? 1 : Number(effectiveSlidesPerView.value);
  // 增加克隆数量以提供更大的拖拽缓冲区
  // 保证两端至少有 slideCount 处理或至少 2 倍 perView
  const minClones = Math.max(Math.ceil(perView) * 2, 4);
  return Math.min(slideCount.value, minClones);
});

/**
 * 渲染列表 = 前克隆 + 真实节点 + 后克隆。
 * 每个元素带 { node, realIndex, renderIndex, isClone }。
 */
const renderSlides = computed(() => {
  const count = slideCount.value;

  if (count === 0) {
    return [];
  }

  const clones = cloneCount.value;

  if (clones === 0) {
    return Array.from({ length: count }, (_, i) => ({
      realIndex: i,
      renderIndex: i,
      isClone: false,
    }));
  }

  const result: Array<{
    realIndex: number;
    renderIndex: number;
    isClone: boolean;
  }> = [];

  // 前克隆（从尾部取 clones 个）
  for (let i = 0; i < clones; i++) {
    const realIdx = ((count - clones + i) % count + count) % count;
    result.push({
      realIndex: realIdx,
      renderIndex: result.length,
      isClone: true,
    });
  }

  // 真实节点
  for (let i = 0; i < count; i++) {
    result.push({
      realIndex: i,
      renderIndex: result.length,
      isClone: false,
    });
  }

  // 后克隆（从头部取 clones 个）
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
 * 将真实索引转为渲染列表中对应真实节点的索引。
 */
function realToRenderIndex(realIndex: number): number {
  return cloneCount.value + realIndex;
}

/**
 * 计算当前视口宽度下的响应式属性
 */
const responsiveProps = computed(() => {
  const entries = Object.entries(props.breakpoints || {})
    .map(([key, value]) => [Number(key), value] as const)
    .filter(([key]) => !Number.isNaN(key))
    .sort((a, b) => a[0] - b[0]);

  return entries.reduce<RebornCarouselBreakpoint>((result, [key, value]) => {
    if (viewportWidth.value >= key) {
      Object.assign(result, value);
    }
    return result;
  }, {});
});

/** 当前生效的每屏显示数量 */
const effectiveSlidesPerView = computed(
  () => responsiveProps.value.slidesPerview ?? props.slidesPerview,
);
/** 当前生效的项目间距 */
const effectiveSpaceBetween = computed(
  () => responsiveProps.value.spaceBetween ?? props.spaceBetween,
);
/** 当前生效的居中模式 */
const effectiveCenteredSlides = computed(
  () => responsiveProps.value.centeredSlides ?? props.centeredSlides,
);
/** 当前生效的箭头模式 */
const effectiveArrow = computed(() => responsiveProps.value.arrow ?? props.arrow);
/** 当前生效的指示器位置 */
const effectiveIndicatorPosition = computed(
  () => responsiveProps.value.indicatorPosition ?? props.indicatorPosition,
);
/** 当前生效的动态模糊 */
const effectiveMotionBlur = computed(() => responsiveProps.value.motionBlur ?? props.motionBlur);
/** 当前生效的容器高度 */
const effectiveHeight = computed(() => responsiveProps.value.height ?? props.height);
/** 当前生效的轮播类型 */
const effectiveType = computed(() => responsiveProps.value.type ?? props.type);
/** 当前生效的滚动方向 */
const effectiveDirection = computed(() => responsiveProps.value.direction ?? props.direction);
/** 当前生效的抓取光标 */
const effectiveGrabCursor = computed(() => responsiveProps.value.grabCursor ?? props.grabCursor);
/** 当前生效的自动尺寸（完全自适应内部元素） */
const effectiveAutoSize = computed(() => responsiveProps.value.autoSize ?? props.autoSize);

/** 是否为垂直滚动 */
const isVertical = computed(() => effectiveDirection.value === "vertical");
/** 是否使用内在尺寸 (自动宽度或卡片模式) */
const usesIntrinsicSlideSize = computed(
  () => effectiveType.value === "card" || effectiveSlidesPerView.value === "auto" || effectiveAutoSize.value,
);
/** 指示器是否可点击 */
const isIndicatorClickable = computed(() => props.pagination?.clickable !== false);
/** 是否显示指示器 */
const showIndicators = computed(
  () =>
    props.pagination !== null &&
    effectiveIndicatorPosition.value !== "none" &&
    slideCount.value > 1,
);
/** 是否显示箭头 */
const showArrows = computed(() => effectiveArrow.value !== "never" && slideCount.value > 1);
const showThumbs = computed(() => !!props.thumbs && slideCount.value > 1);
const thumbsPosition = computed<CarouselThumbsPosition>(() => props.thumbs?.position ?? "bottom");
const thumbsArrow = computed<CarouselArrowMode>(() => props.thumbs?.arrow ?? "never");
const thumbsLoop = computed(() => props.thumbs?.loop ?? false);
const isThumbsVertical = computed(
  () => thumbsPosition.value === "left" || thumbsPosition.value === "right",
);
const showThumbArrows = computed(
  () => showThumbs.value && thumbsArrow.value !== "never" && slideCount.value > 1,
);
const isThumbsBeforeMain = computed(
  () => thumbsPosition.value === "top" || thumbsPosition.value === "left",
);

/** 指示器是否为分页分数模式 */
const isFractionPagination = computed(() => props.pagination?.type === "fraction");

/** 指示器包装容器样式，用于应用自定义偏移值 */
const indicatorWrapperStyle = computed(() => {
  const offset = props.indicatorOffset ?? 16;

  if (isVertical.value) {
    if (effectiveIndicatorPosition.value === "inside") {
      return { right: `${offset}px` };
    }
    if (effectiveIndicatorPosition.value === "outside") {
      return { marginLeft: `${offset}px` };
    }
    return {};
  }

  if (props.indicatorOffset === undefined) {
    return {};
  }

  if (effectiveIndicatorPosition.value === "inside") {
    return { bottom: `${props.indicatorOffset}px` };
  }

  if (effectiveIndicatorPosition.value === "outside") {
    return { marginTop: `${props.indicatorOffset}px` };
  }

  return {};
});

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

const mainPaneClass = computed(() =>
  cn("min-w-0", showThumbs.value && isThumbsVertical.value ? "flex-1" : "w-full"),
);

const thumbsPanelClass = computed(() =>
  ui.value.thumbsPanel({
    class: cn(
      isThumbsBeforeMain.value ? "order-first" : "order-last",
      isThumbsVertical.value ? "w-24 flex-col self-stretch md:w-28" : "w-full flex-col",
    ),
  }),
);

const thumbsPanelStyle = computed(() => {
  if (!showThumbs.value) {
    return undefined;
  }

  if (isThumbsVertical.value) {
    // left/right：缩略图高度跟随主图高度
    const h = mainRootSize.value.height;
    // 如果主图高度还未计算出来，使用最小高度避免全部显示
    return h > 0 ? { height: `${h}px` } : { minHeight: '100px' };
  }

  // top/bottom：缩略图宽度跟随主图宽度
  const w = mainRootSize.value.width;
  // 如果主图宽度还未计算出来，使用最小宽度避免全部显示
  return w > 0 ? { width: `${w}px` } : { minWidth: '100px' };
});

const thumbsViewportClass = computed(() =>
  ui.value.thumbsViewport({
    class: cn(
      isThumbsVertical.value ? "flex-1 overflow-y-auto overflow-x-hidden" : "overflow-x-auto overflow-y-hidden",
      "overflow-hidden", // 确保初始化时就隐藏溢出内容
    ),
  }),
);

const thumbsTrackClass = computed(() =>
  ui.value.thumbsTrack({
    class: cn(
      isThumbsVertical.value ? "flex-col w-full" : "flex-row", // 移除 min-w-max，使用 flex-1 或固定宽度
    ),
  }),
);

const thumbsArrowGroupClass = computed(() =>
  ui.value.thumbsArrowGroup(),
);

/** 计算后的自动播放延迟时间 */
const autoplayDelay = computed(() => {
  if (props.autoplay === false) {
    return 0;
  }

  if (props.autoplay === true) {
    return 3000;
  }

  return Math.max(800, props.autoplay.delay ?? 3000);
});

/** 根容器样式 */
const rootStyle = computed(() => {
  const isAuto = effectiveHeight.value === "auto";
  return {
    height: isAuto ? (currentSlideHeight.value ? `${currentSlideHeight.value}px` : "auto") : effectiveHeight.value,
    // 自动高度模式下增加平滑过渡，放在根容器避免影响视口滚动
    transition: isAuto ? "height 300ms cubic-bezier(0.4, 0, 0.2, 1)" : undefined,
  };
});

/** 视口容器样式 */
const viewportStyle = computed(() => {
  const isAuto = effectiveHeight.value === "auto";
  const base: Record<string, any> = {
    // 关键点：自动高度模式下视口随内容长，不由父级容器 100% 裁切，由 root 容器裁切
    height: isAuto ? "auto" : "100%",
    // loop 模式也使用 CSS scroll-snap，浏览器原生处理每次滑动 ±1 slide
    scrollSnapType: isVertical.value ? "y mandatory" : "x mandatory",
    // 强制禁用 CSS 的 scroll-behavior，确保 jumpToRealPosition 的 behavior: 'auto' 是瞬时的
    scrollBehavior: "auto !important" as any,
  };

  return base;
});

/** 轨道容器样式 */
const trackStyle = computed(() => ({
  gap: `${effectiveSpaceBetween.value}px`,
  // 轨道高度跟随内容，由 root 容器裁切
  height: effectiveHeight.value === "auto" ? "auto" : "100%",
}));

/** 幻灯片尺寸样式 (当非 auto 宽度时计算) */
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

/** UI 覆盖配置 */
const overrides = computed(() => props.ui || {});
/** 最终生成的 UI 类名集 */
const ui = computed(() => {
  const styles = b({
    direction: effectiveDirection.value,
    type: effectiveType.value,
    arrow: effectiveArrow.value,
    indicatorPosition: effectiveIndicatorPosition.value,
    motionBlur: effectiveMotionBlur.value,
    color: props.color,
    indicatorType: props.pagination?.type || "line",
    thumbsPosition: thumbsPosition.value,
    thumbsArrow: thumbsArrow.value,
  });

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, overrides.value.wrapper) }),
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, overrides.value.root) }),
    viewport: (opts?: { class?: any }) =>
      styles.viewport({ class: cn(opts?.class, overrides.value.viewport) }),
    track: (opts?: { class?: any }) =>
      styles.track({ class: cn(opts?.class, overrides.value.track) }),
    slide: (opts?: { class?: any }) =>
      styles.slide({
        class: cn(
          opts?.class,
          overrides.value.slide,
          effectiveHeight.value === "auto" && "h-auto",
          effectiveAutoSize.value && "!w-auto !h-auto self-center",
        ),
      }),
    slideInner: (opts?: { class?: any }) =>
      styles.slideInner({
        class: cn(
          opts?.class,
          overrides.value.slideInner,
          effectiveHeight.value === "auto" && "h-auto",
          effectiveAutoSize.value && "!w-auto !h-auto inline-block",
        ),
      }),
    arrowGroup: (opts?: { class?: any }) =>
      styles.arrowGroup({ class: cn(opts?.class, overrides.value.arrowGroup) }),
    arrow: (opts?: { class?: any }) =>
      styles.arrow({ class: cn(opts?.class, overrides.value.arrow) }),
    indicatorWrapper: (opts?: { class?: any }) =>
      styles.indicatorWrapper({ class: cn(opts?.class, overrides.value.indicatorWrapper) }),
    indicators: (opts?: { class?: any }) =>
      styles.indicators({ class: cn(opts?.class, overrides.value.indicators) }),
    indicator: (opts?: { class?: any }) =>
      styles.indicator({ class: cn(opts?.class, overrides.value.indicator) }),
    indicatorActive: (opts?: { class?: any }) =>
      styles.indicatorActive({
        class: cn(opts?.class, overrides.value.indicatorActive),
      }),
    indicatorInactive: (opts?: { class?: any }) =>
      styles.indicatorInactive({
        class: cn(opts?.class, overrides.value.indicatorInactive),
      }),
    slideActive: (opts?: { class?: any }) =>
      styles.slideActive({ class: cn(opts?.class, overrides.value.slideActive) }),
    slideInactive: (opts?: { class?: any }) =>
      styles.slideInactive({ class: cn(opts?.class, overrides.value.slideInactive) }),
    thumbsShell: (opts?: { class?: any }) =>
      styles.thumbsShell({ class: cn(opts?.class, overrides.value.thumbsShell) }),
    thumbsPanel: (opts?: { class?: any }) =>
      styles.thumbsPanel({ class: cn(opts?.class, overrides.value.thumbsPanel) }),
    thumbsViewport: (opts?: { class?: any }) =>
      styles.thumbsViewport({ class: cn(opts?.class, overrides.value.thumbsViewport) }),
    thumbsTrack: (opts?: { class?: any }) =>
      styles.thumbsTrack({ class: cn(opts?.class, overrides.value.thumbsTrack) }),
    thumbsArrowGroup: (opts?: { class?: any }) =>
      styles.thumbsArrowGroup({ class: cn(opts?.class, overrides.value.thumbsArrowGroup) }),
    thumbsArrow: (opts?: { class?: any }) =>
      styles.thumbsArrow({ class: cn(opts?.class, overrides.value.thumbsArrow) }),
    thumb: (opts?: { class?: any }) =>
      styles.thumb({ class: cn(opts?.class, overrides.value.thumb) }),
    thumbActive: (opts?: { class?: any }) =>
      styles.thumbActive({ class: cn(opts?.class, overrides.value.thumbActive) }),
    thumbInactive: (opts?: { class?: any }) =>
      styles.thumbInactive({ class: cn(opts?.class, overrides.value.thumbInactive) }),
    thumbPreview: (opts?: { class?: any }) =>
      styles.thumbPreview({ class: cn(opts?.class, overrides.value.thumbPreview) }),
    thumbOverlay: (opts?: { class?: any }) =>
      styles.thumbOverlay({ class: cn(opts?.class, overrides.value.thumbOverlay) }),
  };
});

/**
 * 确保索引在有效范围内 [0, count-1]
 */
function clampIndex(index: number) {
  if (slideCount.value <= 0) {
    return 0;
  }

  if (props.loop) {
    return ((index % slideCount.value) + slideCount.value) % slideCount.value;
  }

  return Math.min(Math.max(index, 0), slideCount.value - 1);
}

/**
 * 更新响应式宽度参考
 */
function updateViewportWidth() {
  if (!import.meta.client) {
    return;
  }

  viewportWidth.value = window.innerWidth;
}

/**
 * 更新视口主轴尺寸 (宽度或高度)
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
 * 注册幻灯片 DOM 引用
 */
function setSlideRef(el: any, index: number) {
  if (!el) {
    return;
  }

  const element = (el.$el || el) as HTMLElement;
  slideRefs.value[index] = element;
}

function setThumbRef(el: any, index: number) {
  if (!el) {
    return;
  }

  const element = (el.$el || el) as HTMLElement;
  thumbRefs.value[index] = element;
}

/**
 * 批量执行布局更新，使用 rAF 防抖并防止 ResizeObserver 反馈循环。
 */
function scheduleLayoutUpdate() {
  if (layoutFrame) {
    cancelAnimationFrame(layoutFrame);
  }

  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0;
    if (isUpdatingLayout) {
      return;
    }

    isUpdatingLayout = true;
    updateViewportMainSize();
    scrollToRenderIndex(realToRenderIndex(currentIndex.value), "auto");
    isUpdatingLayout = false;
  });
}

/**
 * 获取渲染列表中第 renderIdx 个 slide 的滚动目标（居中对齐）。
 * 改动 3：始终居中对齐激活的 slide。
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

  // 根据 centeredSlides 决定对齐方式：居中或左对齐
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
  if (slideCount.value === 0) {
    currentIndex.value = 0;
    return 0;
  }

  const nextIndex = clampIndex(index);

  if (nextIndex !== currentIndex.value) {
    currentIndex.value = nextIndex;
    if (options.syncModel ?? false) {
      modelValue.value = nextIndex;
    }
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
  const renderIdx = realToRenderIndex(realIndex);
  const target = getSlideTarget(renderIdx);

  viewport.scrollTo({
    left: isVertical.value ? 0 : target,
    top: isVertical.value ? target : 0,
    behavior: "auto",
  });

  // 同步渲染索引到真实位置，防止下次拖拽使用过期的克隆索引
  currentRenderIndex.value = renderIdx;

  // 等待浏览器完成滚动后解除锁定
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
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
  if (props.loop && isLoopTransitioning.value) {
    return;
  }

  isApplyingIndex = true;
  const nextIndex = setActiveIndex(index, {
    emitChange: options.emitChange,
    syncModel: options.syncModel,
  });

  nextTick(() => {
    const renderIdx = realToRenderIndex(nextIndex);
    scrollToRenderIndex(renderIdx, options.behavior ?? "smooth");

    // 针对平滑滚动，在滚动结束或一定时间后解除锁定
    if ((options.behavior ?? "smooth") === "smooth") {
      waitForScrollEnd(() => {
        isApplyingIndex = false;
      });
    } else {
      isApplyingIndex = false;
    }
  });
}

function goTo(index: number) {
  applyIndex(index, {
    behavior: "smooth",
    emitChange: true,
    syncModel: true,
  });
  // 手动跳转重置自动播放计时
  startAutoplay();
}

function navigateToSlide(index: number, allowWrap = false) {
  if (slideCount.value <= 1) {
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

/**
 * loop 模式下的 next：滚动到渲染列表中当前位置的下一个，
 * 动画结束后静默跳转到真实位置。
 */
function next(isManual: boolean | any = true) {
  if (slideCount.value <= 1) {
    return;
  }

  if (isManual !== false) {
    startAutoplay();
  }

  if (props.loop) {
    isLoopTransitioning.value = true;
    const nextReal = (currentIndex.value + 1) % slideCount.value;
    const currentRenderIdx = realToRenderIndex(currentIndex.value);
    const nextRenderIdx = currentRenderIdx + 1;

    setActiveIndex(nextReal, { emitChange: true, syncModel: true });

    nextTick(() => {
      // 平滑滚动到克隆位置
      scrollToRenderIndex(nextRenderIdx, "smooth");

      // 滚动结束后静默跳转到真实位置
      waitForScrollEnd(() => {
        jumpToRealPosition(nextReal);
      });
    });
  } else {
    if (currentIndex.value >= slideCount.value - 1) {
      return;
    }
    goTo(currentIndex.value + 1);
  }
}

function prev() {
  if (slideCount.value <= 1) {
    return;
  }

  // 手动跳转重置自动播放计时
  startAutoplay();

  if (props.loop) {
    isLoopTransitioning.value = true;
    const prevReal = (currentIndex.value - 1 + slideCount.value) % slideCount.value;
    const currentRenderIdx = realToRenderIndex(currentIndex.value);
    const prevRenderIdx = currentRenderIdx - 1;

    setActiveIndex(prevReal, { emitChange: true, syncModel: true });

    nextTick(() => {
      scrollToRenderIndex(prevRenderIdx, "smooth");

      waitForScrollEnd(() => {
        jumpToRealPosition(prevReal);
      });
    });
  } else {
    if (currentIndex.value <= 0) {
      return;
    }
    goTo(currentIndex.value - 1);
  }
}

/**
 * loop 模式下的 goTo（指示器点击等场景）。
 * 如果目标距离当前位置不超过 slideCount/2，直接滚动到克隆位置再跳回。
 */
function loopGoTo(targetReal: number) {
  if (targetReal === currentIndex.value) {
    return;
  }

  // 手动跳转重置自动播放计时
  startAutoplay();

  isLoopTransitioning.value = true;
  const currentRenderIdx = realToRenderIndex(currentIndex.value);
  const diff = targetReal - currentIndex.value;
  const targetRenderIdx = currentRenderIdx + diff;

  setActiveIndex(targetReal, { emitChange: true, syncModel: true });

  nextTick(() => {
    scrollToRenderIndex(targetRenderIdx, "smooth");

    waitForScrollEnd(() => {
      jumpToRealPosition(targetReal);
    });
  });
}

/**
 * 等待滚动结束后执行回调。
 * 使用 scrollend 事件（现代浏览器支持），降级为 setTimeout。
 */
function waitForScrollEnd(callback: () => void) {
  const viewport = viewportRef.value;

  if (!viewport) {
    callback();
    return;
  }

  // 优先使用 scrollend 事件
  if ("onscrollend" in viewport) {
    const handler = () => {
      viewport.removeEventListener("scrollend", handler);
      callback();
    };
    viewport.addEventListener("scrollend", handler, { once: true });
  } else {
    // 降级方案：等待足够长时间（考虑 transition-all 500ms）
    setTimeout(callback, 600);
  }
}

/**
 * 处理自动播放的主步进逻辑
 */
function handleAutoplayStep() {
  if (slideCount.value <= 1 || autoplayDelay.value <= 0) {
    return;
  }

  if (!props.loop && currentIndex.value >= slideCount.value - 1) {
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
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

/**
 * 启动自动播放计时器
 */
function startAutoplay() {
  stopAutoplay();

  if (!import.meta.client || autoplayDelay.value <= 0 || slideCount.value <= 1) {
    return;
  }

  if (isHovering.value || isFocused.value) {
    return;
  }

  autoplayTimer = window.setInterval(handleAutoplayStep, autoplayDelay.value);
}

let scrollTimeout: any = null;

/**
 * 处理滚动事件触发的索引同步
 */
function handleScroll() {
  if (isJumping.value || isApplyingIndex || (props.loop && isLoopTransitioning.value)) {
    return;
  }

  if (scrollFrame) {
    cancelAnimationFrame(scrollFrame);
  }

  scrollFrame = requestAnimationFrame(() => {
    syncCurrentFromScroll(true);

    // 针对 loop 模式的边界检测，即使在拖拽中也执行静默跳转以防止撞墙
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
  if (isJumping.value || (props.loop && isLoopTransitioning.value)) {
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
 * 限制渲染索引在有效范围内
 */
function clampRenderIndex(index: number) {
  return Math.min(Math.max(index, 0), renderSlides.value.length - 1);
}

/**
 * 处理键盘导航
 */
function handleKeydown(event: KeyboardEvent) {
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
 * 计算幻灯片在循环列表下的视觉距离
 */
function getVisualDistance(realIndex: number) {
  const directDistance = Math.abs(realIndex - currentIndex.value);

  if (!props.loop) {
    return directDistance;
  }

  return Math.min(directDistance, slideCount.value - directDistance);
}

/**
 * 获取幻灯片的外层容器类名，处理活动态、模糊和类型效果
 */
function getSlideClass(realIndex: number) {
  const isActive = realIndex === currentIndex.value;

  return cn(
    ui.value.slide(),
    isActive ? ui.value.slideActive() : ui.value.slideInactive(),
    effectiveHeight.value === "auto" && "h-auto",
    effectiveAutoSize.value && "!w-auto !h-auto self-center",
  );
}

/**
 * 获取幻灯片的内层内容容器类名，处理渲染优化和圆角修正
 */
function getSlideInnerClass() {
  return cn(
    ui.value.slideInner(),
    effectiveHeight.value === "auto" ? "h-auto" : "h-full",
    effectiveAutoSize.value && "!w-auto !h-auto inline-block",
  );
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
  if (props.trigger === "click" && isIndicatorClickable.value) {
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

function getThumbClass(index: number) {
  const isActive = index === currentIndex.value;

  return ui.value.thumb({
    class: cn(
      isThumbsVertical.value
        ? "aspect-[4/3] w-full"
        : "aspect-[4/3] w-20 shrink-0 sm:w-24 md:w-28",
      isActive ? ui.value.thumbActive() : ui.value.thumbInactive(),
    ),
  });
}

function getThumbPreviewClass(index: number) {
  return ui.value.thumbPreview({
    class: cn(
      index === currentIndex.value ? "scale-100" : "scale-[0.96]",
    ),
  });
}

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

// ============================
// 监听器 (Watchers)
// ============================

/** 响应外部 v-model 值的变化 */
watch(
  () => modelValue.value,
  (value) => {
    if (value !== currentIndex.value) {
      applyIndex(value, {
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
watch(slideCount, () => {
  slideRefs.value = slideRefs.value.slice(0, renderSlides.value.length);
  thumbRefs.value = thumbRefs.value.slice(0, slideCount.value);
  nextTick(() => {
    updateViewportMainSize();
    updateAutoHeight();
    applyIndex(currentIndex.value, {
      behavior: "auto",
      emitChange: false,
      syncModel: false,
    });
  });
});

watch(
  () => [showThumbs.value, currentIndex.value, thumbsPosition.value],
  () => {
    if (!showThumbs.value) {
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
  ],
  () => {
    nextTick(() => {
      nextTick(() => {
        scheduleLayoutUpdate();
        updateAutoHeight();
      });
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
  () => [autoplayDelay.value, slideCount.value, isHovering.value, isFocused.value],
  () => {
    startAutoplay();
  },
  { immediate: true },
);

// ============================
// 生命周期 (Lifecycle Hooks)
// ============================

onMounted(() => {
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
  /** 彻底清理所有异步资源：定时器、动画帧、事件监听器和观察者 */
  stopAutoplay();
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
});

/** 暴露给外部调用的方法 */
defineExpose({
  next,
  prev,
  goTo,
});
</script>

<template>
  <div :class="ui.wrapper({ class: props.class })">
    <div :class="thumbsShellClass">
      <div v-if="showThumbs" :class="thumbsPanelClass" :style="thumbsPanelStyle">
        <div ref="thumbsViewportRef" :class="thumbsViewportClass">
          <div :class="thumbsTrackClass">
            <div v-for="index in slideCount" :key="`thumb-${index - 1}`" :ref="(el: any) => setThumbRef(el, index - 1)"
              :class="getThumbClass(index - 1)" :aria-current="(index - 1) === currentIndex ? 'true' : 'false'" role="button"
              tabindex="0" @click="handleThumbClick(index - 1)" @keydown="(event) => handleThumbKeydown(index - 1, event)">
              <div :class="getThumbPreviewClass(index - 1)">
                <CarouselSlotItem :slotFn="defaultSlotFn" :index="index - 1" />
              </div>
              <div :class="ui.thumbOverlay({ class: (index - 1) === currentIndex ? 'opacity-40' : 'opacity-10' })" />
            </div>
          </div>
        </div>

        <!-- 缩略图箭头使用绝对定位 -->
        <div v-if="showThumbArrows" :class="thumbsArrowGroupClass">
          <button type="button" :disabled="!canGoPrevThumb" :class="ui.thumbsArrow()" @click="prevThumb">
            <Icon
              :name="isThumbsVertical ? 'material-symbols:keyboard-arrow-up-rounded' : 'material-symbols:arrow-back-ios-new-rounded'"
              class="size-4.5" />
          </button>
          <button type="button" :disabled="!canGoNextThumb" :class="ui.thumbsArrow()" @click="nextThumb">
            <Icon
              :name="isThumbsVertical ? 'material-symbols:keyboard-arrow-down-rounded' : 'material-symbols:arrow-forward-ios-rounded'"
              class="size-4.5" />
          </button>
        </div>
      </div>

      <div :class="mainPaneClass">
        <div ref="mainRootRef" :class="ui.root()" :style="rootStyle" @mouseenter="isHovering = true" @mouseleave="isHovering = false">
          <div ref="viewportRef" :class="[
            ui.viewport(),
            effectiveGrabCursor && 'cursor-grab',
            effectiveGrabCursor && isDragging && 'cursor-grabbing'
          ]" :style="viewportStyle" :data-direction="effectiveDirection" tabindex="0" @mousedown="() => {
            if (effectiveGrabCursor) {
              isDragging = true;
              isJumping = false;
              isLoopTransitioning = false;
            }
          }" @mouseup="isDragging = false" @touchstart="() => {
            isDragging = true;
            isJumping = false;
            isLoopTransitioning = false;
          }" @touchend="isDragging = false" @mouseleave="isHovering = false; isDragging = false"
            @focusin="isFocused = true" @focusout="isFocused = false" @keydown="handleKeydown" @scroll="handleScroll"
            @scrollend="handleScrollEnd" @wheel="(e) => {
              // 防止垂直模式下滚动穿透到父容器
              if (isVertical.value) {
                e.stopPropagation();
              }
            }">
            <div ref="trackRef" :class="ui.track()" :style="trackStyle">
              <div v-for="(item, renderIdx) in renderSlides"
                :key="item.isClone ? `clone-${item.renderIndex}-${item.realIndex}` : `slide-${item.realIndex}`"
                :ref="(el: any) => setSlideRef(el, renderIdx)" :class="getSlideClass(item.realIndex)" :style="[
                  slideSizeStyle,
                  {
                    scrollSnapAlign: 'center',
                    scrollSnapStop: 'always',
                  },
                ]" :aria-hidden="item.isClone ? 'true' : undefined">
                <div :class="ui.slideInner({ class: getSlideInnerClass() })">
                  <CarouselSlotItem :slotFn="defaultSlotFn" :index="item.realIndex" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="showArrows" :class="ui.arrowGroup()">
            <slot name="prev" :prev="prev">
              <button type="button" aria-label="上一项" :disabled="!canGoPrev" :class="ui.arrow()" @click="prev">
                <Icon
                  :name="isVertical ? 'material-symbols:keyboard-arrow-up-rounded' : 'material-symbols:arrow-back-ios-new-rounded'"
                  :class="cn('size-5 transition-colors duration-200', !!canGoPrev && `active:text-${props.color}`)" />
              </button>
            </slot>
            <slot name="next" :next="next">
              <button type="button" aria-label="下一项" :disabled="!canGoNext" :class="ui.arrow()"
                @click="() => next(true)">
                <Icon
                  :name="isVertical ? 'material-symbols:keyboard-arrow-down-rounded' : 'material-symbols:arrow-forward-ios-rounded'"
                  :class="cn('size-5 transition-colors duration-200', !!canGoNext && `active:text-${props.color}`)" />
              </button>
            </slot>
          </div>

          <div v-if="showIndicators && effectiveIndicatorPosition === 'inside'" :class="ui.indicatorWrapper()"
            :style="indicatorWrapperStyle">
            <slot name="indicators" :active-index="currentIndex" :count="slideCount" :go-to="goTo">
              <div v-if="isFractionPagination"
                class="px-2 py-1 text-sm font-medium tabular-nums flex items-center justify-center min-w-20 rounded-full border border-white/60 bg-white/72 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 pointer-events-auto">
                <span :class="`text-${props.color}`">{{ currentIndex + 1 }}</span>
                <span class="mx-1 opacity-50">/</span>
                <span>{{ slideCount }}</span>
              </div>
              <div v-else :class="ui.indicators()">
                <template v-if="props.pagination?.type === 'button'">
                  <button v-for="(_, index) in slideCount" :key="`reborn-carousel-indicator-inside-btn-${index}`"
                    type="button" :aria-label="`切换到第 ${index + 1} 项`" :class="ui.indicator({
                      class: [
                        index === currentIndex ? ui.indicatorActive() : ui.indicatorInactive(),
                        index === currentIndex && `bg-${props.color}`,
                        'rounded-full', // 圆形
                      ],
                    })" @mouseenter="handleIndicatorEnter(index)" @click="handleIndicatorClick(index)">
                    {{ index + 1 }}
                  </button>
                </template>
                <button v-else v-for="(_, index) in slideCount" :key="`reborn-carousel-indicator-inside-${index}`"
                  type="button" :aria-label="`切换到第 ${index + 1} 项`" :class="ui.indicator({
                    class: [
                      index === currentIndex ? ui.indicatorActive() : ui.indicatorInactive(),
                      index === currentIndex && props.pagination?.type === 'dot' && `bg-${props.color}`,
                    ]
                  })" @mouseenter="handleIndicatorEnter(index)" @click="handleIndicatorClick(index)" />
              </div>
            </slot>
          </div>
        </div>

        <!-- outside 指示器在 mainPane 内部，但在 root 外部，确保不受 flex 影响 -->
        <div v-if="showIndicators && effectiveIndicatorPosition === 'outside'" :class="ui.indicatorWrapper()"
          :style="indicatorWrapperStyle">
          <slot name="indicators" :active-index="currentIndex" :count="slideCount" :go-to="goTo">
            <div v-if="isFractionPagination"
              class="px-2 py-1 text-sm font-medium tabular-nums flex items-center justify-center min-w-20 rounded-full border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900/60 pointer-events-auto">
              <span :class="`text-${props.color}`">{{ currentIndex + 1 }}</span>
              <span class="mx-1 opacity-50">/</span>
              <span>{{ slideCount }}</span>
            </div>
            <div v-else :class="ui.indicators()">
              <template v-if="props.pagination?.type === 'button'">
                <button v-for="(_, index) in slideCount" :key="`reborn-carousel-indicator-outside-btn-${index}`"
                  type="button" :aria-label="`切换到第 ${index + 1} 项`" :class="ui.indicator({
                    class: [
                      index === currentIndex ? ui.indicatorActive() : ui.indicatorInactive(),
                      index === currentIndex && `bg-${props.color}`,
                      'rounded-full', // 圆形
                    ],
                  })" @mouseenter="handleIndicatorEnter(index)" @click="handleIndicatorClick(index)">
                  {{ index + 1 }}
                </button>
              </template>
              <button v-else v-for="(_, index) in slideCount" :key="`reborn-carousel-indicator-outside-${index}`"
                type="button" :aria-label="`切换到第 ${index + 1} 项`" :class="ui.indicator({
                  class: [
                    index === currentIndex ? ui.indicatorActive() : ui.indicatorInactive(),
                    index === currentIndex && props.pagination?.type === 'dot' && `bg-${props.color}`,
                  ]
                })" @mouseenter="handleIndicatorEnter(index)" @click="handleIndicatorClick(index)" />
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>
