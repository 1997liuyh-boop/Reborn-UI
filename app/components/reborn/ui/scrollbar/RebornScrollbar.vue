<script lang="ts" setup>
/**
 * RebornScrollbar 浮层式滚动条
 *
 * 原生滚动条被彻底隐藏（宽度为 0），滚动条视觉由绝对定位的浮层 DOM 承担，
 * 因此滚动条悬浮于内容之上，内容可视宽度不受有无滚动条影响，不产生布局抖动。
 * 粗细与 hover / 拖拽态颜色均由 CSS 变量驱动，不受浏览器原生滚动条限制。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

interface Props {
  /** 滚动条粗细，可传 4 / 6 / 8 档位或任意像素数值，默认继承 CSS 变量的 6px */
  size?: number | string;
  /** 是否常驻显示滚动条；为 false 时仅在悬停容器或滚动过程中淡入 */
  always?: boolean;
  /** thumb 最小长度（px），防止内容极长时 thumb 小到无法拖拽 */
  minThumbSize?: number;
  /** 是否启用横向滚动条，关闭时横向内容被裁剪 */
  horizontal?: boolean;
  /** 停止滚动后隐藏滚动条的延迟（ms），仅 always 为 false 时生效 */
  hideDelay?: number;
  /**
   * 轨道两端的圆角安全内缩（px）。
   * "auto"（默认）按容器实际 border-radius 自动推算；传数值则固定为该值，传 0 关闭内缩。
   */
  inset?: number | "auto";
  /** 顶部固定内容高度（px），仅从纵向轨道与表体视窗中排除，默认 0 */
  verticalOffset?: number;
  /**
   * 轨道是否显形。
   * false（默认）为完全透明的悬浮感；true 使用内置浅灰轨道并自动适配暗色；传颜色字符串则用该颜色。
   */
  track?: boolean | string;
  /** 命令式滚动的默认动画时长（ms），传 0 关闭动画 */
  scrollDuration?: number;
  /** 附加到内部滚动层的类名，用于设置内边距等 */
  wrapClass?: string;
  /** 附加到内容层的类名 */
  contentClass?: string;
}

/** 命令式滚动的可选参数 */
interface ScrollToOptions {
  /** 是否使用动画滚动，默认 true；传 false 立即落位 */
  animated?: boolean;
  /** 本次动画时长（ms），缺省取 scrollDuration */
  duration?: number;
  /**
   * 是否静默滚动，默认 false。
   * 为 true 时本次滚动不会让滚动条淡入（悬停、拖拽照常显示），
   * 用于打开面板时定位选中项这类非用户发起的滚动，避免滚动条无故闪现。
   */
  silent?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  always: false,
  minThumbSize: 20,
  horizontal: true,
  hideDelay: 800,
  inset: "auto",
  verticalOffset: 0,
  track: false,
  scrollDuration: 400,
});

const emit = defineEmits<{
  /** 滚动时触发，携带当前滚动偏移 */
  scroll: [payload: { scrollTop: number; scrollLeft: number }];
}>();

/** 单条滚动条的几何状态 */
interface BarState {
  /** 内容是否溢出，决定该方向滚动条是否存在 */
  active: boolean;
  /** thumb 长度（px） */
  size: number;
  /** thumb 相对轨道起点的偏移（px） */
  offset: number;
}

const rootRef = ref<HTMLElement | null>(null);
const wrapRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

const vertical = ref<BarState>({ active: false, size: 0, offset: 0 });
const horizontalBar = ref<BarState>({ active: false, size: 0, offset: 0 });

/** 轨道两端实际生效的内缩（px）：由 inset 属性指定，或按容器 border-radius 自动推算 */
const insetValue = ref(0);
/** 非零顶部偏移只覆盖纵轨；默认继续使用原有 CSS 内缩定位 */
const verticalTrackStyle = ref<{ top?: string; height?: string }>({});

/** 当前正在拖拽的方向，null 表示未拖拽 */
const dragging = ref<"y" | "x" | null>(null);
/** 鼠标悬停在容器上 */
const hovering = ref(false);
/** 正在滚动中（用于非常驻模式的淡入） */
const scrolling = ref(false);

let hideTimer: ReturnType<typeof setTimeout> | null = null;
let resizeObserver: ResizeObserver | null = null;

/** 命令式滚动动画的帧 id，null 表示当前没有动画 */
let scrollFrame: number | null = null;
/** 当前动画对应的 Promise resolve，动画结束或被打断时调用 */
let scrollResolve: (() => void) | null = null;
/**
 * 下一次 scroll 事件来自静默滚动。
 * scroll 事件异步派发且同帧多次写入会合并为一次，因此用标记而非同步判断，
 * 由 onScroll 消费后清除。
 */
