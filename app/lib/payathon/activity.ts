/**
 * 区块活跃度观察：区块进入视口、页面可见、且报名弹窗没打开时，才算「活跃」。
 *
 * 同一个元素只建一套观察器，多个订阅方共享；最后一个订阅方退订时自动销毁。
 * 活跃状态同时写到元素的 data-motion-running 属性上，样式里的循环动画据此暂停或播放。
 */

type ActivityListener = (active: boolean) => void;

interface ActivityRecord {
  listeners: Set<ActivityListener>;
  readonly active: boolean;
  destroy: () => void;
}

const records = new WeakMap<Element, ActivityRecord>();

/** 报名弹窗的 id，与原站保持一致；弹窗打开时页面上的动效全部暂停 */
const REGISTRATION_DIALOG_SELECTOR = "#payathon-registration";

/**
 * 订阅元素的活跃状态
 * @param element 要观察的区块根元素
 * @param listener 活跃状态变化时回调；订阅时会立即用当前状态回调一次
 * @returns 退订函数
 */
export function observeActivity(element: Element, listener: ActivityListener): () => void {
  let record = records.get(element);
  if (!record) {
    const listeners = new Set<ActivityListener>();
    let intersecting = false;
    let active = false;
    const dialog = document.querySelector<HTMLDialogElement>(REGISTRATION_DIALOG_SELECTOR);

    const update = () => {
      const next = intersecting && !document.hidden && !dialog?.open;
      if (active === next) return;
      active = next;
      element.toggleAttribute("data-motion-running", active);
      for (const fn of listeners) fn(active);
    };

    const intersection = new IntersectionObserver(([entry]) => {
      intersecting = !!entry?.isIntersecting;
      update();
    });
    intersection.observe(element);

    const dialogObserver = new MutationObserver(update);
    if (dialog) dialogObserver.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    document.addEventListener("visibilitychange", update);

    record = {
      listeners,
      get active() {
        return active;
      },
      destroy() {
        intersection.disconnect();
        dialogObserver.disconnect();
        document.removeEventListener("visibilitychange", update);
        element.removeAttribute("data-motion-running");
        records.delete(element);
      },
    };
    records.set(element, record);
  }

  const current = record;
  current.listeners.add(listener);
  listener(current.active);
  return () => {
    current.listeners.delete(listener);
    if (!current.listeners.size) current.destroy();
  };
}
