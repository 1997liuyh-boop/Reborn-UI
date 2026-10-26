import { prefersReducedMotion } from './motion'

/**
 * 锚点与菜单共用的滚动补间。
 * 放在 lib 而不是某个组件目录：CLI 按「../<组件名>/」解析组件间依赖，
 * 写在菜单目录里会让单独安装锚点时连带装上整个菜单。
 */

/** ease-in-out：起步与收尾都慢 */
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

export interface ScrollTweenOptions {
  from: number
  to: number
  duration: number
  setScroll: (value: number) => void
  onComplete?: () => void
}

/** 用 rAF 把滚动位置从 from 补间到 to；返回取消动作，取消时不触发完成回调。减弱动画偏好下直接落到终点 */
export function tweenScroll(options: ScrollTweenOptions): () => void {
  if (options.duration <= 0 || prefersReducedMotion()) {
    options.setScroll(options.to)
    options.onComplete?.()
    return () => {}
  }
  const start = performance.now()
  let frame = 0
  let cancelled = false
  function step(now: number) {
    if (cancelled) return
    const progress = Math.min(1, (now - start) / options.duration)
    options.setScroll(options.from + (options.to - options.from) * easeInOut(progress))
    if (progress < 1) {
      frame = requestAnimationFrame(step)
    }
    else {
      frame = 0
      options.onComplete?.()
    }
  }
  frame = requestAnimationFrame(step)
  return () => {
    cancelled = true
    if (frame) cancelAnimationFrame(frame)
  }
}
