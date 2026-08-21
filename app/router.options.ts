import type { RouterConfig } from "@nuxt/schema";

/** 主顶栏高度，与 docs 布局 pt-16 / top-16 对齐（分类导航已并入主顶栏） */
const MAIN_HEADER_HEIGHT = 64;
/** 锚点上方留白 */
const ANCHOR_GAP = 8;

/** 计算锚点滚动偏移，避免标题被固定顶栏遮挡 */
function getAnchorScrollOffset(): number {
  return MAIN_HEADER_HEIGHT + ANCHOR_GAP;
}

export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;

    if (to.hash) {
      if (import.meta.client) {
        const windowWithAnchorState = window as Window & { __REBORN_SKIP_NEXT_HASH_SCROLL__?: string };
        if (windowWithAnchorState.__REBORN_SKIP_NEXT_HASH_SCROLL__ === to.hash) {
          delete windowWithAnchorState.__REBORN_SKIP_NEXT_HASH_SCROLL__;
          return false;
        }
      }

      const offset = getAnchorScrollOffset();

      return new Promise((resolve) => {
        if (!import.meta.client) {
          resolve({ el: to.hash, top: offset });
          return;
        }

        // 等待正文渲染后再滚动（ContentRenderer / 标题 id 就绪）
        requestAnimationFrame(() => {
          setTimeout(() => {
            // 中文标题的 hash 是百分号编码（#%E5%88...），不是合法 CSS 选择器，
            // 必须解码后按 id 查找；直接 querySelector(to.hash) 会抛 SyntaxError
            const rawId = to.hash.slice(1);
            const el = document.getElementById(decodeURIComponent(rawId)) ?? document.getElementById(rawId);
            if (!el) {
              resolve({ top: 0 });
              return;
            }
            // 减弱动效环境下 smooth 会被静默丢弃，回退为即时滚动
            const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            resolve({ el, top: offset, behavior: prefersReducedMotion ? "auto" : "smooth" });
          }, 0);
        });
      });
    }

    return { top: 0 };
  },
};
