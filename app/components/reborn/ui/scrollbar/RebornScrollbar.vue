<script lang="ts" setup>
/**
 * RebornScrollbar 浮层式滚动条
 *
 * 原生滚动条被彻底隐藏（宽度为 0），滚动条视觉由绝对定位的浮层 DOM 承担，
 * 因此滚动条悬浮于内容之上，内容可视宽度不受有无滚动条影响，不产生布局抖动。
 * 粗细与 hover / 拖拽态颜色均由 CSS 变量驱动，不受浏览器原生滚动条限制。
 *
 * 两条滚动条的 DOM 放在内部子组件 RebornScrollbarBars 里，滚动几何与悬停、淡入、拖拽状态
 * 存进一个引用不变的 reactive 对象、就地修改字段。本组件渲染时不读取这些状态，
 * 滚动与悬停只让子组件更新，默认插槽不会随每次 scroll 重跑。
 */
import type { ScrollbarBarsState, ScrollbarBarState } from "./RebornScrollbarBars.vue";
import { computed, onBeforeUnmount, onMounted, reactive, shallowRef, useTemplateRef, watch } from "vue";
import { prefersReducedMotion } from "~/lib/motion";
import RebornScrollbarBars from "./RebornScrollbarBars.vue";
import { BOUNCE_DISTANCE, BOUNCE_DURATION, claimedWheels, WHEEL_ARRIVAL_WINDOW, WHEEL_GESTURE_GAP } from "./scrollbar-bounce";

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
   * 轨道两端的内缩（px）。
   * "auto"（默认）取贴边间距 --reborn-scrollbar-gap 与按容器 border-radius 推算值中的较大者，
   * 轨道四周都不贴边；传数值则固定为该值，传 0 让两端贴边。
   */
  inset?: number | "auto";
  /**
   * 滚轮滚到顶部 / 底部（横向为最左 / 最右）时是否播放 2px 的回弹反馈。
   * 只响应滚轮与触控板；拖拽滑块、点击轨道、命令式滚动与触屏不回弹，系统开启「减少动态效果」时不播放
   */
  bounce?: boolean;
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
  bounce: true,
  verticalOffset: 0,
  track: false,
  scrollDuration: 400,
});

const emit = defineEmits<{
  /** 滚动时触发，携带当前滚动偏移 */
  scroll: [payload: { scrollTop: number; scrollLeft: number }];
}>();

const rootRef = useTemplateRef<HTMLElement>("rootRef");
const wrapRef = useTemplateRef<HTMLElement>("wrapRef");
const contentRef = useTemplateRef<HTMLElement>("contentRef");

/**
 * 两条滚动条的几何与交互状态，只由子组件 RebornScrollbarBars 在渲染时读取。
 * 引用保持不变、字段就地修改；值未变化的写入不会触发更新
 */
const bars = reactive<ScrollbarBarsState>({
  y: { active: false, size: 0, offset: 0 },
  x: { active: false, size: 0, offset: 0 },
  // 非零顶部偏移只覆盖纵轨；默认继续使用原有 CSS 内缩定位
  yTrackTop: undefined,
  yTrackHeight: undefined,
  hovering: false,
  scrolling: false,
  dragging: null,
});

/** 轨道两端实际生效的内缩（px）：由 inset 属性指定，或按容器 border-radius 自动推算 */
const insetValue = shallowRef(0);

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
/** 下一次 scroll 事件来自命令式滚动，消费方式同 silentPending；这类滚动到达边缘不回弹 */
let programmaticPending = false;

/** 某一轴当前停靠的边缘：start 为顶部 / 最左，end 为底部 / 最右，null 为中间或该轴不可滚动 */
type ScrollEdge = "start" | "end" | null;
/** 上一次记录的两轴边缘状态，scroll 时对比它判断是否刚刚到达边缘 */
const edges: Record<"y" | "x", ScrollEdge> = { y: null, x: null };
/** 最近一次 wheel 事件的时间戳，用来区分滚轮送达与拖拽、点击轨道等其它到达方式 */
let lastWheelAt = Number.NEGATIVE_INFINITY;
/** 本次滚轮手势里已经回弹过的边缘（如 "y-end"），手势结束或离开该边缘后清除 */
let bouncedEdge: string | null = null;
let wheelGestureTimer: ReturnType<typeof setTimeout> | null = null;
/** 进行中的回弹动画；播放期间不叠加新的回弹 */
let bounceAnimation: Animation | null = null;

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

