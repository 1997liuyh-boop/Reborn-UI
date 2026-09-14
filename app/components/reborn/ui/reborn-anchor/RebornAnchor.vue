<script setup lang="ts">
import type {
  AnchorColor,
  AnchorDirection,
  AnchorLinkMeta,
  AnchorMarker,
  AnchorType,
  AnchorUI,
} from "./reborn-anchor.config";
import { useEventListener, useResizeObserver } from "@vueuse/core";
import { computed, nextTick, onBeforeUnmount, onMounted, provide, shallowRef, watch } from "vue";
import { cn } from "~/lib/utils";
import theme, { ANCHOR_INJECTION_KEY } from "./reborn-anchor.config";

defineOptions({
  name: "RebornAnchor",
});

const props = withDefaults(defineProps<RebornAnchorProps>(), {
  offset: 0,
  bound: 15,
  duration: 300,
  marker: true,
  type: "default",
  direction: "vertical",
  color: "primary",
  selectScrollTop: false,
});

const emit = defineEmits<{
  /** 选中的链接改变时触发，载荷为新的 href；滚动到首个锚点之前为 undefined */
  (e: "change", href: string | undefined): void;
  /** 用户点击链接时触发，在滚动之前；在此调用 event.preventDefault() 可拦下组件的默认滚动 */
  (e: "click", event: MouseEvent, href: string | undefined): void;
}>();

export interface RebornAnchorProps {
  /** 滚动的容器，传选择器字符串时在客户端挂载后才查询；留空监听整个窗口 */
  container?: string | HTMLElement | Window;
  /** 锚点滚动的偏移量，滚动后目标元素距容器顶部的距离 */
  offset?: number;
  /** 触发锚点的元素的位置偏移量，目标顶部进入这条线以内即视为选中 */
  bound?: number;
  /** 容器滚动持续时间，单位为毫秒；小于等于 0 时直接跳转 */
  duration?: number;
  /**
   * 标记形态。true 等价于 bar、false 等价于 none；
   * 横向锚点只支持 bar 与 none，传圆点会按 bar 渲染
   */
  marker?: boolean | AnchorMarker;
  /** 锚点类型 */
  type?: AnchorType;
  /** 锚点方向，只影响链接列表的排布，滚动始终是纵向的 */
  direction?: AnchorDirection;
  /** 强调色，决定选中文字与标记的颜色 */
  color?: AnchorColor;
  /** 滚动时链接是否选中位于顶部，开启后 bound 不参与判定 */
  selectScrollTop?: boolean;
  class?: any;
  /** 细粒度样式覆盖对象，键为 root/list/marker/item/link/linkTitle/sublist */
  ui?: AnchorUI;
}

const listRef = shallowRef<HTMLElement>();
/** 链接登记表，顺序即渲染顺序，挂载后按 DOM 先后校正 */
const links = shallowRef<AnchorLinkMeta[]>([]);
/** 当前选中的链接 href */
const activeHref = shallowRef<string>();
/** 解析后的滚动容器；SSR 阶段为 undefined，挂载后才查询 DOM */
const scrollTarget = shallowRef<HTMLElement | Window>();

const isVertical = computed(() => props.direction === "vertical");
const uiOverrides = computed<AnchorUI>(() => props.ui || {});

/** 归一化后的标记形态：布尔值折成 bar / none，横向再把圆点收敛回 bar */
const markerShape = computed<AnchorMarker>(() => {
  const raw = props.marker;
  const shape: AnchorMarker = raw === true ? "bar" : raw === false ? "none" : raw;
  // 圆点是骑在竖轨道上的形态，贴底的横轨道上只能是一段滑块
  if (!isVertical.value && shape !== "none") return "bar";
  return shape;
});

const baseVariants = computed(() => ({
  type: props.type,
  direction: props.direction,
  color: props.color,
  marker: markerShape.value,
}));

const styles = computed(() => theme(baseVariants.value));

const ui = computed(() => ({
  root: (opts?: { class?: any }) => styles.value.root({ class: cn(opts?.class, uiOverrides.value.root) }),
  list: () => styles.value.list({ class: uiOverrides.value.list }),
  marker: () => styles.value.marker({ class: uiOverrides.value.marker }),
}));

