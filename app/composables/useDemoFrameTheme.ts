import type { Ref } from 'vue'
import { getCurrentScope, onScopeDispose } from 'vue'

/** 预览加载后补发主题，兼顾 H5 监听器晚于 load 注册的情况。 */
export function useDemoFrameTheme(frame: Readonly<Ref<HTMLIFrameElement | null | undefined>>) {
  const colorMode = useColorMode()
  let timer: ReturnType<typeof setTimeout> | undefined

  function syncTheme() {
    frame.value?.contentWindow?.postMessage({ type: 'theme-change', theme: colorMode.value }, '*')
  }

  function onFrameLoad() {
    clearTimeout(timer)
    syncTheme()
    timer = setTimeout(syncTheme, 600)
  }

  watch(() => colorMode.value, syncTheme)
  // 与 watch 同生命周期：放进 effectScope 时也随作用域停掉，延迟补发的定时器不会残留
  if (getCurrentScope()) onScopeDispose(() => clearTimeout(timer))
  return { onFrameLoad }
}
