import { onBeforeUnmount, onDeactivated, ref, watch } from 'vue'

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
  const scrollLockCount = ref(0)

  const lock = () => {
    if (scrollLockCount.value === 0) {
      document.getElementsByTagName('body')[0].style.overflow = 'hidden'
      applyOverscrollLock()
    }
    scrollLockCount.value++
  }

  const unlock = () => {
    if (scrollLockCount.value > 0) {
      scrollLockCount.value--
      if (scrollLockCount.value === 0) {
        document.getElementsByTagName('body')[0].style.overflow = ''
        restoreOverscrollLock()
      }
    }
  }

  const destroy = () => {
    shouldLock() && unlock()
  }

  watch(shouldLock, (value) => {
    value ? lock() : unlock()
  })

  onDeactivated(destroy)
  onBeforeUnmount(destroy)

  return {
    lock,
    unlock
  }
}
