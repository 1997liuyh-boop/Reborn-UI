import type { RouterConfig } from "@nuxt/schema";

/** 主顶栏高度，与 docs 布局 pt-16 / top-16 对齐 */
const MAIN_HEADER_HEIGHT = 64;
/** 大屏文档二级导航高度（AppHeaderNav） */
const SUB_HEADER_HEIGHT = 64;
/** 锚点上方留白 */
const ANCHOR_GAP = 8;

/** 计算锚点滚动偏移，避免标题被固定顶栏遮挡 */
function getAnchorScrollOffset(): number {
  if (!import.meta.client) return MAIN_HEADER_HEIGHT + ANCHOR_GAP;

  const hasSubHeader = window.matchMedia("(min-width: 1024px)").matches;
  return MAIN_HEADER_HEIGHT + (hasSubHeader ? SUB_HEADER_HEIGHT : 0) + ANCHOR_GAP;
}

export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;

    if (to.hash) {
      const offset = getAnchorScrollOffset();

      return new Promise((resolve) => {
        if (!import.meta.client) {
          resolve({ el: to.hash, top: offset });
          return;
        }

        // 等待正文渲染后再滚动（ContentRenderer / 标题 id 就绪）
        requestAnimationFrame(() => {
          setTimeout(() => {
            const el = document.querySelector(to.hash);
            if (!el) {
              resolve({ top: 0 });
              return;
            }
            resolve({ el: to.hash, top: offset, behavior: "smooth" });
          }, 0);
        });
      });
    }

    return { top: 0 };
  },
};