/**
 * 计算轨道两端的内缩。
 *
 * 下限是贴边一侧的间距 gap：轨道离容器右 / 下边缘留了 gap，两端也留同样的距离，四周边距一致。
 * 容器带 border-radius 且 overflow: hidden 时，贴边的轨道还会让 thumb 滚到
 * 顶端 / 末端时被圆角弧线削掉一角。以轨道最外侧那一列像素与弧线的交点求内缩量：
 * 设圆角半径 R、轨道离容器边缘 gap，则 R - √(R² - (R - gap)²)。
 * gap ≥ R 时轨道已在直边区域，弧线不构成约束。最终取两者较大值。
 *
 * inset 属性传入数值时跳过自动测量，直接采用该值（0 即两端贴边）。
 */
function measureInset() {
  if (typeof props.inset === "number") {
    insetValue.value = Math.max(props.inset, 0);
    return;
  }

  const root = rootRef.value;
  if (!root || typeof window === "undefined") return;

  const styles = window.getComputedStyle(root);
  const gap = Number.parseFloat(styles.getPropertyValue("--reborn-scrollbar-gap")) || 0;
  // 纵向条贴右侧、横向条贴底部，取这三个角中最大的半径以覆盖全部端点
  const radius = Math.max(
    Number.parseFloat(styles.borderTopRightRadius) || 0,
    Number.parseFloat(styles.borderBottomRightRadius) || 0,
    Number.parseFloat(styles.borderBottomLeftRadius) || 0,
  );

  const dx = Math.max(radius - gap, 0);
  // 向上取整留 1px 余量，避免亚像素下仍有轻微切边
  const curve = radius > 0 ? Math.ceil(radius - Math.sqrt(Math.max(radius * radius - dx * dx, 0))) : 0;
  insetValue.value = Math.max(gap, curve);
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

/** 就地写入单条滚动条的几何，值不变的字段不会触发子组件更新 */
function setBar(bar: ScrollbarBarState, active: boolean, size: number, offset: number) {
  bar.active = active;
  bar.size = size;
  bar.offset = offset;
}

/** 重新测量并计算两个方向 thumb 的长度与位置 */
function update() {
  const wrap = wrapRef.value;
  if (!wrap) return;

  const { clientHeight, scrollHeight, scrollTop, clientWidth, scrollWidth, scrollLeft } = wrap;
  // 轨道两端各内缩一次，thumb 的长度与行程都以轨道长度为基准
  const shrink = insetValue.value * 2;
  const body = getVerticalGeometry(wrap);
  bars.yTrackTop = body.offset > 0 ? `${insetValue.value + body.offset}px` : undefined;
  // 正常零偏移保留上下内缩定位，极矮视窗则显式归零，避免轨道盒子反向撑开。
  bars.yTrackHeight = body.offset > 0 || clientHeight < shrink ? `${body.trackLength}px` : undefined;

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
    setBar(bars.y, true, thumbSize, maxScroll > 0 ? (scrollTop / maxScroll) * maxOffset : 0);
  } else {
    setBar(bars.y, false, 0, 0);
  }

  // 横向
  if (props.horizontal && scrollWidth > clientWidth + 1) {
    const trackLength = Math.max(clientWidth - shrink, 0);
    const thumbSize = Math.min(Math.max((clientWidth / scrollWidth) * trackLength, props.minThumbSize), trackLength);
    const maxScroll = scrollWidth - clientWidth;
    const maxOffset = trackLength - thumbSize;
    setBar(bars.x, true, thumbSize, maxScroll > 0 ? (scrollLeft / maxScroll) * maxOffset : 0);
  } else {
    setBar(bars.x, false, 0, 0);
  }
}

/** 完整刷新：先重算圆角内缩，再重算 thumb 几何（尺寸变化时使用） */
function refresh() {
  measureInset();
  update();
  // 尺寸变化可能让位置离开或贴上边缘，只更新记录，不算「到达」
  if (wrapRef.value) syncEdges(wrapRef.value, false);
}

/** 某一轴的最大可滚动距离；横向关闭时视为不可滚动 */
function maxScrollOf(wrap: HTMLElement, axis: "y" | "x") {
  if (axis === "y") return wrap.scrollHeight - wrap.clientHeight;
  return props.horizontal ? wrap.scrollWidth - wrap.clientWidth : 0;
}