let silentPending = false;

/** 拖拽起点：鼠标坐标与起始滚动偏移 */
let dragStartPos = 0;
let dragStartScroll = 0;
/** 拖拽开始时轨道的视口像素 / 布局像素比例，抵消祖先缩放 */
let dragScale = 1;

/** 尺寸 prop 转为 CSS 变量值；纯数字按 px 处理，其余原样透传（如 "0.5rem"） */
const sizeValue = computed(() => {
  const raw = props.size;
  if (raw === undefined || raw === null || raw === "") return undefined;
  return typeof raw === "number" || /^\d+(?:\.\d+)?$/.test(String(raw)) ? `${raw}px` : String(raw);
});

/** 写到根元素上的 CSS 变量；外部通过 :style 传入的同名变量会覆盖这里的值 */
const rootStyle = computed(() => {
  const style: Record<string, string> = {
    "--reborn-scrollbar-inset": `${insetValue.value}px`,
  };
  if (sizeValue.value) style["--reborn-scrollbar-size"] = sizeValue.value;
  // track 传颜色字符串时直接覆盖轨道颜色；传 true 走类名以便自动适配暗色
  if (typeof props.track === "string" && props.track) style["--reborn-scrollbar-track"] = props.track;
  return style;
});

/** 滚动条是否可见：常驻、悬停或滚动中，且拖拽过程中始终可见 */
const barVisible = computed(() => props.always || hovering.value || scrolling.value || dragging.value !== null);

/**
 * 计算轨道两端的圆角安全内缩。
 *
 * 容器带 border-radius 且 overflow: hidden 时，贴边的轨道会让 thumb 滚到
 * 顶端 / 末端时被圆角弧线削掉一角。以轨道最外侧那一列像素与弧线的交点求内缩量：
 * 设圆角半径 R、轨道离容器边缘 gap，则 inset = R - √(R² - (R - gap)²)。
 * gap ≥ R 时轨道已在直边区域，无需内缩。
 *
 * inset 属性传入数值时跳过自动测量，直接采用该值（0 即关闭内缩）。
 */
function measureInset() {
  if (typeof props.inset === "number") {
    insetValue.value = Math.max(props.inset, 0);
    return;
  }

  const root = rootRef.value;
  if (!root || typeof window === "undefined") return;

  const styles = window.getComputedStyle(root);
  // 纵向条贴右侧、横向条贴底部，取这三个角中最大的半径以覆盖全部端点
  const radius = Math.max(
    Number.parseFloat(styles.borderTopRightRadius) || 0,
    Number.parseFloat(styles.borderBottomRightRadius) || 0,
    Number.parseFloat(styles.borderBottomLeftRadius) || 0,
  );

  if (radius <= 0) {
    insetValue.value = 0;
    return;
  }

  const gap = Number.parseFloat(styles.getPropertyValue("--reborn-scrollbar-gap")) || 0;
  const dx = Math.max(radius - gap, 0);
  // 向上取整留 1px 余量，避免亚像素下仍有轻微切边
  insetValue.value = Math.ceil(radius - Math.sqrt(Math.max(radius * radius - dx * dx, 0)));
}

/** 纵向几何统一排除固定头部；过大的偏移最多占满可用轨道 */
function getVerticalGeometry(wrap: HTMLElement) {
  const available = Math.max(wrap.clientHeight - insetValue.value * 2, 0);
  const requested = Number.isFinite(props.verticalOffset) ? props.verticalOffset : 0;
  const offset = Math.min(Math.max(requested, 0), available);
  return {
    offset,
    trackLength: available - offset,
    clientHeight: wrap.clientHeight - offset,
    scrollHeight: wrap.scrollHeight - offset,
  };
}

