/**
 * 「接近视口」监听：所有调用方共用一个 IntersectionObserver，每个元素只回调一次。
 *
 * 首次回调是异步的，不会像逐个调用 getBoundingClientRect 那样在挂载时强制同步布局——
 * 组件总览一次挂载 150+ 张卡片时，逐张测量会把整页布局在同一帧里重算上百次。
 */

const ROOT_MARGIN = "240px 0px";

const callbacks = new WeakMap<Element, () => void>();
let observer: IntersectionObserver | undefined;

function getObserver() {
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const callback = callbacks.get(entry.target);
      callbacks.delete(entry.target);
      observer?.unobserve(entry.target);
      callback?.();
    }
  }, { rootMargin: ROOT_MARGIN });
  return observer;
}

/** 元素进入视口（含上下 240px 余量）时调用一次 callback；返回取消监听的函数 */
export function onceNearViewport(element: Element, callback: () => void) {
  if (typeof IntersectionObserver === "undefined") {
    callback();
    return () => {};
  }
  callbacks.set(element, callback);
  getObserver().observe(element);
  return () => {
    callbacks.delete(element);
    observer?.unobserve(element);
  };
}
