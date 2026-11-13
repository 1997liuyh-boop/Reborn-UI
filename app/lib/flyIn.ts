import type { Directive } from "vue";

/**
 * 进入视口时入场：首次进入视口时加上 is-flown，初始态与过渡由样式 .fly-in 提供
 * - 数字：延迟（毫秒）
 * - { stagger: 序号 }：网格卡片按列错开
 */

export type FlyInValue = number | { stagger: number } | undefined;

/** 错开间隔（毫秒） */
const STAGGER_STEP = 70;

const values = new WeakMap<Element, FlyInValue>();
let observer: IntersectionObserver | undefined;

/** 所在网格的列数 */
function gridColumns(element: HTMLElement) {
  const parent = element.parentElement;
  if (!parent) return 1;
  const template = getComputedStyle(parent).gridTemplateColumns;
  return template && template !== "none" ? template.split(" ").length : 1;
}

function resolveDelay(element: HTMLElement) {
  const value = values.get(element);
  if (typeof value === "object") {
    // 卡片比容器晚一拍
    return (1 + (value.stagger % gridColumns(element))) * STAGGER_STEP;
  }
  return value ?? 0;
}

function getObserver() {
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target as HTMLElement;
      element.style.setProperty("--fly-delay", `${resolveDelay(element)}ms`);
      element.classList.add("is-flown");
      observer?.unobserve(element);
      values.delete(element);
    }
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.01 });
  return observer;
}

/** v-fly-in 指令 */
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