/** 重新测量并计算两个方向 thumb 的长度与位置 */
function update() {
  const wrap = wrapRef.value;
  if (!wrap) return;

  const { clientHeight, scrollHeight, scrollTop, clientWidth, scrollWidth, scrollLeft } = wrap;
  // 轨道两端各内缩一次，thumb 的长度与行程都以轨道长度为基准
  const shrink = insetValue.value * 2;
  const body = getVerticalGeometry(wrap);
  verticalTrackStyle.value = {
    top: body.offset > 0 ? `${insetValue.value + body.offset}px` : undefined,
    // 正常零偏移保留上下内缩定位，极矮视窗则显式归零，避免轨道盒子反向撑开。
    height: body.offset > 0 || clientHeight < shrink ? `${body.trackLength}px` : undefined,
  };

  // 纵向：容差 1px，规避亚像素导致的误判
  if (scrollHeight > clientHeight + 1) {
    const trackLength = body.trackLength;
    // 上限夹到轨道长度，避免容器极矮时 minThumbSize 撑破轨道
    const thumbSize = Math.min(
      Math.max((body.clientHeight / body.scrollHeight) * trackLength, props.minThumbSize),
      trackLength,
    );
    const maxScroll = scrollHeight - clientHeight;
    const maxOffset = trackLength - thumbSize;
    vertical.value = {
      active: true,
      size: thumbSize,
      offset: maxScroll > 0 ? (scrollTop / maxScroll) * maxOffset : 0,
    };
  } else {
    vertical.value = { active: false, size: 0, offset: 0 };
  }

  // 横向
  if (props.horizontal && scrollWidth > clientWidth + 1) {
    const trackLength = Math.max(clientWidth - shrink, 0);
    const thumbSize = Math.min(Math.max((clientWidth / scrollWidth) * trackLength, props.minThumbSize), trackLength);
    const maxScroll = scrollWidth - clientWidth;
    const maxOffset = trackLength - thumbSize;
    horizontalBar.value = {
      active: true,
      size: thumbSize,
      offset: maxScroll > 0 ? (scrollLeft / maxScroll) * maxOffset : 0,
    };
  } else {
    horizontalBar.value = { active: false, size: 0, offset: 0 };
  }
}

/** 完整刷新：先重算圆角内缩，再重算 thumb 几何（尺寸变化时使用） */
function refresh() {
  measureInset();
  update();
}

/** 滚动时同步 thumb 位置，并在非常驻模式下短暂显示滚动条 */
function onScroll() {
  const wrap = wrapRef.value;
  if (!wrap) return;
  update();
  emit("scroll", { scrollTop: wrap.scrollTop, scrollLeft: wrap.scrollLeft });

  // 静默滚动只同步 thumb 位置，不触发淡入
  if (silentPending) {
    silentPending = false;
    return;
  }
  if (props.always) return;
  scrolling.value = true;
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    scrolling.value = false;
  }, props.hideDelay);
}

/** 将轨道的视口盒子与布局长度关联，点击和拖拽使用相同坐标换算 */
function getTrackGeometry(wrap: HTMLElement, track: HTMLElement, axis: "y" | "x") {
  const rect = track.getBoundingClientRect();
  const length = axis === "y"
    ? getVerticalGeometry(wrap).trackLength
    : Math.max(wrap.clientWidth - insetValue.value * 2, 0);
  const renderedLength = axis === "y" ? rect.height : rect.width;
  return {
    length,
    start: axis === "y" ? rect.top : rect.left,
    scale: length > 0 ? renderedLength / length : 0,
  };
}

/** 按下 thumb 开始拖拽 */
function onThumbMouseDown(event: MouseEvent, axis: "y" | "x") {
  // 阻止默认行为避免拖拽时选中文本
  event.preventDefault();
  event.stopPropagation();
  const wrap = wrapRef.value;
  const track = (event.currentTarget as HTMLElement | null)?.parentElement;
  if (!wrap || !track) return;

  // 用户接管滚动，中止未完成的动画
  stopScroll();

  dragging.value = axis;
  dragStartPos = axis === "y" ? event.clientY : event.clientX;
  dragStartScroll = axis === "y" ? wrap.scrollTop : wrap.scrollLeft;
  dragScale = getTrackGeometry(wrap, track, axis).scale;

  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);
  // 拖拽期间禁用全局文本选中，避免误选
  document.body.style.userSelect = "none";
}

/** 拖拽中：把鼠标位移按「轨道可移动距离 : 内容可滚动距离」换算成滚动偏移 */
function onDragMove(event: MouseEvent) {
  const wrap = wrapRef.value;
  const axis = dragging.value;
  if (!wrap || !axis || dragScale <= 0) return;

  // 轨道被两端内缩，行程要按内缩后的轨道长度换算，否则拖拽与 thumb 会脱节
  const shrink = insetValue.value * 2;

  if (axis === "y") {
    const maxOffset = getVerticalGeometry(wrap).trackLength - vertical.value.size;
    const maxScroll = wrap.scrollHeight - wrap.clientHeight;
    if (maxOffset <= 0) return;
    const target = dragStartScroll + ((event.clientY - dragStartPos) / dragScale / maxOffset) * maxScroll;
    wrap.scrollTop = Math.min(Math.max(target, 0), maxScroll);
  } else {
    const maxOffset = wrap.clientWidth - shrink - horizontalBar.value.size;
    const maxScroll = wrap.scrollWidth - wrap.clientWidth;
    if (maxOffset <= 0) return;
    wrap.scrollLeft = dragStartScroll + ((event.clientX - dragStartPos) / dragScale / maxOffset) * maxScroll;
  }
}

