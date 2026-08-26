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
  /**
   * 轨道是否显形。
   * false（默认）为完全透明的悬浮感；true 使用内置浅灰轨道并自动适配暗色；传颜色字符串则用该颜色。
   */
  track?: boolean | string;
  /** 命令式滚动（setScrollTop / setScrollLeft）的默认动画时长（ms），传 0 关闭动画 */
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
}

const props = withDefaults(defineProps<Props>(), {
  always: false,
  minThumbSize: 20,
  horizontal: true,
  hideDelay: 800,
  inset: "auto",
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

/** 拖拽起点：鼠标坐标与起始滚动偏移 */
let dragStartPos = 0;
let dragStartScroll = 0;

/** 尺寸 prop 转为 CSS 变量值；纯数字按 px 处理，其余原样透传（如 "0.5rem"） */
const sizeValue = computed(() => {
  const raw = props.size;
  if (raw === undefined || raw === null || raw === "") return undefined;
  return typeof raw === "number" || /^\d+(\.\d+)?$/.test(String(raw)) ? `${raw}px` : String(raw);
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

/** 重新测量并计算两个方向 thumb 的长度与位置 */
function update() {
  const wrap = wrapRef.value;
  if (!wrap) return;

  const { clientHeight, scrollHeight, scrollTop, clientWidth, scrollWidth, scrollLeft } = wrap;
  // 轨道两端各内缩一次，thumb 的长度与行程都以轨道长度为基准
  const shrink = insetValue.value * 2;

  // 纵向：容差 1px，规避亚像素导致的误判
  if (scrollHeight > clientHeight + 1) {
    const trackLength = Math.max(clientHeight - shrink, 0);
    // 上限夹到轨道长度，避免容器极矮时 minThumbSize 撑破轨道
    const thumbSize = Math.min(Math.max((clientHeight / scrollHeight) * trackLength, props.minThumbSize), trackLength);
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

  if (props.always) return;
  scrolling.value = true;
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    scrolling.value = false;
  }, props.hideDelay);
}

/** 按下 thumb 开始拖拽 */
function onThumbMouseDown(event: MouseEvent, axis: "y" | "x") {
  // 阻止默认行为避免拖拽时选中文本
  event.preventDefault();
  event.stopPropagation();
  const wrap = wrapRef.value;
  if (!wrap) return;

  // 用户接管滚动，中止未完成的动画
  stopScroll();

  dragging.value = axis;
  dragStartPos = axis === "y" ? event.clientY : event.clientX;
  dragStartScroll = axis === "y" ? wrap.scrollTop : wrap.scrollLeft;

  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);
  // 拖拽期间禁用全局文本选中，避免误选
  document.body.style.userSelect = "none";
}

/** 拖拽中：把鼠标位移按「轨道可移动距离 : 内容可滚动距离」换算成滚动偏移 */
function onDragMove(event: MouseEvent) {
  const wrap = wrapRef.value;
  const axis = dragging.value;
  if (!wrap || !axis) return;

  // 轨道被两端内缩，行程要按内缩后的轨道长度换算，否则拖拽与 thumb 会脱节
  const shrink = insetValue.value * 2;

  if (axis === "y") {
    const maxOffset = wrap.clientHeight - shrink - vertical.value.size;
    const maxScroll = wrap.scrollHeight - wrap.clientHeight;
    if (maxOffset <= 0) return;
    wrap.scrollTop = dragStartScroll + ((event.clientY - dragStartPos) / maxOffset) * maxScroll;
  } else {
    const maxOffset = wrap.clientWidth - shrink - horizontalBar.value.size;
    const maxScroll = wrap.scrollWidth - wrap.clientWidth;
    if (maxOffset <= 0) return;
    wrap.scrollLeft = dragStartScroll + ((event.clientX - dragStartPos) / maxOffset) * maxScroll;
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

  // rect 是轨道自身的盒子，已含两端内缩，点击点直接相对轨道起点计算即可
  const rect = track.getBoundingClientRect();
  if (axis === "y") {
    const thumbSize = vertical.value.size;
    const maxOffset = rect.height - thumbSize;
    const maxScroll = wrap.scrollHeight - wrap.clientHeight;
    if (maxOffset <= 0) return;
    // 让 thumb 中心对齐点击点，并夹紧到合法区间
    const target = Math.min(Math.max(event.clientY - rect.top - thumbSize / 2, 0), maxOffset);
    wrap.scrollTop = (target / maxOffset) * maxScroll;
  } else {
    const thumbSize = horizontalBar.value.size;
    const maxOffset = rect.width - thumbSize;
    const maxScroll = wrap.scrollWidth - wrap.clientWidth;
    if (maxOffset <= 0) return;
    const target = Math.min(Math.max(event.clientX - rect.left - thumbSize / 2, 0), maxOffset);
    wrap.scrollLeft = (target / maxOffset) * maxScroll;
  }
}

/**
 * 中止进行中的滚动动画。
 * 用户滚轮、拖拽 thumb、点击轨道时都会调用，避免手势与动画互相打架。
 */
function stopScroll() {
  if (scrollFrame !== null) {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = null;
  }
  // 动画被打断时也要结束等待，避免调用方的 await 永远挂起
  scrollResolve?.();
  scrollResolve = null;
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
  const wrap = wrapRef.value;
  if (!wrap) return Promise.resolve();

  // 新的滚动请求覆盖上一次未完成的动画
  stopScroll();

  const maxScroll = Math.max(
    axis === "y" ? wrap.scrollHeight - wrap.clientHeight : wrap.scrollWidth - wrap.clientWidth,
    0,
  );
  const to = Math.min(Math.max(value, 0), maxScroll);
  const from = axis === "y" ? wrap.scrollTop : wrap.scrollLeft;
  const distance = to - from;
  const duration = options?.duration ?? props.scrollDuration;
  const animated = options?.animated ?? true;

  /** 按轴写入滚动偏移 */
  const apply = (offset: number) => {
    if (axis === "y") wrap.scrollTop = offset;
    else wrap.scrollLeft = offset;
  };

  // 关闭动画、时长为 0、已在目标位置或环境无 rAF（如 SSR）时直接落位
  if (!animated || duration <= 0 || distance === 0 || typeof requestAnimationFrame === "undefined") {
    apply(to);
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    scrollResolve = resolve;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      apply(from + distance * easeInOutCubic(progress));
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

defineExpose({ update, refresh, setScrollTop, setScrollLeft, stopScroll, wrapRef });
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
