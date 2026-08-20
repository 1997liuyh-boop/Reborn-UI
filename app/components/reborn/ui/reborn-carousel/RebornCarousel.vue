<script setup lang="ts">
import type { PropType, VNode } from "vue";
import {
  Comment,
  Fragment,
  Text,
  cloneVNode,
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  unref,
  useSlots,
  watch,
} from "vue";
import { cn } from "~/lib/utils";
import { tv } from "~/lib/tv";
import theme from "./reborn-carousel.config";
import type {
  CarouselArrowMode,
  CarouselRenderSlide,
  CarouselThumbsPosition,
  RebornCarouselBreakpoint,
  RebornCarouselProps,
} from "./types";

// 统一应用默认值
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

/** 双向绑定外部传入的当前激活索引值 modelValue */
const modelValue = defineModel<number>("modelValue", {
  default: 0,
});

// 组件声明的抛出事件
const emit = defineEmits<{
  /** 幻灯片当前活动索引发生实质性改变时触发此事件 */
  (e: "change", value: number): void;
}>();

/** 内部辅助组件：动态挂载和管理单个幻灯片插槽内容的渲染，以规避 Fragment 节点带来的不确定性 */
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
      // 规范化获取插槽的所有虚拟节点列表
      const nodes = normalizeNodes(localProps.slotFn?.() ?? []);
      const node = nodes[localProps.index];
      // 使用 cloneVNode 创建全新的虚拟节点拷贝，避免同一个 VNode 实例在 VDOM 树的多个分支中被二次卸载导致 Null exposed 异常
      return node ? cloneVNode(node) : null;
    };
  },
});

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

/** 注入当前组件内的插槽数据 */
const slots = useSlots();
/** 默认匿名插槽节点计算属性 */
const defaultSlotFn = computed(() => slots.default ?? (() => []));
/** 获取基于 Tailwind-Variants 构建的主题样式解析器 */
const b = tv(theme);

/** 视口滚动容器 DOM 引用 */
const viewportRef = ref<HTMLDivElement | any>(null);
/** 轨道容器 DOM 引用 */
const trackRef = ref<HTMLDivElement | null>(null);
/** 缩略图滚动视口容器 DOM 引用 */
const thumbsViewportRef = ref<HTMLDivElement | null>(null);
/** 轮播图主视觉根级 DOM 引用 */
const mainRootRef = ref<HTMLDivElement | null>(null);
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
/** loop 模式下，当有极其快速的连续触发（如 hover 滑过多个指示点）时，用于缓存最初的物理视觉起点，以优化最短路径滚动路径 */
let loopTransitionStartIndex: number | null = null;
/** 连续指令迭代计数器，抛弃掉同帧微任务中积攒的过期 nextTick 响应 */
let loopGoToGeneration = 0;
/** 主箭头转场迭代计数器，用于丢弃快速点击产生的过期异步回调 */
let loopArrowGeneration = 0;

/** 窗口尺寸变化时的 Resize 处理句柄 */
let resizeHandler: (() => void) | null = null;
/** 监听视口容器尺寸变化的观察者实例 */
let resizeObserver: ResizeObserver | null = null;
/** 滚动位置检查的渲染帧句柄 */
let scrollFrame = 0;
/** 自动播放的间隔执行定时器 */
let autoplayTimer: any = null;
/** 布局防重入状态锁 */
let isUpdatingLayout = false;
/** 滚动执行中防干扰状态锁 */
let isApplyingIndex = false;
/** 布局批处理更新的 RequestAnimationFrame 帧标记 */
let layoutFrame = 0;

/** 判断当前是否仍处于一次切换流程中，避免重复点击或自动播放叠加推进 */
function isNavigationLocked() {
  return isJumping.value || isApplyingIndex || (props.loop && isLoopTransitioning.value);
}

/** 自动高度 (height="auto") 模式下，组件当前依据活动项动态计算的像素高度 */
const currentSlideHeight = ref(0);
/** 主图区域在视口中的物理宽高，用于联动计算并对齐缩略图面板 */
const mainRootSize = ref({ width: 0, height: 0 });
/** 针对主图最外层根节点的尺寸变化观察器 */
let mainRootObserver: ResizeObserver | null = null;

