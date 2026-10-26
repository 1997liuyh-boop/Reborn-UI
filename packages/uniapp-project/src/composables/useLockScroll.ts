import { onActivated, onBeforeUnmount, onDeactivated, watch } from 'vue'

/**
 * 页面滚动锁（H5）
 *
 * 页面滚动是页面级资源：计数放在模块级，所有遮罩共用。每个调用方只记「自己是否持锁」，
 * 嵌套弹层关掉内层时不会把外层仍需要的锁一并解开；计数从 0 变 1 才写样式，归零才还原。
 * UniApp H5 是纯客户端，模块级状态没有 SSR 跨请求共享的问题；小程序端不编译这段代码。
 */
let lockCount = 0

function applyOverscrollLock() {
  const html = document.documentElement
  const body = document.body
  html.dataset.rbOverscrollPrev = html.style.overscrollBehavior ?? ''
  body.dataset.rbOverscrollPrev = body.style.overscrollBehavior ?? ''
  html.style.overscrollBehavior = 'none'
  body.style.overscrollBehavior = 'none'
}

function restoreOverscrollLock() {
  const html = document.documentElement
  const body = document.body
  html.style.overscrollBehavior = html.dataset.rbOverscrollPrev ?? ''
  body.style.overscrollBehavior = body.dataset.rbOverscrollPrev ?? ''
  delete html.dataset.rbOverscrollPrev
  delete body.dataset.rbOverscrollPrev
}

export function useLockScroll(shouldLock: () => boolean) {
  /** 当前调用方是否持锁：lock / unlock 幂等，重复调用不会重复计数 */
  let holding = false

  const lock = () => {
    if (holding) return
    holding = true
    if (lockCount++ === 0) {
      document.body.style.overflow = 'hidden'
      applyOverscrollLock()
    }
  }

  const unlock = () => {
    if (!holding) return
    holding = false
    if (--lockCount === 0) {
      document.body.style.overflow = ''
      restoreOverscrollLock()
    }
  }

  // immediate：以打开状态挂载的遮罩也要上锁
  watch(shouldLock, (value) => {
    if (value) lock()
    else unlock()
  }, { immediate: true })

  // KeepAlive：失活时释放，再激活时按当前状态重新上锁
  onActivated(() => {
    if (shouldLock()) lock()
  })
  onDeactivated(unlock)
  onBeforeUnmount(unlock)

  return {
    lock,
    unlock,
  }
}
