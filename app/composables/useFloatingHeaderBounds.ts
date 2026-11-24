import { onBeforeUnmount, onMounted, shallowRef } from "vue";

/** 胶囊与两侧栏之间留的间距（px） */
const SIDE_GAP = 16;

/**
 * 悬浮胶囊顶栏的左右边界：lg 起左缘不越过左侧栏（[data-docs-aside]）、右缘不越过本页目录（[data-docs-toc]）。
 * 侧栏与目录的宽度随断点、折叠和页面变化，只能实测；页面没有侧栏 / 目录时退回 16px 边距。
 * 返回值是写给顶栏根节点的 CSS 变量，未测量（SSR、<lg）时为空对象，样式里有兜底值。
 */
export function useFloatingHeaderBounds() {
  const vars = shallowRef<Record<string, string>>({});
  /** 首次测量完成后才关掉边距过渡，之后跟随侧栏折叠逐帧更新，不再追赶 */
  const settled = shallowRef(false);

  let observer: ResizeObserver | null = null;
  let frame: number | null = null;
  let settleTimer: ReturnType<typeof setTimeout> | null = null;
  let removePageHook: (() => void) | null = null;
  let media: MediaQueryList | null = null;

  function measure() {
    frame = null;
    if (!media?.matches) {
      vars.value = {};
      return;
    }
    const viewport = document.documentElement.clientWidth;
    const aside = document.querySelector<HTMLElement>("[data-docs-aside]")?.getBoundingClientRect();
    const toc = document.querySelector<HTMLElement>("[data-docs-toc]")?.getBoundingClientRect();
    const left = aside && aside.width > 0 ? aside.right + SIDE_GAP : SIDE_GAP;
    const right = toc && toc.width > 0 ? viewport - toc.left + SIDE_GAP : SIDE_GAP;
    vars.value = { "--app-header-left": `${Math.round(left)}px`, "--app-header-right": `${Math.round(right)}px` };
    if (!settled.value && !settleTimer) settleTimer = setTimeout(() => (settled.value = true), 350);
  }

  function schedule() {
    if (frame === null) frame = requestAnimationFrame(measure);
  }

  /** 侧栏折叠改变自身宽度，目录随正文变宽而平移：观察两者及目录所在栅格 */
  function observe() {
    observer?.disconnect();
    observer = new ResizeObserver(schedule);
    observer.observe(document.documentElement);
    for (const selector of ["[data-docs-aside]", "[data-docs-toc]"]) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) observer.observe(el);
      if (el?.parentElement) observer.observe(el.parentElement);
    }
    schedule();
  }

  onMounted(() => {
    media = window.matchMedia("(min-width: 1024px)");
    media.addEventListener("change", schedule);
    // 换页后侧栏与目录节点可能整个换掉，重新挂观察
    removePageHook = useNuxtApp().hook("page:finish", () => requestAnimationFrame(observe));
    observe();
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    media?.removeEventListener("change", schedule);
    removePageHook?.();
    if (frame !== null) cancelAnimationFrame(frame);
    if (settleTimer) clearTimeout(settleTimer);
  });

  return { vars, settled };
}