/** 结束拖拽，清理全局监听与文本选中限制 */
function onDragEnd() {
  dragging.value = null;
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);
  document.body.style.userSelect = "";
}

/** 点击轨道空白处：把 thumb 中心跳转到点击位置 */
function onTrackMouseDown(event: MouseEvent, axis: "y" | "x") {
  const wrap = wrapRef.value;
  const track = event.currentTarget as HTMLElement | null;
  if (!wrap || !track) return;

  // 用户接管滚动，中止未完成的动画
  stopScroll();

  const { length, start, scale } = getTrackGeometry(wrap, track, axis);
  const thumbSize = axis === "y" ? vertical.value.size : horizontalBar.value.size;
  const maxOffset = length - thumbSize;
  if (maxOffset <= 0 || scale <= 0) return;
  // 鼠标与 rect 都是视口坐标，先还原为布局像素，再对齐滑块中心。
  const position = ((axis === "y" ? event.clientY : event.clientX) - start) / scale;
  const target = Math.min(Math.max(position - thumbSize / 2, 0), maxOffset);
  const maxScroll = axis === "y" ? wrap.scrollHeight - wrap.clientHeight : wrap.scrollWidth - wrap.clientWidth;
  if (axis === "y") wrap.scrollTop = (target / maxOffset) * maxScroll;
  else wrap.scrollLeft = (target / maxOffset) * maxScroll;
}

/** 程序请求只替换动画，保留已写入位移所对应的待派发静默标记 */
function cancelScrollAnimation() {
  if (scrollFrame !== null) {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = null;
  }
  // 动画被打断时也要结束等待，避免调用方的 await 永远挂起
  scrollResolve?.();
  scrollResolve = null;
}

/**
 * 中止进行中的滚动动画。
 * 用户滚轮、拖拽 thumb、点击轨道时都会调用，避免手势与动画互相打架。
 */
function stopScroll() {
  cancelScrollAnimation();
  // 用户接管滚动时作废静默标记，让随后的滚动正常显示滚动条
  silentPending = false;
}

/** 缓动曲线 easeInOutCubic：起步与收尾平缓、中段快，观感最接近原生平滑滚动 */
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * 命令式滚动到指定偏移。
 * 目标值会夹紧到 [0, 最大可滚动距离]；返回的 Promise 在动画结束或被打断时 resolve。
 */
function scrollAxisTo(axis: "y" | "x", value: number, options?: ScrollToOptions): Promise<void> {
  return scrollTo(axis === "y" ? { top: value } : { left: value }, options);
}

/** 同一次请求以一条动画时间线驱动两轴；未指定的轴始终不写入 */
function scrollTo(position: { top?: number; left?: number }, options?: ScrollToOptions): Promise<void> {
  const wrap = wrapRef.value;
  if (!wrap) return Promise.resolve();

  // 新程序请求覆盖旧动画，但无位移请求不能抹掉上一笔待派发的 scroll 标记。
  cancelScrollAnimation();

  const hasTop = position.top !== undefined && !Number.isNaN(position.top);
  const hasLeft = position.left !== undefined && !Number.isNaN(position.left);
  const fromTop = wrap.scrollTop;
  const fromLeft = wrap.scrollLeft;
  const toTop = hasTop
    ? Math.min(Math.max(position.top!, 0), Math.max(wrap.scrollHeight - wrap.clientHeight, 0))
    : fromTop;
  const toLeft = hasLeft
    ? Math.min(Math.max(position.left!, 0), Math.max(wrap.scrollWidth - wrap.clientWidth, 0))
    : fromLeft;
  const distanceTop = toTop - fromTop;
  const distanceLeft = toLeft - fromLeft;
  const duration = options?.duration ?? props.scrollDuration;
  const animated = options?.animated ?? true;
  const silent = options?.silent ?? false;
  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /** 同一帧内写入请求指定的轴，保留已有静默滚动的异步事件标记 */
  const apply = (progress: number) => {
    const beforeTop = wrap.scrollTop;
    const beforeLeft = wrap.scrollLeft;
    if (hasTop) wrap.scrollTop = fromTop + distanceTop * progress;
    if (hasLeft) wrap.scrollLeft = fromLeft + distanceLeft * progress;
    // 仅实际位移更新标记：无位移保留旧状态，非静默位移则恢复正常淡入。
    if (wrap.scrollTop !== beforeTop || wrap.scrollLeft !== beforeLeft) silentPending = silent;
  };

  // 减少动态效果、关闭动画、无位移或环境无 rAF 时直接落位。
  if (
    !animated || reducedMotion || !Number.isFinite(duration) || duration <= 0
    || (distanceTop === 0 && distanceLeft === 0) || typeof requestAnimationFrame === "undefined"
  ) {
    apply(1);
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    scrollResolve = resolve;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      apply(easeInOutCubic(progress));
      if (progress < 1) {
        scrollFrame = requestAnimationFrame(step);
        return;
      }
      scrollFrame = null;
      scrollResolve = null;
      resolve();
    };
    scrollFrame = requestAnimationFrame(step);
  });
}