/** 读取某一轴当前停靠的边缘；容差 1px，规避缩放下的亚像素滚动位置 */
function readEdge(wrap: HTMLElement, axis: "y" | "x"): ScrollEdge {
  const max = maxScrollOf(wrap, axis);
  if (max <= 1) return null;
  const position = axis === "y" ? wrap.scrollTop : wrap.scrollLeft;
  if (position <= 1) return "start";
  if (position >= max - 1) return "end";
  return null;
}

/**
 * 更新两轴的边缘记录；allowBounce 为 true 时，刚到达边缘的轴播放回弹。
 * 离开已回弹过的边缘后清掉手势锁，同一手势里滚回来还能再弹一次。
 */
function syncEdges(wrap: HTMLElement, allowBounce: boolean) {
  for (const axis of ["y", "x"] as const) {
    const edge = readEdge(wrap, axis);
    const previous = edges[axis];
    edges[axis] = edge;
    if (bouncedEdge?.startsWith(axis) && bouncedEdge !== `${axis}-${edge}`) bouncedEdge = null;
    if (allowBounce && edge && edge !== previous) playBounce(axis, edge);
  }
}

/**
 * 播放一次边缘回弹：滚动层朝越界方向位移 2px 后回到原位。
 *
 * 位移加在滚动层 wrap 上而不是内容层：内容层向上平移会缩小可滚动区域，
 * 停在底部时 scrollTop 被浏览器夹回，动画结束后就不再贴底；平移滚动层本身不改变任何滚动量。
 * 用原生 WAAPI 且不保留结束帧，播完不在滚动层上留下 transform，
 * 内部 position: fixed 元素只在这 320ms 内以滚动层为定位参照。
 */