const itemClass = computed(() => styles.value.item({ class: uiOverrides.value.item }));
const linkTitleClass = computed(() => styles.value.linkTitle({ class: uiOverrides.value.linkTitle }));
const sublistClass = computed(() => styles.value.sublist({ class: uiOverrides.value.sublist }));

/** 选中态逐个链接不同，不能并入根节点那次一次性计算 */
function linkClass(active: boolean) {
  return theme({ ...baseVariants.value, active }).link({ class: uiOverrides.value.link });
}

function addLink(meta: AnchorLinkMeta) {
  links.value = [...links.value, meta];
}

function removeLink(meta: AnchorLinkMeta) {
  links.value = links.value.filter(item => item !== meta);
}

/** setup 顺序在链接被插入到中间时会失真，挂载后按 a 节点的 DOM 先后重排，否则滚动判定的顺序是错的 */
function sortLinks() {
  const next = [...links.value].sort((a, b) => {
    if (!a.el || !b.el) return 0;
    return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
  if (next.some((item, index) => item !== links.value[index])) links.value = next;
}

/**
 * href 形如 `#section-id`，取井号之后的部分按 id 查找。
 * 用 getElementById 而不是 querySelector：数字开头、含冒号或点号的 id 不是合法选择器，会直接抛错
 */
function resolveTarget(href?: string) {
  if (!href || typeof document === "undefined") return undefined;
  const id = href.startsWith("#") ? href.slice(1) : href;
  return id ? (document.getElementById(id) ?? undefined) : undefined;
}

/** 解析滚动容器。字符串在此刻查询 DOM，查不到就不监听滚动，不回落到窗口以免监听错对象 */
function resolveContainer() {
  if (typeof window === "undefined") return;
  const raw = props.container;
  if (raw === undefined) {
    scrollTarget.value = window;
    return;
  }
  scrollTarget.value
    = typeof raw === "string" ? (document.querySelector<HTMLElement>(raw) ?? undefined) : raw;
}

function getScroll() {
  const container = scrollTarget.value;
  if (!container) return 0;
  return container === window ? window.scrollY : (container as HTMLElement).scrollTop;
}

/** 容器能滚到的最大距离，用于判定是否已经触底 */
function getMaxScroll() {
  const container = scrollTarget.value;
  if (!container) return 0;
  if (container === window) {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }
  const box = container as HTMLElement;
  return Math.max(0, box.scrollHeight - box.clientHeight);
}

/**
 * behavior 显式给 instant：容器若在 CSS 里写了 scroll-behavior: smooth，
 * 默认值会让浏览器再叠一层平滑滚动，与这里的补间互相打架
 */
function setScroll(value: number) {
  scrollTarget.value?.scrollTo({ top: value, behavior: "instant" });
}

/** 目标元素顶部距容器可视区顶部的距离，向下为正 */
function getOffsetTop(el: HTMLElement) {
  const top = el.getBoundingClientRect().top;
  const container = scrollTarget.value;
  if (!container || container === window) return top;
  const box = container as HTMLElement;
  // 再减 clientTop 才是内容盒起点，容器带上边框时不这样算会整体差一个边框的宽度
  return top - box.getBoundingClientRect().top - box.clientTop;
}

function setActive(href: string | undefined) {
  if (activeHref.value === href) return;
  activeHref.value = href;
  // 受控绑定下写入后同步读仍可能是旧值，事件载荷用本地新值
  emit("change", href);
}

/** 补间期间置位，滚动监听据此跳过判定，避免程序滚动与滚动判定互相打架 */
let scrolling = false;
let tweenFrame: number | undefined;

function cancelTween() {
  if (tweenFrame !== undefined) cancelAnimationFrame(tweenFrame);
  tweenFrame = undefined;
  scrolling = false;
}

/** ease-in-out：起步与收尾都慢，长距离滚动时不会突兀 */
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** transition-none 只能关掉 CSS 过渡、关不掉 JS 补间，减弱动画的判定必须写在这里 */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** 按当前滚动位置挑出选中的链接 */
function updateActive() {
  if (scrolling || !scrollTarget.value) return;
  const candidates = links.value.filter(item => item.href);
  const last = candidates.at(-1);
  if (!last) return;

  // 触底时强制选中最后一项：末尾区块不足一屏高时，它的顶部永远越不过触发线
  if (getScroll() >= getMaxScroll() - 1) {
    setActive(last.href);
    return;
  }

  const threshold = props.selectScrollTop ? 0 : props.bound;
  let next: string | undefined;
  // 不提前跳出循环：链接顺序是锚点列表的 DOM 顺序，目标区块未必按同样的顺序排布
  for (const item of candidates) {
    const el = resolveTarget(item.href);
    if (el && getOffsetTop(el) - props.offset <= threshold) next = item.href;
  }
  setActive(next);
}

/** 标记位置由测量选中链接得到，写成行内样式，避免为每个位置生成一套类名 */
const markerStyle = shallowRef<Record<string, string>>({ opacity: "0" });

function updateMarker() {
  const list = listRef.value;
  if (!list || markerShape.value === "none") return;
  const link = list.querySelector<HTMLElement>("[data-anchor-active=\"true\"]");
  if (!link) {
    markerStyle.value = { opacity: "0" };
    return;
  }
  const listRect = list.getBoundingClientRect();
  const rect = link.getBoundingClientRect();
  // 纵向三种形态都是固定尺寸，只写链接的中线位置，再由样式上的 -translate-y-1/2 自己居中；
  // 横向滑块要贴合链接宽度，仍然按测量值写 left 与 width
  markerStyle.value = isVertical.value
    ? { opacity: "1", top: `${rect.top - listRect.top + rect.height / 2}px` }
    : { opacity: "1", left: `${rect.left - listRect.left}px`, width: `${rect.width}px` };
}

/**
 * 滚动到指定链接对应的位置。
 * 选中态在滚动开始时就落到目标链接上，不等补间结束，否则一路上会被沿途区块反复改写
 */
function scrollTo(href: string) {
  const el = resolveTarget(href);
  if (!el || !scrollTarget.value) return;
  const from = getScroll();
  const to = Math.min(Math.max(0, from + getOffsetTop(el) - props.offset), getMaxScroll());
  cancelTween();
  setActive(href);
  if (from === to) return;

  if (props.duration <= 0 || prefersReducedMotion()) {
    setScroll(to);
    return;
  }

  scrolling = true;
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / props.duration);
    setScroll(from + (to - from) * easeInOut(progress));
    if (progress < 1) {
      tweenFrame = requestAnimationFrame(step);
      return;
    }
    cancelTween();
  };
  tweenFrame = requestAnimationFrame(step);
}