/** 滚动到指定纵向偏移，默认带缓动动画；传 { animated: false } 立即落位 */
function setScrollTop(value: number, options?: ScrollToOptions) {
  return scrollAxisTo("y", value, options);
}

/** 滚动到指定横向偏移，默认带缓动动画；传 { animated: false } 立即落位 */
function setScrollLeft(value: number, options?: ScrollToOptions) {
  return scrollAxisTo("x", value, options);
}

// 横向开关变化时需要重算（关闭后横向内容被裁剪，scrollWidth 会变）
watch(() => props.horizontal, update);
// 粗细变化会改变轨道与边缘的关系，需连圆角内缩一起重算
watch(() => props.size, refresh);
// 内缩策略切换（auto ↔ 固定值）后立即按新策略重算
watch(() => props.inset, refresh);
// 固定头部高度变化或开关切换时同步轨道与 thumb，不等待下一次滚动。
watch(() => props.verticalOffset, update);

onMounted(() => {
  refresh();
  // 容器与内容任一尺寸变化都要重算 thumb（尺寸变化可能伴随圆角变化，故用 refresh）
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(refresh);
    if (wrapRef.value) resizeObserver.observe(wrapRef.value);
    if (contentRef.value) resizeObserver.observe(contentRef.value);
  }
});

onBeforeUnmount(() => {
  if (hideTimer) clearTimeout(hideTimer);
  resizeObserver?.disconnect();
  resizeObserver = null;
  // 卸载时中止滚动动画，避免 rAF 回调访问已销毁的 DOM
  stopScroll();
  // 组件在拖拽中被卸载时，兜底清理全局监听
  onDragEnd();
});

defineExpose({ update, refresh, scrollTo, setScrollTop, setScrollLeft, stopScroll, wrapRef });
</script>

<template>
  <div
    ref="rootRef"
    class="reborn-scrollbar"
    :class="{ 'reborn-scrollbar--track': track === true }"
    :style="rootStyle"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <!-- 滚动层：原生滚动条已隐藏，宽度为 0，内容可视宽度恒定 -->
    <!-- 滚轮 / 触摸表示用户接管滚动，需中止进行中的动画 -->
    <div
      ref="wrapRef"
      class="reborn-scrollbar__wrap"
      :class="[wrapClass, { 'reborn-scrollbar__wrap--no-x': !horizontal }]"
      @scroll="onScroll"
      @wheel.passive="stopScroll"
      @touchstart.passive="stopScroll"
    >
      <div ref="contentRef" :class="contentClass">
        <slot />
      </div>
    </div>

    <!-- 纵向滚动条浮层 -->
    <div
      v-show="vertical.active"
      class="reborn-scrollbar__bar reborn-scrollbar__bar--vertical"
      :class="{ 'is-visible': barVisible }"
      :style="verticalTrackStyle"
      @mousedown="onTrackMouseDown($event, 'y')"
    >
      <div
        class="reborn-scrollbar__thumb"
        :class="{ 'is-dragging': dragging === 'y' }"
        :style="{ height: `${vertical.size}px`, transform: `translateY(${vertical.offset}px)` }"
        @mousedown="onThumbMouseDown($event, 'y')"
      />
    </div>

    <!-- 横向滚动条浮层 -->
    <div
      v-show="horizontalBar.active"
      class="reborn-scrollbar__bar reborn-scrollbar__bar--horizontal"
      :class="{ 'is-visible': barVisible }"
      @mousedown="onTrackMouseDown($event, 'x')"
    >
      <div
        class="reborn-scrollbar__thumb"
        :class="{ 'is-dragging': dragging === 'x' }"
        :style="{ width: `${horizontalBar.size}px`, transform: `translateX(${horizontalBar.offset}px)` }"
        @mousedown="onThumbMouseDown($event, 'x')"
      />
    </div>
  </div>
</template>