/**
 * 动态高度自适应计算：
 * 在自动高度配置下，提取当前幻灯片真实的 scrollHeight 并更新，
 * 触发根容器带 transition 的柔和高度平滑形变，避免高度突变影响内容排版。
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
      currentSlideHeight.value = slideInner.scrollHeight;
    }
  }
}

/** 规范化处理后，插槽内有效商品或图片幻灯片虚拟节点的只读列表 */
const slideNodes = computed(() => normalizeNodes(slots.default?.() ?? []));
/** 主插槽下真实的幻灯片总张数 */
const slideCount = computed(() => slideNodes.value.length);



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
    }
    return result;
  }, {});
});

/** 实时生效的单屏显示幻灯片张数 */
const effectiveSlidesPerView = computed(
  () => responsiveProps.value.slidesPerview ?? props.slidesPerview,
);
/** 实时生效的项目间距 */
const effectiveSpaceBetween = computed(
  () => responsiveProps.value.spaceBetween ?? props.spaceBetween,
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
const effectiveHeight = computed(() => responsiveProps.value.height ?? props.height);
/** 实时生效的展现风格 */
const effectiveType = computed(() => responsiveProps.value.type ?? props.type);
/** 实时生效的滚动方向线 */
const effectiveDirection = computed(() => responsiveProps.value.direction ?? props.direction);
/** 实时生效的手势拖拽抓取 */
const effectiveGrabCursor = computed(() => responsiveProps.value.grabCursor ?? props.grabCursor);
/** 实时生效的元素自适应尺寸 */
const effectiveAutoSize = computed(() => responsiveProps.value.autoSize ?? props.autoSize);

/** 当前运行是否为垂直单轴滚动 */
const isVertical = computed(() => effectiveDirection.value === "vertical");
/** 是否使用商品内容原生尺寸（卡片展现、自适应 auto 尺寸或自定尺寸等） */
const usesIntrinsicSlideSize = computed(
  () => effectiveType.value === "card" || effectiveSlidesPerView.value === "auto" || effectiveAutoSize.value,
);
/** 分页指示小点是否允许点击 */
const isIndicatorClickable = computed(() => props.pagination?.clickable !== false);
/** 是否应该在视口中绘制分页指示器组件 */
const showIndicators = computed(
  () =>
    props.pagination !== null &&
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

/** 动态指示器浮层容器样式，支持用户配置偏移量 */
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
      "flex-col test-4",
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

/** 精确测算的自动播放停留毫秒时间，最小下限保护为 800ms */
const autoplayDelay = computed(() => {
  if (props.autoplay === false) {
    return 0;
  }

  if (props.autoplay === true) {
    return 3000;
  }

  return Math.max(800, props.autoplay.delay ?? 3000);
});

/** 主根容器的动态样式，包含自动高度的平滑缓动渐变效果 */
const rootStyle = computed(() => {
  const isAuto = effectiveHeight.value === "auto";
  return {
    height: isAuto ? (currentSlideHeight.value ? `${currentSlideHeight.value}px` : "auto") : effectiveHeight.value,
    transition: isAuto ? "height 300ms cubic-bezier(0.4, 0, 0.2, 1)" : undefined,
  };
});

/** 视口容器的核心滚动样式控制 */
const viewportStyle = computed(() => {
  const isAuto = effectiveHeight.value === "auto";
  const base: Record<string, any> = {
    // 自动高度模式下视口随内容长，不由父级容器 100% 裁切，由 root 容器裁切
    height: isAuto ? "auto" : "100%",
    // 激活浏览器原生的 CSS Scroll Snap 特性，实现顺滑且无任何卡顿的滑移锁定
    scrollSnapType: isVertical.value ? "y mandatory" : "x mandatory",
    // 强制禁用 CSS 的默认 scroll-behavior，确保 loop 首尾衔接瞬时跳转毫无闪烁和感知
    scrollBehavior: "auto !important" as any,
  };

  return base;
});

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

/** 混入用户传递的自定义 ui 样式配置 */
const overrides = computed(() => props.ui || {});
/** 整合由 tv 组件主题配置与覆盖样式合成的各个核心节点最终使用的样式名列表 */
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
    wrapper: (opts: { class?: any } = {}) =>
      styles.wrapper({ class: cn(opts.class, overrides.value.wrapper) }),
    root: (opts: { class?: any } = {}) => styles.root({ class: cn(opts.class, overrides.value.root) }),
    viewport: (opts: { class?: any } = {}) =>
      styles.viewport({ class: cn(opts.class, overrides.value.viewport) }),
    track: (opts: { class?: any } = {}) =>
      styles.track({ class: cn(opts.class, overrides.value.track) }),
    slide: (opts: { class?: any; active?: boolean } = {}) => {
      const base = styles.slide({
        class: cn(
          opts.class,
          overrides.value.slide,
          effectiveHeight.value === "auto" && "h-auto",
          effectiveAutoSize.value && "!w-auto !h-auto self-center",
        ),
      });
      if (opts.active === undefined) return base;
      return cn(
        base,
        opts.active
          ? styles.slideActive({ class: cn(overrides.value.slideActive) })
          : styles.slideInactive({ class: cn(overrides.value.slideInactive) }),
      );
    },
    slideInner: (opts: { class?: any } = {}) =>
      styles.slideInner({
        class: cn(
          opts.class,
          overrides.value.slideInner,
          effectiveHeight.value === "auto" ? "h-auto" : "h-full",
          effectiveAutoSize.value && "!w-auto !h-auto inline-block",
        ),
      }),
    arrowGroup: (opts: { class?: any } = {}) =>
      styles.arrowGroup({ class: cn(opts.class, overrides.value.arrowGroup) }),
    arrow: (opts: { class?: any } = {}) =>
      styles.arrow({ class: cn(opts.class, overrides.value.arrow) }),
    indicatorWrapper: (opts: { class?: any } = {}) =>
      styles.indicatorWrapper({ class: cn(opts.class, overrides.value.indicatorWrapper) }),
    indicators: (opts: { class?: any } = {}) =>
      styles.indicators({ class: cn(opts.class, overrides.value.indicators) }),
    indicator: (opts: { class?: any } = {}) =>
      styles.indicator({ class: cn(opts.class, overrides.value.indicator) }),
    indicatorActive: (opts: { class?: any } = {}) =>
      styles.indicatorActive({
        class: cn(opts.class, overrides.value.indicatorActive),
      }),
    indicatorInactive: (opts: { class?: any } = {}) =>
      styles.indicatorInactive({
        class: cn(opts.class, overrides.value.indicatorInactive),
      }),
    slideActive: (opts: { class?: any } = {}) =>
      styles.slideActive({ class: cn(opts.class, overrides.value.slideActive) }),
    slideInactive: (opts: { class?: any } = {}) =>
      styles.slideInactive({ class: cn(opts.class, overrides.value.slideInactive) }),
    thumbsShell: (opts: { class?: any } = {}) =>
      styles.thumbsShell({ class: cn(opts.class, overrides.value.thumbsShell) }),
    thumbsPanel: (opts: { class?: any } = {}) =>
      styles.thumbsPanel({ class: cn(opts.class, overrides.value.thumbsPanel) }),
    thumbsViewport: (opts: { class?: any } = {}) =>
      styles.thumbsViewport({ class: cn(opts.class, overrides.value.thumbsViewport) }),
    thumbsTrack: (opts: { class?: any } = {}) =>
      styles.thumbsTrack({ class: cn(opts.class, overrides.value.thumbsTrack) }),
    thumbsArrowGroup: (opts: { class?: any } = {}) =>
      styles.thumbsArrowGroup({ class: cn(opts.class, overrides.value.thumbsArrowGroup) }),
    thumbsArrow: (opts: { class?: any } = {}) =>
      styles.thumbsArrow({ class: cn(opts.class, overrides.value.thumbsArrow) }),
    thumb: (opts: { class?: any; active?: boolean } = {}) => {
      const base = styles.thumb({
        class: cn(
          opts.class,
          overrides.value.thumb,
          isThumbsVertical.value
            ? "aspect-[4/3] w-full"
            : "aspect-[4/3] w-20 shrink-0 sm:w-24 md:w-28",
        ),
      });
      if (opts.active === undefined) return base;
      return cn(
        base,
        opts.active
          ? styles.thumbActive({ class: cn(overrides.value.thumbActive) })
          : styles.thumbInactive({ class: cn(overrides.value.thumbInactive) }),
      );
    },
    thumbActive: (opts: { class?: any } = {}) =>
      styles.thumbActive({ class: cn(opts.class, overrides.value.thumbActive) }),
    thumbInactive: (opts: { class?: any } = {}) =>
      styles.thumbInactive({ class: cn(opts.class, overrides.value.thumbInactive) }),
    thumbPreview: (opts: { class?: any; active?: boolean } = {}) =>
      styles.thumbPreview({
        class: cn(
          opts.class,
          overrides.value.thumbPreview,
          opts.active !== undefined && (opts.active ? "scale-100" : "scale-[0.96]"),
        ),
      }),
    thumbOverlay: (opts: { class?: any } = {}) =>
      styles.thumbOverlay({ class: cn(opts.class, overrides.value.thumbOverlay) }),
  };
});

