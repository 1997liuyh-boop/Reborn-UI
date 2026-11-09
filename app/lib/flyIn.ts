import type { Directive } from "vue";

/**
 * 进入视口时「飞入」：元素第一次进入视口时从左或右滑进来。
 *
 * - 全部元素共用一个 IntersectionObserver，每个元素只飞一次，之后停止观察；
 * - 初始隐藏态由样式里的 .fly-in 给出，进入视口后写 data-fly="left|right" 与 is-flown 触发过渡；
 * - 绑定值为数字时是额外延迟（毫秒），方向按元素在屏幕左半还是右半决定（取回调里现成的 boundingClientRect，不额外布局）；
 * - 绑定值为 { zigzag: 序号 } 时按「之」字形：序号除以所在网格当前列数得到行号，偶数行从左、奇数行从右，
 *   行内越靠近入场一侧的卡片越先出发，整体走出一条 Z 形路线。列数随断点变化，在进入视口时从网格样式读取。
 */

export type FlyInValue = number | { zigzag: number } | undefined;

const ZIGZAG_STEP = 80;

const values = new WeakMap<Element, FlyInValue>();
let observer: IntersectionObserver | undefined;

function gridColumns(element: HTMLElement) {
  const parent = element.parentElement;
  if (!parent) return 1;
  const template = getComputedStyle(parent).gridTemplateColumns;
  return template && template !== "none" ? template.split(" ").length : 1;
}

function resolve(element: HTMLElement, entry: IntersectionObserverEntry) {
  const value = values.get(element);
  if (typeof value === "object") {
    const columns = gridColumns(element);
    const row = Math.floor(value.zigzag / columns);
    const column = value.zigzag % columns;
    const fromLeft = row % 2 === 0;
    return { side: fromLeft ? "left" : "right", delay: (fromLeft ? column : columns - 1 - column) * ZIGZAG_STEP };
  }
  const box = entry.boundingClientRect;
  const viewportWidth = entry.rootBounds?.width ?? window.innerWidth;
  return { side: box.left + box.width / 2 < viewportWidth / 2 ? "left" : "right", delay: value ?? 0 };
}

function getObserver() {
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target as HTMLElement;
      const { side, delay } = resolve(element, entry);
      element.dataset.fly = side;
      element.style.setProperty("--fly-delay", `${delay}ms`);
      // 先让方向生效一帧，再切到终态，过渡才有起点
      requestAnimationFrame(() => element.classList.add("is-flown"));
      observer?.unobserve(element);
      values.delete(element);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  return observer;
}

/** v-fly-in 指令：v-fly-in="120" 延迟 120ms；v-fly-in="{ zigzag: index }" 按之字形行列入场 */
export const vFlyIn: Directive<HTMLElement, FlyInValue> = {
  mounted(element, binding) {
    if (typeof IntersectionObserver === "undefined") {
      element.classList.add("is-flown");
      return;
    }
    values.set(element, binding.value);
    getObserver().observe(element);
  },
  unmounted(element) {
    observer?.unobserve(element);
    values.delete(element);
  },
};
