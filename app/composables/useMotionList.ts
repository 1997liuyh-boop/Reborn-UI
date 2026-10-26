import type { DOMKeyframesDefinition } from 'motion-v';
import type { ObjectDirective } from 'vue';
import { getCurrentScope, onScopeDispose } from 'vue';
import { prefersReducedMotion, runMotion } from '@/lib/motion';

interface MotionListOptions {
  enabled?: () => boolean;
  enter?: (element: HTMLElement) => DOMKeyframesDefinition;
  leave?: (element: HTMLElement) => DOMKeyframesDefinition;
  duration?: number;
}

/** 列表仅交给 Motion 执行动画，原有节点身份、事件与插槽仍由 Vue 管理。 */
export function useMotionList(options: MotionListOptions = {}) {
  const positions = new WeakMap<HTMLElement, Map<HTMLElement, DOMRect>>();
  const jobs = new Map<HTMLElement, { finish: () => void; stop: () => void }>();
  const leaving = new WeakSet<HTMLElement>();
  const enabled = () => options.enabled?.() !== false && !prefersReducedMotion();

  function isHtmlElement(element: unknown): element is HTMLElement {
    return typeof HTMLElement !== 'undefined' && element instanceof HTMLElement;
  }

  function children(root: HTMLElement) {
    return isHtmlElement(root) ? Array.from(root.children).filter(isHtmlElement) : [];
  }

  /** 取消也必须释放 Vue 的完成回调，避免连续增删后残留离场节点。 */
  function cancel(element: Element) {
    if (!isHtmlElement(element)) return;
    const job = jobs.get(element);
    if (!job) return;
    job.stop();
    job.finish();
  }

  function play(element: HTMLElement, keyframes: DOMKeyframesDefinition, done: () => void, absolute = false) {
    cancel(element);
    const owned = Object.keys(keyframes).map(property => property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`));
    if (absolute) owned.push('position', 'left', 'top', 'bottom', 'width', 'height', 'margin');
    const previous = owned.map(property => [property, element.style.getPropertyValue(property)]);
    const token = { finish, stop: () => {} };
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      if (jobs.get(element) === token) {
        jobs.delete(element);
        for (const [property, value] of previous) {
          if (value) element.style.setProperty(property!, value);
          else element.style.removeProperty(property!);
        }
      }
      leaving.delete(element);
      done();
    }
    jobs.set(element, token);

    if (absolute) {
      // 离场节点脱流后其余项立即获得最终落点，Motion 再从旧视觉位置平滑补位。
      const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = element;
      const parent = element.offsetParent;
      const reversed = isHtmlElement(parent) && getComputedStyle(parent).flexDirection === 'column-reverse';
      // 底部逆序栈高度会收缩，跟随底边定位才能保持离场项的原视觉位置。
      const anchor = reversed ? { top: 'auto', bottom: `${parent.clientHeight - offsetTop - offsetHeight}px` } : { top: `${offsetTop}px` };
      Object.assign(element.style, {
        position: 'absolute', left: `${offsetLeft}px`, ...anchor,
        width: `${offsetWidth}px`, height: `${offsetHeight}px`, margin: '0',
      });
      leaving.add(element);
    }
    const animation = runMotion(element, keyframes, { duration: options.duration ?? 0.2, ease: 'easeOut' });
    token.stop = animation.stop;
    void animation.finished.then(finish);
  }

  function enter(element: Element, done: () => void) {
    if (!isHtmlElement(element) || !enabled()) return done();
    play(element, options.enter?.(element) ?? { opacity: [0, 1], translate: ['0px -6px', '0px 0px'] }, done);
  }

  function leave(element: Element, done: () => void) {
    if (!isHtmlElement(element) || !enabled()) return done();
    play(element, options.leave?.(element) ?? { opacity: 0, translate: '0px -4px' }, done, true);
  }

  /** 独立 translate 属性不会覆盖拖拽项的缩放或使用者自定义的 transform。 */
  const directive: ObjectDirective<HTMLElement> = {
    beforeUpdate(root) {
      if (!enabled()) {
        for (const element of children(root)) cancel(element);
        positions.delete(root);
        return;
      }
      positions.set(root, new Map(children(root).filter(element => !leaving.has(element)).map(element => [element, element.getBoundingClientRect()])));
    },
    updated(root) {
      const previous = positions.get(root);
      positions.delete(root);
      if (!enabled()) {
        for (const element of children(root)) cancel(element);
        return;
      }
      if (!previous) return;
      const moved: Array<{ element: HTMLElement; x: number; y: number; translate: string }> = [];
      const targets: Array<{ element: HTMLElement; before: DOMRect; translate: string }> = [];
      for (const element of children(root)) {
        const before = previous.get(element);
        if (!before || leaving.has(element)) continue;
        cancel(element);
        const translate = element.style.translate;
        element.style.translate = '';
        targets.push({ element, before, translate });
      }
      // 先统一复位，再批量测量，避免每一项交替读写造成强制布局。
      for (const { element, before, translate } of targets) {
        const after = element.getBoundingClientRect();
        const x = before.left - after.left;
        const y = before.top - after.top;
        if (Math.abs(x) > 0.5 || Math.abs(y) > 0.5) moved.push({ element, x, y, translate });
      }
      for (const { element, translate } of targets) element.style.translate = translate;
      for (const { element, x, y, translate } of moved) {
        play(element, { translate: [`${x}px ${y}px`, translate || '0px 0px'] }, () => {});
      }
    },
    beforeUnmount(root) { for (const element of children(root)) cancel(element); },
  };

  // 动画属于调用方作用域，组件卸载与独立 effectScope 停止都要结束。
  if (getCurrentScope()) onScopeDispose(() => { for (const element of [...jobs.keys()]) cancel(element); });
  return { directive, enter, leave, cancel };
}