/**
 * 索引安全约束：
 * 保证计算出来的活动项索引严格落在 [0, slideCount - 1] 的真实合法有效范围内。
 * 在无限循环模式下对超出区域取模运算以保持平顺。
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
function setSlideRef(el: any, index: number) {
  if (!el) {
    return;
  }

  const element = (el.$el || el) as HTMLElement;
  slideRefs.value[index] = element;
}

/**
 * 缩略图渲染回调句柄，用于提取并缓存所有联动缩略图原生 DOM 对象引用
 */
function setThumbRef(el: any, index: number) {
  if (!el) {
    return;
  }

  const element = (el.$el || el) as HTMLElement;
  thumbRefs.value[index] = element;
}

/**
 * 重新规划并安全批量触发一次轨道排版布局计算。
 * 运用 RequestAnimationFrame 对布局回调防反洗和防抖，
 * 规避因频繁高度测量造成的重绘排版损耗。
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
    // 强制视口回滚对齐当前激活项的 DOM 位置
    scrollToRenderIndex(realToRenderIndex(currentIndex.value), "auto");
    isUpdatingLayout = false;
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
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
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

/**
 * loop 模式下的 next：滚动到渲染列表中当前位置的下一个，
 * 动画结束后静默跳转到真实位置。
 */
function next(isManual: boolean | any = true) {
  if (slideCount.value <= 1) {
    return;
  }

  // 平滑转场（含末尾静默跳转窗口）进行中再次触发：中止当前转场并接受新指令（连点即快速前进），
  // 避免因转场锁把点击静默丢弃而出现"需要点两次才切换"。
  // 此刻视口已停在目标张（或转场途中），从当前位置续接新的平滑滚动即可，无视觉突兀。
  if (props.loop && isLoopTransitioning.value) {
    abortLoopTransition();
  } else if (isJumping.value || isApplyingIndex) {
    // 非 loop 的瞬时跳转 / applyIndex 窗口：期间改写会导致状态错乱，忽略
    return;
  }

  if (isManual !== false) {
    startAutoplay();
  }

  if (props.loop) {
    isLoopTransitioning.value = true;
    const generation = ++loopArrowGeneration;
    const nextReal = (currentIndex.value + 1) % slideCount.value;
    const crossingSeam = currentIndex.value === slideCount.value - 1;
    const currentRenderIdx = realToRenderIndex(currentIndex.value);
    const targetRenderIdx = realToRenderIndex(nextReal);

    setActiveIndex(nextReal, { emitChange: true, syncModel: true });

    // 平滑滚动到真实位并在结束后同步索引；接缝时提前用瞬跳换到同图克隆位，
    // 使这段平滑滚动落在「已绘制的真实张」上，避免滑入未绘制克隆张时的绘制卡顿
    const runSmooth = () => {
      if (generation !== loopArrowGeneration) {
        return;
      }
      scrollToRenderIndex(targetRenderIdx, "smooth");
      waitForScrollEnd(() => {
        if (generation !== loopArrowGeneration) {
          return;
        }
        jumpToRealPosition(nextReal);
      });
    };

    nextTick(() => {
      if (generation !== loopArrowGeneration) {
        return;
      }
      if (crossingSeam) {
        // 瞬跳到与当前同图的前置克隆相邻位（视觉无感知），
        // 并把随后的平滑滚动放到下一帧，避免瞬跳与平滑在同一帧被合并成硬跳
        scrollToRenderIndex(currentRenderIdx - slideCount.value, "instant");
        requestAnimationFrame(runSmooth);
      } else {
        runSmooth();
      }
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

  // 平滑转场（含末尾静默跳转窗口）进行中再次触发：中止当前转场并接受新指令（连点即快速后退），
  // 避免因转场锁把点击静默丢弃而出现"需要点两次才切换"。
  if (props.loop && isLoopTransitioning.value) {
    abortLoopTransition();
  } else if (isJumping.value || isApplyingIndex) {
    // 非 loop 的瞬时跳转 / applyIndex 窗口：期间改写会导致状态错乱，忽略
    return;
  }

  // 手动跳转重置自动播放计时
  startAutoplay();

  if (props.loop) {
    isLoopTransitioning.value = true;
    const generation = ++loopArrowGeneration;
    const prevReal = (currentIndex.value - 1 + slideCount.value) % slideCount.value;
    const crossingSeam = currentIndex.value === 0;
    const currentRenderIdx = realToRenderIndex(currentIndex.value);
    const targetRenderIdx = realToRenderIndex(prevReal);

    setActiveIndex(prevReal, { emitChange: true, syncModel: true });

    // 平滑滚动到真实位并在结束后同步索引；接缝时提前用瞬跳换到同图克隆位，
    // 使这段平滑滚动落在「已绘制的真实张」上，避免滑入未绘制克隆张时的绘制卡顿
    const runSmooth = () => {
      if (generation !== loopArrowGeneration) {
        return;
      }
      scrollToRenderIndex(targetRenderIdx, "smooth");
      waitForScrollEnd(() => {
        if (generation !== loopArrowGeneration) {
          return;
        }
        jumpToRealPosition(prevReal);
      });
    };

    nextTick(() => {
      if (generation !== loopArrowGeneration) {
        return;
      }
      if (crossingSeam) {
        // 瞬跳到与当前同图的后置克隆相邻位（视觉无感知），
        // 并把随后的平滑滚动放到下一帧，避免瞬跳与平滑在同一帧被合并成硬跳
        scrollToRenderIndex(currentRenderIdx + slideCount.value, "instant");
        requestAnimationFrame(runSmooth);
      } else {
        runSmooth();
      }
    });
  } else {
    if (currentIndex.value <= 0) {
      return;
    }
    goTo(currentIndex.value - 1);
  }
}

/**
 * loop 模式下的 goTo（指示器点击/悬停等场景）。
 * - 取最短路径：在直接路径与通过克隆区的反向路径之间取绝对值更小的一侧，
 *   避免诸如"从尾页点回首页要反向滚多张"的体验问题。
 * - 转场进行中：中止当前转场以接收新指令，避免连续点击被丢弃。
 */
function loopGoTo(targetReal: number) {
  if (targetReal === currentIndex.value) {
    return;
  }

  // 连续触发（如 hover 扫过中间指示器）时，继续使用最初的视觉起点计算最短路径，
  // 避免 currentIndex 已被前一次覆盖导致算出"绕远路"
  const wasTransitioning = isLoopTransitioning.value;
  const originIndex =
    wasTransitioning && loopTransitionStartIndex !== null
      ? loopTransitionStartIndex
      : currentIndex.value;

  if (wasTransitioning) {
    abortLoopTransition();
  }

  if (targetReal === originIndex) {
    // 新目标正是视觉起点（hover 回退），无需滚动
    setActiveIndex(targetReal, { emitChange: true, syncModel: true });
    loopTransitionStartIndex = null;
    return;
  }

  // 手动跳转重置自动播放计时
  startAutoplay();

  isLoopTransitioning.value = true;
  loopTransitionStartIndex = originIndex;
  const generation = ++loopGoToGeneration;
  const total = slideCount.value;
  const directDiff = targetReal - originIndex;
  // 通过克隆区绕行的差值（与直接路径方向相反）
  const altDiff = directDiff > 0 ? directDiff - total : directDiff + total;
  // 选择绝对值更小的方向；相等时优先正向
  const diff = Math.abs(directDiff) <= Math.abs(altDiff) ? directDiff : altDiff;
  const originRenderIdx = realToRenderIndex(originIndex);
  const targetRenderIdx = originRenderIdx + diff;

  setActiveIndex(targetReal, { emitChange: true, syncModel: true });

  nextTick(() => {
    // 过期的回调直接丢弃（快速 hover 导致同一微任务内堆积多个 nextTick）
    if (generation !== loopGoToGeneration) {
      return;
    }
    // 连触发前，视口可能停在前一次转场的中间位置；先瞬时对齐到视觉起点再平滑滚动，
    // 确保动画方向与最短路径一致
    if (wasTransitioning) {
      scrollToRenderIndex(originRenderIdx, "instant");
    }
    scrollToRenderIndex(targetRenderIdx, "smooth");

    waitForScrollEnd(() => {
      if (generation !== loopGoToGeneration) {
        return;
      }
      loopTransitionStartIndex = null;
      jumpToRealPosition(targetReal);
    });
  });
}

/** 当前未触发的 waitForScrollEnd 等待句柄，用于在中止转场时清理 */
let pendingScrollEndCleanup: (() => void) | null = null;

/**
 * 等待滚动结束后执行回调。
 * 使用 scrollend 事件（现代浏览器支持），降级为 setTimeout。
 * 同时记录清理函数，避免被 abortLoopTransition 中断后回调仍然触发，
 * 否则会导致后续手动切换被误重置。
 */
function waitForScrollEnd(callback: () => void) {
  // 进入新一轮等待前，先清掉前一次尚未触发的等待，避免叠加触发
  pendingScrollEndCleanup?.();
  pendingScrollEndCleanup = null;

  const viewport = viewportRef.value;

  if (!viewport) {
    callback();
    return;
  }

  // 优先使用 scrollend 事件
  if ("onscrollend" in viewport) {
    const handler = () => {
      pendingScrollEndCleanup = null;
      callback();
    };
    viewport.addEventListener("scrollend", handler, { once: true });
    pendingScrollEndCleanup = () => {
      viewport.removeEventListener("scrollend", handler);
    };
  } else {
    // 降级方案：等待足够长时间（考虑 transition-all 500ms）
    const timeoutId = setTimeout(() => {
      pendingScrollEndCleanup = null;
      callback();
    }, 600);
    pendingScrollEndCleanup = () => {
      clearTimeout(timeoutId);
    };
  }
}

/**
 * 中止当前正在进行的 loop 转场。
 * 仅由"手动切换在转场进行中再次触发"的场景调用：
 * 取消挂起的 scrollend 等待并解锁状态机，让新一次切换能立即开始；
 * 当前浏览器原生 smooth scroll 会被随后的 scrollTo 平滑接续，无需手动归位。
 */
function abortLoopTransition() {
  loopArrowGeneration++;
  pendingScrollEndCleanup?.();
  pendingScrollEndCleanup = null;
  isLoopTransitioning.value = false;
  isJumping.value = false;
  loopTransitionStartIndex = null;
}

/**
 * 拖拽开始时统一中止未完成的 loop 转场，避免遗留 scrollend 回调继续改写索引
 */
function handleDragStart() {
  isDragging.value = true;

  if (props.loop && isLoopTransitioning.value) {
    abortLoopTransition();
    return;
  }

  isJumping.value = false;
}

function handleMouseDragStart() {
  if (effectiveGrabCursor.value) {
    handleDragStart();
  }
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

  if (nextTarget && mainRootRef.value?.contains(nextTarget)) {
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

  if (isHovering.value || isFocused.value || isDragging.value || isNavigationLocked()) {
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
});

/** 暴露给外部调用的方法 */
defineExpose({
  /** 平滑滚动切换到下一张：loop 下可从末张无缝回到首张，非 loop 已在末张时无操作；触发 change 并重置自动播放计时 */
  next,
  /** 平滑滚动切换到上一张：loop 下可从首张无缝回到末张，非 loop 已在首张时无操作；触发 change 并重置自动播放计时 */
  prev,
  /** goTo(index)：带平滑滚动动画跳转到指定索引（从 0 起，loop 下越界自动取模），同步 v-model、触发 change 并重置自动播放计时 */
  goTo,
});
</script>

<template>
  <div :class="ui.wrapper({ class: props.class })">
    <div :class="thumbsShellClass">
      <div v-if="showThumbs && isThumbsReady" :class="thumbsPanelClass" :style="thumbsPanelStyle">
        <div ref="thumbsViewportRef" :class="thumbsViewportClass">
          <div :class="thumbsTrackClass">
            <div v-for="index in slideCount" :key="`thumb-${index - 1}`" :ref="(el: any) => setThumbRef(el, index - 1)"
              :class="ui.thumb({ active: (index - 1) === currentIndex })"
              :aria-current="(index - 1) === currentIndex ? 'true' : 'false'" role="button" tabindex="0"
              @click="handleThumbClick(index - 1)" @keydown="(event) => handleThumbKeydown(index - 1, event)">
              <div :class="ui.thumbPreview({ active: (index - 1) === currentIndex })">
                <CarouselSlotItem :slotFn="defaultSlotFn" :index="index - 1" />
              </div>
              <div :class="ui.thumbOverlay({ class: (index - 1) === currentIndex ? 'opacity-40' : 'opacity-10' })" />
            </div>
          </div>
        </div>

        <!-- 缩略图箭头使用绝对定位 -->
        <div v-if="showThumbArrows" :class="thumbsArrowGroupClass">
          <button type="button" :disabled="!canGoPrevThumb" :class="ui.thumbsArrow()" @click="prevThumb">
            <Icon :name="isThumbsVertical ? 'lucide:chevron-up' : 'lucide:chevron-left'" class="size-4.5" />
          </button>
          <button type="button" :disabled="!canGoNextThumb" :class="ui.thumbsArrow()" @click="nextThumb">
            <Icon :name="isThumbsVertical ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="size-4.5" />
          </button>
        </div>
      </div>

      <div :class="mainPaneClass">
        <div ref="mainRootRef" :class="ui.root()" :style="rootStyle" @pointerenter="handlePointerEnter"
          @pointerleave="handlePointerLeave" @focusin="handleFocusIn" @focusout="handleFocusOut">
          <div ref="viewportRef" :class="[
            ui.viewport(),
            effectiveGrabCursor && 'cursor-grab',
            effectiveGrabCursor && isDragging && 'cursor-grabbing'
          ]" :style="viewportStyle" :data-direction="effectiveDirection" tabindex="0"
            @mousedown="handleMouseDragStart" @mouseup="isDragging = false" @touchstart="handleDragStart"
            @touchend="isDragging = false" @mouseleave="isDragging = false" @keydown="handleKeydown"
            @scroll="handleScroll" @scrollend="handleScrollEnd" @wheel="(e) => {
              // 防止垂直模式下滚动穿透到父容器
              if (isVertical) {
                e.stopPropagation();
              }
            }">
            <div ref="trackRef" :class="ui.track()" :style="trackStyle">
              <div v-for="(item, renderIdx) in renderSlides"
                :key="item.isClone ? `clone-${item.renderIndex}-${item.realIndex}` : `slide-${item.realIndex}`"
                :ref="(el: any) => setSlideRef(el, renderIdx)"
                :class="ui.slide({ active: item.realIndex === currentIndex })" :style="[
                  slideSizeStyle,
                  {
                    scrollSnapAlign: 'center',
                    scrollSnapStop: 'always',
                  },
                ]" :aria-hidden="item.isClone ? 'true' : undefined">
                <div :class="ui.slideInner()">
                  <CarouselSlotItem :slotFn="defaultSlotFn" :index="item.realIndex" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="showArrows" :class="ui.arrowGroup()">
            <slot name="prev" :prev="prev">
              <button type="button" aria-label="上一项" :disabled="!canGoPrev" :class="ui.arrow()" @click="prev">
                <Icon :name="isVertical ? 'lucide:chevron-up' : 'lucide:chevron-left'"
                  :class="cn('size-5 transition-colors duration-200', !!canGoPrev && `active:text-${props.color}`)" />
              </button>
            </slot>
            <slot name="next" :next="next">
              <button type="button" aria-label="下一项" :disabled="!canGoNext" :class="ui.arrow()"
                @click="() => next(true)">
                <Icon :name="isVertical ? 'lucide:chevron-down' : 'lucide:chevron-right'"
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
