import { onBeforeUnmount, onDeactivated, watch } from 'vue'

export function useLockScroll(shouldLock: () => boolean) {
  let lockCount = 0

  const lock = () => {
    // #ifdef H5
    if (lockCount === 0) {
      document.body.style.overflow = 'hidden'
    }
    lockCount += 1
    // #endif
  }

  const unlock = () => {
    // #ifdef H5
    if (lockCount > 0) {
      lockCount -= 1
      if (lockCount === 0) {
        document.body.style.overflow = ''
      }
    }
    // #endif
  }

  const destroy = () => {
    if (shouldLock()) unlock()
  }

  watch(shouldLock, (value) => {
    value ? lock() : unlock()
  }, { immediate: true })

  onDeactivated(destroy)
  onBeforeUnmount(destroy)

  return { lock, unlock }
}
