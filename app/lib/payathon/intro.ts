/**
 * 首屏开场的就绪协调：标题打字动画（title）与水母场景（scene）都完成后，顶栏才可交互。
 *
 * 就绪标记写在顶栏元素的 data-title-ready / data-scene-ready 上，两者齐了再写 data-ready，
 * 顶栏样式与首屏的口号、倒计时入场都以 data-ready 为准。
 */

/** 顶栏根元素的选择器，与原站保持一致 */
export const PAYATHON_HEADER_SELECTOR = "[data-payathon-header]";

/** 标记开场的某一部分已就绪 */
export function markIntroReady(part: "title" | "scene"): void {
  const header = document.querySelector<HTMLElement>(PAYATHON_HEADER_SELECTOR);
  if (!header) return;
  header.dataset[`${part}Ready`] = "true";
  if (header.dataset.titleReady && header.dataset.sceneReady) {
    header.dataset.ready = "true";
    header.inert = false;
    header.removeAttribute("aria-hidden");
  }
}

/**
 * 是否跳过标题开场动画
 *
 * 刷新页面时完整播放；从站内其它页面进入、或浏览器前进后退回来时直接展示最终态，
 * 避免用户每次切回来都要再看一遍开场。
 */
export function shouldSkipTitleIntro(force = false): boolean {
  if (force) return true;
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navigation?.type === "reload") return false;
  if (navigation?.type === "back_forward") return true;
  try {
    return !!document.referrer && new URL(document.referrer).origin === location.origin;
  }
  catch {
    return false;
  }
}