function playBounce(axis: "y" | "x", edge: "start" | "end") {
  const wrap = wrapRef.value;
  const key = `${axis}-${edge}`;
  if (!wrap || !props.bounce || bouncedEdge === key) return;
  bouncedEdge = key;
  if (bounceAnimation || typeof wrap.animate !== "function" || prefersReducedMotion()) return;

  // 到达顶部 / 最左时内容顺着来势继续往下 / 往右多走一点，底部 / 最右反之
  const distance = edge === "start" ? BOUNCE_DISTANCE : -BOUNCE_DISTANCE;
  const translate = (value: number) => (axis === "y" ? `translateY(${value}px)` : `translateX(${value}px)`);
  // 缓动逐段生效：前 30% 快速冲出，后段平滑收回，不做反向过冲
  bounceAnimation = wrap.animate(
    [
      { transform: translate(0), easing: "cubic-bezier(0.2, 0, 0, 1)" },
      { transform: translate(distance), offset: 0.3, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
      { transform: translate(0) },
    ],
    { duration: BOUNCE_DURATION },
  );
  const release = () => {
    bounceAnimation = null;
  };
  bounceAnimation.onfinish = release;
  bounceAnimation.oncancel = release;
}

/**
 * 滚轮输入：中止命令式动画，并处理「已在边缘还继续朝外滚」的回弹。
 * 这种情况浏览器不派发 scroll，只能在 wheel 里判断；刚滚到边缘的情况由 onScroll 处理。
 */
function onWheel(event: WheelEvent) {
  stopScroll();
  lastWheelAt = performance.now();
  // 每个 wheel 都把手势结束往后推，惯性滚动期间同一边缘只回弹一次
  if (wheelGestureTimer) clearTimeout(wheelGestureTimer);
  wheelGestureTimer = setTimeout(() => {
    wheelGestureTimer = null;
    bouncedEdge = null;
  }, WHEEL_GESTURE_GAP);

  // Ctrl + 滚轮是缩放手势；已被内层实例认领的事件不再参与判断
  const wrap = wrapRef.value;
  if (!wrap || event.ctrlKey || claimedWheels.has(event)) return;

  // Shift + 滚轮在部分平台只报 deltaY，浏览器按横向滚动处理
  const shifted = event.shiftKey && event.deltaX === 0;
  const dx = shifted ? event.deltaY : event.deltaX;
  const dy = shifted ? 0 : event.deltaY;
  const axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x";
  const delta = axis === "y" ? dy : dx;
  if (delta === 0 || maxScrollOf(wrap, axis) <= 1) return;

  // 本实例在该方向上能滚动，事件归它；关闭回弹的实例同样认领，外层不会替它回弹
  claimedWheels.add(event);
  const edge = readEdge(wrap, axis);
  if ((delta < 0 && edge === "start") || (delta > 0 && edge === "end")) playBounce(axis, edge);
}

/** 滚动时同步 thumb 位置，并在非常驻模式下短暂显示滚动条 */
function onScroll() {
  const wrap = wrapRef.value;
  if (!wrap) return;
  update();
  emit("scroll", { scrollTop: wrap.scrollTop, scrollLeft: wrap.scrollLeft });

  // 只有滚轮送达的边缘才回弹：拖拽滑块、点击轨道与命令式滚动都不在滚轮时间窗内或被单独排除
  const programmatic = programmaticPending;
  programmaticPending = false;
  syncEdges(
    wrap,
    props.bounce && !programmatic && bars.dragging === null && performance.now() - lastWheelAt < WHEEL_ARRIVAL_WINDOW,
  );

  // 静默滚动只同步 thumb 位置，不触发淡入
  if (silentPending) {
    silentPending = false;
    return;
  }
  if (props.always) return;
  bars.scrolling = true;
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    bars.scrolling = false;
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

  bars.dragging = axis;
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
  const axis = bars.dragging;
  if (!wrap || !axis || dragScale <= 0) return;

  // 轨道被两端内缩，行程要按内缩后的轨道长度换算，否则拖拽与 thumb 会脱节
  const shrink = insetValue.value * 2;

  if (axis === "y") {
    const maxOffset = getVerticalGeometry(wrap).trackLength - bars.y.size;
    const maxScroll = wrap.scrollHeight - wrap.clientHeight;
    if (maxOffset <= 0) return;
    const target = dragStartScroll + ((event.clientY - dragStartPos) / dragScale / maxOffset) * maxScroll;
    wrap.scrollTop = Math.min(Math.max(target, 0), maxScroll);
  } else {
    const maxOffset = wrap.clientWidth - shrink - bars.x.size;
    const maxScroll = wrap.scrollWidth - wrap.clientWidth;
    if (maxOffset <= 0) return;
    wrap.scrollLeft = dragStartScroll + ((event.clientX - dragStartPos) / dragScale / maxOffset) * maxScroll;
  }
}

/** 结束拖拽，清理全局监听与文本选中限制 */
function onDragEnd() {
  bars.dragging = null;
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
  const thumbSize = axis === "y" ? bars.y.size : bars.x.size;
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
  // 用户接管滚动时作废静默与命令式标记，让随后的滚动正常显示滚动条、到边正常回弹
  silentPending = false;
  programmaticPending = false;
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
    if (wrap.scrollTop !== beforeTop || wrap.scrollLeft !== beforeLeft) {
      silentPending = silent;
      programmaticPending = true;
    }
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
  if (wheelGestureTimer) clearTimeout(wheelGestureTimer);
  bounceAnimation?.cancel();
  resizeObserver?.disconnect();
  resizeObserver = null;
  // 卸载时中止滚动动画，避免 rAF 回调访问已销毁的 DOM
  stopScroll();
  // 组件在拖拽中被卸载时，兜底清理全局监听；未拖拽时不动 body 的 userSelect，
  // 否则会解除其他实例或组件（如分割面板）正在施加的禁选
  if (bars.dragging !== null) onDragEnd();
});

defineExpose({ update, refresh, scrollTo, setScrollTop, setScrollLeft, stopScroll, wrapRef });
</script>

<template>
  <div
    ref="rootRef"
    class="reborn-scrollbar"
    :class="{ 'reborn-scrollbar--track': track === true }"
    :style="rootStyle"
    @mouseenter="bars.hovering = true"
    @mouseleave="bars.hovering = false"
  >
    <!-- 滚动层：原生滚动条已隐藏，宽度为 0，内容可视宽度恒定 -->
    <!-- 滚轮 / 触摸表示用户接管滚动，需中止进行中的动画；滚轮另负责边缘回弹 -->
    <div
      ref="wrapRef"
      class="reborn-scrollbar__wrap"
      :class="[wrapClass, { 'reborn-scrollbar__wrap--no-x': !horizontal }]"
      @scroll="onScroll"
      @wheel.passive="onWheel"
      @touchstart.passive="stopScroll"
    >
      <div ref="contentRef" :class="contentClass">
        <slot />
      </div>
    </div>

    <!-- 纵横两条滚动条浮层：几何与可见状态只在子组件里读取，滚动时本组件不重渲染 -->
    <RebornScrollbarBars
      :state="bars"
      :always="always"
      @track-down="onTrackMouseDown"
      @thumb-down="onThumbMouseDown"
    />
  </div>
</template>
