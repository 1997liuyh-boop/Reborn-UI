import type { AnimationOptions, DOMKeyframesDefinition } from 'motion-v';
import { animateMini, spring } from 'motion-v';

/** 动画只管理运动值，尺寸、颜色与排版仍由组件的 Tailwind 配置负责。 */
export const motionPresets = {
  fast: { duration: 0.15, ease: [0.33, 1, 0.67, 1] },
  base: { duration: 0.2, ease: [0.33, 1, 0.67, 1] },
  slow: { duration: 0.3, ease: [0.33, 1, 0.67, 1] },
  spring: { type: 'spring', stiffness: 450, damping: 35, mass: 0.7 },
} satisfies Record<string, AnimationOptions>;

export interface MotionHandle {
  /** 完成与中断都会结束等待；调用方用自己的切换序号判断是否仍需收尾。 */
  finished: Promise<void>;
  stop: () => void;
}

const activeAnimations = new WeakMap<Element, MotionHandle>();

/** 每次启动读取偏好，避免页面打开后切换系统设置仍沿用旧值。 */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 无浏览器动画环境也落到最终状态，保持服务端与测试环境可用。 */
function applyFinalFrame(element: Element, keyframes: DOMKeyframesDefinition) {
  if (!('style' in element)) return;
  const style = (element as HTMLElement).style;
  const transforms: string[] = [];
  for (const [key, frames] of Object.entries(keyframes)) {
    const value = Array.isArray(frames) ? frames.findLast(frame => frame != null) : frames;
    if (value == null) continue;
    if (key === 'x' || key === 'y') {
      transforms.push(`translate${key.toUpperCase()}(${typeof value === 'number' ? `${value}px` : value})`);
    } else if (key === 'scaleX' || key === 'scaleY' || key === 'rotate') {
      transforms.push(`${key}(${key === 'rotate' && typeof value === 'number' ? `${value}deg` : value})`);
    } else if (key.startsWith('--')) {
      style.setProperty(key, String(value));
    } else {
      const unitless = ['opacity', 'scale', 'zIndex', 'flexGrow', 'flexShrink', 'order'].includes(key);
      const resolved = typeof value === 'number' && !unitless ? `${value}px` : String(value);
      style.setProperty(key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`), resolved);
    }
  }
  if (transforms.length) style.transform = transforms.join(' ');
}

/** 停在当前画面，供下一次动画继续衔接；不回退到第一帧。 */
export function stopMotion(element: Element | null | undefined) {
  if (element) activeAnimations.get(element)?.stop();
}

/** 同一个节点只保留当前动画，防止旧完成回调覆盖快速切换后的状态。 */
export function runMotion(element: Element, keyframes: DOMKeyframesDefinition, options: AnimationOptions = {}): MotionHandle {
  stopMotion(element);
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function' || typeof requestAnimationFrame !== 'function'
    || typeof Element === 'undefined' || typeof NodeList === 'undefined' || typeof element.animate !== 'function') {
    applyFinalFrame(element, keyframes);
    options.onComplete?.();
    return { finished: Promise.resolve(), stop() {} };
  }
  let finish: () => void = () => {};
  const finished = new Promise<void>((resolve) => { finish = resolve; });
  let stopped = false;
  // DOM 属性直接交给原生动画，避免停止后公共渲染队列再次写回旧样式。
  const transition = prefersReducedMotion()
    ? { ...options, type: undefined, duration: 0, delay: 0, repeat: 0 }
    : { ...motionPresets.base, ...options, type: options.type === 'spring' ? spring : undefined };
  // 复用节点时显式读取起点，避免原生执行器沿用上一次动画缓存的首帧。
  let currentStyle: CSSStyleDeclaration | undefined;
  const frames = Object.fromEntries(Object.entries(keyframes).map(([property, value]) => [
    property,
    Array.isArray(value) ? value : [(currentStyle ??= getComputedStyle(element)).getPropertyValue(property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)), value],
  ]));
  const controls = animateMini(element, frames, transition);
  const handle: MotionHandle = {
    finished,
    stop() {
      if (stopped) return;
      stopped = true;
      try {
        controls.stop();
      } catch (error) {
        // v-show 已隐藏或节点已卸载时无法 commitStyles，先保留可见帧再释放动画。
        if (!(error instanceof DOMException) || error.name !== 'InvalidStateError') throw error;
        const css = getComputedStyle(element);
        const current = Object.fromEntries(Object.keys(keyframes).map(property => [
          property, css.getPropertyValue(property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)),
        ]));
        controls.cancel();
        applyFinalFrame(element, current);
      }
      if (activeAnimations.get(element) === handle) activeAnimations.delete(element);
      finish();
    },
  };
  activeAnimations.set(element, handle);
  void controls.then(() => {
    if (activeAnimations.get(element) === handle) activeAnimations.delete(element);
    finish();
  });
  return handle;
}
