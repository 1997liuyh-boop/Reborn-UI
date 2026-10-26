import { tryOnScopeDispose } from "@vueuse/core";
import { prefersReducedMotion } from "~/lib/motion";
import { tweenScroll } from "~/lib/scroll-tween";

type ScrollAxis = "x" | "y";

/** 平滑滚动的时长，与 RebornAnchor 的默认补间时长一致 */
const SCROLL_TWEEN_DURATION = 300;

/** 自下而上找到在指定轴上真正可滚动的最近祖先；到 body 为止，页面本身不算 */
function findScrollContainer(el: HTMLElement, axis: ScrollAxis) {
  let node = el.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = getComputedStyle(node);
    const overflow = axis === "y" ? style.overflowY : style.overflowX;
    const overflowing =
      axis === "y" ? node.scrollHeight > node.clientHeight : node.scrollWidth > node.clientWidth;
    if (overflowing && /auto|scroll|overlay/.test(overflow)) return node;
    node = node.parentElement;
  }
  return null;
}

/** 按原生 scrollIntoView 的对齐规则，算出容器在单个轴上需要滚动的距离 */
function getScrollDelta(
  position: ScrollLogicalPosition,
  itemStart: number,
  itemSize: number,
  boxStart: number,
  boxSize: number,
) {
  const itemEnd = itemStart + itemSize;
  const boxEnd = boxStart + boxSize;
  if (position === "start") return itemStart - boxStart;
  if (position === "end") return itemEnd - boxEnd;
  if (position === "center") return itemStart + itemSize / 2 - (boxStart + boxSize / 2);
  // nearest：已完整可见就不动；比容器还大时与原生一样优先对齐起始边
  if (itemStart < boxStart || itemSize > boxSize) return itemStart - boxStart;
  if (itemEnd > boxEnd) return itemEnd - boxEnd;
  return 0;
}

/**
 * 把元素滚进它最近的滚动容器（只滚容器，不连带滚动页面）。
 * 每个轴各自一条 rAF 补间，新的滚动开始时先停掉同轴上还没跑完的那条；所在作用域销毁时自动停止。
 */
export function useScrollIntoContainer() {
  const cancellations: Partial<Record<ScrollAxis, () => void>> = {};

  function cancel(axis: ScrollAxis) {
    cancellations[axis]?.();
    delete cancellations[axis];
  }

  /**
   * 在单个轴上把元素滚进最近的滚动容器。
   * 平滑滚动用 rAF 补间而不交给原生 behavior: 'smooth'：原生平滑滚动的时长与曲线由浏览器各自决定，
   * 部分环境（如关闭了平滑滚动的系统设置）还会直接跳到终点，自己补间才能保证各端观感一致。
   * ⚠️ 不用原生 scrollIntoView：它会连带滚动所有祖先滚动容器（包括页面），
   * 菜单一挂载就把整页拽到菜单所在位置，侧栏与内容区各自滚动的布局里尤其突兀。
   */
  function scrollAxisIntoView(
    el: HTMLElement,
    axis: ScrollAxis,
    position: ScrollLogicalPosition,
    behavior?: ScrollBehavior,
  ) {
    const container = findScrollContainer(el, axis);
    if (!container) return;

    const itemRect = el.getBoundingClientRect();
    const boxRect = container.getBoundingClientRect();
    // 可视区从边框内侧算起，clientWidth / clientHeight 已排除滚动条
    const delta =
      axis === "y"
        ? getScrollDelta(position, itemRect.top, itemRect.height, boxRect.top + container.clientTop, container.clientHeight)
        : getScrollDelta(position, itemRect.left, itemRect.width, boxRect.left + container.clientLeft, container.clientWidth);
    cancel(axis);
    if (Math.abs(delta) < 1) return;

    const setScroll = (value: number) => {
      if (axis === "y") container.scrollTop = value;
      else container.scrollLeft = value;
    };
    const from = axis === "y" ? container.scrollTop : container.scrollLeft;
    const max =
      axis === "y"
        ? container.scrollHeight - container.clientHeight
        : container.scrollWidth - container.clientWidth;
    // 终点先夹到可滚范围内，否则补间后半段会一直顶着边界空跑
    const to = Math.min(Math.max(0, from + delta), max);

    if (behavior !== "smooth" || prefersReducedMotion()) {
      setScroll(to);
      return;
    }

    cancellations[axis] = tweenScroll({ from, to, duration: SCROLL_TWEEN_DURATION, setScroll, onComplete: () => { delete cancellations[axis]; } });
  }

  /** 两个轴同时滚动，对齐方式语义同原生 scrollIntoView 的 block / inline */
  function scrollIntoContainer(
    el: HTMLElement,
    options: { block: ScrollLogicalPosition; inline: ScrollLogicalPosition; behavior?: ScrollBehavior },
  ) {
    scrollAxisIntoView(el, "y", options.block, options.behavior);
    scrollAxisIntoView(el, "x", options.inline, options.behavior);
  }

  tryOnScopeDispose(() => {
    cancel("x");
    cancel("y");
  });

  return { scrollIntoContainer };
}