function handleClick(event: MouseEvent, href?: string) {
  emit("click", event, href);
  // 消费者在 click 里 preventDefault 就是完全接管跳转，组件不再滚动
  if (event.defaultPrevented) return;
  event.preventDefault();
  if (href) scrollTo(href);
}

useEventListener(scrollTarget, "scroll", updateActive, { passive: true });
useResizeObserver(listRef, updateMarker);

watch([activeHref, links, () => props.type, () => props.direction, markerShape], async () => {
  await nextTick();
  updateMarker();
});

watch(() => props.container, () => {
  resolveContainer();
  updateActive();
});

onMounted(() => {
  resolveContainer();
  updateActive();
  updateMarker();
});

onBeforeUnmount(cancelTween);

provide(ANCHOR_INJECTION_KEY, {
  activeHref: computed(() => activeHref.value),
  itemClass,
  linkTitleClass,
  sublistClass,
  linkClass,
  addLink,
  sortLinks,
  removeLink,
  handleClick,
});

defineExpose({
  /** `(href: string) => void` 手动滚动到指定链接对应的位置，href 形如 `#section-id` */
  scrollTo,
});
</script>

<template>
  <!-- data-reborn-anchor 是给站内全局锚点跳转逻辑看的标记：本组件自己管滚动，外部不要再劫持这些链接 -->
  <div data-reborn-anchor :class="ui.root({ class: props.class })">
    <div ref="listRef" :class="ui.list()">
      <!-- 标记跟随选中链接滑动，位置由测量写入行内样式 -->
      <span
        v-if="markerShape !== 'none'"
        aria-hidden="true"
        :class="ui.marker()"
        :style="markerStyle"
      />
      <slot />
    </div>
  </div>
</template>
